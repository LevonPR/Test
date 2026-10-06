# Prototype Map: the 13 Official Spore Prototypes and Our Experiments

Source: [spore.com/comm/prototypes](https://www.spore.com/comm/prototypes) ("Play with our
Prototypes"). Maxis describes Spore as "a huge undertaking" during which they explored
"countless design directions in gameplay, simulation and user interface", using "simple,
playable prototypes that we can play around with to get a sense for a particular system." The
public downloads are "not tested, supported or even easily explained."

Coverage: the page descriptions were read; **the executables were not downloaded or run**
(see `sources.md`). Everything under "Official description" is paraphrased from the page.
Everything under "Chimerolog experiment" is our proposal.

License: EA Tools & Materials EULA (text on the page). Personal, noncommercial use "in
connection with EA's products"; no modification, reverse engineering, redistribution, or
commercial use; EA may revoke at any time. These are design references. Do not vendor
binaries or assets into Biomant Chimerolog and do not derive code from them.

Methodology companion: *Advanced Prototyping* (GDC 2006), summarized in `lectures.md` and
`design-philosophy.md` §1.

## 1. Lineage

```
Simulation / tech probes                 Gameplay syntheses              Stage prototypes
------------------------                 ------------------              ----------------
BIOME (programmable CA) ─┐
WaterBoy (fluid on terrain) ─┼──► TidePool (fire-fighting mini game) ──► SPUG ──► GonzagoGL  (Creature stage)
Crowd (flocking / SC4 sims) ─┘
CellCulture (spread of life)                                              CityMaze          (Tribe/Civ ancestor)
TextureBox (paint onto CA)                                                Space             (Space stage)
NetCity (evolving behavior)
Gaslight (SSPSF star formation)
ParticleMan (gravity N-body)
```

Maxis calls TidePool "our first steps down the path toward synthesizing our ideas into a
playable game", built from pieces of BIOME, WaterBoy and Crowd, and the precursor to SPUG and
GonzagoGL. Pattern: single-system probes, then deliberate syntheses into a playable loop.

## 2. Catalogue

### BIOME — programmable cellular automata simulator
- Official description: users develop simple "SimCity-like" grid simulations. Inspired by
  Conway's Life (as SimCity's grids were). Rules use a language based on **chemical
  stoichiometry**; cells change state the way chemicals react. Applications named: forest
  fires, disease epidemics, animal migration, crystallization. **Rectangular and spiral** grids;
  spiral used for stochastic self-propagating star formation at galactic scale.
- Technique: reaction rules `A + B -> C + D` with rates, neighbor counts as concentrations.
- Chimerolog experiment: a rule-driven grid for **folklore hunting grounds** (where a creature
  type spreads, where blight or plague moves through villages, how a forest recovers after a
  hunt). One engine, many rule files owned by design.

### CellCulture — spread of life and culture over a planet
- Official description: SimCity-like simulation of life and culture spreading across a planet
  represented as a **grid of cells**; each cell holds variables for the **amount and kind of
  life**; growth and spread rates rise with favorable conditions.
- Chimerolog experiment: regional **population and rumor model** for the Imperium of Rus map:
  per-region densities of wild chimera stock, peasant population, and rumor/fear levels that
  feed hunt contracts and clinic demand.

### TextureBox — painting onto a live cellular automaton
- Official description: paint-program brushes applied to dynamic CA systems like BIOME and
  CellCulture; brushes lay down color which the CA then **propagates by its rules**.
- Chimerolog experiment: designer/GM brush tool for seeding scenario maps; potentially a
  **hide/scale pattern generator** for spliced skins (reaction-diffusion driven by splice
  parameters). Treat the visual use as optional and asynchronous to simulation.

### WaterBoy — fluid on uneven terrain (2002)
- Official description: fluid dynamics for large bodies of water on uneven terrain; also an
  early showcase of environment cube mapping and custom shaders.
- Chimerolog experiment: low priority. Rivers/marshes as hunt-terrain modifiers only if the
  tactical map needs them.

### TidePool — first playable synthesis
- Official description: combines BIOME's **forest fire** sim, WaterBoy's **terrain + water**,
  and Crowd's **flocking** into a fire-fighting mini game.
- Chimerolog experiment: template for our first synthesis prototype: combine the anatomy
  contract, one context-driven action, and the row-based combat resolver into one hunt
  encounter before any art.

### Crowd — SimCity 4 prototype (agents + flocking)
- Official description: player controls city blocks; sims wander seeking residential,
  commercial or industrial buildings to rest, work or recreate; zoning attracts sim types;
  zoned buildings emit traffic controllable by lights.
- Chimerolog experiment: **clinic flow**: patients and spliced creatures move between intake,
  wards, splicing theatre and release; bottlenecks are visible as queues. Also herd behavior for
  wild quarry during hunts.

### NetCity — evolution of complex behavior from simple components
- Official description: programmable simulator of **complex behavior emerging from simple
  components**; user-defined nodes emit signals and move, or shrink/grow on receiving a signal.
  Inspired by the **Soda Constructor** and Braitenberg's **Vehicles**.
- Technique: body-as-controller; signal propagation through links drives actuators.
- Chimerolog experiment: the most relevant probe for **splicing consequences**. Give spliced
  parts simple sensor/actuator wiring so a grafted organ changes behavior, not only stats. Small
  Braitenberg-style rules produce readable temperaments (skittish, aggressive, clingy) that
  design can name in folklore terms.

### Gaslight — stochastic self-propagating star formation (SSPSF)
- Official description: gas collapses into dense regions that ignite as stars; stars heat and
  push surrounding material, seeding more stars, and so on.
- Chimerolog experiment: not needed for the core game. Keep as a reference for any
  propagating-excitation phenomenon (panic spreading through a village, curse contagion).

### ParticleMan — gravitational N-body sandbox
- Official description: gravity between particles in a cloud; studied orbits, nebulae, star
  formation and streams from pulsars/black holes. Objects: **Particle Gun**, **Gravity Well**.
  Toggle **particle-particle interactions** to compare orderly vs chaotic regimes; a **fusion
  rate** parameter spans nebula star birth (high) to galactic star interaction (low).
- Chimerolog experiment: a tuning-UI pattern rather than a mechanic: a handful of exposed
  sliders should let designers find qualitatively different regimes (calm ward vs. chaotic
  outbreak) in our simulations.

### SPUG — tunable Creature-stage gameplay prototype
- Official description: avatar creature on simple planetary terrain; **hunt prey, evade
  predators, eat, rest, level up**; **no limits** on leveling or cheating stats; designers
  self-impose limits to **explore economies**.
- Chimerolog experiment: the **hunt-and-splice economy sandbox**: contracts, quarry danger,
  harvested parts, splice costs, clinic income, reputation. No art, no animation, every knob
  exposed, no guard rails. Answer "is the loop interesting on numbers alone?"

### GonzagoGL — the final Spore gameplay prototype
- Official description: OpenGL Creature-game prototype with **predators, prey, shelter and
  vegetation**; better terrain and more gameplay emphasis than SPUG; "the final gameplay
  prototype developed for Spore."
- Chimerolog experiment: the second iteration: keep SPUG-level economy, add the tactical row
  grid with terrain/cover and creature abilities derived from anatomy.

### CityMaze — agent-based city (Tribe/Civ ancestor)
- Official description: player places **residential, industrial, entertainment and defense**
  buildings; sims entering them **rest, produce income, improve mood, or defend against
  raiders**; happy, safe, rested sims multiply and pay; miserable ones leave.
- Chimerolog experiment: **clinic management loop** directly: rooms as buildings, staff and
  patients as sims, raids as folklore incursions. Mood/safety/rest -> retention and income.

### Space — Space-stage prototype
- Official description: explore a galaxy, **terraform and colonize** worlds, **fight or
  befriend** aliens; colonies fund **research** that unlocks better terraforming, colonizing,
  fighting and exploring.
- Chimerolog experiment: structural reference for a **research/renown tree** funded by clinic
  and hunt income, unlocking splice techniques and expedition range across the Imperium.

## 3. Patterns worth copying

1. One system per probe (BIOME, WaterBoy, Crowd, ParticleMan).
2. Programmable, data-driven cores (BIOME rule language, NetCity nodes, TextureBox brushes):
   designers in control without recompiling; the "interactive editor / data driving" tiers of
   the Tower of Tuning.
3. Synthesis prototypes (TidePool, SPUG, GonzagoGL) recombine proven probes into a loop with
   goals and failure.
4. Economy before art (SPUG had no limits and no polish).
5. Same math at several scales (propagating-excitation CA for fire, disease, star formation).
6. Archive and revisit: keep prototypes runnable; measure how often they are referred back to.

## 4. Independent experiments proposed for Biomant Chimerolog

Each is a one-question prototype at the lowest workable tuning tier. None is implemented;
these are proposals to be scheduled against the phases in `chimerolog-implementation.md` §6.

| Experiment | Question it answers | Inspired by | Success signal |
| --- | --- | --- | --- |
| **Anatomy Sandbox** | Can arbitrary chimera trees (mixed animal parts, 0-N limbs, 0-N mouths) be built, saved and reloaded through one contract with capability queries returning sane results? | Paper §1.2, §3.1 | 20 hand-made chimeras round-trip; every context query returns explicit zero/one/many; no bone-name lookups. |
| **Reach Rig** | Does one generalized "reach target" action specialize convincingly across 5 radically different bodies? | Paper §3.2, Fig. 2-3 | Same keyed curve; all five touch the target in the same timing; rest pose unchanged when mode toggles. |
| **Gait Bench** | Do leg groups + duty factor/step trigger give non-slipping walks for 1-8 legs of mixed length? | Paper §4.2 | Foot slip below tolerance; visible harmonized cadence across groups; crawl fallback for legless. |
| **Splice Consequence** | Does grafting a part change legal actions and combat rows meaningfully without a stat sheet? | Hecker on "editor consequence"; NetCity | Each of 10 splices adds/removes at least one action or row option; players can predict outcomes from the body. |
| **Hunt-Splice Economy (SPUG-style)** | Is the contract -> hunt -> harvest -> splice -> clinic income loop interesting on numbers alone? | SPUG | Designers find tension points with sliders only; at least two distinct viable strategies. |
| **Clinic Flow (CityMaze/Crowd-style)** | Do room placement and staffing decisions produce legible queues, moods and revenue? | CityMaze, Crowd | Bottlenecks visible within 2 minutes of play; mood -> retention -> income chain readable. |
| **Folklore Spread (BIOME/CellCulture-style)** | Can a rule file drive rumor, fear and quarry population on the region map to generate contracts? | BIOME, CellCulture, TextureBox | Region states diverge from identical starts under different rule files; contracts emerge without scripting. |
| **Interrupt & Outro** | When a combat action is cancelled mid-execution, does the creature land in a valid pose and state? | AIIDE 2010 "Outro Problem" | No pops; goals hand off cleanly; state and animation agree after interruption. |
