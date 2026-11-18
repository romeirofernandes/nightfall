---
name: Nightfall
description: "A softly illustrated alpine winter for free desktop snow."
colors:
  background: "#eef4f8"
  sky: "#b8dafe"
  panel: "#f7f9f7"
  ink: "#0a2634"
  muted: "#334e5b"
  line: "#b7c8cc"
  field: "#e9f0ee"
  field-border: "#a6b9bd"
  field-hover: "#d9e7e4"
  accent: "#226653"
  button: "#0c443b"
  button-hover: "#175a4e"
  on-button: "#fffef6"
  morning-sky: "#c5def7"
  evening-sky: "#f4dfca"
  evening-background: "#f7eee3"
  evening-panel: "#fff8ef"
  evening-ink: "#352f2b"
  evening-muted: "#55473d"
  evening-accent: "#8b422c"
  night-sky: "#081a2d"
  night-background: "#081827"
  night-panel: "#122b3e"
  night-ink: "#f6f4e9"
  night-muted: "#c5d6e2"
  night-line: "#365165"
  night-field: "#1e3b4e"
  night-field-border: "#587184"
  night-field-hover: "#2b4b60"
  night-accent: "#f2cf8e"
  night-button: "#f0e8cf"
  night-button-hover: "#fff6df"
  night-on-button: "#183a35"
  time-panel: "#f8f7efd9"
  time-ink: "#153e3d"
  time-selected: "#133e37"
  time-on-selected: "#fffdf0"
  time-status: "#153e37"
  secondary: "#ffffff30"
  secondary-border: "#526b7880"
  secondary-hover: "#ffffff60"
  night-secondary: "#081c3033"
  night-secondary-border: "#bfd7e48c"
  night-secondary-hover: "#48677c66"
typography:
  display:
    fontFamily: "Prata, Georgia, serif"
    fontSize: "clamp(64px, 6.65vw, 110px)"
    fontWeight: 400
    lineHeight: 1.22
    letterSpacing: "-.04em"
  headline:
    fontFamily: "Prata, Georgia, serif"
    fontSize: "clamp(24px, 5vw, 32px)"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "-.03em"
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  intro:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "clamp(18px, 1.8vw, 26px)"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 550
    lineHeight: 1.55
  command:
    fontFamily: "ui-monospace, monospace"
    fontSize: "13px"
    lineHeight: 1.7
rounded:
  control: "9px"
  time-switch: "14px"
  dialog: "16px"
  status: "6px"
  round: "50%"
spacing:
  icon-gap: "10px"
  action-gap: "14px"
  section-gap: "24px"
components:
  button-primary:
    backgroundColor: "{colors.button}"
    textColor: "{colors.on-button}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 22px"
  button-primary-hover:
    backgroundColor: "{colors.button-hover}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 22px"
  button-secondary-hover:
    backgroundColor: "{colors.secondary-hover}"
  button-utility:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 22px"
  button-utility-hover:
    backgroundColor: "{colors.field-hover}"
  button-icon:
    rounded: "{rounded.round}"
    height: "44px"
    padding: "0"
  time-switch:
    backgroundColor: "{colors.time-panel}"
    textColor: "{colors.time-ink}"
    rounded: "{rounded.time-switch}"
    padding: "5px"
  time-selected:
    backgroundColor: "{colors.time-selected}"
    textColor: "{colors.time-on-selected}"
    rounded: "{rounded.control}"
    padding: "9px 18px"
  dialog:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    padding: "clamp(18px, 4vw, 30px)"
    width: "min(640px, calc(100% - 32px))"
  terminal:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
---
# Design System: Nightfall

## Overview

**Creative North Star: "The Same Winter, Lit Four Ways"**

A detailed, softly illustrated alpine winter is the visual world: snowy mountains, pines, a snowman and small warm Christmas lights. Expressive Prata headlines sit in quiet sky, while Figtree keeps the product explanation, installation controls and time choices readable.

The same landscape is lit for morning, afternoon, evening and night. Local time provides the starting atmosphere; visitors can choose a phase or return to Auto. The interface is spacious and restrained so the winter scene carries the character.

**Key Characteristics:**
- Detailed alpine scenery with small warm light accents.
- Editorial serif display paired with readable humanist sans controls.
- Four clock-based lighting phases with an explicit manual override.
- Semantic controls, visible keyboard focus and reduced-motion behavior.

## Colors

Cool snow, sky blue and pine green anchor daylight; peach and warm ivory soften evening; deep navy and cool snow define night. Warm lights belong to the illustration rather than a separate UI accent scale. The frontmatter records the implemented CSS colors; phase-prefixed tokens override the corresponding base role. Sidecar tonal ramps are synthesized preview metadata, not implemented palette tokens.

### Primary

- **Pine action:** `button`, `button-hover` and `on-button` give the primary installation action a solid, readable surface.
- **Pine focus:** `accent` marks keyboard focus and footer-link hover; evening uses its warm brown accent and night its amber accent.
- **Night action:** `night-button`, `night-button-hover` and `night-on-button` reverse the primary action to pale ivory against the dark scene.

### Neutral

- **Snow surfaces:** `background`, `panel` and `field` separate page, dialog and utility controls; `line` and `field-border` define their boundaries.
- **Alpine ink:** `ink` and `muted` establish strong and supporting text. Evening and night override them together with their surfaces.
- **Winter sky:** `sky`, `morning-sky`, `evening-sky` and `night-sky` coordinate the raster lighting plates and browser theme color.
- **Glazed controls:** the secondary colors carry the translucent action and its border/hover states; night has a separate set. The time panel keeps its own pale surface, dark green text and filled selected state across all phases.

### Named Rules

**The Same Winter Rule.** Keep the scene and interface coordinated across lighting phases; morning and afternoon share the day plate, while evening and night use their corresponding plates.

## Typography

**Display Font:** Prata, with Georgia and serif fallbacks.
**Body Font:** Figtree, with system-ui and sans-serif fallbacks.
**Command Font:** ui-monospace, with monospace fallback.

**Character:** Prata supplies the expressive editorial voice; Figtree keeps the surrounding language clear and compact. Body text is sentence case, including visible phase labels.

### Hierarchy

- **Display:** the hero headline; desktop values are normative in the frontmatter. At (900px) and below it uses (`clamp(58px, 8vw, 76px)`), with the second span on a separate line. At (600px) and below it uses (`clamp(39px, 11.5vw, 64px)`) and line height (1.27).
- **Headline:** installation-dialog title.
- **Body:** default Figtree reading text. Dialog supporting text and navigation use (14px); footer uses (13px).
- **Intro:** hero product description; becomes (17px) with a (25ch) maximum at (600px) and (16px) at (360px).
- **Label:** installation actions; mobile actions use (14px). Time-choice labels use (13px), becoming (10px) on mobile. Time status uses (12px), becoming (11px) on mobile.
- **Command:** selectable, wrapping installation commands, kept separate from prose typography.

### Named Rules

**The Quiet Sky Rule.** Keep the expressive headline and installation controls in readable sky above the detailed scenery.

## Layout

The shared shell is centered at (`min(1376px, calc(100% - clamp(40px, 9vw, 144px)))`). Header, centered hero copy, bottom time controls and footer share these edges. The hero has minimum height (`max(760px, 100svh)`), rising to (`max(800px, 100svh)`) at (600px). Header minimum height changes from (96px) to (76px).

The primary composition is a centered headline over full-bleed scenery. Installation actions wrap with the shared action gap; at (360px) they stack with (210px) width. Time controls sit (32px) above the hero bottom on desktop and (22px) on mobile. At (600px) the selector becomes five equal columns, capped at (390px), with vertically arranged icon and label.

Desktop landscape crops at `center 58%`, shifts to `center 52%` above aspect ratio (19/10), and to `60% center` at (900px). At (600px), the image occupies the bottom (71%) and crops at `100% bottom`, with a top fade that joins the sky. This retains the right-side snowman. Header GitHub text hides below (420px); its link remains a (44px) control.

## Elevation & Depth

The panorama supplies atmospheric depth. A restrained translucent time-selector surface and native installation dialog provide functional elevation; buttons otherwise rely on fill, border and a small state movement.

### Shadow Vocabulary

- **Installation dialog:** (`0 24px 80px #001a2b50`), over a dark translucent backdrop blurred by (7px).
- **Time selector:** (`0 6px 24px #0a233d29`), with (14px) backdrop blur.
- **Celestial light:** the decorative sun uses (`0 0 48px 16px #ffe6a975`); the moon uses (`0 0 38px 10px #d9eeff25`). These are scene lighting, not general surface shadows.

### Named Rules

**The Material Depth Rule.** Let landscape layers carry the scene; reserve interface shadows and blur for the installation dialog and time selector.

The hero copy enters from (18px) below with a (1s) `power3.out` animation and (.1s) stagger. Landscape plates crossfade over (1200ms ease). Control-state transitions take (180ms). Reduced motion suppresses animation and transitions; the entrance runs only under `prefers-reduced-motion: no-preference`.

## Shapes

Controls and the terminal use the shared gently rounded control shape; the time-selector enclosure and dialog use progressively softer corners. Icon buttons and celestial bodies are circular. One-pixel borders distinguish fields, terminal bars and translucent controls. Icons are inline SVG, not font glyphs.

## Components

### Buttons

Solid pine or night-ivory primary actions pair with a translucent secondary action. Installation choices have (196px) minimum width and (50px) minimum height on desktop, with (48px) minimum height on mobile. Utility buttons use the field surface and border. All share the control radius and label role. Hover lifts by (1px); active presses down by (1px) with scale (.985). Keyboard focus uses a (2px) accent outline offset (5px). Icon controls use a (44px) circular target and a translucent hover fill.

### Navigation

A Prata wordmark and snowflake sit opposite the GitHub link and icon controls. Links have (44px) minimum height and underline on hover. The footer uses explicit underlined links, with accent color on hover. A focus-revealed skip link leads to main content.

### Time Selector

A fieldset names the time-of-day choices. Each button carries an icon and text label, with `aria-pressed` exposing selection. The selected button uses the fixed dark-green/pale-ivory pair; its focus outline is dark green offset (2px). A solid status badge remains readable over scenery, with a separate screen-reader scene status.

Auto follows the visitor's local clock: morning (06:00–12:00), afternoon (12:00–16:00), evening (16:00–19:00), and night otherwise. Clock state refreshes every (30s) and on page visibility or restoration. Selection persists in `nightfall-time-mode` and synchronizes across tabs. The sun/moon is a decorative clock-based layer; no location permission or astronomical accuracy is implied.

### Installation Dialog and Terminal

The native dialog adapts to (`min(640px, calc(100% - 32px))`) and a maximum viewport inset of (32px). Its padding is (`clamp(18px, 4vw, 30px)`). A serif title, (44px) close control, bordered terminal and readable supporting links establish hierarchy. The terminal wraps long commands, keeps them keyboard focusable and offers a copy action with visible success/error status. macOS and Arch + Hyprland retain their actual installation commands.

## Do's and Don'ts

### Do:

- **Do** preserve the detailed alpine landscape, snowman and warm Christmas lights.
- **Do** use Prata for expressive headings and Figtree for navigation and controls.
- **Do** preserve readable semantic installation actions and keyboard-operable named time controls.
- **Do** keep local-time Auto and persistent manual phase selection available.
- **Do** respect reduced motion and retain the snowman through the right-aligned mobile crop.

### Don't:

- **Don't** replace the approved detailed illustration with flat cartoon scenery.
- **Don't** let scenery or snow obscure installation controls.
- **Don't** describe the clock-based celestial position as location-based astronomy.
