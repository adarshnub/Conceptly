# Conceptly landing-page scroll film

This asset is a six-second 3D transformation used as a scroll-scrubbed frame sequence. The website maps the visitor's progress through the “Conceptly loop” section to one of 144 WebP frames. It does not autoplay as a normal video.

## Reference-image prompt

Use the supplied Conceptly reference frame as the visual anchor for the video. If you regenerate it, use this image prompt:

```text
Use case: stylized-concept
Asset type: key visual and first-frame reference for a scroll-controlled educational technology landing page
Primary request: Create a premium cinematic 3D render of the Conceptly learning core—one faceted iridescent violet learning sphere surrounded by three thin orbital paths and three small floating lesson cards. The object should communicate that abstract knowledge is becoming tangible and interactive.
Scene/backdrop: deep near-black studio void with a very subtle technical grid and faint atmospheric depth; no floor and no horizon
Subject: a centered polished violet icosahedral core with subtle pearlescent reflections, thin mint, violet, and warm amber orbit lines, and three off-white floating lesson cards with only abstract line marks
Style/medium: high-end real-time 3D product visualization, precise geometry, restrained science-fiction interface aesthetic, tactile educational object, premium but approachable
Composition/framing: landscape 16:9, centered hero object occupying about 54% of frame height, generous safe margin on every edge, all elements fully visible, camera at a slight three-quarter angle, suitable for center-cropping to 4:3
Lighting/mood: soft white key light from upper right, mint rim light from lower left, subtle violet bounce, deep blacks, controlled highlights, no blown-out bloom
Color palette: near-black #0b0d13, violet #776af0, mint #69e8bd, acid-lime #b9ff66 used sparingly, warm amber #f2c963, off-white lesson cards
Materials/textures: faceted satin glass/ceramic core with clearcoat and subtle iridescence; orbit lines are crisp emissive filaments; cards are matte paper-like ceramic
Constraints: exact central composition, clean silhouette, no text, no letters, no logo, no people, no hands, no UI screenshot, no watermark; preserve empty dark space around the object; every object must remain inside the frame
Avoid: generic neon cyberpunk, excessive bloom, magenta fog, liquid blob shapes, photoreal people, illegible interface text, dense particles, lens dirt, camera shake
```

## Image-to-video prompt

Upload the reference frame as the first-frame image, then use this prompt:

```text
Create one continuous six-second cinematic 3D transformation from the supplied first frame. Preserve the exact object identity, materials, palette, lighting direction, camera lens, and dark studio background throughout. The camera makes only a very slow eight-degree clockwise arc and a subtle five-percent push-in. No cuts, no scene changes, no camera shake, and no sudden acceleration.

0.0–1.2 seconds — WATCH:
The faceted violet learning core rotates slowly. Three thin mint, violet, and amber orbit paths move with precise mechanical calm. The three small off-white lesson cards hover in stable positions and gently breathe outward by a few pixels. Everything remains fully inside the frame.

1.2–2.7 seconds — TOUCH:
The orbit paths open smoothly and the three lesson cards travel forward along those paths. The core separates into several clean, layered facets—an elegant exploded view, not a destruction effect. Introduce a few small token blocks that slide into an ordered sequence. Motion must be continuous, smooth, and reversible.

2.7–4.3 seconds — UNDERSTAND:
One token block takes a wrong branch and glows muted coral for a moment. A warm amber guiding pulse travels from the core toward that block, which then returns to the correct path and turns mint. This should read as specific feedback and coaching, with no words or icons.

4.3–6.0 seconds — APPLY:
The blocks organize into two abstract structures: a readable stacked-document silhouette and a precise nested-data silhouette. They orbit once, then fold back into the central violet core. End on a composition extremely close to the first frame so the sequence can scrub in either direction without visual discontinuity.

Continuity requirements:
- Maintain one stable central object and one consistent background.
- No new objects may pop into existence; every element must emerge from the existing core or cards.
- Use smooth eased motion but keep enough visual change between every adjacent frame for scroll scrubbing.
- Keep the subject centered with 18% safe margin on all sides for a 4:3 crop.
- No text, letters, numbers, logos, people, hands, watermarks, subtitles, or UI screenshots.
- No flicker, warping, melting, duplicated cards, changing card count, camera cuts, depth-of-field pumping, or lighting changes.
- Do not add audio. The website controls the experience.
```

## Recommended generation settings

- Duration: exactly 6 seconds.
- Aspect ratio: 16:9 landscape.
- Resolution: 1920×1080 or the generator's nearest high-quality landscape option.
- Frame rate: 24 fps.
- Camera motion: very low.
- Motion strength: medium-low.
- Prompt adherence / reference strength: high.
- Loop mode: off. The website supports forward and reverse scrubbing; temporal consistency matters more than a perfect playback loop.
- Generate at least three variants. Choose the one with the most stable card count and least geometry flicker, not the one with the most dramatic movement.

## Prepare the frame sequence

Install FFmpeg, place the selected video at the repository root as `conceptly-learning-core.mp4`, then run this PowerShell command from the Conceptly folder:

```powershell
ffmpeg -y -t 6 -i .\conceptly-learning-core.mp4 -vf "fps=24,scale=960:720:force_original_aspect_ratio=increase,crop=960:720" -an -c:v libwebp -quality 78 -compression_level 6 .\public\landing\scroll-sequence\frame-%04d.webp
```

The expected files are:

```text
public/landing/scroll-sequence/frame-0001.webp
public/landing/scroll-sequence/frame-0002.webp
...
public/landing/scroll-sequence/frame-0144.webp
```

Confirm that there are exactly 144 frames:

```powershell
(Get-ChildItem .\public\landing\scroll-sequence\frame-*.webp).Count
```

Then change `available` to `true` in `public/landing/scroll-sequence/manifest.json`:

```json
{
  "available": true,
  "frameCount": 144,
  "pattern": "/landing/scroll-sequence/frame-{frame}.webp",
  "width": 960,
  "height": 720
}
```

The landing page will automatically replace the live 3D fallback with the frame sequence. Frames are loaded around the current scroll position rather than downloading all 144 immediately.

## Quality check before activation

Scrub the source video backward and forward before extracting frames. Reject the take if:

- the number of cards changes;
- the central core jumps position or scale;
- any object touches the edge of the 4:3 center crop;
- fine geometry flickers between adjacent frames;
- the wrong-answer coral moment becomes a large red flash;
- the final frame does not closely resemble the first;
- text, glyphs, or watermark artifacts appear.

Keep `available: false` until the full sequence is present. That leaves the lightweight interactive WebGL core active as the safe fallback.
