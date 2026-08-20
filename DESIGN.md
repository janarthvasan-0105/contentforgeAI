---
name: Autonomous Kinetic
colors:
  surface: '#141218'
  surface-dim: '#141218'
  surface-bright: '#3b383e'
  surface-container-lowest: '#0f0d13'
  surface-container-low: '#1d1b20'
  surface-container: '#211f24'
  surface-container-high: '#2b292f'
  surface-container-highest: '#36343a'
  on-surface: '#e6e0e9'
  on-surface-variant: '#cbc4d2'
  inverse-surface: '#e6e0e9'
  inverse-on-surface: '#322f35'
  outline: '#948e9c'
  outline-variant: '#494551'
  surface-tint: '#cfbcff'
  primary: '#cfbcff'
  on-primary: '#381e72'
  primary-container: '#6750a4'
  on-primary-container: '#e0d2ff'
  inverse-primary: '#6750a4'
  secondary: '#cdc0e9'
  on-secondary: '#342b4b'
  secondary-container: '#4d4465'
  on-secondary-container: '#bfb2da'
  tertiary: '#e7c365'
  on-tertiary: '#3e2e00'
  tertiary-container: '#c9a74d'
  on-tertiary-container: '#503d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#cfbcff'
  on-primary-fixed: '#22005d'
  on-primary-fixed-variant: '#4f378a'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#cdc0e9'
  on-secondary-fixed: '#1f1635'
  on-secondary-fixed-variant: '#4b4263'
  tertiary-fixed: '#ffdf93'
  tertiary-fixed-dim: '#e7c365'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#141218'
  on-background: '#e6e0e9'
  surface-variant: '#36343a'
typography:
  h1:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h1-mobile:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  h2:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h3:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1440px
  gutter: 24px
---

## Brand & Style
The design system is engineered to evoke the feeling of a high-performance, autonomous control center. The brand personality is **Sophisticated, Futuristic, and Precise**, targeting technical professionals and creative directors who require an authoritative interface to manage complex automation.

The design style is a hybrid of **Modern Minimalism** and **Technical Glassmorphism**. It utilizes a deep, "cosmic" dark mode foundation to allow vibrant pipeline gradients to signify data flow and activity. The aesthetic emphasizes clarity through generous whitespace and meticulous alignment, ensuring that even the most complex content pipelines feel manageable and orderly. Visual interest is driven by subtle glow effects (light leaks) and sharp, technical details that reinforce the product's autonomous nature.

## Colors
The color palette is built on a "Deep Cosmic" foundation to provide maximum contrast for the functional pipeline gradients. 

- **Foundation:** The primary background uses a near-black neutral to ground the UI, while surfaces use a slightly lighter cool-gray to create perceived depth without the need for heavy shadows.
- **Typography:** Text levels are strictly bifurcated between high-contrast off-white for legibility and a muted lavender-gray for secondary metadata.
- **The Pipeline Gradient:** Six distinct accent colors (Cato through Nova) represent different stages or types of content within the autonomous pipeline. These should be used for status indicators, active states, and "flow" visualizations.
- **Functional Accents:** Glows and borders should derive their hue from the current active pipeline color at a 20-30% opacity.

## Typography
The typographic hierarchy reinforces the balance between high-level creative direction and low-level technical precision.

- **Headlines:** Use **Outfit** for its geometric clarity and modern weight. Use tight letter-spacing for larger headers to maintain an authoritative, "editorial" feel.
- **Body:** **Inter** provides a highly legible, neutral canvas for descriptions and long-form content.
- **Technical UI:** **JetBrains Mono** is reserved for all file paths, metadata, system tags, and timestamps. This monospaced treatment signals "data" and "process," distinguishing it from user-facing content. All labels in monospace should be treated with slight uppercase tracking to enhance their technical character.

## Layout & Spacing
The system uses a **Fluid Grid** model with a strict 8px base unit to ensure precision. 

- **Desktop:** A 12-column grid with 24px gutters. Use large "Safe Zones" (80px+) between major functional blocks to maintain the sophisticated, airy feel of the brand.
- **Panels:** Sidebars and utility panels should have a fixed width (e.g., 280px) while the central pipeline view remains fluid to accommodate complex visualizations.
- **Mobile:** Transition to a 4-column grid. Margins shrink to 16px, and vertical spacing is condensed to minimize scrolling in data-heavy views.
- **Rhythm:** Vertical rhythm should be dictated by the 8px grid. Components like cards and inputs should always align to these increments to maintain the "engineered" aesthetic.

## Elevation & Depth
In this dark, technical environment, depth is communicated through **Tonal Layers** and **Subtle Glows** rather than traditional shadows.

- **Stacking:** The Background (#0A0A0F) is the lowest level. Panels and Cards (#14141C) sit on top.
- **Borders:** Use 1px "Ghost Borders" for all containers. Border colors should be a slightly lighter version of the surface color (#2A2A35) or a low-opacity version of an accent color for active states.
- **Glow Effects:** High-priority elements (like the current active node in a pipeline) should emit a soft, diffused outer glow (30px-50px blur, 15% opacity) matching their specific pipeline gradient color.
- **Glassmorphism:** Use backdrop blurs (20px+) for floating modals or navigation bars to maintain the "futuristic" feel while ensuring content behind is still hinted at.

## Shapes
The shape language is **Soft but Precise**. While a high-tech system might lean toward sharp corners, this design system uses a 4px (Soft) base radius to make the interface feel modern and premium.

- **Standard Elements:** Buttons, inputs, and small cards use a 4px radius.
- **Large Containers:** Content areas and main panels use an 8px (Large) radius.
- **System Tags:** Monospace tags for "Pending" or "Processed" should remain sharp (0px) or use a very minimal 2px radius to reinforce their technical, utility-first nature.
- **Interactive States:** On hover, borders should remain crisp; do not increase corner radius on interaction.

## Components
- **Buttons:** Primary buttons use a solid fill of a pipeline accent color with off-white text. Secondary buttons use the Ghost Border style with a subtle hover glow.
- **Inputs:** Dark backgrounds (#0A0A0F) with a 1px border. Focus states are indicated by a 1px colored border matching the active pipeline stage.
- **Chips/Tags:** Always use the Monospace font. Backgrounds should be low-opacity (10%) versions of the accent colors to prevent visual clutter.
- **Lists/Data Tables:** Use subtle horizontal dividers (1px, #1C1C26). Avoid zebra-striping; use hover highlights instead.
- **Pipeline Cards:** These are the hero components. They feature a vertical gradient sliver on the left edge to indicate the stage (Cato, Vela, etc.) and use the primary surface color with a subtle 1px border.
- **Nodes:** In flow diagrams, use circular connectors with a 2px stroke. Active lines between nodes should animate or use a gradient stroke to show directionality.