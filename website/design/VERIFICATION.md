# React design review

This supersedes the previous static collage review.

## What was delivered

Three separate complete dark pages, a chooser, and a Mac first-launch guide.
React 19, Vite 7, Tailwind 4, shared components and a single outer-width system.
Production output is committed for existing static Vercel deployments; preferred
Vercel Root Directory is `website`, build `npm run build`, output `dist`.

## Validation

- Production Vite build passed after the final changes.
- CI at 872f26b passed: website build, Linux Rust tests/build, macOS Rust tests/build.
- Main-repository Homebrew install/uninstall passed on Apple Silicon and Intel:
  https://github.com/romeirofernandes/nightfall/actions/runs/44073266715
- Skill screenshot scripts rendered Alpine and After Hours at 1440px,
  Observatory at 1440px and 390px, and final Alpine at 390px. Screens were
  visually inspected. The chooser was opened in the collaborative preview.
- Skill consistency runs covered Alpine at 1440/768/390/320, After Hours at
  1440/768/390 plus the automatic 320px pass, and Observatory at 1440/390/320.
  Browser page-error lists were empty. Automated interaction probes confirmed
  weather selection, pause, installation tab changes, keyboard movement,
  closing/restoring the window, and no horizontal overflow.
- Found and fixed: Alpine phone button/window collision, mobile pointer
  positioning, phone touch-control sizing, selected-tab focus visibility,
  small-label contrast, a joined word in the Observatory heading, and
  crowded decorative note content beside the live readout at 320px.
- Fonts and kit licenses are retained. Reduced-motion and hidden-tab behavior
  are implemented; the quick checker did not exercise every motion condition.

## Visual gate

GATE: OPEN 26 (Observatory, before final control/accessibility polish).
The complete gate output is in GATE-OBSERVATORY.txt. No full gate pass is
claimed. Most remaining findings concern required `.wrap` markup, exactly
one/two-screen section heights, heading-size hierarchy, terminal sections
without a separate picture, and decorative contour bounds. These intentional
layouts prioritize the user's request for three different visual directions.
Earlier waiver entries were ignored by the gate and none were applied.
The gate has not been rerun after the last fixes. A later 320px pass found
  a note/readout collision; the decorative note was simplified and a fresh
  screenshot checked. Separate responsive checks
and visual inspection are not represented as a gate pass.

## Distribution and limitations

The public source repository now hosts the root cask, release assets, and Linux
installer. The old tap is archived as a compatibility redirect. Current casks
and installer use this repository's public releases. Both cask copies match.
New commits use Romeiro Fernandes's GitHub-linked noreply identity.

The supplied Mac screenshot is Gatekeeper rejecting an unnotarized application,
not evidence of a runtime crash. The guide uses Apple's supported app-specific
Open Anyway flow. Optional Developer ID/notarization support is implemented in
the release workflow, but that credential-dependent path has not been run.
Release 0.2.1 is still ad-hoc signed. No permanent warning-free Mac launch is
claimed. Fullscreen and scaled multi-monitor runtime coverage remains limited.
