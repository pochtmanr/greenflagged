---
version: "alpha"
name: "Creative Studio | Branding & Culture"
description: "Creative Studio Content Section is designed for structuring a full-width content block for modern web pages. Key features include reusable structure, responsive behavior, and production-ready presentation. It is suitable for component libraries and responsive product interfaces."
colors:
  primary: "#1A33FF"
  secondary: "#9CA3AF"
  tertiary: "#A524FF"
  neutral: "#F2F0EC"
  background: "#1A33FF"
  surface: "#F2F0EC"
  text-primary: "#F2F0EC"
  text-secondary: "#1A33FF"
  border: "#FFFFFF"
  accent: "#1A33FF"
typography:
  display-lg:
    fontFamily: "Inter"
    fontSize: "128px"
    fontWeight: 700
    lineHeight: "128px"
    letterSpacing: "-0.04em"
    textTransform: "uppercase"
  body-md:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: "24px"
  label-md:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0.3px"
    textTransform: "uppercase"
rounded:
  md: "0px"
spacing:
  base: "8px"
  sm: "1px"
  md: "8px"
  lg: "16px"
  xl: "24px"
  gap: "4px"
  card-padding: "16px"
  section-padding: "32px"
components:
  button-link:
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "0px"
  card:
    rounded: "2px"
    padding: "16px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Full Bleed
  - Framing: Glassy
  - Grid: Strong

## Colors

The color system uses dark mode with #1A33FF as the main accent and #F2F0EC as the neutral foundation.

- **Primary (#1A33FF):** Main accent and emphasis color.
- **Secondary (#9CA3AF):** Supporting accent for secondary emphasis.
- **Tertiary (#A524FF):** Reserved accent for supporting contrast moments.
- **Neutral (#F2F0EC):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #1A33FF; Surface: #F2F0EC; Text Primary: #F2F0EC; Text Secondary: #1A33FF; Border: #FFFFFF; Accent: #1A33FF

- **Gradients:** hover:bg-gradient-to-br hover:from-electric/50 hover:to-transparent

## Typography

Typography relies on Inter across display, body, and utility text.

- **Display (`display-lg`):** Inter, 128px, weight 700, line-height 128px, letter-spacing -0.04em, uppercase.
- **Body (`body-md`):** Inter, 16px, weight 500, line-height 24px.
- **Labels (`label-md`):** Inter, 12px, weight 500, line-height 16px, letter-spacing 0.3px, uppercase.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, full bleed structural frame before changing ornament or component styling. Use 8px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / full bleed composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Full Bleed
- **Base unit:** 8px
- **Scale:** 1px, 8px, 16px, 24px, 32px, 48px, 64px, 96px
- **Section padding:** 32px, 96px
- **Card padding:** 16px, 32px
- **Gaps:** 4px, 8px, 12px, 16px

## Elevation & Depth

Depth is communicated through glass, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as glass first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Glass
- **Borders:** 2px #FFFFFF; 1px #FFFFFF; 1px #000000; 1px #0A0A0A
- **Blur:** 8px, 4px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 48px padding and a 0px radius. Drive the shell with linear-gradient(45deg, rgba(0, 0, 0, 0.02) 25%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.02) 50%, rgba(0, 0, 0, 0.02) 75%, rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 0)) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 2px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 2px, 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles. Reuse the existing card surface recipe for content blocks.

### Buttons
- **Links:** text #F2F0EC, radius 0px, padding 0px, border 0px solid rgb(229, 231, 235).

### Cards and Surfaces
- **Card surface:** background rgba(10, 10, 10, 0.5), border 1px solid rgba(255, 255, 255, 0.15), radius 2px, padding 16px, shadow none, blur 4px.
- **Card surface:** background #F2F0EC, border 0px solid rgb(229, 231, 235), radius 2px, padding 32px, shadow none.

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 8px rhythm.
- Do reuse the Glass surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 2px, 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected expressive motion intensity without a deliberate reason.

## Motion

Motion feels expressive but remains focused on interface, text, and layout transitions. Timing clusters around 150ms and 90000ms. Easing favors ease and cubic-bezier(0.4. Hover behavior focuses on text and color changes. Scroll choreography uses GSAP ScrollTrigger for section reveals and pacing.

**Motion Level:** expressive

**Durations:** 150ms, 90000ms, 2000ms, 500ms, 300ms

**Easings:** ease, cubic-bezier(0.4, 0, 1), 0.2, linear

**Hover Patterns:** text, color

**Scroll Patterns:** gsap-scrolltrigger

## WebGL

Reconstruct the graphics as a inset canvas accent using canvas-backed effect. The effect should read as technical, meditative, and atmospheric: dot-matrix particle field with black and sparse spacing. Build it from dot particles + soft depth fade so the effect reads clearly. Animate it as slow breathing pulse. Interaction can react to the pointer, but only as a subtle drift. Preserve dom fallback.

**Id:** webgl

**Label:** WebGL

**Stack:** WebGL

**Insights:**
  - **Scene:**
    - **Value:** Inset canvas accent
  - **Effect:**
    - **Value:** Dot-matrix particle field
  - **Primitives:**
    - **Value:** Dot particles + soft depth fade
  - **Motion:**
    - **Value:** Slow breathing pulse
  - **Interaction:**
    - **Value:** Pointer-reactive drift
  - **Render:**
    - **Value:** Canvas-backed effect

**Techniques:** Dot matrix, Breathing pulse, Pointer parallax, DOM fallback

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <!-- Canvas Background for Subtle "WebGL" feel -->
      <canvas id="bg-canvas" class="fixed inset-0 z-[-1] opacity-30 pointer-events-none"></canvas>

      <!-- Navigation -->
      ```
  - **JS reference:**
    - **Language:** js
    - **Snippet:**
      ```
      // GSAP Scroll Animations
      gsap.registerPlugin(ScrollTrigger);

      // Masked word reveal
      const revealWrappers = document.querySelectorAll('.gs-reveal-wrapper');

      revealWrappers.forEach(wrapper => {
          const texts = wrapper.querySelectorAll('.gs-reveal-text');
      …
      ```
