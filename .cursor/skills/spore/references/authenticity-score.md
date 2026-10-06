# Spore Authenticity Score (SAS) 1.0

A rubric for comparing an implemented creature game against the Spore systems documented in
this skill. The score is a **subjective, evidence-bounded comparison** for internal
development steering. It is not an official rating, not a measure of how much the skill knows,
and not a target that overrides Biomant Chimerolog's own design.

## 1. Rules

1. **Declare scope first.** Either *cell-stage* (creature creation, animation, movement, basic
   interaction of one creature) or *whole-game* (also ecology, progression, world simulation).
   Never mix scopes in one score. Do not impose Spore's stage progression on a game that did not
   ask for it; whole-game scope compares systems, not stages.
2. **Score implemented, observed behavior only.** A criterion earns points when it has been
   run on the test bench (`chimerolog-implementation.md` §5) and the result recorded. Designs,
   plans, and untested code score 0 for that criterion.
3. **Respect evidence ceilings.** Each criterion lists the source that defines "authentic". If
   the sources do not describe a system (skinning, genetics, ecosystem AI), that criterion's
   ceiling is marked *no source* and it is scored only for internal consistency, never for
   fidelity to Spore.
4. **Bench breadth is mandatory.** A criterion demonstrated on a single attractive reference
   creature earns at most 40% of its points. Full points require the multi-morphology bench.
5. **Preserve assessments with the game source.** Store each assessment as a dated file next
   to the code it evaluates (suggested: `docs/authenticity/SAS-YYYY-MM-DD.md`), including
   scope, per-criterion evidence, and the total.
6. **Do not raise scores for**: untested features, promised features, generated visuals that are
   not validated against anatomy, or 2008 benchmark numbers quoted from the paper.

## 2. Criteria

Points sum to 100 in each scope. "Ceiling" names the strongest source available.

### Cell-stage scope (100 points)

| # | Criterion | Pts | Authentic behavior (source finding) | Ceiling |
| --- | --- | --- | --- | --- |
| C1 | Anatomy model | 10 | Creature = tree of bodies with transforms, bounds, parent links, capability tags, standardized deform channels; serial spine at root; rest pose as built. | Paper §1.2 |
| C2 | Semantic selection | 10 | Parts selected by capability + spatial (creature/setspace) + extent + SpineSegment queries; zero/one/many handled; no fixed bone names. | Paper §3.1 |
| C3 | Generalized authoring | 12 | Actions stored in generalized coordinates with movement modes (identity, rest-relative, scale, ground-relative, secondary-relative, lookat); G/S invertible; rest pose invariant across modes; key remapping on mode change. | Paper §3.2-3.3 |
| C4 | Multi-target preview | 6 | Editing an action on one creature updates all loaded creatures live; preview runs runtime code. | Paper §3.4 |
| C5 | Binding, variants, mirroring | 10 | Branch predicates; variant enumeration (single group, product, side constraints, variant groups); automatic sagittal mirror; game chooses variant. | Paper §4.1 |
| C6 | Gait synthesis | 12 | Leg detection, leg groups harmonized by small rationals, duty factor + step trigger, authored styles 1-6 feet, procedural 7+, hip motion, layered styles, crawl/float fallback. | Paper §4.2 |
| C7 | IK quality | 14 | Two-phase particle solver; aim preconditioner; spine splines; anti-buckling; soft constraints; graceful failure in all three modes; path independence. | Paper §4.3 |
| C8 | Secondary motion | 6 | Passive Jiggles on non-IK sub-trees discovered dynamically; no feedback into goals. | Paper §4.4 |
| C9 | Editor consequence | 10 | Adding/removing parts immediately changes what the creature can do and how it moves; animations begin as soon as feet/mouths/graspers are attached. | Paper §5; lecture *Please Finish Your Game* |
| C10 | Validation practice | 6 | A creatures x actions validation grid exists, is run against varied (ideally player-made) creatures, failures classified (bug / authorable / needs feature). | Paper §5 |
| C11 | Visual generation fidelity | 4 | Meshes/skins/paint follow anatomy and deform channels. | *No source* (Rigblocks cited, not described): internal consistency only |

### Whole-game scope (100 points)

| # | Criterion | Pts | Authentic behavior | Ceiling |
| --- | --- | --- | --- | --- |
| W1 | Cell-stage core | 40 | Cell-stage score x 0.4. | as above |
| W2 | Economy sandbox lineage | 10 | A tunable, headless economy prototype (SPUG-like) exists and informed the shipped numbers. | Prototypes page (SPUG, GonzagoGL) |
| W3 | Simulation substrate | 10 | Data-driven grid/CA or agent simulation drives world state (life spread, hazards, population, mood). | Prototypes page (BIOME, CellCulture, CityMaze, Crowd) |
| W4 | Emergent behavior from body | 8 | Behavior derives partly from morphology/wiring rather than only from stats. | Prototypes page (NetCity); *no detailed source* |
| W5 | Human-scale interaction | 8 | Creatures pick up, hold, hand over, feed, using variant selection. | Paper §4.1 examples; lecture *Potential Unreached* |
| W6 | Structure/style discipline | 8 | Clear split between code-reasoned structure and authored style across systems. | Lecture *Structure vs Style* |
| W7 | Prototyping and tuning practice | 8 | One-question prototypes, lowest workable tuning tier, archived and revisited. | Lecture *Advanced Prototyping* |
| W8 | Progression design | 4 | Progression is endogenous (new anatomy/abilities), not badge-driven. | Lecture *Achievements Considered Harmful?* (opinion + cited psychology) |
| W9 | Ecosystem/genetics | 4 | Populations respond to creature traits over time. | *No source* in supplied material: internal consistency only |

## 3. Scoring a criterion

For each criterion record:

```
Cn <name> — <points awarded>/<max>
Scope: cell-stage | whole-game
Evidence: <test/bench run, date, commit, creatures used>
Bench breadth: single reference (cap 40%) | partial bench | full bench
Approximation vs source: <e.g. cubic spine spline instead of quintic; single-phase IK>
Ceiling note: <source section, or "no source: internal consistency only">
```

Award points on a 0 / 25% / 50% / 75% / 100% scale per criterion, then apply the bench-breadth
cap. Round the total to an integer.

## 4. Interpreting the total

| Total | Reading |
| --- | --- |
| 0-20 | Concept or single-creature demo; no morphology independence yet. |
| 21-45 | Anatomy contract and one or two generalized systems working on a bench. |
| 46-70 | Most animation architecture present with approximations; consequences of customization visible. |
| 71-90 | Architecture matches the paper closely across the bench; validation practice in place. |
| 91-100 | Reserved; would require evidence beyond what the supplied sources can confirm. Do not award without stating why. |

The total is a steering number for this team. It says nothing about Spore's actual quality,
about our game's quality as a game, or about compliance with any external standard.

## 5. Assessment file template

```markdown
# SAS 1.0 Assessment — <game name> — <date>
Scope: cell-stage | whole-game
Commit: <hash>   Bench: <list of creatures>
Assessor: <name/agent>

| # | Criterion | Awarded | Max | Breadth | Evidence | Approximation | Ceiling |
| ... |

Total: <n>/100 (subjective comparison; see authenticity-score.md §4)
Open research questions: ...
Not scored (untested or unimplemented): ...
```
