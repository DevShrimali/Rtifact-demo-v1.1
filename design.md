# Rtifact Design System & UI Instructions

This document lists core design guidelines and instructions that must be followed when building or modifying screens in Rtifact.

## 1. Typography & Colors
- **Color Variables**: Only use theme CSS variables from `index.css` (e.g. `var(--card)` instead of `var(--panel)`).
- **Theme Support**: Ensure all colors and panel containers work correctly in both Dark Mode (`[data-theme='dark']`) and Light Mode.

## 2. Component Design Guidelines
- **Underlined Tabs & Navigation**:
  - Container class: `.subnav`
  - Item class: `.subnav-item`
  - Active item class: `.subnav-item.active`
  - **Font Size**: Tabs must use the standard `font-size: 12.5px` and `font-weight: 600`.
  - Always prefix the tab text with a small icon (size 12, strokeWidth 2.2, spacing/margins matching other tabs).
- **Stat Cards**: Use the standard icon-based `.stat-card` component layout instead of simple text blocks or outdated panels.
  - Left-hand icon with a colored soft background.
  - Value and label aligned on the right.
- **Card (Panel) Design**:
  - Always use the `.panel` class for standard card components.
  - Card components must use `var(--card)` for background, `1px solid var(--border)` for border, `12px` for border-radius, and `var(--shadow)` for shadow.
  - Card headers/labels should use `.panel-title` with `font-size: 11px` (uppercase, bold, `var(--faint)`).
  - Card body text should use `.panel-body-text` with `font-size: 13.5px` and `line-height: 1.55`.
  - Card footnotes should use `.panel-foot-note` with `font-size: 11.5px` and `color: var(--faint)`.
- **NO Left-Side Stroke Cards**:
  - **CRITICAL**: Never use card patterns that rely on solid left-side borders (e.g. `borderLeft: '4px solid var(--error)'`). These are retired/outdated design elements.
  - All status indicators should use the standard modern badge system or the icon-based `stat-card` treatment.
- **Badges**:
  - Badge components must use the `.badge` class with a default `font-size: 10.5px` and `font-weight: 700`.
  - Standard status badges: `.badge.sev-critical` (critical outage / error), `.badge.sev-warning` (degraded performance / warn), `.badge.sev-healthy` (operational / success), and `.badge.neutral` (gray/muted status).
  - Explicit inline font-size overrides on badges (e.g. `11px`, `11.5px`) should be avoided to maintain a consistent visual hierarchy.
- **Buttons**:
  - Buttons must use the `.btn` class with a default `font-size: 12.5px`, `font-weight: 600`, and height of `34px`.
  - Use `.btn-primary` for the main action (solid background) and `.btn-secondary` for secondary actions.
  - **NO Gradient Buttons**:
    - **CRITICAL**: Never use linear-gradient backgrounds on buttons (e.g., `background: 'linear-gradient(...)'`). Always stick to standard solid background classes (`btn-primary` with `var(--brand)`) or solid variables defined in the theme.
- **Drawer Panels**: Right-side slide-in drawers must always have a dimmed backdrop overlay (`rgba(0, 0, 0, 0.5)`) and solid opaque backgrounds (`var(--card)`) to prevent underlying content from showing through.
