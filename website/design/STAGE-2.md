# Stage 2: interactive snow

User approved execution with no added controls or instructional labels. Existing pause and day/night controls remain.

Hero buttons and utility buttons register with data-snow-surface; future mockup/card surfaces can use the same marker. A pointer-transparent canvas measures their current bounds so snow follows entrance animation, hover movement and responsive layout. Actual falling flakes deposit onto crossed banks. Banks grow gradually, smooth out, taper and hold less on narrow surfaces. Excess sheds; hover and touch swipes remove local snow and create bounded falling debris. Swipes preserve native scrolling and suppress accidental button activation after dragging. Pause freezes simulation; reduced motion retains a quiet initial snow cap. Decorative canvas adds no focus stops.

Verification: Vite build passed, six unit tests passed (capacity, brushing, overload/deposit, local-time rules), detector returned no findings. Desktop and mobile captures inspected. Browser interaction paths have not been automated end to end; tests verify the underlying brush and shedding physics.

## Correction after user visual review

The first surface renderer produced uniformly white symmetric caps with an obvious outline, including floating snow over transparent utility buttons. User rejected that visual treatment as artificial. Replaced it with slower, lower, uneven powder buildup, tapered capacity with broad drift variation, shaded translucent contact edges and stable fine granules. Removed the stroked outline and corrected the path's overshoot beyond the surface. Solid button surfaces are inset at rounded corners; transparent header utilities no longer collect floating caps. Brushed debris is smaller and softer. Build and six tests pass. Do not reintroduce flat white strips or accumulation over invisible surfaces.

## Brushing correction

User also rejected the abrupt swipe animation. Replaced repeated 85%-per-pointer-sample clearing with segment-distance sweeps: each crossed bank sample has a quadratic spatial falloff and retains residual powder. Stationary input does not erase snow. Swipe velocity is clamped and damped; fragments move briefly with the stroke before falling, with small fractured clusters, low-opacity dust, gravity and a continuous fade instead of round upward projectiles. Pending strokes are bounded and discarded while paused or a modal is open. Build and seven tests pass, including stationary/missed/localized sweep cases. Tested a drag across the real hero button in the in-app browser: snow cleared locally and the installer did not accidentally open. No extra controls or labels added.

## Retained button fill and holiday headline

Per user request, desktop bank capacity and growth scale by 1.8 while mobile remains at its previous setting. Transparent Linux button fills internally with textured snow while hovered; the fill is retained on pointer leave and continues from that level on later visits. Keyboard focus-visible has equivalent behavior; pointer-created focus does not keep filling after leave. Clipped duplicate visual text keeps lettering dark against the filled area while the accessible label is announced once. Existing actions remain.

Headline retains accessible name "A little winter. All yours." with a decorative Santa hat on w and a snowball o. Verified live in the in-app browser: fill reached42.99815% on leave and remained exactly42.99815% on the subsequent check. Fixed snowball alignment at mobile size. Vite build and existing seven tests pass.
