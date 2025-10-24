# Tailwind CSS v4 Dark Mode Fix

## Problem
The application was using Tailwind CSS v4 (alpha/beta) with `darkMode: "class"` in `tailwind.config.ts`, but the generated CSS was using `@media (prefers-color-scheme: dark)` instead of class-based selectors. This caused all components (especially Radix UI portals like ContextMenu, CommandPalette, Combobox) to follow the operating system's theme preference instead of the user's toggle preference.

## Symptoms
- Theme toggle worked for most of the page
- Radix UI Portal components (ContextMenu, CommandPalette, Combobox, DatePicker) followed Windows/macOS system theme
- Inspecting CSS showed `@media (prefers-color-scheme: dark)` rules instead of `.dark` class selectors
- `document.documentElement.classList.contains('dark')` was `false`, but components still showed dark mode when OS was in dark mode

## Root Cause
Tailwind CSS v4 has a different configuration system than v3. The `darkMode: "class"` option in `tailwind.config.ts` was being ignored, and Tailwind was defaulting to media-query based dark mode.

## Solution
Added explicit Tailwind v4 dark mode variant configuration to `app/globals.css`:

```css
@import "tailwindcss";

/* Configure Tailwind v4 to use class-based dark mode ONLY */
@variant dark (&:where(.dark, .dark *));

@tailwind base;
@tailwind components;
@tailwind utilities;
@reference "tailwindcss";
```

This tells Tailwind v4 to:
1. Only apply dark mode styles when `.dark` class exists on a parent element
2. NOT respond to `@media (prefers-color-scheme: dark)`
3. Make dark mode styles apply to both `.dark` elements and their children

## Files Changed
- `app/globals.css` - Added `@variant dark` configuration
- `components/ThemeToggle.tsx` - Enhanced to prevent system theme from overriding user preference

## Testing
After the fix, verify:
1. Theme toggle controls the entire site (not OS theme)
2. ContextMenu (right-click on table rows) respects toggle
3. CommandPalette (⌘K / Ctrl+K) respects toggle
4. Combobox respects toggle
5. DatePicker respects toggle
6. Changing OS theme does NOT affect the site when user has set a preference

## Tailwind v4 Resources
- [Tailwind CSS v4 Alpha Docs](https://tailwindcss.com/docs/v4-alpha)
- [Customizing Variants](https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-variants)

## Related Components
All Radix UI components that use Portals:
- `ContextMenu`
- `CommandPalette` (uses cmdk + Dialog)
- `Combobox` (uses cmdk + Popover)
- `DatePicker` (uses Popover)
- `DropdownMenu`
- `Popover`
- `Dialog`
- `Tooltip`

These components render outside the normal DOM tree, so they need explicit theme class inheritance.

