# Rtifact Design System & UI Instructions

This document lists core design guidelines and instructions that must be followed when building or modifying screens in Rtifact.

## 1. Typography & Colors
- **Color Variables**: Only use theme CSS variables from `index.css` (e.g. `var(--card)` instead of `var(--panel)`).
- **Theme Support**: Ensure all colors and panel containers work correctly in both Dark Mode (`[data-theme='dark']`) and Light Mode.

## 2. Component Design Guidelines
- **Underlined Tabs**: Navigation tabs (e.g. subnav) should use the underlined styling:
  - Container class: `.subnav`
  - Item class: `.subnav-item`
  - Active item class: `.subnav-item.active`
  - Always prefix the tab text with a small icon (size 12, strokeWidth 2.2, spacing/margins matching other tabs).
- **Stat Cards**: Use the standard icon-based `.stat-card` component layout instead of simple text blocks or outdated panels.
  - Left-hand icon with a colored soft background.
  - Value and label aligned on the right.
- **NO Left-Side Stroke Cards**:
  - **CRITICAL**: Never use card patterns that rely on solid left-side borders (e.g. `borderLeft: '4px solid var(--error)'`). These are retired/outdated design elements.
  - All status indicators should use the standard modern badge system or the icon-based `stat-card` treatment.
- **NO Gradient Buttons**:
  - **CRITICAL**: Never use linear-gradient backgrounds on buttons (e.g., `background: 'linear-gradient(...)'`). Always stick to standard solid background classes (`btn-primary` with `var(--brand)`) or solid variables defined in the theme.
- **Drawer Panels**: Right-side slide-in drawers must always have a dimmed backdrop overlay (`rgba(0, 0, 0, 0.5)`) and solid opaque backgrounds (`var(--card)`) to prevent underlying content from showing through.
