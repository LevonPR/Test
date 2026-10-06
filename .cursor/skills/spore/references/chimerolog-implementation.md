# Biomant Chimerolog: Implementation Proposals

Applies the Spore research to *Biomant Chimerolog* (The Grand Chimerolog / Imperium of Rus):
biomancy, clinic management, folklore hunting, splicing, and row-based tactical combat.

Status of this document: **proposal**. It is derived from the user's concept and the supplied
sources, not from the current codebase. Before acting on any section, inspect the actual game
(engine, save schema, implemented systems) and prefer newer project decisions. Each proposal is
tagged with its basis: **[paper]** (SIGGRAPH 2008), **[lecture]** (Hecker), **[prototype]**
(Maxis prototypes page), or **[ours]** (our adaptation, unverified).

## 1. Layer separation

Keep five layers with one-directional dependencies **[paper §1.2, §3-4; ours]**:

```
Anatomy definition  ──►  Generated phenotype  ──►  Animation intent  ──►  Physical pose  ──►  Game simulation reads anatomy,
(bodies, caps,           (meshes, skins,           (generalized action     (IK-solved,          never the pose or mesh
 splices, rest pose)      portraits; optional,       curves, contexts,       gait, Jiggles)
                          async, validated)          variants)
```

Rules:
- Anatomy is the single authority. Legal actions, combat rows, clinic procedures and visuals
  are all derived from it through one validated contract (§2).
- Generated visuals (portraits, GLB, textures) are optional outputs validated against anatomy;
  a generated asset is never promoted to anatomy **[ours]**.
- The simulation must run headless with anatomy alone (SPUG principle: economy before art
  **[prototype]**).

## 2. Anatomy contract

**[paper §1.2]** adapted **[ours]**.

```ts
type Cap =
  | 'root' | 'spine' | 'limb' | 'grasper' | 'foot' | 'mouth' | 'eye' | 'sensor'
  | 'wing' | 'tail' | 'horn' | 'armor' | 'gland' | 'venom' | 'fin' | string;

interface Body {
  id: string;
  parent: string | null;             // null only for the root spine body
  restPosition: Vec3;                // creature-relative
  restRotation: Quat;
  bounds: AABB;
  caps: Set<Cap>;
  deforms: Record<string, number>;   // standardized per part type: mouth.open, hand.grip, ...
  origin: SpliceOrigin;              // [ours] donor species, graft quality, folklore tags
}

interface Chimera {
  id: string;
  bodies: Body[];                    // tree; serial spine chain at the root
  rootId: string;                    // spine body chosen by heuristic (max leg attachments, then position)
  version: number;                   // bump on any structural change; invalidates binds (see §4.3)
}
```

Invariants (validate on load, on every splice, before save):
- Exactly one root; root has `spine`; spine bodies form a serial chain from the root.
- Tree only: every non-root body has exactly one parent; no cycles **[paper: general graphs
  hurt player creativity]**.
- Every `foot` and `grasper` is reachable from a spine body through `limb` bodies (defines legs
  and arms for gaits and reach).
- Rest pose is "reasonable": no body outside a configurable multiple of the torso bounds; no
  self-overlapping limb chains **[paper: rest pose assumption]**.
- Deform channel names are drawn from a per-part-type schema, so systems can treat them as
  opaque **[paper]**.

Context queries **[paper §3.1]**: implement `query(chimera, ctx)` returning `Body[]` where
`ctx = { cap, spatial?: {axis, zone, space: 'creature' | 'setspace'}, extent?, limbModifier?: 'SpineSegment' }`.
Callers must handle **zero, one, and many** results explicitly. No system may reference a body by
a universal name such as `LeftHand`; humanoid-only imported rigs are not a valid anatomy source.

Gameplay derivation examples **[ours]**:

| Query | Derived gameplay |
| --- | --- |
| `mouth` count ≥ 1 | can bite / feed; venom if any `mouth` body also has `venom` |
| `grasper` count ≥ 1 | can hold/throw/hand over; two `grasper` opposite-side -> two-handed actions |
| `foot` count and leg lengths | movement rows per turn; crawl if 0 feet |
| `wing` present | may occupy rear row and ignore ground hazards |
| `armor` on `spine` bodies | front-row damage reduction |
| `sensor`/`eye` FrontMost | initiative and ambush detection |

## 3. Animation and pose

### 3.1 Generalized action authoring **[paper §3.2-3.3]**
- Actions are authored once in generalized coordinates `q_g`, with per-channel context and
  movement mode: identity, rest-relative (position/rotation independently), scale
  (CreatureSize / LimbLength), ground-relative, secondary-relative (+ ExternalTarget,
  SecondaryDirectionalOnly, lookat).
- Editor preview and runtime evaluator share one code path (WYSIWYG). Preview must show at least
  three markedly different chimeras simultaneously.
- Changing a channel's movement mode remaps existing keys so the active body's specialized curve
  is unchanged; the rest pose is preserved for every mode.

### 3.2 Binding **[paper §4.1]**
- On first play of an action on a chimera: evaluate branch predicates (`UprightSpine`,
  `HasGraspers`, `HasFeet`, plus ours e.g. `HasWings`), compute blend-group ownership, enumerate
  variants (single variant groups, variant product with same-/opposite-side constraints,
  sagittal mirror), and cache keyed by `(actionId, chimera.id, chimera.version)`.
- Combat and clinic code choose the variant (nearest grasper to the target, a mouth not
  currently holding, etc.).

### 3.3 Frame pipeline **[paper §4]**
1. Specialize each channel's `q_g` to `q_s` via `S`; blend by group/priority into pose goals.
2. Add gait goals (leg groups, duty factor, step trigger, authored styles 1-6 feet, procedural
   7+, crawl/float fallback) **[paper §4.2]**.
3. Solve spine, then limbs, with the Particle IK solver (`particle-ik-solver.md`).
4. Apply passive Jiggles to sub-trees without IK. Jiggles never write goals **[paper §4.4;
   prefer this over the 2007-era Wiggles ordering]**.

For a 2D presentation **[ours]**: run the same pipeline in a 2.5D or side-view space and
project; or reduce to planar particles with the same two-phase structure. The contract, queries
and variants are dimension-independent.

## 4. Game-system contracts

### 4.1 Splicing **[ours; motivated by lecture "editor consequence"]**
- A splice is an anatomy edit: add/remove/replace a sub-tree, set `origin`, revalidate §2
  invariants, bump `version`.
- Every splice must change at least one of: legal actions, combat row options, clinic
  procedure requirements, or a folklore tag; if none changes, the splice is rejected at design
  time as a cosmetic-only graft (allowed only when explicitly flagged cosmetic).
- Optional behavior wiring **[prototype NetCity]**: a graft may add sensor->actuator rules that
  alter temperament in and out of combat.

### 4.2 Row-based tactical combat **[ours]**
- Rows are data; a chimera's allowed rows and actions are computed from anatomy queries at bind
  time and cached per `version`.
- Action resolution reads anatomy and simulation state only; animation is a consumer. Combat
  must be resolvable headless for tests.
- Targeting uses the same context queries as animation (e.g. "strike the FrontMost `armor`
  body" or "bite nearest `grasper`") so hit locations and animations agree.

### 4.3 Clinic management **[prototype CityMaze, Crowd; ours]**
- Rooms, staff, patients and spliced stock as agents with need/mood/safety/rest loops; queues
  visible; procedures require anatomy-derived preconditions (a graft needs a compatible
  attachment site: a spine or limb body with free capacity).
- Population and rumor pressure on the region map **[prototype CellCulture, BIOME]** generate
  demand and hunt contracts.

### 4.4 Interruption (Outro) contract **[lecture AIIDE 2010; ours]**
- Every action declares: cancellable phases, the outro it plays on cancel, the state it leaves
  the chimera in, and which held objects/targets are released.
- The owner of the current action is responsible for its shutdown; the incoming action waits
  for the outro handshake or forces it with an explicit `preempt` that still runs a minimal
  outro. No reliance on the blender to hide the cut.

### 4.5 Persistence **[ours]**
- Save anatomy (bodies, caps, deforms, origin, version) and simulation state. Do not save
  bind caches, poses, or generated assets as authoritative; regenerate them. Generated asset
  references may be saved with a hash of the anatomy they were validated against.

## 5. Acceptance scenarios and invariants

Run each scenario on a fixed test bench of at least five markedly different chimeras
(examples: biped with two graspers; quadruped with a single mouth and no graspers; six-legged
low crawler; legless serpent with wings; three-headed asymmetric hulk). Add player-made chimeras
to the bench as they appear **[paper: stochastic testing against uploaded creatures]**.

### Geometric invariants
- G1: `S(b, G(b, q_s)) == q_s` within tolerance for every body and movement mode.
- G2: For any `q_g` that puts one chimera at rest, all bench chimeras are at rest.
- G3: Ground-relative `q_g.z = 1` places the selected body on the ground for all bench bodies.
- G4: IK: reachable goals met within tolerance; unreachable goals yield a reaching pose with
  all limb constraints inside the shrink/stretch band; identical inputs give identical outputs
  (path independence).
- G5: Gait: foot slip during stance below tolerance at three speeds; no leg group frequency
  ratio outside the small-rational set.

### Gameplay invariants
- P1: Legal action set and row set are pure functions of anatomy (same anatomy -> same sets).
- P2: Every non-cosmetic splice changes at least one derived gameplay property.
- P3: Combat resolves headless with identical results with and without the presentation layer.
- P4: Context queries return explicit `[]`, `[one]`, or `[many]` and every caller handles all
  three (lint or test for it).

### Interruption invariants
- I1: Cancel at any frame of any action leaves the chimera in a declared valid state with all
  temporary holds released.
- I2: Preempted action's outro or minimal outro always runs; no two authoritative actions own
  the same body DOF at once.

### Persistence invariants
- S1: Save/load round-trips anatomy byte-for-byte after normalization; `version` preserved.
- S2: Loading a save with a newer capability schema revalidates and reports, never silently
  drops bodies.
- S3: Bind caches rebuild identically from loaded anatomy.

### Visual invariants
- V1: Preview and runtime produce the same pose for the same inputs.
- V2: A generated asset whose tagged parts do not match anatomy is rejected or flagged; the
  simulation continues unaffected.
- V3: Jiggles never move a body that has IK.

### Acceptance scenarios
1. **Feed the patient**: a chimera with N mouths and M graspers picks up a ration (variant
   choice by nearest free grasper; mouth-only branch when M = 0) and eats. Passes G1-G4, P1, I1.
2. **Row shift under fire**: a six-legged crawler moves one row while a biped strikes it; the
   strike is cancelled by a stun mid-swing. Passes G5, P3, I1-I2.
3. **Graft a wing**: splice a wing onto a quadruped; rear row becomes legal; the reach action
   still binds and plays; save/load preserves everything. Passes P2, S1-S3, V1.
4. **Bad import**: a generated GLB with a humanoid rig is attached to a serpent anatomy; the
   asset is rejected with a report and the serpent still animates. Passes V2.

## 6. Phased build sequence

Milestones, each gated by the invariants above. A restricted morphology envelope per phase is
acceptable; graceful handling outside the envelope is required from phase 1.

| Phase | Deliverable | Envelope | Gate |
| --- | --- | --- | --- |
| 0 | Anatomy contract, validator, context queries, save/load; headless economy sandbox (SPUG-style) | any tree | P1, P4, S1-S3; sandbox answers its question |
| 1 | Particle IK (two-phase) + debug view + sliders; identity/rest-relative modes; one reach action; multi-chimera preview | 1 spine, ≤4 limbs, ≤2 graspers | G1-G4, V1 |
| 2 | Gaits (leg groups, duty/step, 1-6 feet styles), crawl/float fallback | ≤6 legs | G5 |
| 3 | Scale, ground-relative, secondary-relative + lookat modes; variants + mirroring; branch predicates | mixed parts, asymmetric | G2-G3, scenario 1 |
| 4 | Row-based combat bound to anatomy; interruption contract; Jiggles | full bench | P2-P3, I1-I2, V3, scenario 2 |
| 5 | Splicing with consequence rules; clinic flow; region rumor/population rules | full bench + player-made | scenario 3, prototypes §4 experiments |
| 6 | Optional async visual generation with validation | n/a | V2, scenario 4 |

## 7. Reporting template

When delivering work under this skill, report:
1. What was implemented and how it was measured (which invariants, on which bench chimeras).
2. What is a simpler approximation than the source (e.g. cubic instead of quintic spine
   splines; single-phase IK; authored gaits only for bipeds and quadrupeds).
3. The next unresolved research question (e.g. volume-aware movement modes; gait anticipation
   under discontinuous input; AI<->animation interface).
4. No claims of arbitrary-morphology perfection, and no reuse of 2008 performance numbers as
   current targets.
