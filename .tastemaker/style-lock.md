# Style Lock — Darren Lin Personal Brand Site

## Color contract

Palette: elegant / light / analogous harmony (base hue 74.8, accent hue 106.8)

| Role | Hex | Use |
|------|-----|-----|
| text | #201911 | body copy, headings |
| bg | #fff9f2 | page background |
| surface | #f5efe8 | alternate sections |
| primary | #91692c | buttons, accents, key terms |
| on-primary | #ffffff | text on primary fills |
| secondary | #ebdbc7 | muted backgrounds |
| accent | #78752e | eyebrows, index numbers |
| border | #e5dfd7 | hairline rules |

### Legal pairings (from check_contrast.py matrix)

**Text-safe (>= 4.5):**
- text/on-primary, text/bg, text/surface, text/border
- primary/on-primary, accent/on-primary
- bg/primary, bg/accent

**UI-safe (>= 3.0, < 4.5):**
- surface/primary, surface/accent, primary/border
- text/accent, accent/border, text/primary

**Decorative (< 3.0):**
- border/on-primary, bg/border, surface/border
- surface/on-primary, bg/surface, bg/on-primary, primary/accent

### Contrast verification

- primary/on-primary: 4.93:1 (text-safe ✓)
- bg/primary: 4.71:1 (text-safe ✓)
- bg/accent: 4.58:1 (text-safe ✓)
- text/bg: 16.62:1 (text-safe ✓)
- text/surface: 15.22:1 (text-safe ✓)
- text/on-primary: 17.38:1 (text-safe ✓)

## Typography

- Display: Gloock (Google Fonts, one weight)
- Body: Inter (Google Fonts, weights 400/500/600)
- Line-height floor for display: 1.05
- Letter-spacing: -0.01em to -0.02em for display, 0.08em for uppercase labels

## Density & spacing

- Base: 4px unit
- Section padding: space-32 (128px) top/bottom on desktop, space-24 (96px) on mobile
- Card internal padding: N/A (no cards on this page)
- Content gap: space-6 (24px)
- Hairline rules: 1px solid border color

## Shape

- Radius: 2px (sm), 4px (md) — minimal, elegant
- Shadow: 0 1px 3px rgba(32, 25, 17, 0.04) — barely there

## Motion

- Engine: GSAP 3.12 + ScrollTrigger (CDN)
- Reveal: opacity 0→1, translateY 40px→0, power2.out, stagger 0.08
- Reduced motion: freeze at final state
- Hero sequenced delay: 0.12s stagger

## Structure

- Macrostructure: Editorial Index
- Archetypes: N4 / H1 / F6 / F4 / P2 / C2 / Ft1 / S1
