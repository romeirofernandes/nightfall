# Design review

GATE: OPEN 7 (rounds used up)

The requested Leonxlnx design-taste-frontend skill was installed and applied.
The three-round gate completed, and its instruction to stop after the final
round was followed. The page is functional; the visual gate did not pass.
The remaining findings and the five reasoned waivers are recorded below.

## Direction

Software; collage hero; blue-black-cornflower palette (the first two dealt
palettes conflicted with the dark-only brief); Gabarito and Figtree; rounded
controls; one iris-opens moment; live product snowfall instead of a decorative
shader. Direct consumer-software voice, truthful product facts. No assumed
prices, customer counts, quotes, awards, or testimonials. No canonical Vercel
domain was invented.

One original generated alpine-night wallpaper is used in the hero. No stock
photograph is presented as the app. Desktop UI on the page is an interactive
browser demonstration, not an operating-system recording. No photographs or
other client assets are missing.

## Browser checks

The skill's own foreground headless-Chrome scripts were used. The initial full
check covered 1440, 1024, 820, 768, and 390 pixels; subsequent gate checks covered
1440, 390, and a 320-pixel overflow/tap-size pass. The missing phone hero was
traced to a zero-width flex child, fixed, and confirmed in a fresh screenshot.
Final desktop and phone screenshots were inspected. Copy lint had no failures
or warnings. The moment checker recognized the intended iris-opens transition.

## Installer checks

Homebrew cask installation, architecture selection, app signature verification,
version inspection, and uninstall passed on macos-15 (Apple Silicon) and
macos-15-intel:

https://github.com/romeirofernandes/homebrew-nightfall/actions/runs/44067489804

The public Linux archive was downloaded and its SHA-256 matched the published
checksum. Real Hyprland/macOS overlay runtime behavior still needs wider
desktop testing. App bundles are ad-hoc signed and are not Apple-notarized.

## Final gate output

```text
gate: checking website/dist/index.html (software); this takes a few minutes on a CPU Chrome
gate: rounds used up; 7 FAIL open
  FAIL off-grid         div.hero-text.grid > div.hero__text.span-5 > div.release-line > span:nth-of-type(2) "Night  [1440, 390]
       left edge at 94px, 14px off the page margin at 80px (21 elements, like h1#hero-h)
       fix: move it onto the page margin, or the column edge its section uses
  FAIL section-gaps     section#weather / section#native  [1440]
       89px between these sections, -65% against the median 254px
       fix: use one gap between sections (all within 25% of each other)
  FAIL photo-print      div.wrap > div.hero-text.grid > div.hero__art.span-6 > snow-desktop.ly-piece.ly-piece--mai  [1440]
       the photograph alpine-night.webp is drawn over by a print (a halftone, dither or engraving canvas) in the hero: its sky and light parts drop out to the page's ground
       fix: show the photograph plain (in colour, or greyed into the palette with CSS); a print belongs on a software page's secondary picture at most
  FAIL container-edges  div.hero-text.grid > div.hero__text.span-5 > div.release-line > span:nth-of-type(2) "Night  [1440]
       1 text block starts on a left line at x 94, 14px from the container's left: text starts on the container's left, or on one split line (x 623, 732, 841) (SR-6)
       fix: start the text on the container's left, or on the one split line every split shares
  FAIL split-pair       main#top > section.hero.hero--collage > div.wrap > div.hero-text.grid "Nightfall 0.2.1A de  [1440]
       the two columns of the split start 28px apart at the top: a split's columns are top-aligned, 8px either way (SR-8)
       fix: top-align both columns of the split (align-items: start)
  FAIL split-pair       section#install > div.wrap > div.install-layout "macOSArch + HyprlandTerminal Copy ⧉$ bre"  [1440]
       the split's left column starts with a picture or a box, not text: text left, the visual right, on every split (SR-8)
       fix: put the text in the left column and the visual in the right, on every split
  FAIL photo-print      div.wrap > div.hero-text.grid > div.hero__art.span-6 > snow-desktop.ly-piece.ly-piece--mai  [390]
       the photograph alpine-night-mobile.webp is drawn over by a print (a halftone, dither or engraving canvas) in the hero: its sky and light parts drop out to the page's ground
       fix: show the photograph plain (in colour, or greyed into the palette with CSS); a print belongs on a software page's secondary picture at most
  WAIVED no-visual section#install "Your next snow day starts here.": This installation section contains its functional code console and the actual app icon. It is not a feature section requiring a decorative photograph.
  WAIVED text-only section#questions "Questions before the snow.": This is the open FAQ; the skill expressly permits picture-free FAQ sections. The preceding sections demonstrate the product visually.
  WAIVED edge-left #weather p "Put the kettle on.Find the fluff": This paragraph belongs to the draggable desktop demo window, not page copy. Its left edge must follow the window, which has its own padding.
  WAIVED edge-left #install p "For Arch x64 in a running Hyprla": This paragraph is instructional text inside the terminal console. Its inset follows that console's padding, while the actual section and columns share the page grid.
  WAIVED hero-lines section.hero h1: The fixed final title fits in two lines. This stress check substitutes a 47-character title; the layout reference permits waiving it when the final title fits.
  19 WARN (not blocking), first: flush section#native > div.mo-io__stage > div.; copy-headings div.wrap > div.faq-grid > article:nth-of; section-gaps main#top > section.hero.hero--collage / ; section-gaps section#install / section#questions; section-gaps section#questions / footer.closing.foote
Stop fixing: put these open FAILs and the waivers in your report, then finish.
GATE: OPEN 7 (rounds used up)

```

## Waivers

```json
[
 {"check":"no-visual","target":"section#install","reason":"This installation section contains its functional code console and the actual app icon. It is not a feature section requiring a decorative photograph."},
 {"check":"text-only","target":"section#questions","reason":"This is the open FAQ; the skill expressly permits picture-free FAQ sections. The preceding sections demonstrate the product visually."},
 {"check":"hero-lines","target":"section.hero h1","reason":"The fixed final title fits in two lines. This stress check substitutes a 47-character title; the layout reference permits waiving it when the final title fits."},
 {"check":"edge-left","target":"#weather p","reason":"This paragraph belongs to the draggable desktop demo window, not page copy. Its left edge must follow the window, which has its own padding."},
 {"check":"edge-left","target":"#install p","reason":"This paragraph is instructional text inside the terminal console. Its inset follows that console's padding, while the actual section and columns share the page grid."}
]

```

## Performance check

The performance script reported 3 FAIL and 4 WARN: below-fold icons were not
lazy-loaded at both widths, and it observed 0.408 layout shift during the
desktop walk (0.000 at initial load). These are not a passing performance
result. Transfer was about 403 KiB desktop and 228 KiB phone, with no broken
requests, no long tasks, no blocking time, and zero WebGL contexts.

```text

perf website/dist/index.html @ 1440px
  PASS  host CPU load (before/after)               1/1 %          
  PASS  total transfer                             403.2 KiB      html 4.2K  css 59.7K  js 53.1K  font 53.5K  img 227.9K  other 4.7K
  PASS  requests                                   22             21 by load
  PASS  images bytes                               227.9 KiB      2 files
  PASS  largest image                              227.4 KiB      assets/alpine-night.webp
  PASS  JS parsed                                  142.5 KiB      9 files, 53.1K gz
  PASS  CSS                                        59.7 KiB       6 files
  PASS  font families                              2              Gabarito, Figtree
  PASS  font files                                 2              53.5K
  PASS  font bytes                                 53.5 KiB       
  WARN  images without width+height                2              icon.svg, icon.svg
  FAIL  below-fold images not lazy                 8              icon.svg, icon.svg, icon.svg
  WARN  oversized images (natural > 2.2x shown)    1              alpine-night.webp 1536px for 626
  PASS  WebGL live at load                         0              
  PASS  WebGL live at bottom                       0              
  PASS  WebGL peak live                            0              0 contexts made in all
  PASS  long tasks                                 0              runs 3, 0..0, max 0ms
  PASS  blocking time                              0 ms           runs 3, 0..0 ms; at load 0ms
  PASS  FCP (CPU, relative)                        192 ms         runs 3, 172..208
  PASS  LCP (CPU, relative)                        192 ms         runs 3, 172..248, img.wallpaper
  FAIL  layout shift                               0.408          runs 3, 0.408..0.408; at load 0.000
  PASS  modules loaded, never mounted              0              
  PASS  broken requests                            0              
  PASS  page height                                6 screens      DOM 324 nodes

perf website/dist/index.html @ 390px
  PASS  host CPU load (before/after)               1/1 %          
  PASS  total transfer                             228.3 KiB      html 4.2K  css 59.7K  js 53.1K  font 53.5K  img 53.6K  other 4.2K
  PASS  requests                                   21             20 by load
  PASS  images bytes                               53.6 KiB       2 files
  PASS  largest image                              53 KiB         assets/alpine-night-mobile.webp
  PASS  JS parsed                                  142.5 KiB      9 files, 53.1K gz
  PASS  CSS                                        59.7 KiB       6 files
  PASS  font families                              2              Gabarito, Figtree
  PASS  font files                                 2              53.5K
  PASS  font bytes                                 53.5 KiB       
  WARN  images without width+height                2              icon.svg, icon.svg
  FAIL  below-fold images not lazy                 9              icon.svg, icon.svg, icon.svg
  WARN  oversized images (natural > 2.2x shown)    1              alpine-night-mobile.webp 780px for 340
  PASS  WebGL live at load                         0              
  PASS  WebGL live at bottom                       0              
  PASS  WebGL peak live                            0              0 contexts made in all
  PASS  long tasks                                 0              runs 3, 0..0, max 0ms
  PASS  blocking time                              0 ms           runs 3, 0..0 ms; at load 0ms
  PASS  FCP (CPU, relative)                        120 ms         runs 3, 96..132
  PASS  LCP (CPU, relative)                        120 ms         runs 3, 96..132, img.wallpaper
  PASS  layout shift                               0.000          runs 3, 0.000..0.000; at load 0.000
  PASS  modules loaded, never mounted              0              
  PASS  broken requests                            0              
  PASS  page height                                7.1 screens    DOM 321 nodes

SUMMARY website/dist/index.html: 3 FAIL, 4 WARN  -> FAIL

```
