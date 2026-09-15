# The Spore Prototypes (Maxis, 2002-2008)

Source: [spore.com/comm/prototypes](https://www.spore.com/comm/prototypes) ("Play with our
Prototypes"). Maxis describes how Spore was "a huge undertaking" during which they explored
"countless design directions in gameplay, simulation and user interface", and that one of their
main exploration tools was building "simple, playable prototypes that we can play around with
to get a sense for a particular system." The public downloads are explicitly "not tested,
supported or even easily explained."

License: EA Tools & Materials EULA. Personal, noncommercial use only; no modification,
reverse engineering, redistribution or commercial use. Use these as references, not as code.

Complementary source: Chris Hecker and Chaim Gingold's GDC 2006 lecture *Advanced Prototyping*
(see `design-philosophy.md` §1), which is the methodology behind these prototypes.

## 1. The prototype lineage at a glance

```
Simulation / tech probes                Gameplay syntheses              Stage prototypes
------------------------                ------------------              ----------------
BIOME (programmable CA) ─┐
WaterBoy (fluid on terrain) ─┼──► TidePool (fire-fighting mini game) ──► SPUG ──► GonzagoGL  (Creature stage)
Crowd (flocking / SC4 sims) ─┘
CellCulture (spread of life)                                             CityMaze          (Tribe/Civ stage)
TextureBox (paint onto CA)                                               Space             (Space stage)
NetCity (evolving behavior)
Gaslight (SSPSF star formation)
ParticleMan (gravity N-body)
```

Maxis' own description of TidePool: "our first steps down the path toward synthesizing our
ideas into a playable game", combining pieces of BIOME, WaterBoy and Crowd, and setting the
stage for SPUG and GonzagoGL. This is the pattern to copy: small single-system probes first,
then deliberate syntheses of several probes into a playable loop.

## 2. Prototype catalogue

Each entry: what it is (paraphrased from Maxis), the underlying technique, and what it means
for our evolution game.

### BIOME — programmable cellular automata simulator
- What: Lets users build simple "SimCity-like" grid simulations. Inspired by Conway's Life
  (as SimCity itself was). Rules are written in a language based on **chemical
  stoichiometry** (the notation for chemical reactions): cells change state the way chemicals
  change when exposed to other chemicals. Cited applications: forest fires, disease
  epidemics, animal migration, crystallization. Supports **rectangular and spiral** CA
  grids; the spiral grid was used to study stochastic self-propagating star formation at
  galactic scale.
- Technique: Rule set = list of reactions `A + B -> C + D` with rates/probabilities, applied
  per cell using neighbor counts as reagent concentrations.
- For us: A data-driven CA engine with reaction-style rules is a cheap, general substrate for
  biomes, climate, disease, vegetation spread, and even galactic structure. Build it once,
  reuse it at every stage (see `evolution-game-playbook.md`).

### CellCulture — spread of life and culture over a planet
- What: SimCity-like simulation of life and culture spreading across a planetary surface.
  Planet is a **grid of cells**; each cell holds several variables describing the **amount
  and kind of life** present. Life grows and spreads cell-to-cell based on those variables;
  the more favorable the conditions, the faster growth and spread.
- Technique: Multi-channel CA (per-cell vectors), growth rate as a function of local
  suitability, diffusion to neighbors.
- For us: Direct model for the macro view of evolution: populations of species as per-cell
  densities, environment suitability driving growth, migration as diffusion, and culture as
  a second layer spreading over the same grid.

### TextureBox — painting onto a live cellular automaton
- What: Applies paint-program brushes to dynamic CA systems like BIOME and CellCulture.
  Brushes apply color to a canvas that then **propagates those colors using CA rules**.
- Technique: User input as a source term into the CA; the CA does the "rendering".
- For us: Pattern for terraforming/planet-painting tools and for designer tuning UIs: paint
  initial conditions, watch the simulation take over. Also a good editor for creature skin
  patterns if we ever do reaction-diffusion textures.

### WaterBoy — fluid on uneven terrain (2002)
- What: Fluid dynamics simulator for the behavior of large bodies of water on uneven terrain.
  Also an early demo of then-modern GPU features: environment cube mapping and custom shaders.
- Technique: Height-field / shallow-water style simulation over a terrain heightmap.
- For us: Sea level, rivers and floods as a driver of biome change and speciation pressure;
  the tide-pool setting for the cell stage.

### TidePool — first playable synthesis
- What: Combines the **forest fire simulator from BIOME**, **terrain + water from WaterBoy**,
  and the **flocking system from Crowd** into a fire-fighting mini game.
- For us: Template for a "vertical slice" prototype: pick three proven subsystems and force
  them into one loop with a win condition.

### Crowd — SimCity 4 prototype (agents + flocking)
- What: Player controls a neighborhood of city blocks. Sims wander looking for residential,
  commercial or industrial buildings to rest, work or recreate. Zoning gray blocks attracts
  sims of that type. Zoned buildings emit traffic vehicles controllable with traffic lights.
- Technique: Agent needs + attractors, flocking/steering, emitters.
- For us: Herd/flock behavior for prey and predators in the creature stage; agent need
  satisfaction loops for the tribal stage.

### NetCity — evolution of complex behavior from simple components
- What: Programmable simulator for the **evolution of complex behavior from simple
  components**. User-defined nodes can emit signals and move, or shrink and grow when a
  signal is received. Inspired by the **Soda Constructor** (sodaplay.com) and by
  Braitenberg's **Vehicles: Experiments in Synthetic Psychology**.
- Technique: Node-and-link "creatures" whose morphology *is* their controller: signal
  propagation through links drives actuators (grow/shrink/move). Braitenberg vehicles show
  how trivial sensor-motor wiring yields behavior that reads as fear, aggression, love.
- For us: This is the most directly "evolution" prototype in the set. A body-as-controller
  representation lets us apply mutation/selection to morphology and behavior together, which
  is what an evolution game needs if creatures are to *earn* their traits rather than only be
  painted with them.

### Gaslight — stochastic self-propagating star formation (SSPSF)
- What: Interstellar gas collapses under gravity into dense regions that become stars; new
  stars heat surrounding material and push it away, creating new dense regions, which make
  more stars, and so on.
- Technique: Propagating-excitation CA (same family as forest fire / epidemic models),
  often run on BIOME's spiral grid to get spiral-arm structure.
- For us: Procedural galaxy generation for the space stage that produces spiral arms and star
  clusters from a rule set rather than hand placement.

### ParticleMan — gravitational N-body sandbox
- What: Simulates gravitational attraction between particles in a cloud. Used to study
  orbits, nebula formation, star formation and particle streams from pulsars/black holes.
  Elements include a **Particle Gun** and **Gravity Well** objects. Toggling
  **particle-particle interactions** contrasts orderly independent particles with chaotic
  interacting ones. A **fusion rate** parameter: high rates simulate star birth in collapsing
  nebulae; low rates simulate interactions between stars in a galaxy.
- Technique: N-body gravity with optional pairwise interaction and a merge ("fusion") rule.
- For us: Space-stage visuals and a tuning example: a handful of physics sliders exposed to
  designers produced a wide range of qualitatively different phenomena.

### SPUG — tunable Creature-stage gameplay prototype
- What: Player controls an avatar creature on a simple planetary terrain and may **hunt prey,
  evade predators, eat, rest and level up stats**. **No limitations** on leveling or cheating
  stats; designers impose limits themselves. Purpose: let designers **explore different
  economies** for the creature game.
- For us: The creature-stage economy should be prototyped as a pure numbers sandbox first
  (hunger, energy, health, XP, predator danger), with every knob exposed and no guard rails,
  before any art or animation is attached.

### GonzagoGL — the final Spore gameplay prototype
- What: OpenGL prototype of the Creature game. Places the player in an environment with
  **predators, prey, shelter and vegetation**. Advances SPUG with higher-quality terrain and
  more emphasis on gameplay. "The final gameplay prototype developed for Spore."
- For us: The second iteration after SPUG: keep the economy, add spatial gameplay (shelter,
  vegetation, terrain), still before production art.

### CityMaze — agent-based city (Tribe/Civ ancestor)
- What: Player controls a city of sim creatures and places **residential, industrial,
  entertainment and defense** buildings. Sims entering them **rest, produce income, improve
  mood, or defend against raider attacks**. Happy, safe, rested sims multiply and produce
  income; miserable, threatened, tired sims leave.
- For us: Population dynamics as a function of needs satisfied is the same loop as
  ecosystem carrying capacity; reuse the model between creature ecology and tribal cities.

### Space — Space-stage prototype
- What: Explore a galaxy with a spacecraft, discover worlds to **terraform and colonize**,
  meet alien species to **fight or befriend**. Successful colonies yield resources and income
  to invest in **technological research**; advanced tech improves terraforming, colonizing,
  fighting and exploring.
- For us: A 4X-lite loop; the terraforming tool should reuse the CA planet model
  (CellCulture/BIOME) so that colonies and native life interact through one simulation.

## 3. Patterns worth copying

1. **One system per probe.** BIOME, WaterBoy, Crowd, ParticleMan each isolate a single
   simulation and expose its parameters.
2. **Programmable, data-driven cores.** BIOME (rule language), NetCity (user-defined nodes),
   TextureBox (brushes as inputs) all put designers in control without recompiling; this is
   the "data driving / interactive editor" tier of the Tower of Tuning.
3. **Synthesis prototypes** (TidePool, SPUG, GonzagoGL) recombine proven probes into a loop
   with goals and failure.
4. **Economy before art.** SPUG had no limits and no polish; its only job was to let designers
   feel out the creature economy.
5. **Same math at multiple scales.** Propagating-excitation CA served forest fires, disease,
   *and* galactic star formation. Look for these reuses in our own design.
6. **Ship them.** Maxis released the prototypes publicly. Keeping an archive of runnable
   prototypes is one of the "Advanced Prototyping" success metrics (how often is a prototype
   referred back to?).
