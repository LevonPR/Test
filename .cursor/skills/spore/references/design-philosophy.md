# Design and Engineering Philosophy from Chris Hecker's Lectures

Chris Hecker worked on Spore at Maxis for six years (creature animation, prototyping, AI) and
later made SpyParty. The lectures below are the ones from
[Category:Lectures](https://www.chrishecker.com/Category:Lectures) with direct bearing on how we
design, prototype, tune and ship an evolution game. Full 27-lecture index with links:
`lectures-index.md`.

## 1. Advanced Prototyping (GDC 2006, with Chaim Gingold)

[Page](https://www.chrishecker.com/Advanced_Prototyping). Based on four years of prototyping
games, technology and UI for Spore and at the Indie Game Jam. Highest-rated Game Design track
talk of that GDC. Given again at MIGS 2006 and at Ubisoft Montreal (the best, most interactive
version, ~1.5 h).

### 1.1 What the talk covers
- Prototyping is a distinct skill set from making the game.
- Questions to settle **before** building: what is the focus? what metric judges success?
- How to design, start and build the prototype (content and code).
- How to iterate via testing and integrating feedback.
- Where prototyping fits in production: the process was reframed as **discovery,
  preproduction, production, ...** and prototyping is most useful in the **first three**.
- Extra success metric added later: **how often is the prototype referred back to in the
  archive?** Never revisited means either it answered a trivial question completely, or it was
  less useful than believed.

### 1.2 The Tower of Tuning
Levels of tuning, top to bottom:

1. **scripting language** — add another language to your game
2. **hotloading** — reload variables when the file changes
3. **data driving** — variables in a file
4. **interactive editor** — sliders, hotkeys to change variables live
5. **recompiling** — variables in code; trivial, doesn't scale, but often enough

Hecker and Gingold's position: **stay as low on the tower as you can** and still work
efficiently. Each step up adds systemic complexity; take it only when forced (long compile times
force interactive editors; long load times force hotloading). A scripting language is *not*
automatically the ultimate flexibility.

For our project: start every simulation prototype with constants in code and a slider panel;
move to data files when designers need to own the values; add hotloading only when load times
hurt; do not add a scripting layer speculatively.

### 1.3 Two-person presentations (companion page)
Lessons from co-presenting: know the other person's material cold; "two talks enter, one talk
leaves"; rehearse in front of peers, which depersonalizes cuts; trust makes editing each
other's work possible.

## 2. Structure vs Style (GDC 2008)

[Page](https://www.chrishecker.com/Structure_vs_Style). Analyzes how we solve **"hard
interactive problems"**: problems at the intersection of **technology, aesthetics and
interactivity**. Claim: any solution to such a problem has a **structure vs. style
decomposition**.

- Canonical example: the **texture-mapped triangle**, "the technology that has had the single
  greatest impact on games in our history". Structure = xyz, uv, connectivity, texels (the
  computer can draw, hit-test, traverse); style = vertex positions and texture colors (artists
  make mood and atmosphere).
- Other good decompositions: wavetable synthesis, mesh skinning, motion-capture processing,
  HTML+CSS, typefaces.
- **Spore's creature animation system has an explicit structure/style decomposition, and so
  does the creature paint system.**
- Posits a future **"Photoshop of AI"**: a tool with the same properties for behavior. (Debated
  at the GDC 2009 AI Summit panel *The Photoshop of AI*.) Grew out of Hecker's interest in
  **sampling vs. synthesis** approaches.

For our project, apply the test to every system: what is the structure the code reasons about,
and what is the style a designer/artist authors? Creature bodies+caps vs. the meshes; CA rule
grammar vs. the rule sets; gait parameters vs. the authored style tables; genome schema vs.
the evolved values.

## 3. Game AI, animation, and design (AIIDE 2010 and related)

[My AIIDE 2010 Lecture on Game AI](https://www.chrishecker.com/My_AIIDE_2010_Lecture_on_Game_AI),
"SpyParty, A Game About AI...plus some ranting."

Core statement: **Game AI is Game Design.** "Whether this is a less-than or a
less-than-or-equals sign is game design." Consequently AI researchers need to make compelling,
playtested, released games to do relevant research.

Technical content drawn from Spore and SpyParty:
- Feed the **player's control through the same pathing system the AI uses**.
- It is hard to find games that use IK in interesting, subtle, human ways.
- SpyParty's **Situations**: like Sims interactions but multiple can run simultaneously,
  layered and resource-based (he dislikes the resource-based part but knows no better way yet).
- **C switch statements for low-level AI**: clear and explicit; the behavior tree system in
  Spore still bottomed out in switch statements.
- Refers back to the Tower of Tuning.

The two biggest open problems in game AI and animation:
1. **The Outro Problem**: who is responsible for shutting down the currently running behavior
   when switching to a new one? Most systems punt to the animation state machine/blender or
   ignore latency and correctness; that "will never result in high quality behavior and
   movement."
2. **The AI <-> Anim Problem**: how and what do AI and animation communicate? Challenges:
   similar-but-not-identical states; a wide bidirectional interface; deadly combinatorics;
   proceduralism cannot compete on quality. GUI "bubbles and lines" AI/animation middleware
   makes toy demos but pushes the problem elsewhere.

Both reduce to one challenge: **"Interesting things happen over time"**, and computers and
languages are bad at things that happen over time. Not solvable by inventing a new language
until the conceptual framework exists.

Design half: mixes Frank Lantz's "games are the aesthetics of interactive systems" with
"aesthetics are the opposite of science" to argue AI tuning is design, not engineering.

Related: [Design, Games, and Game Design (feat. SpyParty)](https://www.chrishecker.com/Design,_Games,_and_Game_Design_(feat._SpyParty)),
UC Berkeley: design -> build -> test loop cannot separate design from build for deep,
interactive work (Valve does not hire single-discipline designers); three kinds of user tests —
**depth testing, kleenex testing, focus testing** — "never do the last one"; games are at about
**1905 in film history**; bottom-up beats top-down for emotional depth; **Depth-first,
Accessibility-later** development (Blizzard-inspired).

## 4. What developers need from research (I3D 2011)

[A Game Developer's Wish List for Researchers](https://www.chrishecker.com/A_Game_Developer%27s_Wish_List_for_Researchers).

Priority order when evaluating research for adoption, contrary to the belief that performance
dominates:

1. **Robustness**
2. **Simplicity**
3. **Performance**

"If you're doing art and entertainment, you want—as a rule—to be right up against the systemic
complexity that breaks the camel's back. So, taking on a new piece of straw is dangerous and
has to be clearly worth the risk."

Other points: release **source code** (it is more rigorous than the paper); research
**perceptual metrics/models** to formalize the hacks we use; do not patent; escape paywalls;
publish **negative results** (the SIGGRAPH review process forced him to cut negative results
and caveats from the Spore paper); researchers can rip real game data with modding tools and
ask permission afterwards. "If we aren't just about to fail, but not failing, we could have
made the game cooler."

## 5. Achievements Considered Harmful? (GDC 2010)

[Page](https://www.chrishecker.com/Achievements_Considered_Harmful%3F). Survey of the
psychology literature on rewards and motivation (Deci vs. Cameron debate; Kohn's *Punished by
Rewards*; Pink's *Drive*). The two results both camps accept, for **interesting tasks**:

1. **Tangible, expected, contingent rewards reduce free-choice intrinsic motivation.**
2. **Verbal, unexpected, informational feedback increases intrinsic motivation.**

"The intrinsic reward for knifing dudes is knifing dudes." Nightmare scenario: make an
interesting game, add extrinsic motivators, destroy intrinsic motivation, metrics push toward
designs where extrinsic motivation works. If forced to ship rewards, **minimize damage**:

- Don't make a big fuss about them.
- Use unexpected rewards.
- Use absolute, not relative measures.
- Use **endogenous** rewards (inside the game's fiction/systems).
- Make them informational, not controlling.

For an evolution game: let new traits, morphologies and ecological niches be the reward; avoid
badge-style meta-rewards for "evolving 10 times".

## 6. Metrics Fetishism

[Page](https://www.chrishecker.com/Metrics_Fetishism). Old design ran on intuition + playtest
observation; now telemetry dominates. Metrics are great but we gather what is convenient,
worship it, and **hill-climb** into a **local maximum**, "terrified to move because all
derivatives point down, while the giant mountain of game design awesomeness is sitting right
over there." Intuition is the **simulated-annealing temperature** that escapes local maxima;
metrics polish points worth polishing. **"The metrics are the craft, and the intuition is the
art."**

## 7. Depth, scope and finishing

- [Please Finish Your Game](https://www.chrishecker.com/Please_Finish_Your_Game) (GDC 2010
  rant): worries about fixation on dev time (corporate ship dates, indie jams). Miyamoto: "A
  delayed game is eventually good, a bad game is bad forever." Mechanics have a **natural depth**
  it is our duty to explore (Braid vs. a pile of jam games). **On Spore: it "failed to fully
  explore the mechanic of what we called editor consequence"**; six years was not the issue,
  depth was. "We need more depth and understanding. We don't need more wacky ideas and shallow
  games shipped on time." Includes a thoughtful email exchange with Cactus about confusing
  "exploring the mechanic" with "tacking on features".
- [A Dialogue On Depth](https://www.chrishecker.com/A_Dialogue_On_Depth) (IndieCade 2011, with
  Paul Sottosanti): depth is not the same as hard (mental/physical), complicated, meaningful,
  emergent or wide; single vs. multiplayer; player-skill vs. avatar-skill. "500 hour games" vs.
  pastimes. Spore is on his list of games to think about when pondering depth.
- [Potential Unreached](https://www.chrishecker.com/Potential_Unreached) (GDC 2011 rant): games
  ignore **human-scale interaction** (picking things up, holding a drink); Ico's hand-holding is
  "the buggiest two-link IK solver" and one of the most powerful mechanics ever; aesthetics and
  gameplay are not separable, reskinning changes the game; "Lifification of games" over
  gamification of life.
- [The Dysfunctional Three-Way](https://www.chrishecker.com/The_Dysfunctional_Three-Way) (GDC
  2012 rant): developers, players and press share an **appetite for sameness**. Why care? "For
  the same reason people should care about biodiversity... a world with only weedy species...
  kudzu, rats, cockroaches, and us would be incredibly sad and boring." A ready-made thematic
  hook for an evolution game about diversity.
- [5 Minutes Worth of Observations about AAA Indie Games](https://www.chrishecker.com/5_Minutes_Worth_of_Observations_about_AAA_Indie_Games)
  (IGS 2011): AAA indie = polished, full of love, **highly anticipated**; every one had "A
  Long-term Slow-burn Grass-roots Awareness-building Campaign"; talk about your game early and
  often; press are indie-friendly and want stories.
- [No One Knows About Your Game](https://www.chrishecker.com/No_One_Knows_About_Your_Game)
  (GDC 2013): even with lots of press, practically no one knows. Theory partly from analyzing
  Spore: **"You cannot overhype a game, you can only underdeliver."** Cheng Infinity Hypothesis:
  indie-scale games never run out of potential players, so marketing mistakes are recoverable.

## 8. Speaking, press and industry (for completeness)

- [How to Give a Good Presentation](https://www.chrishecker.com/How_to_Give_a_Good_Presentation):
  rehearse in real time, standing, in front of real people; deliver what the abstract promised;
  cover what did not work. Includes Chris Crawford's alternative (many solo rehearsals, no
  notes, few slides, emotional context first).
- [Do Your Job Well, Please](https://www.chrishecker.com/Do_Your_Job_Well,_Please) (GDC 2009)
  and [Me and the Wii](https://www.chrishecker.com/Me_and_the_Wii): on press context and
  out-of-context quotes ("Computation power is not orthogonal to gameplay"; performance matters
  for gameplay algorithms, not just graphics). Also notes he was wrongly blamed online for
  Spore's lack of depth.
- [Fair Use](https://www.chrishecker.com/Fair_Use) (GDC 2013 rant, video montage on AAA
  marketing).
- [Developer Power and the U Word](https://www.chrishecker.com/Developer_Power_and_the_U_Word)
  (CGDC 1997): developers collectively hold the power to set technical direction; "The
  good-enough is the enemy of the excellent."
- [Game Object Systems](https://www.chrishecker.com/Game_Object_Systems): notes on Thief's
  object system (Doug Church) from a Seoul conference; Hecker has interviewed many teams about
  their object systems.
