---
name: spore
description: "Design and engineering knowledge distilled from Maxis' Spore for building an evolution game: the 13 public Spore prototypes and how Maxis prototyped, the SIGGRAPH 2008 procedural creature-animation system (semantic retargeting, variants, gait synthesis, Particle IK, Jiggles), and Chris Hecker's lectures on prototyping, structure-vs-style, IK/physics, and game design. Use when designing or implementing creature editors, procedural animation for user-made morphologies, evolution/ecosystem simulations, cellular-automata worlds, prototyping plans, or tuning pipelines for the evolution game."
---

# Spore: Reference Skill for the Evolution Game

This skill packages everything from the requested sources into a form you can act on while
building our evolution game. Use it whenever a task touches creature creation, animating
arbitrary player-made bodies, simulating life/ecosystems/galaxies, prototyping a mechanic,
or deciding how to tune and iterate.

Sources (all content in `references/` is distilled from these):

| Source | What it covers | Reference file |
| --- | --- | --- |
| [spore.com/comm/prototypes](https://www.spore.com/comm/prototypes) | 13 playable Maxis prototypes that led to Spore | `references/prototypes.md` |
| [Real-time Motion Retargeting... (page)](https://www.chrishecker.com/Real-time_Motion_Retargeting_to_Highly_Varied_User-Created_Morphologies) + [SIGGRAPH 2008 PDF](https://www.chrishecker.com/images/c/cb/Sporeanim-siggraph08.pdf) | The full Spore creature animation system | `references/procedural-animation.md`, `references/particle-ik-solver.md` |
| [How To Animate a Character You've Never Seen Before](https://www.chrishecker.com/How_To_Animate_a_Character_You%27ve_Never_Seen_Before) | GDC 2007 lecture on the same system | `references/procedural-animation.md` |
| [Category:Lectures](https://www.chrishecker.com/Category:Lectures) | All 27 Hecker lectures (prototyping, IK, physics, design, AI) | `references/lectures-index.md`, `references/design-philosophy.md`, `references/ik-and-physics.md` |

Applied guidance for our project (derived from the above, not from the sources directly):
`references/evolution-game-playbook.md`.

## How to use this skill

1. Identify which subsystem the task is about and open the matching reference file below.
   Do not try to hold the whole skill in context at once; the reference files are long.
2. Prefer the source vocabulary (bodies, caps, contexts, movement modes, variants, leg groups,
   Particle IK, Jiggles) in code and docs so the team shares one language with the literature.
3. When proposing a new mechanic or system, first check `references/prototypes.md` for the
   Maxis prototype that already explored it, and follow the prototyping rules in
   `references/design-philosophy.md` (focused question, cheapest tuning tier, archive metric).
4. Cite the source file/section in PR descriptions when a design decision comes from this skill.

## Quick decision guide

| If the task is... | Read | Key takeaways |
| --- | --- | --- |
| Build/extend the creature editor data model | `procedural-animation.md` §1 | Character = DAG of 20-80 *bodies*; serial spine chain at the root; each body has transform, bounds, parent, and *capability* tags (grasper, mouth, foot, spine, root...). Rest pose is whatever the player built. |
| Animate a creature that did not exist at author time | `procedural-animation.md` §2-3 | Author in a generalized, morphology-independent space via *semantic* selection (contexts) and *movement modes*; specialize at runtime; enumerate *variants*; branch only as a last resort. |
| Make legs walk on any leg count/length | `procedural-animation.md` §3.4 | Cluster legs into groups of similar length, harmonize with small rational ratios, drive duty factor + step trigger per foot, authored gait styles for 1-6 feet, procedural for 7+, crawl/float heuristic for footless bodies. |
| Pose a skeleton from goals every frame | `particle-ik-solver.md` | Two-phase (spine then limbs) particle-and-length-constraint solver; aim preconditioner; spine splines (quintic Hermite); anti-buckling; delegated goals; soft constraints. ~0.2 ms for 25 bodies in 2008. |
| Add life to un-animated parts | `procedural-animation.md` §3.6 | *Jiggles*: passive, highly damped pseudo-physics on sub-trees with no IK; never feeds back into keyed bodies. |
| Simulate ecosystems, spread of life, fire, disease, star formation | `prototypes.md` (BIOME, CellCulture, Gaslight, ParticleMan, TextureBox) | Stoichiometry-style CA rules; grid with per-cell life variables; SSPSF for galaxies; gravitational N-body for nebulae/orbits. |
| Design the creature-stage economy (hunt, eat, rest, level) | `prototypes.md` (SPUG, GonzagoGL) | Tunable, self-limited sandbox for designers first; graphics later. |
| Design tribe/city/space stages | `prototypes.md` (CityMaze, Crowd, Space) | Agent-based cities with mood/safety/rest loops; galaxy exploration with terraform/colonize/research economy. |
| Decide whether to prototype, and how | `design-philosophy.md` §1 | One question per prototype; Tower of Tuning (stay as low as possible); measure by how often the prototype is referred back to. |
| Choose how to expose tuning knobs | `design-philosophy.md` §1.2 | recompiling < interactive editor < data driving < hotloading < scripting language. Climb only when forced. |
| Decide what is code vs. what is authored content | `design-philosophy.md` §2 | Structure vs. style decomposition: computer reasons about structure, artists own style. The Spore anim system and creature paint are explicit examples. |
| Wire AI to animation | `design-philosophy.md` §3 | Game AI *is* game design; the Outro Problem and the AI-Anim Problem; avoid bubble-and-line middleware that just relocates the problem. |
| Evaluate a paper/algorithm for adoption | `design-philosophy.md` §4 | Robustness > simplicity > performance. Source code is more rigorous than the paper. |
| Add rewards/achievements/metrics | `design-philosophy.md` §5-6 | Tangible expected contingent rewards reduce intrinsic motivation; metrics are craft, intuition is art; avoid hill-climbing into a local maximum. |
| Scope and depth of the game | `design-philosophy.md` §7 | Spore under-explored *editor consequence*; depth not time invested; you cannot overhype, only underdeliver. |
| Physics for ragdolls, tails, ponytails, constraints | `ik-and-physics.md` | Survey of IK methods Hecker tried; four articulated-body simulators; Lagrange multipliers in 4 steps; MLCP as a universal hammer; annotated physics bibliography. |

## Non-negotiable lessons from the sources

- Bring humans into the semantic loop. Spore's biggest win was having animators *tell* the
  system what matters (which bodies, which frame of reference) rather than inferring it.
  "Having a human simply tell the system what is important is immensely powerful, efficient,
  and robust."
- Design for graceful failure. Goals will be out of reach, in conflict, or implausible.
  Every failure mode must still produce a natural-looking pose or behavior.
- Prefer simple, tunable algorithms over mathematically fancy ones. The Particle IK solver
  beat CCD, Jacobian, and constrained-dynamics solvers because it was *tunable*, not because
  it was more correct.
- Path independence matters. Redundant solvers that depend on the previous frame's solution
  will eventually tie themselves in knots.
- Passive secondary motion must never override authored motion (Wiggles -> Jiggles lesson).
- Prototype to answer one question, at the lowest tuning tier that works, and archive it.
- Test stochastically against real user content. Spore kept an "Animation Validation Grid"
  of creatures x animations, targeting a ~90%+ pass rate and improving.
- Explore the core mechanic to the depth it deserves. Wacky ideas are cheap; depth is rare.

## Legal note on the Maxis prototypes

The prototypes on spore.com ship under EA's Tools & Materials EULA: personal, noncommercial
use only; no redistribution, modification, reverse engineering, or commercial use. Treat them
as design references to play and learn from. Do not vendor their binaries or assets into this
repository and do not derive code from disassembly. Reimplement the *ideas* (which are
described publicly on that page) in our own code.
