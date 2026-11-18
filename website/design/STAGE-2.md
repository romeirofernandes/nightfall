# Stage 2: interactive snow

User approved execution with no added controls or instructional labels. Existing pause and day/night controls remain.

Hero buttons and utility buttons register with data-snow-surface; future mockup/card surfaces can use the same marker. A pointer-transparent canvas measures their current bounds so snow follows entrance animation, hover movement and responsive layout. Actual falling flakes deposit onto crossed banks. Banks grow gradually, smooth out, taper and hold less on narrow surfaces. Excess sheds; hover and touch swipes remove local snow and create bounded falling debris. Swipes preserve native scrolling and suppress accidental button activation after dragging. Pause freezes simulation; reduced motion retains a quiet initial snow cap. Decorative canvas adds no focus stops.

Verification: Vite build passed, six unit tests passed (capacity, brushing, overload/deposit, local-time rules), detector returned no findings. Desktop and mobile captures inspected. Browser interaction paths have not been automated end to end; tests verify the underlying brush and shedding physics.
