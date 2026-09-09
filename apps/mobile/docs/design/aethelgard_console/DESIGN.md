---
name: Aethelgard Console
colors:
  surface: '#1E293B'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#d5c4ab'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#9d8f78'
  outline-variant: '#504532'
  surface-tint: '#ffbb18'
  primary: '#ffdda2'
  on-primary: '#412d00'
  primary-container: '#ffb900'
  on-primary-container: '#6c4c00'
  inverse-primary: '#7c5800'
  secondary: '#bcc7de'
  on-secondary: '#263143'
  secondary-container: '#3e495d'
  on-secondary-container: '#aeb9d0'
  tertiary: '#d3e2fb'
  on-tertiary: '#233144'
  tertiary-container: '#b8c6df'
  on-tertiary-container: '#445267'
  error: '#EF4444'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea7'
  primary-fixed-dim: '#ffbb18'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5e4200'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#d5e3fd'
  tertiary-fixed-dim: '#b9c7e0'
  on-tertiary-fixed: '#0d1c2f'
  on-tertiary-fixed-variant: '#3a485c'
  background: '#0F172A'
  on-background: '#dae2fd'
  surface-variant: '#334155'
  success: '#22C55E'
  information: '#3B82F6'
  warning: '#F59E0B'
  text-primary: '#F8FAFC'
  text-secondary: '#94A3B8'
  divider: '#1E293B'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8dp
  half: 4dp
  screen-padding-min: 16dp
  screen-padding-max: 20dp
  touch-target-min: 48dp
  touch-target-preferred: 56dp
  gutter: 16dp
---

## Brand & Style

The design system is engineered as a "Server Authority" interface—a professional operator console for Hermes Mobile that prioritizes technical precision over aesthetic flair. The personality is calm, trustworthy, and utilitarian, evoking the feeling of a mission-critical dashboard rather than a consumer social app.

The visual style is **Corporate / Modern** with a focus on **Tonal Layering**. It avoids decorative elements like gradients or glassmorphism in favor of high-contrast readability and structural integrity. Every pixel serves a functional purpose, ensuring that operators can manage complex agent interactions and system states with absolute certainty.

## Colors

The palette is "dark-first," utilizing a deep navy-graphite foundation to reduce eye strain during long operational sessions.

- **Primary (Amber/Gold):** Reserved for brand touchpoints and critical call-to-actions. It is used sparingly to maintain its impact.
- **Surface Strategy:** Depth is communicated through lightness. The background is the darkest layer, with containers and cards becoming progressively lighter graphite shades to indicate elevation.
- **Semantic Integrity:** Status signaling is paramount. Success, Information, Warning, and Error colors are accessibility-vetted. These colors must always be accompanied by supporting icons and text to ensure the system remains functional for all users regardless of color perception.

## Typography

This design system utilizes **Inter** for all UI elements to ensure maximum legibility and a neutral, professional tone. **JetBrains Mono** is introduced for log data and technical identifiers, reinforcing the "operator console" aesthetic.

- **Action Labels:** Must always use verbs (e.g., *Connect*, *Authorize*).
- **Hierarchy:** Use `headline-lg` for primary screen anchors and `headline-md` for card or section titles.
- **Readability:** Body text uses a generous 1.5x line height to maintain clarity in data-dense environments.

## Layout & Spacing

The system is built on a strict **8dp rhythmic grid**. A secondary **4dp increment** is permitted only for high-density information rows, such as log viewers or compact status lists.

- **Grid Model:** A 12-column fluid grid for tablet/landscape, reflowing to a single-column stack on mobile portrait.
- **Margins:** Standard horizontal screen padding is **16dp**, increasing to **20dp** on larger handsets to provide breathing room.
- **Touch Targets:** No interactive element should be smaller than **48dp**. Primary actions (FABs, main buttons) should target **56dp** to ensure reliable operation in mobile contexts.
- **Safe Areas:** Design must strictly respect Android gesture navigation bars and status bar insets.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** rather than traditional drop shadows. This maintains a clean, technical appearance.

- **Level 0 (Background):** The base `background` color.
- **Level 1 (Surface):** Default container color for cards and list items.
- **Level 2 (Elevated):** Used for active states or elements that float over content (e.g., Bottom Sheets).
- **Outlines:** Use subtle `divider` colored borders (1dp) on Level 1 surfaces to define boundaries without adding visual weight. Shadows are only permitted on primary Floating Action Buttons (FABs) to ensure they are the most prominent element on the z-axis.

## Shapes

The shape language is **Soft (Level 1)**, utilizing a 4dp (0.25rem) base radius. This provides a professional, "tooled" feel that is more approachable than sharp corners but more serious than the highly rounded Material 3 defaults.

- **Standard Elements:** 4dp corner radius.
- **Cards/Modals:** 8dp (rounded-lg) to provide a distinct container definition.
- **Chips/Badges:** 12dp (rounded-xl) or full-pill to differentiate status indicators from functional buttons.

## Components

### Buttons
- **Primary:** Solid Amber background with Navy text. High emphasis.
- **Secondary:** Outlined with Primary Amber or Surface-Variant.
- **Destructive:** Solid Error Red or Outlined Red for "Delete/Disconnect" actions.
- **Min Height:** Always 48dp.

### Status Chips
- **Requirement:** Must include an icon + text (e.g., [Icon] Connected).
- **Colors:** Use semantic palette (Success, Info, Warning, Error) with a low-opacity background tint (15%) and high-opacity text.

### Input Fields
- **Style:** Filled style with a bottom-line indicator. Use `Surface-Variant` as the background.
- **States:** Active states use the Primary Amber for the underline and label.

### Cards
- **Style:** Level 1 Surface with a 1dp divider border.
- **Padding:** 16dp internal padding following the 8dp grid.

### Feedback & Transitions
- **Skeletons:** Mandatory for data-loading states to prevent layout shift.
- **Mutations:** Use compact spinners for "Save" or "Update" actions. The UI must never assume success; it must wait for server confirmation before updating state.
- **Privacy:** Implement a "Locked" overlay state that obscures sensitive values (URLs, keys) behind a biometric prompt.

## Connection-flow prototype notes

The F01–F07 HTML review frames use the same 56dp app bar, 48dp minimum touch
target, system sans-serif stack, inline symbols, and connection vocabulary:
`Connected`, `Reconnecting`, `Offline`, `Authentication expired`, and
`Incompatible server`. Onboarding screens intentionally omit a connected chip
until the server confirms the session. The authentication frame starts the
supported Hermes sign-in handoff and never asks for an invented operator ID,
passkey, bearer token, or protocol identifier.

Each frame keeps state variants visible as review fixtures: restore/lock states,
sign-in return errors, compatibility outcomes, biometric availability, and
offline/read-only behavior. The responsive shell uses safe-area padding and
scrollable content so the same frames remain usable at 360dp and 412dp widths,
including when the URL field receives the keyboard.
