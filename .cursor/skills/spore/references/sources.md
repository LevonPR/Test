# Sources and Coverage

Provenance for everything in this skill, what was actually acquired and read, what is only
linked, and known gaps. Retrieval date for all items: 2026-09-15.

## Status legend

| Status | Meaning |
| --- | --- |
| **Read in full** | Complete text acquired and studied; claims in this skill may cite it directly. |
| **Read (page)** | The web page text was acquired and studied; linked downloads (slides, audio, video, binaries) were **not** acquired. |
| **Linked only** | Referenced by a source but not retrieved. Do not claim knowledge of its contents. |

## Requested sources

| # | Source | Status | Where distilled |
| --- | --- | --- | --- |
| 1 | [Spore Community: Prototypes](https://www.spore.com/comm/prototypes) | Read (page). Descriptions of all 13 prototypes and the EA Tools & Materials EULA text were captured. **No prototype executables were downloaded or run.** | `prototypes.md` |
| 2 | [Real-time Motion Retargeting to Highly Varied User-Created Morphologies (project page)](https://www.chrishecker.com/Real-time_Motion_Retargeting_to_Highly_Varied_User-Created_Morphologies) | Read (page). Abstract, BibTeX, author affiliations, video descriptions captured. Videos (two FRAPS captures, mp4/avi, ~27-29 MB each) **linked only**. FAQ section is empty on the source. | `paper-notes.md` |
| 3 | [Sporeanim-siggraph08.pdf](https://www.chrishecker.com/images/c/cb/Sporeanim-siggraph08.pdf) | **Read in full.** 11 pages, PDF 1.3, 3.9 MB, final submitted draft. Stored at `paper/Sporeanim-siggraph08.pdf`; page-indexed extraction at `paper/full-text.md` (pypdf; hyphenation and ligature artifacts possible; figures not extracted). | `paper-notes.md`, `particle-ik-solver.md` |
| 4 | [How To Animate a Character You've Never Seen Before](https://www.chrishecker.com/How_To_Animate_a_Character_You%27ve_Never_Seen_Before) (GDC 2007) | Read (page). Abstract captured. Slides and mp3 **linked only**; the page itself notes the slides are image-heavy and need the audio, and that live Spasm demos are missing from the materials. | `paper-notes.md` §0, `lectures.md` |
| 5 | [Category:Lectures](https://www.chrishecker.com/Category:Lectures) | Read (page) plus wiki API query confirming **27 members**. Every member page was fetched and read (page). Slides/audio/video for each are **linked only** unless noted. | `lectures.md`, `design-philosophy.md`, `ik-and-physics.md` |

## Lecture pages fetched (all 27)

5 Minutes Worth of Observations about AAA Indie Games · A Dialogue On Depth · A Game
Developer's Wish List for Researchers · Achievements Considered Harmful? · Advanced Prototyping ·
Design, Games, and Game Design (feat. SpyParty) · Developer Power and the U Word (full speech
text is on the page and was read) · Do Your Job Well, Please · Fair Use · Five Physics
Simulators for Articulated Bodies · Game Object Systems · How To Animate a Character You've
Never Seen Before · How to Give a Good Presentation (full memo text on page, read) · How to
Simulate a Ponytail · Inverse Kinematics · Me and the Wii (full essay on page, read) · Metrics
Fetishism (full essay on page, read) · My AIIDE 2010 Lecture on Game AI · No One Knows About Your
Game · Physics References (full annotated bibliography on page, read) · Please Finish Your Game
(includes full email exchange, read) · Potential Unreached · Structure vs Style · The
Dysfunctional Three-Way · The Mixed Linear Complementarity Problem · Two Person Presentations ·
Vector Calculus.

## Media and downloads referenced but not acquired

- Spore prototype executables (13 Windows downloads) on spore.com.
- Paper videos: generalization/specialization demo; Jiggles + gait demo.
- GDC 2007 slides + mp3 (How To Animate...).
- GDC 2006 Advanced Prototyping ppt + mp3; MIGS/Ubisoft versions not recorded per the page.
- GDC 2008 Structure vs Style slides + audio.
- GDC 2002 IK slides + mp3; GDC 2003 Five Simulators slides + mp3; GDC 2004 MLCP slides + mp3 +
  OCaml Lemke source; GDC 2005 Vector Calculus slides + mp3.
- Ponytail slides and the two Game Developer Magazine articles; sample code.
- AIIDE 2010, I3D 2011, IndieCade 2011, Berkeley, GDC 2010/2011/2012/2013 rant/soapbox media.
  Several pages state the former slide-sync host is dead and videos are to be re-uploaded.
- Doug Church's Thief object system PowerPoint (Game Object Systems).
- Cited works inside the paper (Gleicher 1998, Jakobsen 2001, Alexander 2003, Rotenberg 2004,
  Willmott et al. 2007 "Rigblocks", etc.) are known only by citation here.

## Known gaps and cautions

- The paper is the only complete primary technical source. Everything about the Spore creature
  editor beyond §1.2 of the paper (Rigblocks, skinning, texturing, DNA points, procedural paint)
  is **not covered** by the supplied material; the *Structure vs Style* page only mentions that
  creature paint has a structure/style decomposition "to be written about in the future".
- GDC 2007 vs SIGGRAPH 2008: the 2007 talk predates the Wiggles -> Jiggles change described in
  the paper (§4.4). Prefer the paper where they might differ.
- No Spore source code, genetics/evolution simulation, or ecosystem AI is described in any
  supplied source. The prototypes page gives one-paragraph descriptions only.
- Performance numbers (0.2 ms per 25-body character on a 1.7 GHz Pentium-M; ~90% animation pass
  rate) are 2008 production figures, not targets for current hardware or for our game.
- Several lecture pages are opinion pieces (rants, press essays). `lectures.md` marks which
  entries are technical evidence and which are historical opinion.
- The EA prototype EULA (personal, noncommercial; no modification, redistribution, reverse
  engineering) governs the prototype downloads. The PDF is the authors' freely posted draft and
  is stored here as a research reference only; do not ship it inside game assets.
