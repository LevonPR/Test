# Real-time Motion Retargeting to Highly Varied User-Created Morphologies — Full Text (page-indexed)

Hecker, Raabe, Enslow, DeWeese, Maynard, van Prooijen. Proceedings of ACM SIGGRAPH 2008.

Source PDF: `Sporeanim-siggraph08.pdf` in this directory (final submitted draft from https://www.chrishecker.com/images/c/cb/Sporeanim-siggraph08.pdf).

Text extracted automatically with pypdf; hyphenation, ligatures and column ordering may be imperfect. Figures are not included; open the PDF to inspect them. Page headings below correspond to PDF pages 1-11.


---

## Page 1

```text
Real-time Motion Retargeting to Highly Varied User-Created Morphologi es
Chris Hecker∗ Bernd Raabe†
Ryan W. Enslow† John DeWeese†
Maxis/Electronic Arts
Jordan Maynard‡
Trion World Network
Kees van Prooijen‡
Total Immersion Software
Abstract
Character animation in video games—whether manually key-
framed or motion captured—has traditionally relied on codifying
skeletons early in a game’s development, and creating animations
rigidly tied to these ﬁxed skeleton morphologies. This paper in-
troduces a novel system for animating characters whose morpholo-
gies are unknown at the time the animation is created. Our au-
thoring tool allows animators to describe motion using familiar
posing and key-framing methods. The system records the data in
a morphology-independent form, preserving both the animation’s
structural relationships and its stylistic information. At runtime,
the generalized data are applied to speciﬁc characters to yield pose
goals that are supplied to a robust and efﬁcient inverse kinematics
solver. This system allows us to animate characters with highly
varying skeleton morphologies that did not exist when the anima-
tion was authored, and, indeed, may be radically different than any-
thing the original animator envisioned.
CR Categories: I.3.7 [Computer Graphics]: Three-Dimensional
Graphics and Realism—Animation
Keywords: character animation, motion retargeting, user gener-
ated content, inverse kinematics, procedural animation, games
1 Introduction
User generated content is an increasingly popular way to give play-
ers meaningful creative input into video games [Edery et al. 2007],
and enabling players to create the fundamental art assets—the char-
acters, vehicles, buildings, and planets—is one of the primary de-
sign goals of the game Spore [Wright 2005]. Allowing players
to create art assets after the game has shipped forces the code to
be ﬂexible and robust enough to deal with the new, never-before-
seen content. Characters present a particularly challenging prob-
∗checker@d6.com
†{braabe,renslow,jdeweese}@ea.com
‡{jordan.maynard,keesvp}@gmail.com
lem, requiring the synthesis of player created morphologies with
authored animations for in-game actions (e.g. picking fruit from
a tree, throwing a spear, or dancing a jig). Preserving the style
and quality of professionally authored animations as they are retar-
geted at runtime to extremely varied player-created morphologies
required a new approach to character animation.
Our solution preserves the traditional animation workﬂow found in
tools such as Maya [Aut 2008], while enabling keyframe anima-
tors to create automatically retargetable, yet stylized, motion. We
bring the animators directly into the retargeting loop and have them
specify the semantics of various aspects of the animation during au-
thoring. We use this semantic data to record the motion in a gener-
alized form, and at runtime we specialize it onto the different char-
acter morphologies to generate the individual retargeted motions.
The success of this method shows the power of explicitly speciﬁed
semantic information in solving the motion retargeting problem.
The remainder of this section presents a high level summary of our
methods for authoring and playing animations on unknown mor-
phologies, a list of our contributions, and an overview of the ter-
minology used to describe the animated characters. Section 2 dis-
cusses related work. Sections 3 and 4 discuss in detail the author-
ing and playback of the character animations. Finally, Section 5
describes the results both qualitatively and quantitatively, as well
as how the system is tested in production and its limitations, and
discusses future work and the applicability of the system to other
games and animation challenges.
1.1 Overview
Authoring In our OpenGL-based authoring tool Spasm, the ani-
mators pose the characters, set keys, edit curves, and preview ani-
mations, much like in traditional game animation (Fig. 1). Anima-
tions contain an arbitrary number of channels, and for each chan-
nel, the animator tells Spasm which parts of the character to select
and which aspects of the motion are important. This semantic in-
formation is used to create an invertible function G that is used to
move from the specialized pose on a speciﬁc character to a gen-
eralized space that is character-independent, and back again (us-
ing S = G− 1). The semantic speciﬁcation phases for both selec-
tion and movement are the key differences—from the animator’s
perspective—between authoring an animation in Spasm versus a
traditional character animation tool.
Playback At runtime, the generalized animation curves are spe-
cialized onto the character using S and a combinatoric technique—
called variants—for controlling the playback. The resulting pose
goals preserve the overall motion and stylistic details of the au-
thored animation. Stylized locomotion is synthesized for the
player-created leg morphology and layered onto the goals. The
goals are fed into an inverse kinematics (IK) solver tuned to handle
```


---

## Page 2

```text
Figure 1: Spasm screenshot with two preview characters.
conﬂicting objectives while attaining natural solution poses. Fi-
nally, passive secondary animation is added for aesthetic appeal.
Contributions The semantic speciﬁcation concept and details for
both selection and movement, the decomposition of the problem
into generalized and specialized spaces, and the various ways of
formulating G based on the animator-controlled semantics are the
main contributions of this work to the authoring phase of the retar-
geting problem. The contributions to the playback phase include
the variant technique for exposing the combinatoric variety of an-
imation playback options, the locomotion synthesizer for generat-
ing stylized gaits on arbitrary leg morphologies, the robust, high
performance IK solver with its emphasis on ad hoc tunability and
preconditioners for attaining natural character poses, and the pas-
sive secondary animation subsystem.
1.2 Character Terminology
The player creates new characters in Spore by manipulating a mal-
leable clay-like torso containing the spine, and attaching limbs and
deformable anatomical body parts chosen from a palette [Willmott
et al. 2007], including various mouths, eyes, graspers, feet, spikes ,
armor, etc. The ﬁnal character is composed of bodies (which in-
clude the anatomical parts, spine vertebrae, and limbs), meshes,
and textures. Characters usually contain between 20 and 80 bodies.
Figure 2 shows the relationship between a character’s mesh (the top
row) and its bodies (the bottom row).
The bodies contain the position and rotation transforms, bounding
boxes, and hierarchical parent-child information traditionally asso-
ciated with bones in other animation systems. The bodies also con-
tain tags—called capabilities or caps—describing the body’s se-
mantics to the animation system. For example, the body associated
with a hand mesh has the grasper capability. Bodies can have scalar
deform curves that control low level mesh animations on the body.
Examples include opening and closing hands, mouths, or eyes, ears
drooping, toes bending, etc. The deforms are standardized across
the various types of anatomical body meshes (e.g. all mouth bod-
ies respond to the open/closed deform). This allows the deforms
to be opaque to the animation system, so we ignore them for the
remainder of this paper.
The character bodies form a directed acyclic graph, with a serial
chain of spine bodies at the root of the tree. 1 The root body of the
1Early prototypes for the Spore character creator supported more general
tree is a unique spine body chosen by a heuristic based on the max-
imum number of incident leg limbs and the position of the body.
The position and orientation of the bodies at the time the player
creates the character is called the rest pose. Traditionally, the rest
pose of a game character is a known standard pose, but we cannot
count on any speciﬁc conﬁguration for the rest pose. We simply
assume the player created the character in a “reasonable” rest con-
ﬁguration, 2 not hyper-extended or curled into a ball, etc.
2 Related Work
Traditional game character animation blends static animation data
onto ﬁxed skeletons, with occasional IK for foot placement or head
lookat [Mizuguchi et al. 2001]. When the morphology of the char-
acter is unknown, these methods are clearly inapplicable.
Motion retargeting is not a new problem, but most existing work
is ofﬂine, not efﬁcient enough for real-time games, or requires a
large database of example motion, and no previous work consid-
ers the range of morphologies we do. Gleicher [1998] presents
an ofﬂine method using spacetime constraints on example motion.
The paper brieﬂy considers different morphologies, but requires
similar sizes, and only retargets to characters with fewer degrees
of freedom (DOF). Many other ofﬂine methods exist with sim-
ilar limitations [Lee and Shin 1999; Popovi ´c and Witkin 1999].
Choi and Ko [2000] and Shin et al. [2001] develop online meth-
ods using IK, but both only consider identical skeletal topologies.
Kulpa et al. [2005] support different numbers of bones along limbs
by using IK in real time, but only on humanoid topologies.
Many of these efforts try to automatically derive the semantic struc-
ture of the motion and its constraints from example data, whereas
we have the animators a priori describe the important factors to
our system. In this sense, our system is illustrative instead of ex-
ample based . In fact, abstracting the motion, for both the con-
straints and the style, is a common thread throughout the related
work. For example, while not focused on motion retargeting,
both Chi et al. [2000] and Neff and Fiume [2005] form parame-
terized semantic models for animation style on ﬁxed human skele-
tons. By contrast, our system gives the animator direct control over
the model for the motion constraints for each animation, and then
records the stylized animation curves within this model.
IK for character animation is also a very well studied problem, both
synthetic [Girard and Maciejewski 1985; Welman 1993; Zhao and
Badler 1994] and example-based [Grochow et al. 2004]. Unlike
most IK solvers for character animation, which use explicit repre-
sentations of the angular DOF, our solver draws from the molecular
dynamics (MD) literature and works with cartesian DOF and length
constraints [Kastenmeier and V esely 1996; Tang et al. 1999]. Fol-
lowing the SHAKE algorithm [Ryckaert et al. 1977], most of these
MD-inspired IK techniques use a linearized error ﬁxup during con-
straint iteration, but we use a nonlinear length correction, similar to
Jakobsen [2001]. Our IK solver differs from previous work in its
two-phase architecture and its explicit emphasis on ad hoc tunabil-
ity and custom preconditioners, which we have found invaluable for
ﬁnding natural poses under conﬂicting goals.
Synthetic locomotion has often focused on bipeds [Bruderlin and
Calvert 1989; Bruderlin and Calvert 1996; Sun and Metaxas 2001].
structures, including loops, but testing revealed the inte rface complexity of
a general graph was actually a hindrance to player creativit y.
2This assumption can obviously prove to be false, but in our tes ting,
players create the characters in acceptable poses, and somet imes adjust the
rest pose after seeing their character animate.
```


---

## Page 3

```text
Girard and Maciejewski [1985] develop a system for arbitrary in-
dependent legs, but do not address stylistic variation or animator in-
put. Procedural secondary animation, both physical [O’Brien et al.
2000] and fake [Barzel 1997; Barzel et al. 1996] has been discussed,
but our system dynamically discovers the sub-trees to be simulated
and integrates—but does not interfere—with the authored data.
3 Animation Authoring
Traditional keyframed animation workﬂow proceeds as follows:
1. Select. The animator chooses which parts of the character he
or she will animate.
2. Pose. The animator moves the selected parts of the character
to a new position and orientation.
3. Key. The animator records a key frame for the selected and
posed parts of the character.
4. Preview. The animator plays back the animation, or a portion
of it, to check the work, repeating the process based on the
visual feedback.
Spasm preserves this basic workﬂow, enabling animators comfort-
able with traditional tools to create retargetable motion. We now
discuss the modiﬁcations to each step in detail.
3.1 Selecting
In traditional character animation, the animator clicks the mouse on
the character skeleton to select the bone or locator he or she wants to
pose via forward or inverse kinematics. The selected object is usu-
ally referenced by a simple index or name in the animation. When
the runtime skeleton is not known at author-time, this direct index-
ing is impossible, so we require the animator to describe which
bodies are selected using a semantic query. After a channel’s se-
lection is speciﬁed, the animator can then click on any one of the
selected bodies of a character in the viewport to activate it.
3.1.1 Contexts
In our system, the animator uses a channel’s context to describe the
bodies the channel poses. Contexts are constraint-based ﬁlters over
the bodies of the character. The context selects zero or more bodies
by intersecting the speciﬁed constraints, in a manner similar to e-
mail and music ﬁlters [Moz 2008; App 2008]. We use the phrase
selected bodies to refer to the results of the context query, and active
body to refer to the unique selected body with which the animator
is currently interacting in Spasm.
Type The animator builds up a primary context query to select
bodies on the character by ﬁrst specifying the type of the query.
The type speciﬁes the body capability ( grasper, mouth, spine, root,
etc.) to be selected. This query will select all the bodies on the
character that have the speciﬁed cap, so if the query was grasper
and the character has four graspers, four bodies will be selected.
Spatial Queries The animator can narrow the selection
by specifying different spatial constraints for the selec-
tion, including Front/Center/Back, Left/Center/Right, and
Top/Center/Bottom. Each of these spatial constraints can be
relative to the character’s bounds (the front or back halfspaces of
the entire character’s bounding box, with the side constraints being
inclusive of the center zone), or relative to the setspace of bodies
with the given capability. For example, if a character has four
graspers, but all are in the front halfspace of the character, then the
regular front constraint would choose all of the graspers, but a fro nt
setspace query would make a bounding box of the graspers, then
choose the graspers in the front halfspace of those local bounds.
The setspace option allows the animator to separate out bodies
even when they are clumped relative to the character as a whole.
Extent Queries There is also an extent constraint, which can be
FrontMost, BackMost, RightMost, etc. and will always select
zero or one body, the most distant body in the given extent direction
(ties are broken arbitrarily).
Limb Modiﬁer Finally, there is a limb modiﬁer , which performs
limited skeletal hierarchy traversal. The limb modiﬁer can be set
to SpineSegment. When the unmodiﬁed query selects bodies, this
modiﬁer will “walk up” any parent limbs to the ﬁrst bodies with the
spine capability, effectively ﬁnding an approximation to the clavi-
cle/shoulder (or hip/pelvis) bones for a given selection. This, for
example, allows the animator to select and pose the appropriate
clavicle(s) for another channel’s selected graspers.
3.1.2 Discussion
The game code also constructs and evaluates context queries on the
characters for use in gameplay AI reasoning, inventory, etc. Again,
in traditional games the skeleton is known and the code can simply
refer to explicit bone names or indices, but in Spore the code must
describe the semantics of the selection just as the animators do.
We looked into creating context queries automatically by clicking
on character bodies in Spasm, but we ruled this out as combinator-
ically infeasible. There are many different ways to select the same
body with completely different context queries, so the beneﬁts of
an automatic interface were outweighed by the potential errors in-
troduced trying to resolve the ambiguities. From a workﬂow stand-
point, the animators set up their preferred channels once, and reuse
them in multiple animations, so this has proven not to be a burden.
3.2 Posing
As with selection, the semantics of the motion—called the move-
ment mode—is speciﬁed by the animator so the motion can be re-
targeted. The movement mode dictates how the pose data is inter-
preted for the channel by describing the important characteristics
of the motion (e.g. whether the movement is relative to the ground,
or depends on the size of the character or the length of the limb,
etc.). At a low level, it is a speciﬁcation for the coordinate frame in
which movement is recorded, and it is used to construct the gener-
alization function G and its inverse, the specialization function S.
Once a body is selected and activated, the animator can pose the
active body with Maya-style position and rotation manipulators. If
multiple bodies are selected by the primary context query, all of
the bodies will move as the animator manipulates the active body.
The active body will follow the mouse manipulator, and the other
selected bodies will move with the active body based on the move-
ment mode of the channel as described below.
3.2.1 Generalization and Specialization
The position and rotation of a given body bi on a speciﬁc char-
acter in character-relative Euclidean space (i.e. what is displayed
in the Spasm viewport) is referred to as the specialized coordi-
nates or pose of the body, qsi. The function G takes the special-
ized pose to the body-independent generalized position and rota-
tion coordinates, qg, by qg = G(bi, qsi, m ). Similarly, given
qg and a body bi, the function S produces the qsi for that body,
qsi = S(bi, qg, m ). The m parameter controls mirroring across
the sagittal plane, and is discussed in Section 4.1.2.
During body manipulation and posing in Spasm, the active body’s
qs are continually generalized to qg, and then the resulting qg is
```


---

## Page 4

```text
(a) Rest 1
 (b) Reach 1
 (c) Rest 2
 (d) Reach 2
Figure 2: Secondary Relative. Moving the green external target affects the reach pose and the red sp line, but not the rest pose.
specialized onto each of the channel’s selected bodies bi yielding
qsi. This process includes the active body, and because G = S− 1,
the active body appears to the animator to be directly manipulated
in Euclidean specialized space, but it is not treated as a special case
internally. The active movement modes determine the speciﬁc def-
inition of G, which in turn determines how the other non-active
selected bodies move with the active body.
3.2.2 Movement Modes
The movement modes describe the semantics of the motion—
what’s important about it for expressing a desired intent. They are
ad hoc, in the sense that additional movement modes are added on
an as-needed basis when the animators are unable to express an in-
tended movement so it generalizes to a large set of characters, but
they are usually designed to work together and layer when possi-
ble. All movement modes have the character rest pose as a sort of
“origin”, such that if one character is at its rest pose for a given qg,
all characters will be at their rest poses, regardless of the mode.
Identity The most basic movement mode is the identity, G =
S = 1, also called absolute mode . In this mode, the qs of the
manipulated body are simply copied to the qg by G, which are
then copied to the qsi of the other bodies by S—all selected bodies
have the same character-relative position and rotation. This mode
is not very useful for animating positions, but it can be useful for
rotations, allowing the animator to specify a uniform end orienta-
tion for selected bodies regardless of their rest orientation. Posing
a grasper to hold a platter of food up would be appropriate use of
absolute mode for rotation.
Rest Relative In contrast to absolute mode, in rest relative mode
G computes the qg as a delta from the rest pose of the body. The
bodies move relative to their rest poses—if the manipulated body is
moved 1 unit to the left of its rest position, all of the bodies move
1 unit to the left of their respective rest positions, and similarly for
rotation. Both position and rotation can have rest relative mode set
independently. A hand wave animation might use rest relative posi-
tion mode to pose a grasper because the absolute position isn’t im-
portant, just the relative waving motion, but absolute rotation mode
so the grasper is pointed up regardless of its rest pose.
Scale Animators can specify a scale mode that affects how G and
S compute position data. If no scale mode is set, the qsi posi-
tion curves are the same scale on all characters. If CreatureSize
mode is enabled, S performs a nonuniform scale to the qsi, pro-
portional to the bounding box of the character. Small characters get
small curves; large characters get large curves. LimbLength mode
causes S to scale the pose based on the limb length of the posed
body. The limb length of a given body is the path length from the
body to the nearest spine segment, forming an approximation to the
workspace of the body. Specialization will result in large move-
ments on long limbs and small movements on short limbs.
Ground Relative The ground relative mode distorts the coordi-
nate frame of the movement such that the z-axis is vertical and
scaled 0 to 1 from the rest pose to the ground. In generalized co-
ordinates, qgz = 0 . 0 speciﬁes the rest pose height and qgz = 1 . 0
speciﬁes the ground height. This way, when qgz = 1 . 0 is special-
ized onto different bodies, each will hit the ground, so an animation
of picking up a rock or pounding the ground will generalize across
characters with different grasper heights with the same timing. 3
Secondary Relative Movement A secondary context query lets
the animator specify another set of bodies to which the primary
body movement is relative for expressing motions like “put the hand
to the mouth” or “clap hands” across characters with different rel-
ative positions of hands, mouths, etc. The secondary context also
allows an ExternalTarget query type, giving the game dynamic in-
put into the specialization of the animations. For example, the code
can set the target to a fruit location for a “pick fruit” animation
or have two characters “shake hands” by setting the target of each
character to the other character’s grasper.
G distorts the motion frame so the x-axis is the vector between the
rest position of the body and the target, with 0. 0 at the rest position
and 1. 0 at the target. 4 This frame is updated during evaluation of
G, so a pose that puts the body at the target will change as the tar-
get moves, even if the qg for the pose is not changing. Figures 2(a)
and (c) show the affect of moving the target while in the rest pose;
the two character poses are identical because the rest pose is inde-
pendent of G as mentioned above. Figures 2(b) and (d) show the
poses for one qg but with different target positions; these two dif-
ferent specialized poses are generated from the same generalized
pose. In the lower wireframe images in Figure 2 you can see the
channel’s red animation curve being distorted as the target moves,
3We plan to add a sagittal relative mode soon that will do the same dis-
tortion for the sagittal plane, allowing animators to expres s hand claps and
other animations that have bodies that cross from left to righ t with increased
generalization quality.
4There is a modiﬁer called SecondaryDirectionalOnly that does not
rescale the frame’s x-axis, so that the direction changes as t he target moves
but the scaling of the pose does not. This modiﬁer allows the an imators to
express a punch movement in the direction of the target, withou t the punch
changing shape as the target moves closer to the body.
```


---

## Page 5

```text
while keeping the local style information intact. Figure 3 shows the
example for two characters with very different morphologies.
(a) Rest
 (b) Reach
Figure 3: Two different characters posed with the same qg.
Lookat We also allow a lookat controller to be activated when
secondary relative mode is enabled. This mode aims the rotation
frame’s forward vector towards the target object. The head body
in Figure 2 has a lookat controller applied to it; notice the head fol-
lowing the target during the reach. The lookat mode deﬁnes a frame
for recording relative rotation poses—it does not completely spec-
ify the rotation of the body—so a “nodding head” movement can
be performed while looking at the [potentially moving] target. Soft
joint limits are applied to the lookat controller to damp its inﬂuence
as the target moves into the half space behind the selected body, al-
lowing characters with multiple heads facing in different directions
to use an appropriate head to follow a target.
3.2.3 Blending
Multiple channels can select the same bodies, so a priority and
grouping system is in place to give the animator control over which
channels contribute to a body’s pose. The ﬁrst channel to select
a body takes ownership of the body 5 for its animator-speciﬁable
blend group . Later channels can share ownership of the body if
the animator assigns them a matching blend group. The resulting
qs for each channel are blended using traditional weighted position
and rotation blends. Because the movement modes are set at au-
thor time and ﬁxed for a given channel, the animators use blends
between channels to affect a continuous change from one move-
ment mode to another. For example, a character can grab a piece of
fruit at the external target using a grasper, and then put the fruit in
the character’s mouth in a single ﬂuid movement by blending be-
tween external target-relative and internal target-relative channels
over time using varying weights on each channel.
3.3 Keying
The animation key frames record the generalized qg for each en-
abled key data curve for a channel, and intra-key interpolation oc-
curs on these qg. The key data curves include position, rotation, the
various deform curves, weights on each curve, and miscellaneous
discrete keyable information.6 The animators have explicit Hermite
spline control over the keyed qg curves. The raw splines on the qg
can be manipulated, or the curves can be specialized by Spasm onto
5More precisely, ownership is allocated separately to each a nimated de-
gree of freedom, so ownership of just the rotation is possible .
6Examples include per-key visual, sound, and data events.
the given character and active body, and the splines can be manip-
ulated in specialized space (which is then generalized back to the
stored keys). Some animators prefer to manipulate the generalized
curves directly (which control the actual data being interpolated,
but can be nonintuitive), while other prefer the specialized curves
(which appear to be traditional Euclidean curves, but are different
for each selected body), so we provide both options.
Key Remapping When an animator changes the movement mode
during authoring (e.g. to experiment with the different op-
tions to increase generalization of the animation, or to repurpose
an animation for a different but similar movement), G for the
channel changes. This invalidates any existing qg keys saved
with the old G, so we remap the existing keys such that the
active body b’s qs do not change. We construct Sold from
the pre-modiﬁcation movement mode, and Gnew from the post-
modiﬁcation movement mode, and then remap each key’s qg by
qgnew = Gnew(b, S old(b, qgold , f alse ), f alse ). This leaves b’s
qs curve and Euclidean motion exactly the same, while the qg
are converted to the new movement mode. By keeping the active
body’s specialized curve unchanged, we give the animator direct
control over what aspects of the old versus new movement modes
he or she would like to preserve. For example, by activating a body
at the end of a long limb, and then switching LimbLength scal-
ing off, the large movement will be preserved on the active body
while the corresponding old small movements on short limbs will
become large movements. By contrast, activating a body on a short
limb and then removing LimbLength scaling would perform the
opposite remapping: all of the curves would become small.
3.4 Preview
Spasm allows the animator to load multiple characters simultane-
ously, all bound to the same animation data as shown in Figures 1
and 3. The animator can edit the animation data on any loaded
character at any time and instantly see the changes reﬂected on the
other characters, because the qs for all the characters are derived
from the shared qg (Section 3.2.1). This enables the animator to
preview and edit the animation on many different morphologies si-
multaneously, and directly compare how changes to one character’s
pose generalize to other characters. This allows the animator inter-
active control over the quality of the motion retargeting across a set
of example characters and greatly tightens the authoring feedback
loop. Preview in Spasm uses the same code as in-game playback to
support WYSIWYG7 authoring.
4 Animation Playback
At runtime, the Spore animation system presents a typical ani-
mation Application Programming Interface [Muratori et al. 2008;
Desmecht and Dachary 2006] to the game, including playback,
asynchronous animation loading, caching, queing, layering anima-
tions with weights, etc. The ﬁrst time an animation is played on
a given character, a special bind phase occurs. Then, every frame,
for any animations playing on a character, the qs for the channel’s
selected bodies are computed using S and blended together. The re-
sulting pose goals are composed with any synthesized locomotion
and fed to the IK solver, and then secondary animation is applied.
4.1 Binding
When an animation is played on a character for the ﬁrst time, the
animation and the character go through a bind phase to determine if
7What Y ou See Is What Y ou Get
```


---

## Page 6

```text
and how the playback will occur, using techniques called branching
and variants, respectively.
4.1.1 Branching
The bind phase begins by evaluating a series of branch predi-
cates on the character. These three-valued predicates ( true, f alse,
ignore) constrain the set of characters to which the animation
will bind, allowing the animators to split up the space of char-
acter morphologies. For example, one branch predicate is Up-
rightSpine, which evaluates a heuristic for whether the character’s
spine is predominantly prone or upright. Other predicates include
HasGraspers and HasFeet. If the animators cannot create a sin-
gle sufﬁciently general animation—and we cannot modify the sys-
tem to generalize for the action—they can create multiple distinct
“branched” animations for the original movement. For example,
animations for tool usage are branched on whether the character
has graspers to manipulate objects, or whether the character uses
its mouth because it has no graspers. Branching animations is a so-
lution of last resort, because it increases content creation costs by
forcing multiple animations to be authored and tested for an action.
4.1.2 Variants and Mirroring
As described in Section 3.2.3, blend group ownership and priority
information is computed during the bind phase. The system then
computes “how many different ways the animation can play on the
character”. Each “way” is called a variant. The game code choses
which variant is played at runtime as described below. V ariants
are best described using examples. Figure 4 depicts an abstract
character with ﬁve bodies, labeled A, B, 1, 2, and 3.
Figure 4: Abstracted character and bodies, viewed from the front.
Single Variant Group If we want to create an animation for grab-
bing a fruit from a tree with a grasper, the character only needs a
single grasper to grab the fruit, but there is no way at author time to
know which grasper should be used—the position of the fruit rel-
ative to the character and the number and distribution of the char-
acter’s graspers are unknown. We allow the animator to mark a
channel so its curves are played on only one of its selected bodies
at a time. A distinct variant for the animation is generated for each
grasper selected by the marked channel. The game can play the
variant for the most appropriate grasper dynamically based on arbi-
trary game-speciﬁc criteria: for example, which grasper is closest
to the fruit, which one is not already holding another object, etc.
Concretely, if all the bodies in Figure 4 are graspers, ﬁve variants
will be generated, one for each body: A, B, 1, 2, and 3.
Sagittal Mirroring An animation is created with arbitrary chiral-
ity, and the system automatically generates its sagittal mirror dur-
ing variant generation. The animator can control how S specializes
curves when mirroring. Figure 5 shows the two mirroring possibili-
ties on an asymmetric character for the same qg. Figure 5(a) shows
the qsi with m (from Section 3.2.1) set to false on the left side, and
true on the right side, while Figure 5(b) shows m set to false for all
bodies. Notice how the positions and orientations of the graspers in
Figure 5(a) are mirrored appropriately across the sagittal plane.
(a) Mirrored
 (b) Not mirrored
Figure 5: An asymmetric character with and without sagittal plane
mirroring on a grasper channel. The grasper curve to the left in
each picture is the unmirrored curve.
Many Variant Groups A more complex example involves pass-
ing a fruit from one grasper to another using two grasper channels.
V ariants allow the game code to arbitrarily choose both the giving
and receiving graspers. Each combination of graspers participating
in the handoff generates a single variant. If we assume the bod-
ies labeled A and B are the only two graspers on the character,
two variants, AB and BA, are generated. The ﬁrst hands the fruit
from A to B, and the second from B to A using sagittal mirror-
ing. The variants do not have to have the same cap: if A and B
are mouths, and 1, 2, and 3 are graspers, an animation to put a fruit
in a mouth could generate 1A, 1B, 2A, 2B, 3A, and 3B. The
animator can specify the spatial relationship of the varying chan-
nels, so if 1, 2, and 3 are graspers, and the two channels are the
same-side-constrained, two variants will be generated: 23 and 32.
If the channels are opposite-side-constrained, the system will gen-
erate four variants: 12, 13, 21, and 31. No spatial constraints will
generate all six permutations: 12, 13, 21, 23, 31, 32.
Variant Product This modiﬁed cartesian product is called the
variant product of the bodies. There is no limitation on the channel
arity of the variant product or on the types of the channels involved.
The animator can also group channels so they vary together and do
not generate additional variants. For example, an animation might
have a grasper channel and a grasper-shoulder channel using a limb
modiﬁer . Setting these two channels to the same variant group will
cause the shoulder to co-vary with the appropriate grasper.
4.2 Gaits
The characters undergo legged locomotion across uneven terrain
and along curved paths with discontinuous input velocities. The
animators can control the feet for non-locomoting animations, but
we use a gait system to generate the locomotion to ensure we meet
the aesthetic requirements that feet not slip and that the leg move-
ment be plausible based on the character translation and rotation.
Leg Groups The player generated characters can have any num-
ber of legs of different lengths in arbitrary arrangements. A leg is
deﬁned as a path through the tree of connected limb segments with
a foot body at the leaf and a spine segment at the base of the tree—
called the hip. Figure 6 shows some examples of player created
leg conﬁgurations with various branching structures. The legs are
clustered into one or more groups of roughly equal length. The leg
groups are harmonized by approximating their length ratios with
small rational numbers. The ratios are used to compute the relative
frequency of the gait cycle applied to each group.
Foot and Hip Posing For a given leg group, the feet attached to
each unique hip are ordered, and the gait system generates a cycli-
cal pattern of foot movements by assigning values to the locomo-
```


---

## Page 7

```text
Figure 6: A variety of player-created leg conﬁgurations.
tion duty factor and step trigger parameters. The duty factor is the
fraction of the duration of the overall gait cycle time that the foot
is on the ground [Alexander 2003]. The step trigger is the offset
from the overall gait cycle at which the foot begins its particular
cycle [Rotenberg 2004]. The hips are translated and rotated as the
feet are moved for believable torso motion. The foot’s path during
its ﬂight phase is controlled by the animators in Spasm using either
a custom set of parameters for the arc, or a graphical editor for the
position and rotation of the foot in a normalized space. The nor-
malized path is then applied to each foot, taking into account the
leg length. This system is separate from the generalization and spe-
cialization system described above for historical reasons. We have
considered merging them but have not had time.
Gait Styles The system can handle multiple gait styles layered on
a character at the same time. The animators author a mapping be-
tween character movement speed and the gait parameters for groups
with 1 ≤ nf eet ≤ 6, and the system procedurally generates the pa-
rameters styles for nf eet ≥ 7. The movement speed is used to
interpolate between sets of parameters authored for various veloci-
ties. Additional gait styles can be applied to a character for special
effects, like limping, or a lumbering gait for large characters. Dif-
ferent leg groups could be in different gait styles simultaneously on
the same character. For example, two short legs could be running
while four long legs are trotting.
A heuristic is used to determine if a character with no feet should
ﬂoat above the ground or crawl along the ground. Crawling char-
acters have some spine bodies converted into pseudo-feet and an
inch-worm-like gait is generated for these bodies.
4.3 Particle IK Solver
The animation system’s Particle IK Solver uses the body pose goals
set by the various subsystems already discussed, and attempts to
satisfy them by forming a system of constraints over the linked
character bodies. Because a Spore character usually has many fewer
goals than DOF, the IK equations form an underdetermined system.
In general, underdetermined systems admit inﬁnite solutions, so the
solver uses the extra DOF to optimize secondary objectives. The
Particle IK Solver has many competing high level objectives:
1. High Performance. It will be run every frame on every pro-
cedurally animating character in the game.
2. Accuracy and Naturalness in Workspace. It should com-
pute an accurate and natural looking solution pose if the goals
are within the workspace of the character.
3. Graceful Failure. There are three main failure modes, and
each should result in a natural pose: First, goals can be out-
side the workspace ; the character should reach for them in-
stead of mechanically hyperextend. Second, goals can con-
ﬂict and lead to overdetermined constraints for sub-trees of
the character. Third, the goals may be implausible ; they are
strictly within the character workspace, but satisfying them
might cause the character to attain an unnatural pose.
4. Path Independence. IK solvers for underdetermined sys-
tems, especially with preconditioners relying on frame-
coherence, can give path dependent solutions—the solu-
tion at timestep t depends on the solutions at previous
timesteps [Klein and Huang 1983; Y an et al. 1999]. This is
undesirable for a number of reasons (e.g. introducing unpre-
dictability into playback [Tolani et al. 2000]). Highly redun-
dant manipulators with path dependent solvers can eventually
tie themselves in knots in our experience.
Overview Robustly satisfying the objectives above led us to cre-
ate a new IK solver with several differences from traditional solvers.
The Particle IK Solver treats the character skeleton as a set of 3DOF
particles with 1DOF length constraints between them. A simple it-
erative constraint solver is run over the particles with various pre-
conditioners and parameters for tuning its behavior both statically
and dynamically. The ﬁnal body DOF are reconstructed from the
particle positions and length constraints after the solve. It is a two-
phase solver; the ﬁrst phase solves for the spine pose, and the sec-
ond phase solves for the limb poses, treating the spine as ﬁxed. We
attain more natural poses with the two-phase solver than we did
with monolithic one-phase solvers because we can tune each phase
to the particular idiosyncrasies of spine versus limb movement. In
fact, the Particle IK Solver is speciﬁcally designed to support ﬂexi-
ble tuning and the addition of many ad hoc preconditioners and sub-
tree solvers. We implemented several mathematically more com-
plex iterative and nonlinear equation-based IK solvers (including
several ﬂavors of Cyclic Coordinate Descent, Jacobian methods,
Constrained Dynamics, etc.), but in our experience these solvers
were slower and less amenable to tuning due to their complexity
and nonlinearity. This was a major impediment to our ability to
tune the solver code to attain natural poses. The simple architec-
ture and core implementation of the Particle IK Solver allows us to
make speciﬁc ad hoc tuning adjustments and special cases, without
compromising the quality of the solution in other areas of the pose.
In some sense, the design of the solver gives us “local control” over
the solution algorithm, a characteristic we feel was missing from
our previous, more “advanced”, solvers.
4.3.1 Initialization
The IK solver analyzes the character’s body goals and morphology
to ﬁnd the complete sub-tree that “has IK”. A body is said to “have
IK” if it or any of its children have pose goals. If a sub-tree does
not have IK, it is ignored by the solver and it becomes a candidate
for procedural secondary animation as discussed in Section 4.4.
The Root The root body is special-cased in the IK solver and
always has IK. It is forward kinematically controlled by the anima-
```


---

## Page 8

```text
Figure 7: Particle and constraint allocation for a limb.
tors and it is not affected by the solver iterations. 8 The root’s pose
is computed and the non-root bodies are hierarchically transformed
into the root-relative rest pose . This pose is used as a precondi-
tioner, giving the root goal signiﬁcant inﬂuence over the ﬁnal pose
of the character.
Delegated Goals Some body goals are delegated to the body’s
parent to improve the solved pose. For example, mouths attached
to the spine delegate their pose goals to their parent spine segment.
This keeps the mouth from moving independently of the spine—
if the animator moves the mouth, the spine will bend to place the
mouth at the goal and the motion will be more natural than if the
mouth had pivoted at its attachment joint.
Particles and Constraints Particles and constraints are allocated
to the joints and bodies depending on the caps and the solver phase.
Details of the allocation strategy for each phase are below in Sec-
tions 4.3.2 and 4.3.3. Particles are 3DOF points in Euclidean space.
Full 6DOF body goals are converted to 3DOF position goals at
the joint position of the body, avoiding the need to handle 6DOF
goals inside the solver [Meredith and Maddock 2004]. Constraints
are 1DOF length constraints between two particles. A particle can
have any number of constraints attached to it. Each constraint con-
tains a “mass” value for each of its two endpoint particles, allow-
ing the same particle to appear to have different masses for tuning
purposes when accessed from different attached constraints. The
constraints are enforced iteratively using a nonlinear length correc-
tion step [Jakobsen 2001], where the computed length error is used
to adjust the position of each particle along the constraint axis in
inverse proportion to its mass—a particle with a larger mass moves
less during length correction. The mass values have no physical
meaning, they are simply scalar values that control the impact of
the constraint solution on each endpoint particle. The length error
for each constraint is fed through a C1 continuous piecewise func-
tion that determines the resulting correction distance, enabling soft
constraints. Constraints are allowed to stretch and compress to give
an empirically more organic feel to the generated poses.
4.3.2 Spine Phase
In the spine phase, we allocate particles and constraints to the spine
and to simpliﬁed versions of the limbs. Each body with a goal in a
limb sub-tree is given a single length constraint directly to the spine.
The distal particle is set to the body goal position, the proximal
particle is set to the spine joint, and the constraint length is set to
the rest chord length of the simpliﬁed chain. The yellow line in
Figure 7 shows an example, with the blue dot showing the spine
attachment point of the simpliﬁed limb constraint, and the red dot
showing the grasper’s pose goal.
8Immediate children of the root can have a slight inﬂuence on the root’s
ﬁnal pose, but this inﬂuence is computed after initializatio n.
Spine Splines The character’s torso is usually composed of many
spine bodies as shown in Figure 8. Solving the spine directly with a
particle at each joint produces kinks and unnatural poses. We avoid
these problems by only allocating particles and constraints at IK
branch points along the spine. Branch points are caused whenever
more than one child of a spine body has IK, and at non-spine →
spine transitions in the IK chains moving rootwards, such as limb
attachment points. We generate a particle at each IK branch point
on the spine, with a length constraint between each, no matter how
many spine bodies exist between the branch points. In Figure 8’s
example, there are no branch points along the spine, so a single
length constraint (the blue line) is generated for the entire spine.
If the feet in the ﬁgure had goals, there would be branch points at
the leg attachment bodies, and multiple constraints along the spine
would be generated. Any spine particles are associated with the
child spine body of the joint at which they are allocated. This is a
unique map since the spine is a serial chain. At each spine particle,
an additional constraint is allocated to the root-relative rest pose
position for the anti-buckling algorithm described below.
Figure 8: A typical character spine and spine splines.
Next, the IK solver ﬁts a spline to the spine body joint positions be-
tween each pair of IK branch points, using linear least squares, and
stores the spline parameters in the local space of the particle’s as-
sociated body mentioned above. For a given spine spline segment,
only state at the particle endpoints is available during reconstruc-
tion, so we must use a single spline to span the segment. It is com-
mon for player created spines to have many inﬂection points, and
cubic splines did not ﬁt adequately in many common cases, while
quintic Hermite splines proved sufﬁcient. In Figure 8, the red dots
are the spine body positions, the yellow curve is the computed cu-
bic spline, and the green curve is the quintic. 9 We then step along
the spline—transporting a coordinate frame with its y axis paral-
lel to the spline tangent—to a point near each body’s position. We
record the t parameter value along the spline and the relative offset
and relative orientation of the body with respect to the transported
frame. This information allows us to reconstruct the coordinates of
the interior spine bodies given a posed spline, so the spine bodies
interior to a spine constraint can be ignored during the solve.
Constraint Iteration and Anti-Buckling Once the particles,
constraints, and spine splines have been constructed, the spine
phase constraint solver iterations begin. The constraint solver has
9Note, the spline endpoints are the joint positions of the ﬁrs t and last
constrained spine bodies, not the body positions.
```


---

## Page 9

```text
inner and outer iterations. The inner iterations loop over the con-
straints, from the leaves inward.10 The outer iterations loop over the
inner iterations a ﬁxed number of times (5 in our implementation).
The simpliﬁed limbs are allowed to compress to 10% of their rest
lengths during this phase, under the assumption that the limb will
bend to hit the pose during the limb phase. The shape of the spine
is monitored during the outer constraint iterations, and a simple
heuristic metric for whether it has buckled (folded over onto it-
self) into an unnatural pose is computed by comparing the angles of
the neighboring spine constraints. If buckling is detected, the con-
straints to the spine’s root-relative rest pose are smoothly enabled,
which pulls the spine back to a known-good conﬁguration. The end
result is a blend between the buckled pose and the root-relative rest
pose, which has proven to be a reasonable compromise between
ﬂexibility and robustness in our tests.
Reconstruction After the constraint iterations are completed, the
spine pose is reconstructed from the particle positions with an out-
ward iteration. The root’s pose is known, as mentioned in Sec-
tion 4.3.1. Each spine particle’s position is adjusted by projec-
tion in case the constraint iterations did not converge to an allowed
shrink/stretch factor (10%/120% in our implementation).
We reconstruct the orientations of spine bodies associated with IK
particles by computing a tangent vector at both the rest and the
posed position. We then construct the minimal-twist rotation be-
tween these tangents, and use it to rotate the root-relative rest ori-
entation of the body. Any delegated orientation goals are then
blended into the body. Once the position and orientation of the
particle-associated spine bodies are computed, the intra-spline bod-
ies can be reconstructed by the frame transport discussed above.
The technique for computing the tangents at the particles depends
on the constraint topology. If the particle is in two spine constraints,
the tangent, vi, is computed using a three-point-difference with the
neighboring spine particles: vi = ( pi+1 − pi− 1)/ 2. If the particle
is an endpoint, we use the tangent of the rootward neighbor particle
(which will either be the root or an interior particle, and therefor
known) and solve for the tangent of a natural cubic spline given
˙vi = 0, yielding vi = 3(pi− 1 − pi)/ 2 − vi− 1/ 2.
4.3.3 Limb Phase
The limb phase of the IK solver uses the posed spine and solves
for the limb conﬁgurations. In this phase, particles are allocated at
every limb joint, and constraints are allocated for every limb body
(the red points and green lines in Fig. 7). If a body has multiple
direct children with IK goals, cross-constraints are added between
them so they retain their relative positions.
Preconditioning The limb constraint solver uses an aim precon-
ditioner. The spine attachment point of a limb sub-tree is computed
given the newly posed spine, and then the limb sub-tree is distorted
(or aimed) such that its IK particles are at their goal positions before
the constraint iterations start.
We will describe the limb aim distortion for a serial chain limb ﬁrst,
where there is a single particle at the leaf with a pose goal. A vector
vr from the spine attachment point to the leaf particle in the root-
relative rest pose is computed. Then a vector vg from the spine
attachment point to the IK goal for the particle is computed, and a
minimal-twist rotation is generated to take vr to vg. Finally, a scale
factor along vg is composed with the rotation to create a transform
that rotates and scales the limb particles such that the end particle is
at the pose goal. This transform does not take the constraint lengths
into account, nor does it scale in directions orthogonal to vg, so if
10Inward iteration distributes the position error immediately since the
leaves contain all the initial error.
the pose goal is very far (resp. close) from the character, the limb
will be highly stretched (resp. squashed) along vg. The resulting
length constraint violations will be handled during the constraint
iteration. The aim preconditioner keeps the limb in a natural pose
as it compresses and extends, and favors rotation at shoulders and
hips. Simply running the constraint iterations from the root-relative
rest pose leads to unnatural poses, as the goal error is distributed
poorly along the limb. Other IK algorithms try to provide tuning
parameters to ameliorate this problem [Welman 1993]. Our aim
preconditioner leads to more natural poses in our experiments, but
it relies on the temporary violation of the length constraints, which
is not supported by most IK algorithms.
For branching limbs, the algorithm computes the aim distortion
transform by forming a weighted average of the goals in a sub-tree.
It then recurses outward to each child branch point, and repeats un-
til it aims the leaf serial chains.
Reconstruction The constraint iteration is identical to the spine
phase (without the anti-buckling algorithm), and after it is com-
plete, the limb positions and orientations are reconstructed. Posi-
tion reconstruction is also similar the spine phase. Because we have
a full set of particles and constraints for the limb bodies, we only
need to compute the twist around the constraint axis to complete a
body’s orientation. In the case of a body with no cross-constraints
on its particles, we compute the minimal-twist rotation from the
root-relative rest pose to the ﬁnal pose and use it to transform the
body’s rest orientation to the ﬁnal orientation. If there are cross-
constraints, then the orientation is fully determined (or overdeter-
mined) and we pick the ﬁrst two constraint axes to form the posed
frame. We have considered a minimization over the potential ori-
entations similar to the relative orientation problem in photogram-
metry [Horn 1990], but it has not proved necessary.
4.4 Jiggles
There is no robust way for an animator to select the bodies that are
not required for a given motion during authoring, but these bod-
ies should have secondary animation applied to them for aesthetic
quality [Thomas and Johnston 1981; Lasseter 1987]. Therefor, if a
sub-tree of the character does not “have IK”, a very simple highly-
damped pseudo-physical dynamics simulator—called Jiggles—is
applied to the bodies based on a heuristic for ﬂexibility, placement,
and type. The important factors are that the “jigglable” sub-trees
are dynamically determined based on the bodies the animation does
not select, and the simulated movement is completely passive with
respect to the keyed bodies and does not feed back to the rest of
the character. This latter restriction keeps the animator’s motion
authoritative over the selected parts of the character, while the re-
mainder of the character merely responds to the keyed movement
with plausible secondary motion. Our original secondary animation
system—called Wiggles—set goals for the IK solver and affected
the animation pose goals, which negatively impacted the quality of
the animators’ work.
5 Results and Discussion
We have presented an animation system capable of playing anima-
tions on characters with wildly varying morphologies, characters
that did not exist at the time the animations were authored. The
animations retain stylistic details as they are played, and the system
allows animators to control the way the animation is generalized
across characters. The animators are able to use familiar work ﬂow
to create these animations. The character gaits are synthesized with
stylistic variations tuned by the animators. An efﬁcient IK solver,
tuned to return natural organic movements, poses the character ev-
```


---

## Page 10

```text
ery frame. A simple procedural system applies subtle secondary
animation for believability.
Testing and Performance The animation system presented has
been implemented and has undergone thorough testing. Qualita-
tively, players seem amazed when the character they just created
“comes to life” and expresses emotions via animation. The in-game
editor begins playing animations on the character as soon as the
player adds feet, mouths, or graspers. Quantitatively, we stochasti-
cally test the animations against an ever-changing database of char-
acters uploaded from the game. A team of animation testers plays
the animations on a range of characters and reports failures using
a spreadsheet as shown in Figure 9. The fail cases reveal plain old
code bugs, aesthetic generalization issues that can be addressed by
animators with the existing features, and generalization issues that
need additional features or branches (Section 4.1.1) to solve. We
have tested several hundred creatures and a thousand animations
over the development of the system. The current pass rate is ~90%
and is continually improving.
Figure 9: An example Animation V alidation Grid.
The performance of the system is acceptable. A procedurally an-
imating character with 25 bodies currently takes approximately
0.2ms per frame on a 1.7Ghz Pentium-M machine and optimiza-
tion is ongoing. Approximately 35% of the time is spent in the IK
solver, with the rest spread amongst keyframe interpolation, goal
blending, etc.
Applicability and Usability Although this animation system was
created speciﬁcally for Spore and its extreme character morphology
range, there are several aspects of this work that are applicable to
other games and animation problems. Most importantly, bringing
animators into the loop with the semantic markup phase for selec-
tion and movement modes, and giving them realtime preview and
editing across multiple different targets, is applicable to motion re-
targeting in general, and more broadly, any place parameterized an-
imation is used. Although there is an appeal to algorithmically dis-
covering semantics, we ﬁnd having a human simply tell the system
what is important is immensely powerful, efﬁcient, and robust. Our
target-relative movement modes are also generally applicable. For
example, many existing systems use blending to interpolate poses
for reaching targets or aiming weapons with style [Kovar and Gle-
icher 2004]. By using our movement modes to record the anima-
tion curves, we avoid the need to search and blend sampled data,
and we can distort the curves directly to meet a goal while retaining
authored style. The Particle IK Solver is another generally useful
contribution of the work. Designing explicitly for ad hoc tuning and
preconditioners to aid in ﬁnding natural pose solutions is valuable to
all animation IK systems. Finally, as more games explore user gen-
erated content, whether allowing players to create characters from
scratch like Spore, or just allowing adjustable height, weight, body
shape, and other morphology parameters, real time motion retarget-
ing will become more important to many games.
Animators learning the system need training on how to create con-
text queries and use Spasm, but they create complete animations
on a single character within a few hours. However, it takes weeks
to build up an intuition about which kinds of motions generalize
across a wide range of characters and which don’t. The system is
complicated, and there are multiple equivalent ways to author an
animation on a single character that specialize completely differ-
ently onto other characters.
Limitations The current animation system has many limitations.
The current selection and movement modes cannot effectively ex-
press a motion such as “hug each other” or “rub your chin” be-
cause the system has no understanding of volume and boundaries.
We also completely ignore intra-character collision because it was
too difﬁcult to solve the nonlinear workspace problem for arbitrary
morphologies within our time constraints, but it is clearly a ﬂaw in
the system. The Particle IK Solver’s failures could be more grace-
ful. The current anti-buckling technique works most of the time,
but it is simplistic and can appear heavy-handed when it engages.
Also, the path independence of the IK solver causes singularities in
the solution space. 11 We push the singularities around to conﬁgu-
rations the character is unlikely to hit, but the animations can still
twist unrealistically if the pose comes close to the singularity.
Future Work In addition to addressing the speciﬁc limitations
above, the biggest area for improvement involves increasing the
level of “reasoning” the system performs about the character mor-
phologies. Examples would be the aforementioned boundary rela-
tive mode and a movement mode that models concepts like “close
in” and “extended”. Animators will need to be able to express much
more complex and subtle semantics to the system before the anima-
tions will generalize in way that’s competitive with a Maya anima-
tion on a single ﬁxed character. The gait system’s biggest challenge
is how to provide believable locomotion with anticipation in the
face of discontinuous player and code inputs.
Acknowledgements
Many thanks to Lucas Kovar for his incredible help in preparing this
paper. James O’Brien, Zoran Popovi ´c, and the anonymous review-
ers provided excellent feedback as well. We also thank the Spore
animators, John Cimino, Tony Gialdini, Bob King, and Gal Roth,
and the rest of the Spore team for putting up with our unique12 an-
imation system. Finally, thanks to the animation testers, Patrick
Benjamin, David Kertesz, and Steven Sadler, and to producers
Stephen Lim, Brodie Andersen, Peter Swearengen, and Steve Eng.
References
ALEXANDER , R. M. 2003. Principles of Animal Locomotion .
Princeton University Press.
APPLE , I NC . 2008. Apple iTunes Smart Playlists. http://www.
apple.com/lae/itunes/smartplaylists.html.
AUTODESK , I NC . 2008. Autodesk Maya . http://www.
autodesk.com/maya.
BARZEL , R., H UGHES , J. F., AND WOOD , D. N. 1996. Plausible
motion simulation for computer graphics animation. In Com-
puter Animation and Simulation ’96 , 183–197.
BARZEL , R. 1997. Faking dynamics of ropes and springs. IEEE
Comput. Graph. Appl. 17 , 3, 31–39.
11This is unavoidable for path independent solvers because of the Hairy
Ball Theorem and its ilk.
12They might choose a different word.
```


---

## Page 11

```text
BRUDERLIN , A., AND CALVERT , T. 1989. Goal-directed dy-
namic animation of human walking. In Proceedings of ACM
SIGGRAPH 89, 233–242.
BRUDERLIN , A., AND CALVERT , T. 1996. Knowledge-driven, in-
teractive animation of human running. In Proceedings of Graph-
ics Interface (GI’96) , 213–221.
CHI, D., C OSTA , M., Z HAO , L., AND BADLER , N. 2000. The
emote model for effort and shape. In Proceedings of ACM SIG-
GRAPH ’00 , 173–182.
CHOI , K.-J., AND KO, H.-S. 2000. On-line motion retargeting.
Journal of Visualization and Computer Animation 11 , 223–243.
DESMECHT , L., AND DACHARY, L., 2006. Cal3d animation sys-
tem. http://home.gna.org/cal3d.
EDERY, D., B ROWN , M., P ALLISTER , K., K OSTER , R., AND
MUZYKA , R., 2007. Sharing control. Game Developers Con-
ference 2007.
GIRARD , M., AND MACIEJEWSKI , A. 1985. Computational mod-
eling for the computer animation of legged ﬁgures. In Proceed-
ings of ACM SIGGRAPH 1985 , 263–270.
GLEICHER , M. 1998. Retargeting motion to new characters. In
Proceedings of ACM SIGGRAPH 98, Annual Conference Series,
ACM SIGGRAPH, 33–42.
GROCHOW , K., M ARTIN , S., H ERTZMANN , A., AND POPOVI ´C,
Z. 2004. Style-based inverse kinematics. ACM Transactions on
Graphics 23, 3.
HORN , B. K. P. 1990. Relative orientation. International Journal
of Computer Vision 4, 59–78.
JAKOBSEN , T., 2001. Advanced character physics. Game Devel-
opers Conference 2001. http://www.teknikus.dk/tj/
gdc2001.htm.
KASTENMEIER , T., AND VESELY, F. J. 1996. Numerical robot
kinematics based on stochastic and molecular simulation meth-
ods. Robotica 14, 329–337.
KLEIN , C., AND HUANG , C. 1983. Review of pseudoinverse
control for use with kinematically redundant manipulators. IEEE
Trans. Systems, Man, and Cybernetics 13, 2 (March/April), 245–
250.
KOVAR, L., AND GLEICHER , M. 2004. Automated extraction
and parameterization of motions in large data sets. ACM Trans.
Graph. 23, 3, 559–568.
KULPA , R., M ULTON , F., AND ARNALDI , B. 2005. Morphology-
independent representation of motions for interactive human-like
animation. Computer Graphics F orum, Eurographics 2005 spe-
cial issue 24, 3, 343–352.
LASSETER , J. 1987. Principles of traditional animation applied
to 3d computer animation. In Proceedings of ACM SIGGRAPH
’87, 35–44.
LEE , J., AND SHIN , S. Y. 1999. A hierarchical approach to inter-
active motion editing for human-like ﬁgures. In Proceedings of
ACM SIGGRAPH 99, 39–48.
MEREDITH , M., AND MADDOCK , S. 2004. Using a half-jacobian
for real-time inverse kinematics. In Procedings of The 5th In-
ternational Conference on Computer Games: Artiﬁcial Intelli-
gence, Design and Education , 81–88.
MIZUGUCHI , M., B UCHANAN , J., AND CALVERT , T. 2001. Data
driven motion transitions for interactive games. In Eurographics
2001 Short Presentations.
MOZILLA FOUNDATION . 2008. Mozilla Thunderbird Message
Filters. Tutorial at http://opensourcearticles.com/
thunderbird_15/english/part_07.
MURATORI , C., R OBERTS , J., F ORSYTH , T., AND MOORE ,
D., 2008. Granny 3d animation sdk. http://www.
radgametools.com/granny/sdk.html.
NEFF, M., AND FIUME , E. 2005. Aer: aesthetic exploration
and reﬁnement for expressive character animation. In SCA ’05:
Proceedings of the 2005 ACM SIGGRAPH/Eurographics sym-
posium on Computer animation , 161–170.
O’B RIEN , J. F., Z ORDAN , V. B., AND HODGINS , J. K. 2000.
Combining active and passive simulations for secondary motion.
IEEE Comput. Graph. Appl. 20 , 4, 86–96.
POPOVI ´C, Z., AND WITKIN , A. 1999. Physically based motion
transformation. In Proceedings of ACM SIGGRAPH 99 , 11–20.
ROTENBERG , S., 2004. Locomotion. UCSD CSE169: Computer
Animation Lecture Notes. Available at http://graphics.
ucsd.edu/courses/cse169_w04/CSE169_13.ppt.
RYCKAERT , J., C ICCOTTI , G., AND BERENDSEN , H. 1977. Nu-
merical integration of the cartesian equations of motion of a sys-
tem with constraints: molecular dynamics of n-alkanes. Journal
of Computational Physics 23 , 327–341.
SHIN , H. J., L EE , J., G LEICHER , M., AND SHIN , S. Y. 2001.
Computer puppetry: an importance-based approach. ACM
Transactions on Graphics 20, 2 (Apr.), 67–94.
SUN, H. C., AND METAXAS , D. N. 2001. Automating gait gen-
eration. In Proceedings of ACM SIGGRAPH ’01 , 261–270.
TANG , W., C AVAZZA, M., M OUNTAIN , D., AND EARNSHAW ,
R. 1999. A constrained inverse kinematics technique for real-
time motion capture animation. The Visual Computer 15 , 7–8
(November), 413–425.
THOMAS , F., AND JOHNSTON , O. 1981. Disney Animation, The
Illusion of Life. Abbeville Press.
TOLANI , D., G OSWAMI , A., AND BADLER , N. I. 2000. Real-
time inverse kinematics techniques for anthropomorphic limbs.
Graphical models 62, 5, 353–388.
WELMAN , C. 1993. Inverse Kinematics and Geometric Con-
straints for Articulated Figure Manipulation . Master’s thesis,
Simon Fraser University.
WILLMOTT , A., Q UIGLEY , O., C HOY, L., S HARP , B., AND IN-
GRAM , R., 2007. Rigblocks: Player-deformable objects. SIG-
GRAPH 2007 Sketches.
WRIGHT , W., 2005. The future of content. Game Developers
Conference 2005, March. http://video.google.com/
videoplay?docid=-262774490184348066.
YAN, Y., O HNISHI , K., AND FUKUDA , T. 1999. Decentralized
control of redundant manipulators: a control scheme that gener-
ates a cyclic solution to the inverse problem. In Proceedings of
1999 IEEE/ASME International Conference on Advanced Intel-
ligent Mechatronics, 404–409.
ZHAO , J., AND BADLER , N. 1994. Inverse kinematics position-
ing using nonlinear programming for highly articulated ﬁgures.
ACM Transactions on Graphics 13, 4 (Oct.), 313–336.
```
