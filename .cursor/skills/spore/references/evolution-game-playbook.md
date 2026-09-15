# Evolution Game Playbook (derived guidance)

This file applies the source material to *our* evolution game. Unlike the other references,
it is our interpretation, not a restatement of the sources. Where a recommendation traces to a
source, the source is named so it can be checked.

## 1. Stage map and the Maxis prototype to study for each

| Our stage (working names) | Core loop | Maxis prototypes to study | Systems to build |
| --- | --- | --- | --- |
| Cell / tide pool | eat, avoid, grow, mutate | TidePool, WaterBoy, Crowd (flocking) | 2D fluid/heightfield, steering, simple part-based body |
| Creature | hunt, evade, eat, rest, socialize, evolve | SPUG -> GonzagoGL | economy sandbox, terrain, shelter/vegetation, creature editor + procedural animation |
| Ecosystem / planet | species spread, compete, adapt | CellCulture, BIOME, TextureBox | multi-channel CA planet, suitability functions, migration |
| Tribe / city | needs, mood, safety, growth | CityMaze, Crowd | agent needs, building effects, population dynamics |
| Space | explore, terraform, colonize, research | Space, Gaslight, ParticleMan | SSPSF galaxy gen, N-body flavor, 4X-lite economy that reuses the CA planet |

Build order (from *Advanced Prototyping* and the TidePool -> SPUG -> GonzagoGL lineage):
single-system probes first, then a synthesis prototype per stage, then production.

## 2. Prototyping rules we commit to

1. Each prototype answers **one written question** (e.g. "Does a hunger/energy economy with
   predators produce interesting risk decisions without scripted events?").
2. Stay low on the **Tower of Tuning**: constants + an in-app slider panel. Promote to data
   files only when a designer needs to own values. No scripting layer until forced.
3. Prototypes are **archived and runnable**; track how often each is referred back to.
4. Economy before art (SPUG). No animation, no production meshes in economy probes.
5. Every simulation probe exposes its parameters like ParticleMan did (toggle
   interactions, rates), so designers can find qualitatively different regimes.

## 3. Creature representation

Adopt the Spore body model directly (paper §1.2):

- Creature = DAG of **bodies**, serial **spine** chain at the root, limbs and parts attached.
- Each body: transform, bounds, parent, **caps** (`root`, `spine`, `grasper`, `mouth`, `foot`,
  `eye`, `sensor`, `fin`, ...), standardized **deform** channels per part type.
- Rest pose = as built. Choose the root spine body by a heuristic (most leg attachments, then
  position).
- Keep the editor **tree-only**; Maxis found general graphs hurt creativity.

Evolution layer on top (our addition, informed by NetCity/Braitenberg):

- A **genome** that expresses into the body DAG (part type, attachment, size, count, symmetry)
  plus behavioral wiring (sensor -> actuator gains). Mutation operates on the genome; selection
  operates on outcomes in the simulation.
- Gameplay code queries creatures with the same **context queries** the animation system uses
  (`grasper FrontMost`, `mouth`, `foot` count), so abilities derive from morphology rather than
  from a stat sheet. This is the "editor consequence" Hecker felt Spore under-explored
  (*Please Finish Your Game*); make it our central mechanic and explore it to its natural depth.

## 4. Animation plan

Follow the paper's architecture in order of payoff:

1. **Bodies + caps + context queries** (needed by gameplay anyway).
2. **Particle IK solver** (two-phase, aim preconditioner, soft constraints). Ship with a debug
   view of particles/constraints and all tuning knobs on sliders.
3. **Gaits**: leg detection, leg groups with small-rational harmonization, duty factor + step
   trigger per foot, authored style table for 1-6 feet, procedural beyond, crawl/float fallback.
4. **Jiggles** for non-IK sub-trees. Passive only.
5. **Generalized authoring**: movement modes (rest relative, scale modes, ground relative,
   secondary relative + lookat), blend groups, variants with sagittal mirroring. Build an
   in-engine Spasm-like tool with multi-creature preview from day one; preview must run the game
   code.
6. **Branch predicates** last, and only when generalization fails.

Testing: keep an **Animation Validation Grid** (creatures x animations, pass/fail/notes) and
run it stochastically against player-made creatures once we have them. Target 90%+ and trend.

## 5. Simulation substrate

Write **one data-driven cellular-automata engine** and reuse it (BIOME, CellCulture, Gaslight,
TextureBox all share the pattern):

- Grid with N channels per cell (life amounts by kind, resources, temperature, fire, disease).
- Rules expressed as **stoichiometric reactions** with rates, e.g.
  `1 Grass + 1 Herbivore -> 1.05 Herbivore` (rate k, neighborhood-weighted), `Fire + Tree -> Fire + Ash`.
- Support rectangular grids; add a spiral/polar grid for galaxy-scale SSPSF.
- Brushes (TextureBox) inject values for terraforming and designer setup.
- Suitability functions (CellCulture) turn environment channels into growth multipliers per
  species; migration is diffusion weighted by suitability gradient.

This gives evolution pressure at the population level (which niches expand or collapse) that
interacts with individual creatures' morphology-derived abilities.

## 6. Design guardrails from the lectures

- **Structure vs. style**: genome schema, CA rule grammar, IK solver, gait parameterization are
  structure; evolved values, rule sets, style tables, keyed curves are style. Never bake
  aesthetic choices into structure code.
- **Game AI is game design**: creature behavior tuning belongs to design; keep low-level
  behavior explicit (switch-statement clear), and plan for the Outro Problem when switching
  behaviors (who cancels the current action and how the animation lands).
- **Robustness > simplicity > performance** when picking algorithms.
- **Rewards**: progression should be endogenous (new parts, niches, abilities). Avoid expected,
  tangible meta-rewards; prefer unexpected informational feedback (the creature does something
  new because of a new body).
- **Metrics**: instrument playtests, but let intuition propose jumps; do not hill-climb.
- **Depth over breadth**: fewer stages done deeply beat many shallow ones. Spore's lesson.
- **Human scale**: let creatures pick up, hold, hand over, feed (the variant system exists for
  exactly this). Interesting gameplay "lays all over the floor" at this scale (*Potential
  Unreached*).
- **Diversity as theme**: a world of only weedy species is sad and boring (*Dysfunctional
  Three-Way*); make biodiversity legible and rewarding in the fiction.
- **Awareness**: talk about the game early and often; you cannot overhype, only underdeliver.

## 7. Open problems to expect (from the sources)

- Motions needing volume/boundary awareness (hug, rub chin) and intra-creature collision.
- Anti-buckling heavy-handedness; IK singularities.
- Gait anticipation under discontinuous player input.
- AI <-> animation interface combinatorics; the Outro Problem.
- Animators (and our designers) need weeks to build intuition for what generalizes across
  morphologies; budget for that learning curve and for a validation grid.
