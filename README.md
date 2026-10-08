# 1st Amendment Auditor

A free satirical browser game about manufacturing outrage and discovering the overhead.
Original town and characters, atmospheric WebGPU lighting, and local saves.

[Play the game](https://scrapmebaby.github.io/-first-amendment-auditor/)

No account, payment, API key, microphone or webcam is needed to play. Progress
saves in your browser; export a backup through Settings before clearing site
data or changing devices. Recorded gameplay videos download separately.

Mature satire with confrontations, violence, crude humor and optional profanity.
Fictional dialogue and police outcomes are not legal advice.

## Source and reuse

Editable source and build instructions are in [source/](source/README.md).
The served index.html is prebuilt and minified. No build server is needed.

Free to play, modify and share under [LICENSE](LICENSE); selling copies,
paid access and paid derivatives are prohibited. This is source-available,
not an OSI open-source license. [Player agreement](EULA.txt).
Third-party dependencies retain their own notices in [licenses/](licenses/).

## Hosting

GitHub Pages serves main / root over HTTPS. No paid backend or custom domain.
See [HOSTING.txt](HOSTING.txt) for local-first storage and hosting details.

## Movement controls (v0.6)

On foot: WASD/arrows walk relative to the screen; Shift jogs. Clicking a
destination routes around buildings. In the car: W/↑ gas, S/↓ brake then
reverse, A/D or ←/→ steer, Shift hard brake. Stop before pressing E to exit.
Touch controls show Gas and Brake while driving. Old saves remain compatible.

## First-person and mirrors (v0.7)

Press V or First person to switch views; drag to look and use Q/R to turn.
Find mirror walks you to a nearby live mirror. Purchased shirts, masks and
flies appear in your reflection. Six mirror locations persist with each save.
First-person and live mirrors require WebGPU or WebGL2.

## Fullscreen and controllers (v0.8)

The town fills your screen. Tab or Menu & objectives opens the pause menu.
Standard Xbox/PlayStation-style
controllers use left stick to move, right stick to look in first-person, triggers
to drive and Start/Options for menus. Full bindings appear in the menu.

## Resolution and color (v0.9)

Settings now offers Automatic, Native and 4K resolution, plus automatic
Display P3 output with an sRGB fallback. For iPhone, try Balanced + Native +
Automatic color; lower resolution to Automatic for smoother play and less heat.
4K is optional. Wide-gamut color requires a supported screen and browser.

## Phone controls (v0.9.1)

Use the left thumbstick to walk; push to the edge to jog. Drag the right side
to look in first-person. While driving, the stick steers and separate pedals
control gas, brake/reverse and stopping. Portrait and landscape are supported.

## Compact controls (v0.9.2)

The hamburger icon opens the menu. The fullscreen request button is removed.
Zoom hides in first-person, and the right-side view/street actions share one
compact panel. Phones use drag-to-look without duplicate turn arrows.

## Shared map and sound (v0.9.3)

The map sits under the transparent phone thumbstick. Tap the speaker beside
the menu to enable sound; later taps also recover suspended browser audio.

## Two-way conversations (v0.10)

Engage starts auditor/civilian banter, even before recording. A collapsible
conversation panel keeps speakers and replies readable on phones. 148 new
original lines use contextual pools without immediate repetition.
[Research notes and transcript sources](source/DIALOGUE-SOURCES.txt).

## Compact map (v0.10.1)

The phone map is now hidden behind a small Map button, separate from the
transparent thumbstick. It closes when you resume movement. Map contrast,
landmark labels and facing markers improve readability in its compact card.
Escalation dialogue now swears more strongly when profanity is enabled.

## v0.11.0 cash, channel credit and variable earnings

Shops and equipment repairs require cash; unavoidable bills can still overdraw an account. Uploads now generate saved, per-take audience variation, likes and variable ad rates. Reach caps at 90 seconds. The editor shows the simulated forecast, including likes and net income, before uploading. Ordinary footage can fund equipment; crew wages, repairs, retaliation and interest still threaten margins.

Each loan requires three new uploads and 150 new likes since the previous loan. The outstanding principal limit grows with uploads and likes, up to $300; each advance is at most $100. Fees and daily interest rise with repeat borrowing. Demonetized channels cannot borrow. Principal never counts as earnings. Existing saves retain balances, gear and debt; historical likes are not fabricated.

Platform review now allows a longer earning runway: 20 uploads, eight serious edited-content strikes, or reputation 90 after at least 12 uploads. A destroyed camera with no repair funds or eligible loan still unlocks the recovery career.

Validation: unit suite, syntax checks, standalone build and `node tests/economy-browser.cjs` (mobile Chromium Canvas compatibility mode). The browser check exercises blocked purchases/loans, publishing, likes, an affordable upgrade and the repeat-loan lock. No physical iPhone testing was performed.

## v0.12.0 browser character voices

Settings → Enable voices or Preview character voices turns on device text-to-speech. Auditor, locals and officers receive consistent voice assignments, saved locally on each device; available English voices are assigned separately before being reused. Modest pitch/rate differences help when the device has few voices. Volume and enable preference travel with gameplay saves. The main speaker button mutes all game audio, including speech.

Dialogue is filtered using the profanity preference before speaking. Speech has a bounded queue, pauses the next ordinary banter turn until the voice finishes, and cancels in menus, on loss of focus, or when hidden. Captions remain available. Unsupported browsers remain caption-only. Voice lists can load asynchronously. Device voices may use a network service; offline availability and voice quality vary. No application speech API, keys, account or paid backend is added. Synthesized speech is not included in downloaded gameplay recordings.

Validation: complete unit suite, syntax checks, standalone build and mobile-sized Chromium integration with an injected speech engine. Tests cover activation, voice assignments, sequencing, mute, saved preferences, errors, unsupported devices and old saves. Actual audio output on iPhone Safari has not been tested.
