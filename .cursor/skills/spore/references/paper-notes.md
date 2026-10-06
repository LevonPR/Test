# Paper Engineering Notes: Spore's Procedural Creature Animation System

Engineering distillation of the SIGGRAPH 2008 paper, organized by subsystem. Every statement
in sections 0-4 is a **source finding** unless marked "for our project" (proposed adaptation).
When exact wording, equations or figures matter, open the supplied paper at
`paper/Sporeanim-siggraph08.pdf` or search `paper/full-text.md` (page-indexed). The mapping
between paper sections and these notes:

| Paper | Notes here |
| --- | --- |
| §1 Introduction, §1.2 Character Terminology | §0, §1 |
| §3 Animation Authoring (3.1 Selecting, 3.2 Posing, 3.3 Keying, 3.4 Preview) | §2 |
| §4.1 Binding (Branching, Variants), §4.2 Gaits, §4.4 Jiggles | §3 |
| §4.3 Particle IK Solver | `particle-ik-solver.md` |
| §5 Results and Discussion | §4 |

Sources:
- Hecker, Raabe, Enslow, DeWeese, Maynard, van Prooijen. *Real-time Motion Retargeting to
  Highly Varied User-Created Morphologies.* Proceedings of ACM SIGGRAPH 2008 (11 pages).
  Local copy: `paper/Sporeanim-siggraph08.pdf` ·
  [Original PDF](https://www.chrishecker.com/images/c/cb/Sporeanim-siggraph08.pdf) ·
  [Project page](https://www.chrishecker.com/Real-time_Motion_Retargeting_to_Highly_Varied_User-Created_Morphologies)
  (page also links two rough FRAPS videos, not acquired: one of generalization/specialization
  across creatures, one of the Jiggles and gait systems).
- Hecker, *How To Animate a Character You've Never Seen Before*, GDC 2007
  ([page](https://www.chrishecker.com/How_To_Animate_a_Character_You%27ve_Never_Seen_Before);
  slides + mp3; the talk leaned on live demos in the Spasm tool).

BibTeX from the project page:

```bibtex
@inproceedings{sporeanim,
  author    = {Chris Hecker and Bernd Raabe and Ryan W. Enslow and John DeWeese and Jordan Maynard and Kees van Prooijen},
  title     = {Real-time Motion Retargeting to Highly Varied User-Created Morphologies},
  booktitle = {Proceedings of ACM SIGGRAPH '08},
  note      = {\url{http://chrishecker.com/Real-time_Motion_Retargeting_to_Highly_Varied_User-Created_Morphologies}},
  year      = {2008} }
```

The Particle IK solver (paper §4.3) is detailed separately in `particle-ik-solver.md`.

## 0. The problem (GDC 2007 framing)

"Spore has a unique problem: most of the content in the game will be made after the game
ships." Creatures can have almost arbitrary shapes and skeleton topology: "my creature might
have two arms and one leg, yours might have no arms and seven legs, and two mouths." The
questions the system answers:

1. How do we animate creatures we have never seen, well enough to convey emotion?
2. How do we let animators use their skills *today* in a way we can apply *later* to the
   user's creature?

Traditional game animation (keyframed or mocap) is bound to a fixed skeleton codified early
in development. Prior retargeting research was offline, needed big example databases, or
assumed similar/humanoid topologies. Spore's approach is **illustrative, not example-based**:
animators explicitly specify the *semantics* of an animation up front, and the system records
motion in a **morphology-independent generalized form**, then **specializes** it onto each
creature at runtime and hands the result to an IK solver.

Pipeline:

```
Author (Spasm tool)                          Runtime (per character, per frame)
-------------------                          ----------------------------------
select bodies via CONTEXT query              bind: branch predicates -> variants
pose with MOVEMENT MODE (defines G / S)      specialize generalized curves with S
key generalized coords q_g                   blend channel goals (groups/priorities)
preview on many creatures at once            + synthesized locomotion (gaits)
                                             -> Particle IK solver -> pose
                                             -> Jiggles on un-animated sub-trees
```

## 1. Character model and terminology

- The player builds a creature from a malleable clay-like **torso containing the spine**, then
  attaches **limbs** and deformable anatomical parts from a palette (mouths, eyes, graspers,
  feet, spikes, armor, ...). Cited as Willmott et al. 2007, "Rigblocks: Player-deformable
  objects" (SIGGRAPH 2007 sketch).
- The final character is composed of **bodies** (anatomical parts, spine vertebrae, limb
  segments), meshes and textures. Typically **20-80 bodies**.
- A **body** holds what a bone would in other systems: position and rotation transforms,
  bounding box, parent-child hierarchy. Additionally:
  - **Capabilities ("caps")**: tags describing the body's semantics to the animation system
    and to gameplay code. Examples: `grasper`, `mouth`, `foot`, `spine`, `root`. The hand
    mesh's body has the `grasper` cap.
  - **Deform curves**: scalar channels controlling low-level mesh animation on that body
    (open/close hand, mouth, eyes; ears drooping; toes bending). Deforms are **standardized
    per part type** (every mouth answers to open/closed), so the animation system can treat
    them as opaque.
- Topology: bodies form a **directed acyclic graph** with a **serial chain of spine bodies
  at the root**. The root body is a unique spine body chosen by a heuristic (max number of
  incident leg limbs, plus position). Early Spore editors allowed general graphs with loops;
  testing showed the interface complexity **hindered player creativity**, so trees won.
- **Rest pose** = whatever configuration the player built. The system assumes it is
  "reasonable" (not hyper-extended or balled up). In practice players do this, and sometimes
  fix the rest pose after seeing the creature animate.

Data model sketch for our project (proposed adaptation; the Chimerolog contract built on it is
in `chimerolog-implementation.md` §2):

```ts
type Cap = 'root' | 'spine' | 'grasper' | 'mouth' | 'foot' | 'eye' | 'limb' | string;

interface Body {
  id: string;
  parent: string | null;        // null only for the root spine body
  restPosition: Vec3;           // character-relative
  restRotation: Quat;
  bounds: AABB;
  caps: Set<Cap>;
  deforms: Record<string, number>;  // e.g. { open: 0..1 }
}
```

## 2. Authoring (Spasm)

Spasm is Maxis' custom OpenGL animation tool. It preserves the four-step workflow animators
know (**Select, Pose, Key, Preview**) while changing what each step records. Preview in Spasm
runs the *same code* as in-game playback (WYSIWYG).

### 2.1 Select: contexts (semantic queries)

Because the runtime skeleton is unknown, a channel cannot reference bones by index/name.
Instead each channel carries a **context**: a constraint-based filter over bodies, akin to
e-mail or smart-playlist filters. The context yields the **selected bodies**; the one the
animator is currently manipulating is the **active body**.

Query components:

| Component | Options | Notes |
| --- | --- | --- |
| Type | a capability (`grasper`, `mouth`, `spine`, `root`, ...) | Selects *all* bodies with that cap (4 graspers -> 4 bodies). |
| Spatial | Front/Center/Back, Left/Center/Right, Top/Center/Bottom | Relative to the character's bounding box **or** to the *setspace* (bounding box of only the bodies with that cap). Side constraints include the center zone. Setspace separates bodies that are clumped relative to the whole character. |
| Extent | FrontMost, BackMost, LeftMost, RightMost, TopMost, BottomMost | Selects zero or one body (ties broken arbitrarily). |
| Limb modifier | `SpineSegment` | Walks up parent limbs to the first `spine` body: approximates the clavicle/shoulder or hip/pelvis for a selection, so another channel can pose the appropriate shoulder for the selected grasper. |

The **game code uses the same context queries** for AI reasoning, inventory, etc. Automatic
query generation by clicking bodies was rejected as combinatorially ambiguous (many queries
select the same body). Animators set up preferred channels once and reuse them.

### 2.2 Pose: movement modes, generalization G and specialization S

- Specialized pose of body `b_i` (character-relative Euclidean): `q_s_i`.
- Generalized, body-independent pose: `q_g = G(b_i, q_s_i, m)`; inverse `q_s_i = S(b_i, q_g, m)`
  with `S = G^-1`. `m` is the sagittal mirroring flag.
- While posing, the active body's `q_s` is continually generalized to `q_g`, which is then
  specialized onto *every* selected body (including the active one, which is not special-cased
  internally). So all selected bodies move together according to the channel's movement mode.
- The **movement mode** is the animator's statement of "what matters about this motion"; at a
  low level it defines the coordinate frame in which motion is recorded. Modes are ad hoc:
  added when animators cannot express an intent that generalizes, designed to layer. All modes
  share the rest pose as an origin: if one character is at rest for a given `q_g`, all are.

| Mode | Definition | Typical use |
| --- | --- | --- |
| **Identity / absolute** | `G = S = 1`; every selected body gets the same character-relative position/rotation. | Rotation: uniform end orientation regardless of rest (hold a platter level). Rarely useful for position. |
| **Rest relative** | `q_g` is a delta from each body's own rest pose (position and rotation set independently). | A hand wave: rest-relative position, absolute rotation so the hand points up. |
| **Scale: CreatureSize** | `S` scales positions nonuniformly by the character's bounding box. | Big creatures make big gestures. |
| **Scale: LimbLength** | `S` scales by the body's limb length = path length to nearest spine segment (approximates workspace). | Long limbs move far, short limbs move a little. |
| **Ground relative** | z axis vertical, remapped so `q_g.z = 0` is rest height and `q_g.z = 1` is the ground. | Pick up a rock / pound the ground with identical timing on any grasper height. (A sagittal-relative analogue was planned for claps and crossing motions.) |
| **Secondary relative** | A secondary context picks target bodies; x axis is the vector from the body's rest position to the target, 0 at rest, 1 at target. Frame updates during evaluation so the pose tracks a moving target. Secondary may be `ExternalTarget`, set by game code (a fruit; the other creature's grasper for a handshake). Modifier `SecondaryDirectionalOnly` keeps direction but not rescaling (a punch toward a target that does not squash as the target nears). | "Hand to mouth", "clap", "pick fruit", "shake hands". |
| **Lookat** (with secondary relative) | Aims the rotation frame's forward vector at the target; defines a frame for *relative* rotation keys so a nod can play while tracking. Soft joint limits damp influence as the target passes behind the body, so multi-headed creatures use an appropriate head. | Head tracking. |

Figures 2 and 3 in the paper show that one `q_g` gives correct reach poses on very different
morphologies, and that moving the target deforms the specialized curve while preserving the
local style of the motion.

### 2.3 Blending between channels

Several channels may select the same bodies. Ownership is allocated per animated degree of
freedom (rotation can be owned separately from position). The first channel to select a body
owns it for its **blend group**; later channels join by matching group. Results are blended
with ordinary weighted position/rotation blends. Since a channel's movement mode is fixed at
author time, animators **blend between channels to transition modes over time**: grab fruit
with an external-target-relative channel, then bring it to the mouth with an
internal-target-relative channel in one fluid motion.

### 2.4 Key: keys in generalized space

- Keys store `q_g` per enabled curve: position, rotation, deform curves, per-curve weights,
  and discrete keyable data (per-key visual/sound/data events).
- Interpolation happens on `q_g` with Hermite splines. Animators can edit the raw generalized
  curves (exact but non-intuitive) or the specialized curves on the current character (look
  Euclidean, differ per body); edits are generalized back to the stored keys.
- **Key remapping on mode change**: switching a channel's movement mode changes `G`, which
  would invalidate keys. Spasm remaps so the *active body's* specialized curve is unchanged:
  `q_g_new = G_new(b, S_old(b, q_g_old, false), false)`. Which body is active thus decides what
  is preserved (activate a long-limb body and turn off LimbLength scaling: big motion is kept
  on it and short limbs now move big too; activate a short-limb body: everything becomes small).

### 2.5 Preview: many creatures at once

Spasm loads multiple characters bound to the same animation. Editing on any one instantly
updates all others because every `q_s` derives from the shared `q_g`. This gives the animator
interactive control over generalization quality across a test set and tightens the loop.

## 3. Playback

The runtime presents a conventional animation API (play, async load, cache, queue, layer with
weights). First play of an animation on a character triggers a **bind** phase; afterwards each
frame computes `q_s` for each channel via `S`, blends goals, composes locomotion, solves IK,
then applies Jiggles.

### 3.1 Binding: branching

**Branch predicates** are three-valued (`true`, `false`, `ignore`) tests on the character
that gate whether an animation binds. Examples: `UprightSpine` (heuristic for prone vs.
upright spine), `HasGraspers`, `HasFeet`. If a single animation cannot be made general enough
and the system cannot be extended, animators author separate **branched** animations (e.g.
tool use with graspers vs. with the mouth). Branching is a **last resort** because it
multiplies authoring and testing cost.

### 3.2 Binding: variants and mirroring

Bind computes ownership/priority, then enumerates "how many different ways the animation can
play on this character". Each way is a **variant**; game code picks one at runtime.

- **Single variant group**: mark a channel so its curves play on only one selected body at a
  time; one variant per candidate body. For "grab fruit" the game picks the grasper nearest the
  fruit, or one not already holding something.
- **Sagittal mirroring**: animations are authored with arbitrary chirality; the system
  generates the mirror automatically during variant generation. The animator controls how `S`
  specializes when mirroring (`m` flag), so poses mirror correctly even on asymmetric bodies.
- **Many variant groups / variant product**: with two varying channels (give and receive
  grasper), each combination is a variant (`AB`, `BA`). Channels need not share a cap: hand to
  mouth with graspers 1,2,3 and mouths A,B yields `1A 1B 2A 2B 3A 3B`. Spatial relationships
  can constrain the product: same-side gives `23, 32`; opposite-side gives `12, 13, 21, 31`;
  unconstrained gives all six permutations. Arity and types are unrestricted.
- **Variant groups**: channels placed in the same group co-vary instead of multiplying
  variants (a grasper channel and its shoulder channel via the `SpineSegment` modifier).

### 3.3 Per-frame specialization and goal blending

For each playing animation, compute `q_s` for the selected bodies of each channel using `S`,
blend per blend group/priority, and emit **pose goals** (6-DOF, later reduced to 3-DOF
position goals at joint positions by the IK solver).

### 3.4 Gaits (locomotion synthesis)

Legged locomotion over uneven terrain, along curved paths, with **discontinuous input
velocities**. Feet may be animator-controlled in non-locomoting animations, but locomotion is
synthesized so feet do not slip and leg motion is plausible for the body's translation and
rotation. Note: this subsystem is separate from G/S "for historical reasons".

- **Leg definition**: a path through the limb tree from a `foot` body at the leaf to the spine
  segment at the base (the **hip**). Player legs branch arbitrarily (paper Fig. 6).
- **Leg groups**: legs are clustered into groups of roughly equal length. Group length ratios
  are approximated by **small rational numbers** to harmonize the relative frequency of each
  group's gait cycle.
- **Foot and hip posing**: for a leg group, feet on each unique hip are ordered; a cyclical
  foot pattern is produced by assigning each foot a **duty factor** (fraction of the cycle the
  foot is on the ground; Alexander 2003) and a **step trigger** (phase offset into the cycle;
  Rotenberg 2004). Hips translate/rotate with the feet for believable torso motion.
- **Flight path**: the foot's swing arc is animator-authored in Spasm either via arc parameters
  or a graphical editor in a normalized space, then applied per foot scaled by leg length.
- **Gait styles**: animators author a mapping from movement speed to gait parameters for groups
  with 1-6 feet; the system procedurally generates parameters for 7+ feet. Speed interpolates
  between authored sets. Extra styles layer on for effects (limping, lumbering for large
  creatures). Different leg groups can run different styles at once (two short legs running
  while four long legs trot).
- **No feet**: a heuristic decides whether the creature floats or crawls. Crawlers get some
  spine bodies converted into pseudo-feet with an inch-worm gait.
- Open problem cited: believable locomotion *with anticipation* given discontinuous player and
  code inputs.

Implementation sketch:

```ts
interface Leg { hip: Body; foot: Body; length: number }
interface LegGroup { legs: Leg[]; meanLength: number; freqRatio: Rational }
interface FootCycle { dutyFactor: number; stepTrigger: number }   // both in [0,1)

function planGait(legs: Leg[], speed: number, styles: GaitStyleTable): Map<Leg, FootCycle> {
  const groups = clusterByLength(legs);            // roughly equal length
  harmonizeWithSmallRationals(groups);             // e.g. 1:1, 2:1, 3:2
  const out = new Map<Leg, FootCycle>();
  for (const g of groups) {
    const params = g.legs.length <= 6 ? styles.lookup(g.legs.length, speed) : proceduralParams(g, speed);
    orderFeetPerHip(g).forEach((leg, i) => out.set(leg, params.forFoot(i)));
  }
  return out;
}
```

### 3.5 Particle IK Solver

See `particle-ik-solver.md`. Summary: skeleton as 3-DOF particles with 1-DOF length
constraints; two phases (spine, then limbs with spine fixed); aim preconditioner; quintic spine
splines; anti-buckling; soft, stretchy constraints; designed for ad hoc tunability and
graceful failure; path independent.

### 3.6 Jiggles (passive secondary animation)

Animators cannot robustly select "everything I did *not* animate", yet those parts need
secondary motion for appeal (Thomas & Johnston; Lasseter). So: any sub-tree that does **not
"have IK"** (no pose goals on it or its children) is handed to **Jiggles**, a very simple,
highly damped pseudo-physical simulator, applied based on heuristics for flexibility,
placement and type.

Two rules make it work:
1. Jigglable sub-trees are **discovered dynamically** from what the current animations leave
   unselected.
2. The motion is **completely passive**: it responds to keyed motion but never feeds back into
   the IK goals or the rest of the character. The earlier system, **Wiggles**, set IK goals and
   degraded the animators' work; that is why it was replaced.

## 4. Results, testing, limits, future work

- Players "seem amazed" when their creature comes to life; the editor starts playing animations
  as soon as feet, mouths or graspers are attached.
- **Testing**: stochastic testing against an ever-changing database of creatures uploaded from
  the game. Animation testers play animations on creature sets and log failures in an
  **Animation Validation Grid** spreadsheet (creatures x animations). Failures fall into: code
  bugs; aesthetic generalization issues fixable by animators with existing features;
  generalization issues needing new features or branches. Several hundred creatures x ~1000
  animations tested; pass rate ~90% and rising at publication.
- **Performance**: ~0.2 ms per frame for a 25-body procedurally animating character on a
  1.7 GHz Pentium-M; ~35% in IK, the rest in keyframe interpolation, goal blending, etc.
- **Learning curve**: animators make complete single-character animations within hours, but
  need **weeks** to develop intuition for which motions generalize. Many equivalent ways to
  author on one character specialize very differently on others.
- **Limitations**: no notion of volume/boundaries (cannot express "hug" or "rub chin");
  intra-character collision ignored; anti-buckling is simplistic and heavy-handed when it
  engages; path-independent IK necessarily has singularities (hairy ball theorem), pushed to
  unlikely configurations but still able to twist unrealistically nearby.
- **Future work**: more "reasoning" about morphology (boundary-relative mode; "close in" vs.
  "extended" concepts); richer semantics; gait anticipation under discontinuous input.
- **Applicability beyond Spore**: semantic markup by humans + realtime multi-target preview
  applies to any retargeting or parameterized animation; target-relative movement modes replace
  search-and-blend of sampled poses for reaching/aiming; the Particle IK solver's tunability
  benefits any IK; any game with adjustable height/weight/body shape faces a mild version of
  this problem.

## 5. Structure vs. style, applied here (GDC 2008 link)

Hecker's later *Structure vs Style* lecture names this system as an explicit
structure/style decomposition: contexts, movement modes, caps, variants and the IK solver are
the **structure** the computer reasons about; the keyed `q_g` curves, gait arcs and style
tables are the **style** animators own. Keep that split clean in our implementation: no
hard-coded aesthetic decisions in the solver, no topology assumptions in the authored data.

## 6. What the paper does not provide

Do not attribute these to the paper; they are our implementation choices if we build them:

- Mesh generation, skinning, UVs, or texturing for player-built bodies (the paper cites
  Willmott et al. 2007 "Rigblocks" for deformable parts but does not describe it).
- A genetics, splicing or evolution simulation; "DNA" is not a concept in the paper.
- Ecosystem, combat or clinic gameplay logic; the paper only notes that gameplay code reuses
  context queries for AI reasoning and inventory.
- Spore's actual source code, tool source (Spasm), or data formats.
- Intra-character collision, volume awareness, or anticipation in gaits (listed as
  limitations/future work).
