# The Spore Particle IK Solver

Source: §4.3 of Hecker et al., *Real-time Motion Retargeting to Highly Varied User-Created
Morphologies*, SIGGRAPH 2008. Related background: Hecker's
[Inverse Kinematics](https://www.chrishecker.com/Inverse_Kinematics) page (survey of solvers
he has written; see `ik-and-physics.md`), Jakobsen 2001 *Advanced Character Physics*
(nonlinear length correction), and the molecular-dynamics SHAKE/RATTLE family (cartesian DOF +
length constraints).

## 1. Why a new solver

Spore characters usually have **many more DOF than goals**, so IK is underdetermined and the
solver must spend spare DOF on secondary objectives. The competing objectives:

1. **High performance**: runs every frame on every procedurally animated character.
2. **Accuracy and naturalness in workspace**: reachable goals give accurate, natural poses.
3. **Graceful failure** in three modes, each still yielding a natural pose:
   - goal outside the workspace: *reach* toward it, do not mechanically hyperextend;
   - conflicting goals (overdetermined sub-trees);
   - implausible goals (reachable but would produce an unnatural pose).
4. **Path independence**: the solution at time t must not depend on earlier frames. Path
   dependent redundant manipulators "can eventually tie themselves in knots"; path dependence
   also makes playback unpredictable.

Maxis implemented "several mathematically more complex" solvers first, including multiple
flavors of **Cyclic Coordinate Descent, Jacobian methods, and Constrained Dynamics**. They were
**slower and less amenable to tuning** because of complexity and nonlinearity. The Particle IK
Solver's simple core gives "local control" over the algorithm: ad hoc tuning and special cases
can be added without degrading the rest of the pose.

## 2. Core representation

- Skeleton = set of **3-DOF particles** (points) connected by **1-DOF length constraints**.
- Full 6-DOF body goals are reduced to **3-DOF position goals at the body's joint position**
  (avoids handling 6-DOF goals inside the solver; cf. Meredith & Maddock 2004).
- Each constraint stores a **"mass" for each of its two endpoints**. The same particle may
  appear to have different masses from different constraints. Masses are pure tuning scalars,
  not physical.
- Constraints are enforced iteratively with a **nonlinear length correction** (Jakobsen): the
  length error moves each endpoint along the constraint axis in inverse proportion to its mass.
- The length error passes through a **C1-continuous piecewise function** to yield the
  correction distance, giving **soft constraints**. Constraints are allowed to **stretch and
  compress**, which reads as more organic.
- Body DOF (positions and orientations) are **reconstructed** from particle positions and
  constraints after the solve.

```ts
interface Particle { p: Vec3; goal?: Vec3 }
interface Constraint { a: Particle; b: Particle; restLen: number; massA: number; massB: number }

function relax(c: Constraint, soften: (err: number) => number) {
  const d = sub(c.b.p, c.a.p);
  const len = length(d);
  const corr = soften(len - c.restLen);          // C1 piecewise: soft near 0, clamped far out
  const n = scale(d, 1 / len);
  const wA = c.massB / (c.massA + c.massB);       // heavier particle moves less
  const wB = c.massA / (c.massA + c.massB);
  c.a.p = add(c.a.p, scale(n,  corr * wA));
  c.b.p = sub(c.b.p, scale(n,  corr * wB));
}
```

## 3. Two-phase architecture

Phase 1 solves the **spine**; phase 2 solves the **limbs with the spine held fixed**. Two
phases gave more natural poses than any monolithic solver because spine and limb movement have
different idiosyncrasies and can be tuned independently.

### 3.1 Initialization (both phases)

- Determine the sub-tree that **"has IK"**: a body has IK if it or any descendant has a pose
  goal. Sub-trees without IK are ignored by the solver and become **Jiggles** candidates.
- **Root**: special-cased; always has IK; forward-kinematically controlled by animators; not
  moved by iterations (immediate children may slightly influence it after initialization). The
  root's pose is computed first and all bodies are transformed into the **root-relative rest
  pose**, which acts as a **preconditioner** giving the root goal strong influence.
- **Delegated goals**: some bodies hand their goals to the parent for better poses, e.g. a
  mouth attached to the spine delegates to its spine segment, so moving the mouth bends the
  spine instead of pivoting the mouth at its attachment.
- Allocate particles/constraints according to caps and phase (below).

### 3.2 Spine phase

Allocation:
- Each limb sub-tree body with a goal gets **one simplified constraint straight to the spine**:
  distal particle at the goal position, proximal particle at the spine attachment joint, rest
  length = chord length of the simplified chain at rest.
- **Spine particles only at IK branch points**: wherever more than one child of a spine body
  has IK, and at non-spine -> spine transitions walking rootward (limb attachment points). One
  length constraint between consecutive branch-point particles regardless of how many spine
  bodies lie between. A spine with no branch points becomes a single constraint. Each spine
  particle maps to the child spine body of its joint (unique because the spine is serial).
- Each spine particle also gets a constraint to its **root-relative rest position** for
  anti-buckling (initially off).

Spine splines:
- Solving with a particle at every spine joint produces kinks. Instead, fit a spline to the
  spine joint positions between each pair of branch points by **linear least squares**, stored
  in the local space of the particle's associated body.
- Player spines have many inflection points; **cubic** Hermite fits were inadequate, **quintic
  Hermite** splines proved sufficient. Spline endpoints are the joint positions of the first
  and last constrained spine bodies (not body positions).
- Step along the spline transporting a frame whose y axis follows the tangent; for each
  interior body record spline parameter `t`, offset and relative orientation to that frame.
  This lets interior bodies be reconstructed from the posed spline, so they are ignored during
  iteration.

Iteration and anti-buckling:
- **Inner iterations** loop over constraints **from the leaves inward** (distributes position
  error immediately since leaves carry the initial error). **Outer iterations** repeat the
  inner loop a fixed number of times (**5**).
- Simplified limbs may **compress to 10% of rest length** in this phase, on the assumption the
  real limb will bend in the limb phase.
- After outer iterations, check a **buckling heuristic**: compare angles between neighboring
  spine constraints to detect the spine folding onto itself. If buckled, **smoothly enable**
  the rest-pose constraints, pulling the spine back toward the known-good root-relative rest
  pose. The result is a blend between buckled and rest poses: a "reasonable compromise between
  flexibility and robustness", acknowledged as simplistic and sometimes heavy-handed.

Reconstruction (outward from the known root):
- Project each spine particle back into the allowed shrink/stretch band (**10% / 120%**) in
  case iterations did not converge.
- Orientation of particle-associated spine bodies: compute tangents at rest and posed
  positions, build the **minimal-twist rotation** between them, apply to the root-relative rest
  orientation, then blend in any delegated orientation goals.
- Tangent rule: interior particle (two spine constraints): three-point difference
  `v_i = (p_{i+1} - p_{i-1}) / 2`. Endpoint particle: use the rootward neighbor's tangent and
  solve a natural cubic with zero end-curvature: `v_i = 3 (p_{i-1} - p_i) / 2 - v_{i-1} / 2`.
- Interior spline bodies come back via the transported frame data.

### 3.3 Limb phase

Allocation: a particle at **every limb joint** and a constraint for **every limb body**. If a
body has multiple direct children with IK goals, add **cross-constraints** between them so they
keep their relative positions.

**Aim preconditioner** (the key to natural limb poses):
- Serial chain with one leaf goal: let `v_r` = vector from spine attachment point (on the
  freshly posed spine) to the leaf particle in root-relative rest pose; `v_g` = vector from the
  attachment point to the goal. Build the minimal-twist rotation taking `v_r` to `v_g`, compose
  with a **scale along `v_g`** so the leaf lands exactly on the goal, and apply that transform to
  all limb particles. Length constraints are deliberately violated (limb stretched if the goal
  is far, squashed if near); the constraint iterations fix them afterwards.
- Effect: keeps the limb in a natural shape as it extends/compresses and favors rotation at
  shoulders and hips. Iterating from the rest pose without aiming distributes goal error poorly
  along the limb. This relies on temporarily violating length constraints, which most IK
  algorithms do not allow.
- Branching limbs: compute the aim transform from a **weighted average of the sub-tree's
  goals**, apply, then recurse outward to each child branch point until the leaf serial chains
  are aimed.

Iteration: identical to the spine phase, minus anti-buckling.

Reconstruction: positions as in the spine phase. Orientation only needs the **twist about the
constraint axis**: with no cross-constraints, use the minimal-twist rotation from root-relative
rest to final pose applied to the rest orientation; with cross-constraints the frame is fully
(or over-) determined, so take the first two constraint axes as the posed frame. (A
photogrammetry-style relative-orientation minimization was considered and found unnecessary.)

## 4. Pseudocode for the whole solve

```ts
function solveIK(character: Character, goals: Map<BodyId, Goal>): Pose {
  const hasIK = markHasIK(character, goals);            // body or any descendant has a goal
  const rootPose = poseRoot(character, goals);          // FK from animators, not iterated
  const rrRest = toRootRelativeRest(character, rootPose);   // preconditioner
  delegateGoals(character, goals);                      // e.g. spine-mounted mouths -> spine

  // ---- Phase 1: spine ----
  const spine = allocateSpine(character, hasIK, goals, rrRest);   // particles at IK branch points,
                                                                  // simplified limb chords, rest tethers
  fitQuinticSplines(spine, character);                  // per segment between branch points
  for (let outer = 0; outer < 5; outer++) {
    for (const c of spine.constraints.leavesInward()) relax(c, spine.soften);   // limbs may compress to 10%
    if (detectBuckling(spine)) spine.enableRestTethers(smoothRamp(outer));
  }
  projectToBand(spine, 0.10, 1.20);
  const spinePose = reconstructSpine(spine, rrRest);    // minimal-twist tangents, spline transport

  // ---- Phase 2: limbs (spine fixed) ----
  const limbs = allocateLimbs(character, hasIK, goals, spinePose);  // particle per joint, constraint per body,
                                                                    // cross-constraints for sibling goals
  aimPrecondition(limbs, spinePose, rrRest, goals);     // rotate+scale toward goals; recurse at branch points
  for (let outer = 0; outer < 5; outer++)
    for (const c of limbs.constraints.leavesInward()) relax(c, limbs.soften);
  const limbPose = reconstructLimbs(limbs, rrRest);

  const pose = compose(rootPose, spinePose, limbPose);
  return applyJiggles(pose, character, hasIK);          // passive; sub-trees without IK only
}
```

## 5. Tuning knobs the design deliberately exposes

- Per-endpoint constraint masses (asymmetric influence).
- Softening function shape (how soft near zero error, where it clamps).
- Shrink/stretch band (10% / 120%) and the spine-phase compression allowance (10%).
- Outer iteration count (5).
- Buckling detection threshold and ramp-in of rest tethers.
- Delegation rules by cap (which bodies hand goals to parents).
- Aim preconditioner weighting for branching sub-trees.

## 6. Known weaknesses to plan for

- Failure could be more graceful; anti-buckling is blunt.
- Path independence guarantees singularities somewhere in the solution space; place them where
  characters rarely go and expect occasional twists nearby.
- No intra-character collision, no workspace/volume reasoning.
