# Designer opening assets

Generated using the built-in image_gen tool on 2026-09-07. Original character, no stock illustration or new font.

`designer-poses.png`: 1536 × 1024 RGB sprite sheet. Three 512-pixel columns: work, think, idea. The generator baked a neutral checkerboard into the image despite alpha requests. Source is preserved unchanged. `src/stage/Designer.tsx` uses an sRGB SVG color matrix with two merged branches: warm colors alpha = clamp(24 × (R − B) − 0.18), graphite alpha = clamp(6 − 10 × R). This removes neutral light pixels while preserving warm skin/clothing and dark pencil lines. Runtime compositing is transparent; the source PNG itself is NOT RGBA. Recheck the filter if recoloring clothing to neutral gray/white. Keep the filter when reusing this sprite.

One shared image, pose selected via SVG viewBox. Laptop, tablet, chair and desk edge are separate SVG groups. All Chinese copy remains editable text. Existing font license remains public/fonts/OFL.txt.

## Initial prompt

Use case: illustration-story. Create a production sprite sheet for a warm paper stop-motion landing-page story. Genuine transparent background alpha, no paper rectangle or baked checkerboard. Wide 1536x1024 image, THREE evenly spaced columns, each contains the SAME original freelance designer from waist up, same size and baseline. Each figure fully isolated, generous transparent gutters, no overlap. Woman around 30, short dark graphite slightly tousled bob, small round glasses, cream shirt with sleeves rolled, muted sage green knitted vest. Thoughtful human personality, subtle expressions. Editorial colored pencil + dry graphite contour drawing, hand drawn irregular fine lines, sparse warm muted color fills with pencil grain, refined proportions not corporate vector clipart or cute mascot. Three-quarter view looking to the RIGHT toward separate work papers that will be added in code. LEFT column: focused working, head inclined down right, right forearm reaching toward lower right to use a drawing tablet, fingers holding a simple graphite pencil. MIDDLE: pausing at client questions, slightly tilted head, one hand supporting chin, other arm resting, mild wry contemplation not anxiety. RIGHT: small moment of clarity, attentive slight smile, head looking right, arm extends farther right holding pencil to write an idea on separate paper. Keep exact same facial identity, clothes, body size and camera angle in all three. All heads at same height and torsos at same baseline, arms remain inside their own columns. No computer, no desk, no chair, no surrounding objects, no lettering, no decorative doodles, no speech bubbles, no logos. Only character and held pencil, background truly transparent.

## Selected revision prompt

Edit the provided sprite sheet. Keep the SAME three poses, character identity, three-column layout, image dimensions 1536x1024, and head/torso scale. IMPORTANT: simplify into a refined 2D editorial illustration: flatter light muted sage fills, fewer pencil marks, lighter charcoal lines; remove lifelike skin shading, make faces stylized with minimal features. Remove ALL background and brown/black glows/shadows, genuinely transparent RGBA empty space, not dark backdrop or checkerboard. No environmental shadow around characters. Very clean cutout edges. Keep the woman with dark bob, glasses, cream shirt, sage vest. Each figure stays inside its own 512px-wide column. All text absent. Designed to composite directly over light cream paper.

## Conversion for the website

Converted to WebP for `web/public/paper-film/` on 2026-09-08. The three textures use
lossy q82-84; this sprite sheet uses q92 because the compositing filter derives its
transparency from its own colours and lossy noise would show up as fringing at the
silhouette. Measured against the lossless encode, the derived alpha differs by more
than 8% on 1.5% of pixels, all of them on existing anti-aliased contours, and the
checkerboard, the pencil tip and the dark contour lines are unchanged. The original
PNGs are not in this repository; they live with the reference demo.
