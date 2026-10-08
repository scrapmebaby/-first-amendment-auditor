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

## v0.13.0 conversation library

The game now contains 315 complete four-turn exchanges (1,260 lines) and 1,000 situational lines: 2,260 distinct authored lines in total, up from 364. These are original fixed dialogue, not copied transcripts, runtime AI output or combinatorial estimates. New material covers street, civic, library, café, rain, recognition, escalation, four civilian temperaments and remembered meetings. Replies stay together to preserve the exchange; context determines the pool. Existing shuffle bags exhaust their pool before repeating and avoid immediate repeats across bag boundaries.

Individual civilians now remember previous Engage conversations in your local save. Returning to the same person can select a follow-up exchange; first meetings never select that pool. Serious anger takes priority over personality and memory. While ordinary spoken turns play, the civilian waits rather than walking off mid-sentence; escape, police and driving still interrupt. Situational pools cover pleas, anger, distress, departure, music, thrown objects, contact, equipment damage, police, witnesses, crew, legal bluster and the service-career ending. Profanity filtering applies before captions and device speech.

No speech service or account was added. The standalone download increased by approximately 77 KB before transfer compression. Automated checks cover exact counts, unique text/exchanges, pool exhaustion, context and escalation routing, caption length, profanity filtering, and old-save migration. Mobile browser checks cover four-turn exchanges, captured speakers, portrait/landscape layout, persisted encounter memory and voice integration with a mock speech engine. Actual iPhone speech quality remains device-dependent and has not been listening-tested here.

## v0.14.0 officer encounters, awards and character choice

New careers start with Male/Female selection. The female design has its own bun, face proportions and silhouette; both retain the satirical wardrobe, masks, merch and flies, including in mirrors and the service career. Settings can change the selection later. Existing saves retain the original male appearance without a forced restart.

Officer Vale stands outside City Hall. Near an officer, use Film & question officer or Engage when the officer is the closest subject. Ask for supervisor appears nearby; keyboard G and the controller-accessible menu also expose the request. Four exchanges per officer per day keep a single argument bounded. Officers may respond professionally, threaten the auditor, or escalate to excessive force after repeated engagement. Punch/kick poses, health loss and $65 hospital visits are represented. A requested supervisor arrives to review recorded misconduct; a supported complaint can lead to a disciplinary investigation, not an automatic firing or settlement. Civilians and responding patrols retain their existing encounters.

Video ad rates increase by 50% at unchanged reach. Recorded officer threats have a 45% settlement chance for $300–$899; recorded excessive force has a 70% chance for $600–$1,799. Weaker contact claims have a 20% chance for $150–$399. Claim filing costs $12 and lawyers take 30% of awards. Each filed case adds a fictional $75 city legal cost; awards add to that taxpayer total. Result screens show gross award, legal fee, filing fee, net gain and taxpayer cost. The ledger tracks awards, fees, taxpayer expense and hospital bills. New totals start with this version for old saves. Purchases still require cash and existing loan caps remain.

Validation: full unit suite, syntax checks, standalone build; mobile browser economy/banter/voice checks; and an end-to-end officer flow in Canvas compatibility mode and WebGL rendering, including female selection and save, recorded threat, supervisor review, injury, hospital, city settlement and taxpayer accounting. Physical iPhone audio/performance has not been measured. Police, liability and monetary outcomes remain deliberately simplified fiction.

## v0.15.0 popularity, home cleanup and sustainable accounting

Doggie bags cost $6 for five. One bag clears one mess while on foot at home; use the contextual Pick up mess button or Home, loans & career. Lawn, porch and trash incidents remain until cleaned. Each mess gets two game hours of grace. HOA inspections run every three game hours while the simulation is active: fines start at $25, rise with repeated neglect and pile count, and cap at $100 per inspection. Menus normally pause time; there are no offline fines. Cleanup labor is free, clears the visible mess and reduces stress. Packs remain available through the home menu after leaving auditing.

Actual views and likes now drive discovery and accumulated exposure. Reputation alone no longer automatically reveals the address. Popular videos increase the chance of the town connecting the channel to the home, subsequent property incidents, and friends/family fallout. Offscreen friends may cancel shared travel; unwanted attention can create family privacy costs. These events add relationship strain as well as clearly labeled expenses. Home cameras provide evidence, masks can defeat identification, and floodlights reduce the cost of occasional property damage. A pile alone no longer generates an automatic repair bill. Uncleared incidents are never silently discarded when the history fills.

New loans: up to $100 each, $250 outstanding, four per career, three game days between advances, plus three new uploads and 150 new likes. Daily interest starts at 8% and rises by two percentage points with each new advance; fees start at $8 and rise by $4. Existing principal is retained, even if above the new limit, and cannot grow beyond the new ceiling through new borrowing. Old rates stay until another advance reprices the balance. Principal borrowing/repayment remains outside profit.

The ledger now groups actual income and expenses by source. Old-save revenue/expense totals remain in explicitly labeled historical buckets rather than inventing a past breakdown. The cash-minus-debt figure, revenue, expenses, borrowing and repayment reconcile. Hospital, HOA, privacy fallout, gear, production, loan fees and interest remain separate categories.

Payout mix: 45% quiet, 35% steady, 15% breakout, 5% viral. Audience outcomes stay attached to takes; changing the title or reopening the editor does not reroll them. Ad rates vary separately with the saved take, and reach still caps at 90 seconds. These are game distributions, not claims about real platforms.

Balance audit (`node tools/economy-audit.mjs`): 1,000 synthetic 45-second takes, six engagement points, starter equipment, full condition, no music claim, no context cut, and no prior exposure:

| Tier | Share | Mean gross ads | Mean net after upload cost | Mean home-discovery chance |
| --- | ---: | ---: | ---: | ---: |
| Quiet | 45% | $14.86 | $10.36 | 1.8% |
| Steady | 35% | $35.74 | $31.24 | 2.9% |
| Breakout | 15% | $131.20 | $126.70 | 8.0% |
| Viral | 5% | $504.02 | $499.52 | 27.8% |

These nets exclude travel, injuries, property costs, HOA fines and debt service. Short, low-engagement or claimed takes can lose money; expensive crews can erase otherwise positive margins. Context cuts increase reach and discovery risk, while serious edited-content strikes shorten the monetized career. High profits are possible; the game does not silently subtract them to force failure.

Verification: complete unit suite, syntax/build, a deterministic payout audit, and mobile browser flows for HOA fines, bag purchasing, contextual cleanup, saved progress, category totals, income-funded upgrades and loan locks. No physical iPhone performance test was performed.
