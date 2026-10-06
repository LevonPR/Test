# IK and Physics Background (Hecker lectures)

Use this when implementing skeleton solvers, ragdolls, tails/tentacles, jointed mechanisms,
or when choosing a constraint approach. The Spore Particle IK solver
(`particle-ik-solver.md`) sits at the "particle-based" end of the spectrum described here.

## 1. Inverse Kinematics — the solver survey

[Page](https://www.chrishecker.com/Inverse_Kinematics). Hecker lists the IK algorithms he has
implemented, mostly for his indie rock-climbing game and then Spore:

- simple serial analytical IK
- **Cyclic Coordinate Descent (CCD)**: serial and tree structured; with joint limits from the
  root; with child-child joint limits; dynamically re-rooted; 2-, 3- and 6-DOF; sequential
  Euler-angle joint solver; numerical quaternion joint solver
- **rigid body dynamics solvers**
  - augmented coordinates: explicit with Lagrange multipliers + LCP joint limits; implicit with
    stiff springs
  - generalized coordinates: explicit with springs; implicit Featherstone with stiff springs
- **particle-based solver** (SHAKE, RATTLE, Jakobsen style): dense-constraint approach to
  branching nodes; sparse branching with multiple passes

The GDC 2002 lecture *My Adventures in Inverse Kinematics* covers the CCD approach for the
climbing game (slides + mp3 on the page).

Reading of the survey for our project: Maxis tried the fancy end of this list and shipped the
particle-based end, because tunability and robustness beat mathematical sophistication for
character posing. Start with particles + length constraints; reach for CCD or Jacobian methods
only for narrow, well-understood chains.

## 2. Five Physics Simulators for Articulated Bodies (GDC 2003)

[Page](https://www.chrishecker.com/Five_Physics_Simulators_for_Articulated_Bodies). Four
articulated rigid-body simulators prototyped for the climbing game plus a hypothetical fifth.
Two axes explored:

| | explicit integration | implicit integration |
| --- | --- | --- |
| **augmented coordinates** | Lagrange Multipliers | Stiff Springs |
| **generalized coordinates** | Composite Rigid Body Method | Recursive Newton-Euler |

Key sections: **degrees of freedom**, and **stiffness** (why it matters for games and why stiff
equations are hard to integrate). Abstract: dissatisfaction with traditional IK for an
interactive dynamically animated human led to constrained rigid-body physics for consistency
and believability; the fifth algorithm describes properties needed for real-time games.

## 3. How to Simulate a Ponytail — Lagrange multiplier constraints

[Page](https://www.chrishecker.com/How_to_Simulate_a_Ponytail) (GDC 1999/2000 lecture and a
two-part Game Developer Magazine series). After free 6-DOF bodies with springs, gravity and
single-point collisions, the next steps are **resting contact** (stacking) and **hard
constraints** (ragdolls, cars). Popular approaches:

- Augmented coordinates / Lagrange multipliers with explicit integration (the article's topic)
- Generalized coordinates with explicit integration (Featherstone; Balafoutis & Patel)
- Implicit integration with springs/potentials and/or generalized coordinates (David Wu)
- Iterative projection-based fixup (Thomas Jakobsen, GDC 2001) — the family Spore's IK uses

Lagrange multipliers intuitively: compute known external forces, then compute the extra forces
needed to keep constraints satisfied (a block on a floor: constraint force cancels gravity and
upward pulls but never resists sliding). Constraints remove DOF one at a time and compose
modularly for any subset of a body's 6 DOF.

**Constrained dynamics in 4 steps** (general form):
1. Matrix Newton `f = M a`, with known external forces `f_e` and unknown constraint forces `f_c`.
2. Write constraint equations `C(q) = 0` on the state vector and differentiate twice.
3. Solve symbolically for accelerations (M is trivially invertible in augmented coordinates)
   in terms of workless constraint forces `J^T lambda`.
4. Form `A x = b` for the multipliers `lambda`, solve, substitute back for accelerations.

Writing good constraint equations (signed distance functions) is "a deeper exercise than it
appears". Sample code implements the general math for a 3-DOF point constraint.

## 4. The Mixed Linear Complementarity Problem (GDC 2004)

[Page](https://www.chrishecker.com/The_Mixed_Linear_Complementarity_Problem). Originally
mistitled *Lemke's Algorithm: The Hammer in Your Math Toolbox*. Thesis: many disparate problems
(contact, joint limits, friction, some optimization) transform into an **MLCP** — the nail —
and one solver (Lemke) is the hammer; optimize later if needed. Also derives ease-curve cubic
splines from four endpoint constraints (a technique to internalize) and explains **KKT**
optimality conditions. Provides an OCaml Lemke implementation with **"advanced start"**
support. Future direction: **Second Order Cone Programming**; "the great watershed in
optimization isn't between linearity and nonlinearity, but convexity and nonconvexity"
(Rockafellar).

## 5. Vector Calculus (GDC 2005)

[Page](https://www.chrishecker.com/Vector_Calculus). "The study of how scalars and vectors
change in space and time, which sounds a lot like video games." Highlights: infinitesimal
rotations are vectors (they commute); keep the **shape** of scalar/vector/matrix derivatives
straight and **use column vectors**; a surface normal is a differential/covector, not a vector;
shape-based derivation of the product rule.

## 6. Physics References (CGDC 1997)

[Page](https://www.chrishecker.com/Physics_References). Annotated, reading-order bibliography
for rigid-body dynamics with milestones. Breadth-first ordering. Highlights:

- Basics: Feynman Lectures vol. 1 (first 20 chapters); Hecker's Game Developer Magazine
  physics series parts 1-3; Thomas & Finney calculus.
  Milestone: a 2D rigid-body simulator with springs, gravity, correct angular effects from
  forces and collisions.
- Advanced dynamics/math: Symon *Mechanics* (undergrad), Goldstein *Classical Mechanics*
  (graduate classic; great on kinematics and 3D orientation), Arnold *Mathematical Methods of
  Classical Mechanics* (abstract). Engineering *Statics and Dynamics* texts for examples.
- Further sections: collision detection, articulated rigid bodies, constraints, generalized
  coordinates, contact, "It Doesn't Work" (debugging/stiffness), "What's Left?".

## 7. What this means for Biomant Chimerolog (proposed adaptation)

- Chimera posing: particle IK (Spore approach). Cheap, tunable, path independent.
- Secondary motion (tails, antennae, tentacles, manes): Jiggles-style damped pseudo-physics on
  non-IK sub-trees; if real dynamics are ever needed, Jakobsen projection first, Lagrange
  multipliers only for mechanisms needing exact hard joints.
- Contact/joint limits at scale: consider an MLCP formulation to unify them under one solver.
- Everything should be robust first, simple second, fast third.
