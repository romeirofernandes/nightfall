# Stage 3: landscape depth and scroll choreography

Approved winter world and plain headline remain. The scroll and depth foundation is the scope of this stage. The user reviewed the snowman-building direction and chose to drop it.

Focal motion: moving through the foreground pine boughs into the alpine valley. One sticky scenic passage, no section-by-section reveal template. Near boughs separate faster than the distant scene; the headline stays stationary and fades as the next passage scrolls naturally into place. No text parallax.

Continuity: keep the same daytime/nighttime plates, snow, working installation actions and existing controls. One new scene passage uses genuine product copy. Bottom footer remains reachable. Lenis supports wheel smoothing; native touch scrolling and keyboard scrolling remain, without snap or wheel interception. ScrollTrigger owns only transform/opacity of bounded scenery layers. Pause and reduced-motion disable spatial scroll effects; reduced motion uses a normal flowing hero and passage. Modal blocks the smoothing loop until closed.

Keep the user’s staged review cadence and group related source and build changes into one commit per milestone.

## Theme correction

User requires separate foreground artwork for each time phase, matching the existing themed landscape. Preserve branch geometry across real morning/day/evening/night lighting plates. Remove CSS colour filters. Crossfade the matching plate with the same 2.6-second duration as the distant scenery. Do not reuse a daylight foreground with a generic dark tint.

## First milestone verification

Build and nine existing model tests pass. One Impeccable detector pass returned no findings. Desktop full passage and mobile reduced-motion captures inspected. Live in-app browser: scrolled from hero through passage to footer; confirmed headline/buttons/rim hide together; Pause at top retains copy opacity1; resumed snowfall; switched afternoon/night and verified loaded matching foreground files. Morning and evening art inspected as assets; not claiming full browser coverage of all phase/viewport combinations.

Review correction: paused timeline keeps scroll-controlled scrub instead of autoplay. Dedicated foreground images replace colour filters in all four themes and crossfade after decode, with cached-image readiness handled. Only visited foreground phases are loaded. New foreground assets are built-in image_gen outputs; exact prompts are embedded in each PNG.
