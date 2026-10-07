# 1st Amendment Auditor

An independent, free-to-play satirical **playable campaign prototype** about manufacturing outrage, living with the consequences, and learning that giving up is winning. Original procedural town and characters; no copied game assets or commercial music.

## Play

`1st-amendment-auditor.html` is the complete, self-contained game, including fonts. Download it and open it in a current browser. For the most consistent WebGPU, video-storage, and save behavior, serve it over localhost or HTTPS:

```sh
python3 -m http.server 8080
```

Then open **http://localhost:8080/1st-amendment-auditor.html**. Alternatively, run `python3 run-game.py` to start the local server and open the game automatically. On Windows with Python installed, `py -m http.server 8080` also works. The downloaded game needs no installation, build service, account, or API key to play. Rebuilding the source requires Node.js, Python 3, and `npm ci`. The modular site in `dist/` can be deployed to any static HTTPS host.

Three.js selects WebGPU when an adapter is available and WebGL 2 otherwise. Devices without either use the original Canvas compatibility renderer. The live renderer indicator makes the selection explicit. Direct `file://` navigation could not be tested in this environment because managed Chromium blocks local-file navigation; localhost was tested.

## Controls

| Input | Action |
| --- | --- |
| WASD / arrow keys | Screen-relative walking; driving: W/↑ gas, S/↓ brake then reverse, A/D or ←/→ steer |
| Shift | Jog on foot; hard brake while driving |
| Click sidewalk | Walk a route around buildings (on foot only) |
| E | Enter nearby car / get out |
| F | Start or finish a recording |
| Space | Deliver the next confrontational catchphrase |
| Scroll / + / − | Zoom |
| Buttons / touch pad | Equivalent mobile controls |

Menus and background tabs pause simulation, except the live police-statement form. Suspects can leave while that form is open. Settings contains sound, weather, save export/import, and career reset.

## The playable loop

1. Start with **$0**, a cracked-phone camera, and a smoking rust bucket.
2. Explore fourteen fictional locations in Little Liberty and encounter eighteen locals. Film at least three seconds. Characters have different temperaments, not identical hostility.
3. Locals ask for space, argue, swear, gesture, pace, play a fictional royalty-trap playlist, leave, cry, throw a cup or stink bomb, or shove the character/camera. Non-graphic health consequences can lead to a $65 hospital visit.
4. Finish a take. The editing desk contains a playable local recording when MediaRecorder is supported, a timestamped event log, and the context-removal toggle. Removing provocation increases simulated views but reduces the society meter. The downloadable original remains unedited.
5. Publish to a **simulated** YouTube channel. No account or real upload occurs. Ads pay a tiny amount; editing, data, gear maintenance and crew wages often exceed it. Claimed audio produces no ad income.
6. Buy cameras, stabilizers, microphones, clown and poop masks, two crew members, and pepper spray/mace. Crew follow the player in matching “I’m with stupid” shirts. Credit is limited; debt incurs interest.
7. The auditor calls police and demands criminal charges against the civilian: “I’m pressing charges! This person hit me. I’m the victim here!” The player then deploys exaggerated legal jargon, requests a supervisor and case number, and portrays the confrontation as an unprovoked attack. These auditor lines appear as speaker-labeled captions and in the recorded event log. A patrol car arrives, an officer approaches, and an eligible outcome may show an arrest escort and departure while recording continues. An arrest is not a conviction. Review the incident report afterward and choose whether to file a separate fictional civil claim against the city. The civilian complaint and city lawsuit are distinct steps. Contact does not guarantee liability or payout; full-context evidence can defeat a claim.

## Downfall campaign (v0.2)

The campaign now has six stages: attention, reputation, retaliation, demonetization, service work, and peace. Open **Home, loans & career** in the sidebar for the campaign panel.

- **Recognition and violence:** provocation and uploads raise reputation. Locals recognize the auditor, lose patience sooner, and at higher reputation may punch/kick or smash equipment. Low health sends the auditor to hospital. A destroyed camera ends the take and cannot record until repaired. Repair costs and lower reach from damaged equipment eat into income.
- **Police and disputed harm:** civilians minimize injuries or broken gear, cry, grow angrier or flee. Officers express dislike of the auditor while assessing the reported incident. Some high-reputation encounters require a written statement first. The form asks for the full sequence, including the lead-up. **This form deliberately does not pause the town:** an on-screen countdown shows the civilian's opportunity to leave. The auditor complains while the suspect escapes. The report can still be filed afterward. This is a fictional satirical branch, not a claim about real police procedure.
- **Privacy reversal:** reputation 25 exposes the fictional home address. Lawn fouling and trash-dumping incidents happen during continued uploads or time spent in the town. There is no gunfire, nudity or graphic defecation. Lawn damage and sanitation cost money; cleanup costs $12 per unresolved incident. Cameras cost $70 plus $7 daily storage; lights cost $45 plus $3 daily electricity. The first camera-recorded visitor is identifiable; later visitors adapt by wearing masks. CCTV evidence uses a labeled **reconstructed security still and incident record**, not a saved CCTV video. The lawn, mess, installed equipment and visiting figure appear in the world.
- **Debt spiral:** each loan supplies $150 principal. The first has a $10 fee and 5% daily interest; later loans add $6 to the fee and 3 percentage points to the rate, capped at 28%, applied to **all** outstanding loan principal. Maximum eight loans. Loan cash is excluded from profit; repayments reduce principal rather than being counted as a second expense. Overdraft interest remains a separate cost.
- **The platform moves on:** a warning appears around four uploads/reputation 45. Eight uploads, four serious context-cutting strikes, or reputation 90 permanently ends simulated ad revenue. These are invented gameplay thresholds. Continuing to upload earns $0 while costs remain. Exhausted borrowing plus a destroyed camera also opens the final exit so the campaign cannot become stuck without a way forward.
- **Service and surrender:** after demonetization, choose to give up auditing. The camera and mace retire, crew leave, new borrowing ends, and a hardship plan freezes escalating loan interest. Walk to the café, library or park to clock in. Complete three short useful tasks per shift; café shifts pay $32, library shifts $35, and groundskeeping shifts $38. A quarter of wages goes toward outstanding principal. Complete three shifts and explicitly **put the camera away for good** to win. The game does not erase debts or past harm. It ends the spiral.

Older saves without campaign data migrate automatically. Reputation, damage, loans, home evidence, demonetization, service tasks and the completed ending persist across saves and JSON exports. Live police pursuits remain transient.

## Original character cast (v0.4)

The GPU-rendered townspeople now use an original carved-caricature style. Eighteen named locals have explicitly chosen silhouettes, skull/jaw profiles, noses, hair, clothing palettes, accessories and posture. Additional designs cover the auditor, two crew members and two officers. The characters use authored procedural geometry, not downloaded human models or generated image textures.

Examples: Pat's loosened tie and heavy glasses; Morgan's narrow cardigan silhouette, silver bun and books; Dee's wide work shirt, visor and mail satchel; Sam's scrubs and angular curls; Casey's copper bob and repaired coat; Nell's sunhat and gardening clothes. The auditor has a forward-leaning belly, stained shirt, press lanyard and missing teeth. Clothing seams, lapels, buttons, pockets, repairs, shaped shoe soles and accessories are modeled details. Crew lettering is a locally rendered texture on the shirts themselves.

- **Meet the locals** in the footer opens the cast viewer. **Meet [name]** under the nearby local's name opens that person's model. Drag or use the arrow buttons to rotate; choose a full figure or face close-up and try expressions. The viewer displays the same rigs used in town and requires WebGL 2.
- Each figure is consolidated into a skinned mesh with rigid bone weights that preserve the carved shapes; accessories that need separate visibility remain separate. Walking, blinking, idle motion, refusal, anger, crying, recoil and throwing use articulated joints and facial features. In-game dialogue/encounter states drive the relevant poses. Gallery biographies describe characterization; they are not all separate AI behavior routines.
- Existing masks and camera gear remain visible; masked home visitors retain a face covering. Giving up auditing switches the player to cleaner service clothing and retires the camera.
- Gameplay zoom now reaches closer for character detail. Save files and economy rules remain compatible. The engage button now visibly respects its existing cooldown instead of silently ignoring quick repeat clicks.
- The original Canvas-only compatibility renderer and reconstructed CCTV stills retain simplified representations. The detailed cast is available in the Three.js WebGPU and WebGL 2 paths.

`cast-lineup.png` is a review sheet made from actual character-viewer renders. `tools/cast-contact-sheet.py` assembles those screenshots (Pillow is needed only to regenerate that QA sheet). `dist/characters.js` contains the complete cast designs, geometry and animation. `dist/cast-studio.js` contains the inspection viewer. No external asset requests or new runtime dependencies were added for this work. Playable gender selection, fly-related penalties, weekly assistance and bathroom mechanics remain pending. Cosmetic flies are implemented in v0.7.

## Three.js atmosphere (v0.3)

The game now uses **Three.js 0.186.1**, bundled locally. The town layout, economy, campaign and save format remain compatible with v0.2. A real perspective camera and depth buffer replace the former screen-space polygon renderer.

- Physically based surface materials, actual shadow maps and a distant spotlight approximating sunlight. Buildings and tree canopies occlude the light.
- Shadow-aware volumetric scattering, depth-clipped against the world, at 35% rendering resolution; restrained bloom and ACES tone mapping. This is a foundation for further atmosphere/art work, not a finished photorealistic environment.
- Procedural drifting sky clouds, cloud-shade modulation, distance haze, rolling hills and fuller low-poly trees. Cloud shade is an artistic approximation, not physically coupled to the sky-cloud field.
- Golden hour, clear sky, overcast, rain and fog. Rain reduces material roughness; it does not yet create physically reflected puddles. Weather changes gradually in the town.
- Settings → Graphics: **Atmospheric** enables rays and bloom; **Balanced** keeps perspective, lighting, shadows, sky and fog. Balanced is the default on small screens and the WebGL fallback unless a preference was saved. Graphics preferences are stored separately from the career.
- Rendering bounds outstanding WebGPU work so a slow GPU cannot accumulate an unlimited frame queue. Actual performance on physical mobile/desktop GPUs has not been measured here.
- Optional synthesized wind/rain, engine and siren audio. Dialogue remains captioned.

No textures, scripts or fonts are fetched from a CDN. Three.js and all assets are embedded in the single-file build. Weekly assistance, playable gender selection, fly buildup and bathroom mechanics are still pending; this release prioritizes the rendering conversion.

## Saves and footage

Gameplay autosaves to browser `localStorage`, with JSON import/export. Recorded **in-game** video uses browser `MediaRecorder` and IndexedDB, with an in-memory fallback. The recorder captures only the generated game scene and captions; it never requests a camera, microphone, or desktop permission. Video takes are silent originals. WebGPU video capture uses encoded pixel readback into a separate Canvas surface to avoid driver-specific GPU copy corruption; this adds overhead while recording. Completed frames are submitted atomically. CCTV stills remain stylized reconstructions. Download them from the editing desk before publishing consumes the take.

JSON backups contain career data, clip metadata and event logs, **not video blobs**. Moving to another device preserves the gameplay take but requires separately downloaded videos. Browser storage can be cleared or evicted; export backups when needed. Imported saves are validated before replacing the current career. Ambient NPC positions and live police sequences are not persisted; completed incident reports and recorded clips are.

## Economy

- Ads: $0.0024 per simulated view; claimed music: $0.
- Editing/data: $4.50 for an intact-context upload; $8 for a context-cut upload, before equipment and crew.
- Equipment upkeep per upload: camera $4, stabilizer $3, microphone $2.
- Crew wages: $18 per hire per upload.
- Credit purchasing limit: −$350. Midnight overhead: $8, plus 2% interest on debt.
- Claim filing: $12. Eligible settlements are uncertain and lawyers take 40%.
- Health at or below 15 triggers hospital treatment for $65. Once purchased, mace fires automatically when a civilian shoves the auditor or camera, consuming one charge. A visible spray, crying/retreat animation, and the auditor’s self-defense/charge demands are recorded. Manual use is also available. Unprovoked spray can generate fines; retaliatory use does not guarantee either an arrest or immunity. Spray can undermine civil claims.
- Society begins at 0% and can fall to −100%. Recording alone does not reduce the meter; provocation, manipulative editing, and escalation do.

These are invented balancing rules for satire, not statements of platform monetization or legal procedure.

## Town / real-world reference notes

Little Liberty's city hall, library, post office, courthouse, café, police station, hospital, shops, park, news office and editing den are fictional. The geography and people do not reproduce a real city or identifiable individuals.

Reference reading informed the *types* of places and interactions:

- [American Library Association — Auditing the First Amendment at Your Public Library](https://www.oif.ala.org/auditing-the-first-amendment-at-your-public-library/): library setting, quiet-space conflicts and staff responses.
- [MRSC — Rights and Limits on Filming in Public Facilities](https://mrsc.org/stay-informed/mrsc-insight/april-2023/rights-and-limits-on-filming-in-public-facilities): civic spaces and the distinction between lawful filming and disruptive conduct.
- [York University — Policeman Obscures Accountability with Taylor Swift](https://www.yorku.ca/osgoode/iposgoode/2022/02/23/filling-blank-space-policeman-obscures-accountability-with-taylor-swift/): music intended to disrupt distribution of recordings. The game's music-claim mechanic is fictional and simplified; no copyrighted songs are included.

Rendering references: [Three.js WebGPURenderer](https://threejs.org/manual/pages/webgpurenderer.html), [node post-processing](https://threejs.org/manual/pages/webgpu-postprocessing.html), and [volumetric lighting](https://threejs.org/examples/webgpu_volume_lighting.html).

## Source and verification

- `dist/core.js`: save schema/migration, purchases, clip economics, claims.
- `dist/campaign.js`: reputation, home retaliation, loan accounting, equipment repair, service jobs and victory.
- `dist/world.js`: shared town geometry, characters, patrol visuals and legacy compatibility renderer.
- `dist/three-world.js`: perspective projection, Three.js lighting, GPU backends, shadows, atmospheric post-processing and persistent character rigs.
- `dist/characters.js`: original cast design profiles, colored geometry, accessories and articulated animation.
- `dist/cast-studio.js`: rotatable close-up character viewer.
- `dist/atmosphere.js`: shared weather state and legacy weather composition.
- `dist/audio.js`: original procedural ambience.
- `dist/capture.js`: local in-game video capture and storage.
- `dist/app.js`: input, simulation, encounters, menus and persistence.
- `build.py`: bundles modules with pinned esbuild and creates the single-file game; font and Three.js licenses are embedded.
- `tests/core.test.js` and `tests/campaign.test.js`: pure economy, campaign progression, accounting, save migration and ending tests (`npm test`).
- `tests/browser.cjs`, `tests/encounters.cjs`, `tests/mace.cjs`, `tests/campaign-browser.cjs`, `tests/violence.cjs`: Playwright functional checks. They use this workspace's Playwright installation and Chromium; adapt the paths for another development machine.

```sh
npm ci
npm run check
npm test
npm run build
```

Fonts: Barlow Condensed and DM Sans, bundled under the SIL Open Font License. Three.js is bundled under the MIT license. Full license texts are in `licenses/` and embedded in the standalone HTML.

## Prototype limits

This is a compact, exterior-only open world with simplified NPC behavior, driving and legal outcomes. It is not a finished large-scale 3D life simulator. Context cutting changes simulated publication results, not encoded video frames. NPC dialogue is text; no commercial songs are used. No real platform integration, payments, multiplayer or cloud accounts. Further work includes interiors, navigation/pathfinding, closer cinematic cameras, richer character animation, more detailed day/night lighting, and the pending personal-needs mechanics.

No hosted Site was published: the Sites source-workflow helper required by the available publishing workflow was not installed in this environment. The standalone game and complete source remain independently hostable.


## v0.5: saves, language and scene dialogue

No login is required or recommended for this local-first release. GitHub Pages
serves static files; Google sign-in alone would not store a save. Cross-device
sync would need an authenticated storage service, per-user access rules,
conflict handling, account deletion and maintenance. None is included here.

Progress autosaves every ten active seconds and on page exit, when browser
storage is available. Settings offers Save now and JSON export/import. Export
before changing devices, browser profiles or hosting address; private browsing
and clearing site data can delete saves. Video blobs are stored separately in
IndexedDB and must be downloaded individually. JSON imports are validated.
Local saves are editable; there is no competitive server economy to protect.
The legacy save key is preserved for compatibility. Storage is origin-based:
other repositories on the same github.io origin can access that origin's data.
Use a dedicated domain if isolation from other hosted projects is important.
Do not put personal information in fictional police statements.

Settings → Language defaults to Profanity off and persists in saves. Existing
saves migrate to that default. Built-in dialogue, shop labels, notifications
and displayed saved text are filtered; new recorded captions follow the setting.
Already-recorded videos cannot be retroactively cleaned. This is not a child
mode: violence, mature satire and crude themes remain. There is no voice acting.

`dist/dialogue.js` contains original event-specific line banks, global shuffle
bags without replacement, and protection against immediate repeats at bag
boundaries. The same common line does not repeat just because a different local
speaks. Pleas can specialize for the library, café, civic sites and rain. Mood
and temperament choose reaction events through existing encounter logic;
reputation changes recognition. Police phases, damage, mace, flight and arrests
have their own banks. Auditor lines precede delayed civilian responses; nearby
witnesses and crew fill occasional gaps. Police scenes suppress ambient chatter.
Line selection does not use the test-controlled encounter RNG. Anti-repeat bags
are session-local; reloading starts new bags. No paid APIs or runtime text model.

Design reference: Elan Ruskin's [GDC 2012 contextual dialogue presentation](https://www.gdcvault.com/play/1015946/AI-driven-Dynamic-Dialog-through).
It describes selecting responses from world facts and falling back to general
rules. This prototype uses a small event/context implementation of that general
pattern; it does not reproduce Valve or GTA dialogue, code, audio or characters.
New banks can be written without expanding a branching story script.

## License and GitHub hosting

This project is **source-available, free to play and share**, under the custom
[Free Sharing, No Sale License 1.0](LICENSE). Free forks and mods are allowed;
selling copies, paid access, paid derivatives and paid unlocks are prohibited.
Optional donations without perks and monetized gameplay videos are allowed.
Keep attribution and license notices; identify modifications. Third-party
components retain their original licenses in `licenses/`. The [player agreement](EULA.txt)
is also summarized in Settings. A no-sale restriction does not meet the
[Open Source Definition](https://opensource.org/osd). This is a custom license,
not an assurance of enforceability in every jurisdiction.

For the simplest free deployment, use `1st-amendment-auditor-hosting.zip`
and follow [HOSTING.txt](HOSTING.txt): upload its contents to a new public
repository and enable Pages from `main` / root. The package already includes
`index.html` and editable source; no build or paid service is needed. Use the
free `github.io` address. A pseudonymous account and GitHub's private noreply
commit address keep personal attribution out of the public repository.
Use an email you control for account verification/recovery, not a fabricated
unreachable address. The project credit remains the project contributors;
required third-party author notices remain intact. No personal contact email
is included. Hosting is subject to GitHub's terms and usage limits.
The game is published through GitHub Pages; the repository root index.html is the live entry point.

## Source formatting and production output

`npm run format` formats editable JavaScript, CSS and tests with pinned Prettier.
`npm run format:check` checks the same convention without changes.
`npm run build` minifies the bundled JavaScript and generates `dist/style.min.css`;
the standalone HTML embeds minified scripts/styles and its fonts. Generated
output is excluded from formatting. Required third-party notices remain.
Minification reduces transfer size; it is not access control or proof of authorship.
No source maps or local workspace paths are included in the public JS bundle.

## v0.6 movement

Cars now accelerate, coast, brake and reverse with speed-dependent steering and
rotating body geometry. Stop before exiting. The touch arrows use the same
vehicle-relative controls; their accessible labels change when driving. Menus
and reloading stop momentum. Saved heading is optional in older saves.

Click-to-walk and civilian movement use a collision-checked navigation grid.
Locals choose short walks and pause, separate from nearby residents, and route
escapes around buildings. Animation phase follows distance traveled and facing
turns smoothly. This is still a compact arcade prototype: no traffic simulation,
vehicle suspension, pedestrian ragdolls or full rigid-body physics.

## v0.6.1 exhaust audio

Settings → Sound enables the car’s synthesized burbling, fart-like exhaust.
Its voiced buzz, uneven flutter and falling rasp bursts follow speed and
acceleration, including reverse. The effect uses reusable Web Audio nodes;
no sound downloads, recordings, paid service or microphone access. Existing
mute and menu/background pause settings apply. Local video takes remain silent.

## v0.6.2 outdoor soundscape

Sound now includes gently gusting wind, weather-following rain and spatially
varied daytime bird calls. Birds quieten in heavy rain and at night. Short
original chord passages last about 15 seconds, with roughly 40–75 seconds
of silence between passages. Settings offers a separate Background music
switch. Conversations, recording and police scenes fade decorative audio
down. Driving suppresses birds/music and lowers wind so the sputtering car
remains prominent. Master Sound/mute and background/menu pause still apply.
No external audio assets or music service. Gameplay video exports stay silent.


## v0.7 first-person and mirrors

Press V or use First person to switch views. Drag to look; Q/R turn on foot.
Movement follows your view on foot; driving keeps the existing vehicle controls.
Find mirror walks to the nearest mirror and faces it. Six mirrors are placed
per save: one near the start and five chosen from safe town locations. The layout
and view preference persist in saves; older saves receive a stable layout.

Mirrors reflect the live scene, your character, equipped mask, shirt and orbiting
flies. Buy Press for Views or Taxpayer Funded shirts in the shop; owned shirts
can be equipped or removed there. Clothing is cosmetic. Flies are currently
visual, with no relocation penalty. First-person uses a reflection-only character
layer so your face does not obstruct the main camera.

To limit GPU cost, only the nearest mirror in front of the player within 24
world units renders a live reflection, at half resolution. First-person and live
mirrors require WebGPU or WebGL2; those controls are disabled in Canvas fallback.
No account, network service or external character assets are needed.


## v0.8 fullscreen and controllers

The town fills the viewport. Tab or Menu & objectives opens the paused career
menu; Tab/Escape or Resume returns to play. Arrow keys move keyboard focus in
menus and Enter activates buttons. Form fields retain normal typing and Tab.
The compact HUD retains cash, health and street actions. The fullscreen button
requests browser fullscreen from a click; unsupported browsers keep the viewport
layout. Mobile browser chrome may remain visible.

Standard Gamepad API controllers work over your device's existing USB/Bluetooth
connection. Press a controller button once if the browser has not exposed it yet.
Left stick moves with analog speed; right stick looks in first-person. A/✕ engages,
X/□ records, Y/△ enters/exits the car, B/○ hard-brakes, RT/R2 accelerates and
LT/L2 brakes/reverses. Left stick also steers/drives. Left stick click jogs.
LB/L1 uses mace; RB/R1 requests charges. View/Share changes view; Start/Options
opens/closes menus. D-pad navigates menus, left/right changes select fields,
A/✕ activates and B/○ goes back. Text entry/file pickers use device input.

Stick deadzones prevent small drift. Button actions trigger once per press;
disconnected/background controllers provide no gameplay input. Only browser
standard mappings are supported; uncommon controllers may require OS mapping.
There are no additional services, dependencies, accounts or permissions.


## v0.9 resolution and Display P3

Menu → Settings separates lighting quality, resolution and output color.
Automatic resolution retains the existing performance budget. Native renders
at device pixel density, capped at the UHD budget. 4K renders 3840×2160 at 16:9,
preserving other aspect ratios within the same long/short-edge limits and GPU
texture limit. On smaller screens this is supersampling, not extra physical
screen pixels. UI text remains browser-rendered at native density.

Automatic color uses Display P3 when both the screen and canvas support it;
sRGB remains the fallback and can be selected explicitly. Three.js performs
linear-light color management and output conversion; the canvas is configured
to the matching color space. This is wide-gamut SDR, not HDR. Source textures
keep their existing sRGB interpretation. Changing output gamut does not invent
additional detail or saturate the artwork. Video capture remains separate from
the display resolution and does not promise 4K or P3 exports.

Options save locally on this device and apply after resuming. Reopen Settings
to see the actual render dimensions and output color space. For iPhone, start
with Balanced graphics, Native resolution and Automatic/P3 color; use Automatic
resolution for lower heat, battery use or a smoother frame rate. 4K is optional
and best suited to capable desktop GPUs. Real iPhone frame rates vary by model.


## v0.9.1 phone movement

The phone directional buttons are replaced by a 144px analog thumbstick. Push
slightly to walk slowly; push to the outer edge to jog. In first-person, drag
the right side to look while moving with the left thumb. Each finger owns its
control, so releasing one no longer cancels another. Touching the world no
longer starts an unintended click-to-walk route. Mouse click-to-walk remains.

While driving, the stick steers only. Separate Gas, Brake/Reverse and Stop
pedals support simultaneous steering and throttle. Lift a pedal to release it.
Controls reset when menus open, the browser loses focus, a touch is cancelled
or the viewport changes. Coarse-pointer devices get controls in landscape too,
with safe-area spacing and a smaller minimap out of the thumb area.

## v0.9.2 compact HUD

Removed the fullscreen request button (the game still fills its viewport).
The top-left menu is a labeled hamburger icon; Tab remains available. Zoom
buttons are hidden in first-person and scroll no longer changes its zoom.
View/mirror and street actions share one two-row panel. Touch devices use
drag-to-look without duplicate turn buttons. Portrait notices sit below the
right-side panel. Desktop turn buttons remain available.

## v0.9.3 shared map and phone audio

On touch layouts, the minimap sits beneath the movement pad with a transparent
stick and outlined thumb marker. The map stays visible in portrait/landscape;
desktop layouts retain their separate minimap. Map rendering cannot intercept
stick input.

The speaker icon beside the menu enables/mutes sound and saves the preference.
Sound remains off until enabled. Audio initialization explicitly resumes the
context during a tap; subsequent pointer releases/clicks/key presses retry
suspended or interrupted playback. Capture-phase input also sees joystick taps.
Where supported, the browser audio session uses playback mode. Device media
volume and browser restrictions still apply; menus intentionally pause audio.

## v0.10 two-way conversations

Engage starts an original, coherent four-turn exchange: auditor, civilian,
auditor, civilian. It works without recording; only recorded encounters affect
the existing filming/escalation economy. Ordinary residents pause briefly to
answer, but can still flee or react to an incident. Walking out of range,
entering the car, police involvement or an incompatible reaction cancels
remaining banter. Engaging again begins another exchange.

The fixed conversation panel names each speaker and keeps the latest four
lines readable. Hide/Show collapses it; it fades away after inactivity. Phones
use this panel instead of the floating one-line bubble. Actual conversation
lines enter recorded clip event histories; video subtitles still show the
current line. The game does not add synthesized or recorded speech voices.

37 authored exchanges add 148 lines to the existing 200 event-driven lines.
Location, weather, reputation and patience select contextual pools. Each pool
is shuffled and exhausted before repeating. Profanity controls apply to both
sides. Research sources and limitations are in DIALOGUE-SOURCES.txt; no external
transcripts, names, recordings or runtime dialogue services are bundled.
