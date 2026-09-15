# Lecture Guide: Chris Hecker's Category:Lectures (27 entries)

Source: [Category:Lectures](https://www.chrishecker.com/Category:Lectures); membership confirmed
via the site's wiki API. Every page was read; slides/audio/video were not acquired
(`sources.md`). Deeper notes: `design-philosophy.md` (design, prototyping, AI, rewards) and
`ik-and-physics.md` (IK, physics, math).

## Evidence classes

| Class | Meaning | How to use |
| --- | --- | --- |
| **T** Technical evidence | Describes an implemented algorithm or system and its measured behavior. | May justify an engineering decision; cite it. |
| **M** Methodology | Process advice grounded in the author's production experience. | Adopt as working practice; state that it is practice, not measurement. |
| **O** Historical opinion | Rants, essays, industry commentary, position statements from 1997-2013. | Use for framing and design values only; do not present as fact or as current industry state. |

## All 27 entries

| Lecture | Venue / year | Class | Summary | Implication for Biomant Chimerolog | Notes in |
| --- | --- | --- | --- | --- | --- |
| [5 Minutes Worth of Observations about AAA Indie Games](https://www.chrishecker.com/5_Minutes_Worth_of_Observations_about_AAA_Indie_Games) | IGS 2011 | O | AAA indie = polished, loving, highly anticipated; needs a long slow-burn awareness campaign. | Start talking about the game early; awareness cycles are longer than dev cycles. | design-philosophy §7 |
| [A Dialogue On Depth](https://www.chrishecker.com/A_Dialogue_On_Depth) | IndieCade 2011 | O | Depth vs hard/complicated/emergent/wide; player-skill vs avatar-skill; "500-hour games"; Spore listed. | Decide which axis splicing + tactical combat is deep on, and test that axis specifically. | design-philosophy §7 |
| [A Game Developer's Wish List for Researchers](https://www.chrishecker.com/A_Game_Developer%27s_Wish_List_for_Researchers) | I3D 2011 | M | Robustness > simplicity > performance; source code beats papers; publish negative results. | Algorithm selection order for IK, gaits, CA: robust first. | design-philosophy §4 |
| [Achievements Considered Harmful?](https://www.chrishecker.com/Achievements_Considered_Harmful%3F) | GDC 2010 | O (cites psychology literature) | Tangible expected contingent rewards reduce intrinsic motivation; how to minimize damage. | Progression through new anatomy/abilities/folklore, not badges. | design-philosophy §5 |
| [Advanced Prototyping](https://www.chrishecker.com/Advanced_Prototyping) | GDC 2006, w/ Gingold | M | Spore prototyping practice; Tower of Tuning; prototype success metrics. | Governs every experiment in `prototypes.md` §4. | design-philosophy §1 |
| [Design, Games, and Game Design (feat. SpyParty)](https://www.chrishecker.com/Design,_Games,_and_Game_Design_(feat._SpyParty)) | UC Berkeley | O/M | Design and build inseparable for deep interactive work; depth vs kleenex vs focus testing; depth-first, accessibility-later. | Depth-test the splice/combat core with returning players before broad accessibility work. | design-philosophy §3 |
| [Developer Power and the U Word](https://www.chrishecker.com/Developer_Power_and_the_U_Word) | CGDC 1997 | O | Developers collectively control technical direction; "good-enough is the enemy of the excellent." | Framing only. | design-philosophy §8 |
| [Do Your Job Well, Please](https://www.chrishecker.com/Do_Your_Job_Well,_Please) | GDC 2009 rant | O | Plea to journalists for accuracy and context. | Not applicable to implementation. | design-philosophy §8 |
| [Fair Use](https://www.chrishecker.com/Fair_Use) | GDC 2013 rant | O | Video montage critique of AAA marketing. | Not applicable. | design-philosophy §8 |
| [Five Physics Simulators for Articulated Bodies](https://www.chrishecker.com/Five_Physics_Simulators_for_Articulated_Bodies) | GDC 2003 | T | Explicit/implicit x augmented/generalized coordinate simulators; DOF; stiffness. | Background if ragdoll/physical creatures are ever needed; not required for the paper's IK approach. | ik-and-physics §2 |
| [Game Object Systems](https://www.chrishecker.com/Game_Object_Systems) | Seoul conference | T (secondhand) | Doug Church on Thief's object system. | Reminder that the anatomy contract is an object-system decision; page has little detail. | design-philosophy §8 |
| [How To Animate a Character You've Never Seen Before](https://www.chrishecker.com/How_To_Animate_a_Character_You%27ve_Never_Seen_Before) | GDC 2007 | T (abstract only on page) | Spore procedural animation; what worked and didn't. Predates the Wiggles -> Jiggles change. | Use with the 2008 paper; prefer the paper where they differ. | paper-notes §0 |
| [How to Give a Good Presentation](https://www.chrishecker.com/How_to_Give_a_Good_Presentation) | GDC speaker memo | M | Real-time, standing rehearsals in front of people; Crawford's alternative. | Team pitch/demos. | design-philosophy §8 |
| [How to Simulate a Ponytail](https://www.chrishecker.com/How_to_Simulate_a_Ponytail) | GDC 1999/2000 | T | Lagrange-multiplier constrained rigid bodies in 4 steps. | Only if exact hard joints are needed; the paper's IK does not use this. | ik-and-physics §3 |
| [Inverse Kinematics](https://www.chrishecker.com/Inverse_Kinematics) | GDC 2002 | T | Survey of IK solvers Hecker implemented (CCD variants, dynamics-based, particle-based). | Context for why Spore chose the particle solver. | ik-and-physics §1 |
| [Me and the Wii](https://www.chrishecker.com/Me_and_the_Wii) | GDC 2007 rant + essay | O | "Computation power is not orthogonal to gameplay"; press-context problems. | Budget CPU for simulation and IK, not only rendering. | design-philosophy §8 |
| [Metrics Fetishism](https://www.chrishecker.com/Metrics_Fetishism) | essay, 2010 | O/M | Metrics hill-climb to local maxima; intuition is the annealing step. | Instrument playtests, but let design propose jumps. | design-philosophy §6 |
| [My AIIDE 2010 Lecture on Game AI](https://www.chrishecker.com/My_AIIDE_2010_Lecture_on_Game_AI) | AIIDE 2010 | T/O | Game AI is game design; Outro Problem; AI<->Anim Problem; Spore behavior trees bottomed out in switch statements. | Design the combat action interruption contract explicitly (`chimerolog-implementation.md` §4.4). | design-philosophy §3 |
| [No One Knows About Your Game](https://www.chrishecker.com/No_One_Knows_About_Your_Game) | GDC IGS 2013 | O | "You cannot overhype a game, you can only underdeliver" (partly from analyzing Spore). | Ship what is shown. | design-philosophy §7 |
| [Physics References](https://www.chrishecker.com/Physics_References) | CGDC 1997 | M | Annotated rigid-body dynamics bibliography with milestones. | Reading list if physics work is scheduled. | ik-and-physics §6 |
| [Please Finish Your Game](https://www.chrishecker.com/Please_Finish_Your_Game) | GDC 2010 rant | O | Depth over dev time; Spore under-explored "editor consequence". | Splice consequence is our core mechanic; explore it to its natural depth. | design-philosophy §7 |
| [Potential Unreached](https://www.chrishecker.com/Potential_Unreached) | GDC 2011 rant | O | Human-scale interaction; aesthetics inseparable from gameplay. | Let chimeras hold, carry, feed, hand over; the variant system exists for this. | design-philosophy §7 |
| [Structure vs Style](https://www.chrishecker.com/Structure_vs_Style) | GDC 2008 | M/T | Hard interactive problems decompose into structure (code) and style (authored); Spore anim and paint are examples. | Anatomy schema/IK/gait parameterization = structure; keyed curves, style tables, folklore content = style. | design-philosophy §2 |
| [The Dysfunctional Three-Way](https://www.chrishecker.com/The_Dysfunctional_Three-Way) | GDC 2012 rant | O | Appetite for sameness; biodiversity analogy. | Thematic hook for creature variety. | design-philosophy §7 |
| [The Mixed Linear Complementarity Problem](https://www.chrishecker.com/The_Mixed_Linear_Complementarity_Problem) | GDC 2004 | T | MLCP as a universal formulation; Lemke; KKT; SOCP outlook. | Only if contact/joint-limit physics is added. | ik-and-physics §4 |
| [Two Person Presentations](https://www.chrishecker.com/Two_Person_Presentations) | GDC 2006 postmortem | M | Lessons from co-presenting. | Team communication. | design-philosophy §1.3 |
| [Vector Calculus](https://www.chrishecker.com/Vector_Calculus) | GDC 2005 | T | Derivative shapes, column vectors, normals as covectors. | Math hygiene for the IK/spline code. | ik-and-physics §5 |

## Reading order for the Chimerolog team

1. Advanced Prototyping (M) — before scheduling any experiment.
2. Structure vs Style (M/T) — before designing the anatomy contract and content pipeline.
3. How To Animate... (T) together with the paper — before animation work.
4. Inverse Kinematics (T) — before touching the solver.
5. My AIIDE 2010 Lecture (T/O) — before designing combat action interruption.
6. Wish List for Researchers (M), Metrics Fetishism (O/M), Achievements (O) — before
   progression and telemetry design.
7. Please Finish Your Game / Potential Unreached / Dialogue On Depth (O) — for design values.

## Requested items outside the category

| Item | Class | Notes in |
| --- | --- | --- |
| [SIGGRAPH 2008 paper + project page](https://www.chrishecker.com/Real-time_Motion_Retargeting_to_Highly_Varied_User-Created_Morphologies) | T (primary) | `paper-notes.md`, `particle-ik-solver.md`, `paper/` |
| [Spore prototypes](https://www.spore.com/comm/prototypes) | M (descriptions) | `prototypes.md` |
