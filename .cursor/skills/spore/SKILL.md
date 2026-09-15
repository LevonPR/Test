---
name: spore
description: Apply Spore research to Biomant Chimerolog (The Grand Chimerolog / Imperium of Rus) and procedural creature game development. Use for chimera anatomy and editors, morphology-independent animation, semantic action targeting, inverse kinematics, gait synthesis, ecology prototypes, consequences of creature customization, and evidence-based Spore authenticity scoring.
---

# Spore

Build original creature systems using the supplied Spore research. Preserve Biomant Chimerolog's biomancy, clinic management, folklore hunting, splicing, and row-based tactical combat. Treat this as a reusable engineering and design reference, not a replacement game specification.

## Start with the relevant evidence

- Read [sources and coverage](references/sources.md) for provenance, acquisition status, media links, and gaps. Do not claim every linked recording or prototype executable has been studied.
- Read [paper engineering notes](references/paper-notes.md) for anatomy, contexts, coordinate frames, binding, gaits, IK, secondary motion, results, and limitations.
- Use [the complete supplied paper](references/paper/Sporeanim-siggraph08.pdf) and [its page-indexed text](references/paper/full-text.md) when exact details matter. Search the text for `Movement Modes`, `Variant Product`, `Spine Splines`, `Preconditioning`, or `Limitations`; inspect PDF figures rather than inferring them from extraction.
- Read [Chimerolog implementation](references/chimerolog-implementation.md) for project-specific proposals, contracts, acceptance scenarios, and the phased build sequence.
- Read [prototype map](references/prototypes.md) for all 13 official prototype descriptions and independent experiments for our game.
- Read [lecture guide](references/lectures.md) for all 27 category entries, game-design implications, and distinctions between historical opinion and technical evidence.

## Working procedure

1. Inspect the current game, its instructions, engine, save schema, and implemented systems before changing code. The project mapping here is a proposal based on the user's concept, not evidence of current implementation. Respect newer decisions.
2. State the concrete behavior to deliver: which creature forms, actions, world interactions, target platform, and fallback behavior are involved. Preserve the existing stack; use this research in a 2D or 3D implementation as appropriate.
3. Separate the anatomy definition, generated phenotype, animation intent, physical pose, and game simulation. Let anatomy determine legal actions and visuals through one validated contract.
4. Select body parts by capabilities and spatial relationships. Handle zero, one, and many results explicitly. Never make arbitrary chimeras depend on universal bone names such as `LeftHand` or on a humanoid-only imported rig.
5. Author action timing and style in generalized coordinates; specialize to the current body's scale, rest pose, ground, or target. Keep the editor preview and runtime evaluator shared. Preserve rest poses when changing coordinate modes.
6. Bind and cache anatomy-dependent selections and variants; invalidate on relevant anatomy/capability changes. Blend goals, add gait goals, solve spine then limbs where appropriate, and apply passive secondary motion only after authoritative goals.
7. Make changes observable across several markedly different creatures, not merely a single attractive reference. Validate the relevant geometric, gameplay, interruption, persistence, and visual invariants from the implementation reference.
8. Report what was implemented and measured, what is a simpler approximation, and the next unresolved research question. Avoid promises of arbitrary-morphology perfection or historical benchmark performance on current devices.

## Essential distinctions

- Distinguish **source finding**, **our proposed adaptation**, and **unverified work** in design decisions. Use the 2008 paper over the earlier 2007 slides where the architecture differs: passive Jiggles follows IK; do not copy the older Wiggles ordering into the final architecture.
- The paper supplies an animation architecture, not complete Spore source code, a full DNA-to-surface algorithm, an automatic skinning implementation, genetic simulation, or a ready game engine. Describe mesh/UV/skinning/genetics choices as our implementation choices.
- Use a supported morphology envelope with graceful handling outside it. Restricted body plans can be a production milestone without removing the broader vision.
- Keep visual generation asynchronous and optional to the simulation. A generated portrait or GLB is not automatically an animatable, semantically tagged, deformable chimera. Use anatomy as the authority and validate generated assets against it.
- Study the official prototypes as design references. Their page's stated terms do not grant general commercial reuse of EA binaries/assets; do not vendor them into our game. Preserve the supplied paper as a research reference, separate from shipped game assets.
- Skill use does not itself authorize paid generations, publication, messages, or changes outside the requested game work.

## Authenticity scoring

When asked to score authenticity or develop toward a Spore benchmark, use [the SAS 1.0 rubric](references/authenticity-score.md). Declare cell-stage versus whole-game scope, score implemented behavior with evidence ceilings, and preserve assessments with the game source. Treat 0–100 as a subjective comparison, not an official rating or a measure of skill knowledge. Do not raise a score for untested features or impose Spore stage progression on a different requested game.

## Supplementary references

- [Particle IK solver](references/particle-ik-solver.md): implementation-level notes and pseudocode for the paper's two-phase solver.
- [IK and physics background](references/ik-and-physics.md): Hecker's solver survey, articulated-body simulators, Lagrange multipliers, MLCP, physics bibliography.
- [Design philosophy](references/design-philosophy.md): expanded notes on the prototyping, structure-vs-style, AI, rewards, metrics, and depth lectures.
