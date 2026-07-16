# Conceptly iridescent voice blob — design QA

final result: blocked

## Comparison target

- Source visual truth: the soft cyan, violet, and magenta glass blob attached by the user in the current conversation.
- Procedural implementation: `C:\Users\adars\Documents\GitHub\Conceptly\src\components\voice-core-3d.tsx`.
- Implementation routes: lesson questionnaire and chapter class-session screens.
- Intended viewports: 1440px desktop and 390×844 mobile.
- Intended states: idle, narration, correct, incorrect, and coach guidance.

## Findings

- [P1] Rendered comparison is unavailable
  - Location: shared bottom-left voice presence.
  - Evidence: neither the in-app preview browser nor connected Chrome was available; Chrome is installed but not running.
  - Impact: the final silhouette, translucency, crop, and overlap with lesson controls cannot be judged from a browser screenshot.
  - Fix: capture the running implementation and compare it with the supplied reference in one visual input.

## Required fidelity surfaces

- Fonts and typography: the existing small Geist Mono narration label is retained; rendered contrast remains pending.
- Spacing and layout rhythm: the fixed bottom-left placement and responsive sizes are unchanged; visible crop remains pending.
- Colors and visual tokens: the neutral shader uses deep blue, electric cyan, violet-magenta, and cool highlights. Semantic states replace those shader uniforms with green, coral, or amber palettes.
- Image quality and asset fidelity: no image, texture, SVG, or model is used. Two procedural sphere meshes create the outer membrane and inner folds. Custom vertex and fragment shaders provide deformation, translucency, Fresnel edges, and moving light ribbons.
- Copy and content: narration labels remain original Conceptly copy.

## Full-view comparison evidence

Blocked: no browser-rendered implementation screenshot is available.

## Focused-region comparison evidence

Blocked: the reference is available in conversation, but a rendered WebGL capture is unavailable.

## Comparison history

- Earlier version: hard spherical shell with three separate glass torus rings.
- Fix made: removed the shell, rings, halo, and lights; replaced them with two deforming volumes and an iridescent shader matching the softer reference.
- Post-fix evidence: TypeScript, ESLint, unit tests, and the production shader bundle compile successfully. Visual comparison remains blocked by browser availability.

## Verification completed

- [x] TypeScript strict check.
- [x] ESLint.
- [x] 12 unit tests.
- [x] Next.js production build.
- [x] Confirmed no image or texture reference exists in the voice implementation.
- [x] Reduced-motion mode stops continuous WebGL animation.
- [ ] Desktop browser capture.
- [ ] Mobile browser capture.
- [ ] Idle/narrating/correct/wrong/coach state comparison.
- [ ] Browser console and WebGL shader compilation check.
