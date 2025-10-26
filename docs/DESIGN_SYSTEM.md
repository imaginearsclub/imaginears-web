# Imaginears Design System
**Version**: 2.0  
**Last Updated**: October 26, 2025  
**Status**: Production Ready ✅

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Accessibility](#accessibility)
7. [Keyboard Navigation](#keyboard-navigation)
8. [Dark Mode](#dark-mode)
9. [Best Practices](#best-practices)

---

## Overview

### Design Principles

1. **Consistency** - Unified visual language across all interfaces
2. **Accessibility** - WCAG 2.1 Level AA compliant
3. **Performance** - Optimized for speed and responsiveness
4. **Clarity** - Clear visual hierarchy and information architecture
5. **Delight** - Subtle animations and micro-interactions

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **UI Primitives**: Radix UI
- **Icons**: Lucide React
- **Animations**: Tailwind Animations

---

## Color System

### Semantic Color Palette

Our design system uses 8 semantic colors, each with a specific purpose and meaning:

#### 🔵 Primary (Blue)
- **Purpose**: Primary actions, navigation, emphasis
- **Values**: 
  - Light: `#3B82F6` (blue-500)
  - Dark: `#60A5FA` (blue-400)
- **Usage**: Primary buttons, links, active states, key metrics
- **Examples**: Dashboard cards, main CTAs

#### 🟣 Purple  
- **Purpose**: Settings, configuration, special features
- **Values**:
  - Light: `#A855F7` (purple-500)
  - Dark: `#C084FC` (purple-400)
- **Usage**: Settings indicators, configuration badges, events
- **Examples**: Event cards, settings sections

#### 🟢 Success (Green)
- **Purpose**: Success states, active status, online indicators
- **Values**:
  - Light: `#10B981` (emerald-500)
  - Dark: `#34D399` (emerald-400)
- **Usage**: Success messages, active badges, online status
- **Examples**: "Active" badges, success alerts

#### 🟡 Warning (Amber)
- **Purpose**: Warnings, pending states, caution
- **Values**:
  - Light: `#F59E0B` (amber-500)
  - Dark: `#FBBF24` (amber-400)
- **Usage**: Warning messages, pending states, moderate alerts
- **Examples**: "Pending" status, warning dialogs

#### 🔴 Danger (Red)
- **Purpose**: Errors, critical states, destructive actions
- **Values**:
  - Light: `#EF4444` (red-500)
  - Dark: `#F87171` (red-400)
- **Usage**: Error messages, delete buttons, critical alerts
- **Examples**: Delete confirmations, error states

#### 🔷 Info (Sky Blue)
- **Purpose**: Information, metadata, neutral emphasis
- **Values**:
  - Light: `#0EA5E9` (sky-500)
  - Dark: `#38BDF8` (sky-400)
- **Usage**: Informational badges, metadata, neutral CTAs
- **Examples**: Info badges, tooltips

#### 🟠 Orange
- **Purpose**: Tools, moderate warnings, secondary emphasis
- **Values**:
  - Light: `#F97316` (orange-500)
  - Dark: `#FB923C` (orange-400)
- **Usage**: Tool indicators, moderate priority items
- **Examples**: Tool badges, secondary alerts

#### ⚫ Default (Gray)
- **Purpose**: Neutral, general-purpose elements
- **Values**:
  - Light: `#64748B` (slate-500)
  - Dark: `#94A3B8` (slate-400)
- **Usage**: Default state, text, borders, backgrounds
- **Examples**: Default badges, inactive states

### Neutral Colors

- **Slate**: Primary neutral palette
  - Background: `slate-50` → `slate-950`
  - Text: `slate-600` → `slate-400`
  - Borders: `slate-200` → `slate-800`

---

## Typography

### Font Families

- **Primary**: Inter (system fallback: -apple-system, BlinkMacSystemFont, "Segoe UI")
- **Monospace**: JetBrains Mono (for code blocks)

### Type Scale

```css
text-xs:   0.75rem  (12px)  - Small labels, captions
text-sm:   0.875rem (14px)  - Body text, descriptions
text-base: 1rem     (16px)  - Standard body text
text-lg:   1.125rem (18px)  - Large body text, small headings
text-xl:   1.25rem  (20px)  - Card titles, section headings
text-2xl:  1.5rem   (24px)  - Page headings
text-3xl:  1.875rem (30px)  - Major headings
text-4xl:  2.25rem  (36px)  - Hero headings
```

### Font Weights

- `font-normal`: 400 - Body text
- `font-medium`: 500 - Emphasized text, labels
- `font-semibold`: 600 - Subheadings, important text
- `font-bold`: 700 - Headings, strong emphasis

---

## Spacing & Layout

### Spacing Scale

Based on 4px increments:

```
gap-1:  0.25rem (4px)
gap-2:  0.5rem  (8px)
gap-3:  0.75rem (12px)
gap-4:  1rem    (16px)
gap-6:  1.5rem  (24px)  ← Primary gap for card grids
gap-8:  2rem    (32px)
gap-12: 3rem    (48px)
```

### Layout Guidelines

- **Card Grid Spacing**: `gap-6` (24px)
- **Component Padding**: `p-4` to `p-6` (16px-24px)
- **Section Spacing**: `space-y-6` (24px vertical)
- **Button Spacing**: `gap-2` (8px between icon and text)

### Border Radius

- **Small**: `rounded-lg` (8px) - Buttons, badges
- **Medium**: `rounded-xl` (12px) - Inputs, small cards
- **Large**: `rounded-2xl` (16px) - Cards, dialogs, main containers

---

## Components

### Button

**Location**: `components/common/Button.tsx`

#### Variants
- `default` - Dark gray (general purpose)
- `primary` - Blue (primary actions)
- `success` - Green (positive actions)
- `danger` - Red (destructive actions)
- `outline` - Transparent with border
- `ghost` - Transparent, minimal

#### Sizes
- `sm` - Small (compact spaces)
- `md` - Medium (standard)
- `lg` - Large (hero actions)

#### Features
- ✅ Icon support (left & right)
- ✅ Loading states with spinner
- ✅ ARIA labels
- ✅ Disabled states
- ✅ Focus indicators

#### Usage Example

```tsx
import { Button } from "@/components/common";
import { Save, ChevronRight } from "lucide-react";

// Basic button
<Button variant="primary">
  Save Changes
</Button>

// Button with icons
<Button 
  variant="primary" 
  leftIcon={<Save />}
  rightIcon={<ChevronRight />}
>
  Save & Continue
</Button>

// Loading button
<Button 
  isLoading
  loadingText="Saving..."
  variant="success"
>
  Save
</Button>

// Icon-only button (requires aria-label)
<Button 
  variant="ghost" 
  ariaLabel="Delete item"
>
  <Trash />
</Button>
```

---

### Input

**Location**: `components/common/Input.tsx`

#### States
- `default` - Normal state
- `error` - Shows error styling
- `success` - Shows success styling

#### Sizes
- `sm` - Small (compact forms)
- `md` - Medium (standard)
- `lg` - Large (hero inputs)

#### Features
- ✅ Icon support (left & right)
- ✅ Integrated labels
- ✅ Error messages with `role="alert"`
- ✅ Helper text
- ✅ Required indicators
- ✅ Auto-generated IDs
- ✅ Full ARIA support

#### Usage Example

```tsx
import { Input } from "@/components/common";
import { Mail, Check } from "lucide-react";

// Basic input
<Input 
  label="Email Address"
  placeholder="you@example.com"
  required
/>

// Input with icons
<Input
  label="Email"
  leftIcon={<Mail />}
  rightIcon={<Check />}
  state="success"
/>

// Input with error
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
  required
/>

// Input with helper text
<Input
  label="Username"
  helperText="Only letters, numbers, and underscores"
/>
```

---

### Badge

**Location**: `components/common/Badge.tsx`

#### Variants
All 8 semantic colors: `default`, `primary`, `success`, `warning`, `danger`, `info`, `purple`, `orange`

#### Sizes
- `sm` - Small (compact)
- `md` - Medium (standard)
- `lg` - Large (emphasis)

#### Features
- ✅ 8 color variants
- ✅ Status role for status badges
- ✅ ARIA labels for icon-only
- ✅ Consistent styling

#### Usage Example

```tsx
import { Badge } from "@/components/common";

// Status badge
<Badge variant="success" isStatus>
  Active
</Badge>

// Count badge
<Badge variant="danger" ariaLabel="3 unread messages">
  3
</Badge>

// Category badge
<Badge variant="purple">
  Settings
</Badge>
```

---

### Card

**Location**: `components/common/Card.tsx`

#### Variants
- `default` - Standard border
- `bordered` - Thicker border
- `elevated` - Shadow effect

#### Accent Colors
All 7 semantic colors (excluding default): `primary`, `success`, `warning`, `danger`, `info`, `purple`, `orange`

#### Features
- ✅ Color accent top border
- ✅ Interactive hover states
- ✅ Multiple padding options
- ✅ Sub-components (Header, Title, Content, Footer)

#### Usage Example

```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent, 
  CardFooter 
} from "@/components/common";

// Standard card
<Card>
  <CardHeader>
    <CardTitle>Dashboard</CardTitle>
    <CardDescription>Overview of your metrics</CardDescription>
  </CardHeader>
  <CardContent>
    Your content here
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>

// Card with accent
<Card accent="primary" variant="elevated" interactive>
  <CardContent>
    Primary card with hover effect
  </CardContent>
</Card>

// Visual hierarchy example
<Card accent="success" variant="elevated">
  <CardContent>
    Success-themed card for active status
  </CardContent>
</Card>
```

---

### Dialog

**Location**: `components/common/Dialog.tsx`

#### Features
- ✅ Built on Radix UI (accessibility)
- ✅ Focus trap
- ✅ Escape key closes
- ✅ Click outside closes
- ✅ Responsive sizing (`w-[90vw] max-w-3xl`)
- ✅ Smooth animations
- ✅ Screen reader announcements

#### Usage Example

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/common";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button variant="danger" onClick={handleConfirm}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### ConfirmDialog

**Location**: `components/common/ConfirmDialog.tsx`

#### Variants
- `danger` - Red, for destructive actions
- `warning` - Amber, for warnings
- `info` - Blue, for informational

#### Features
- ✅ Auto-focus on confirm button
- ✅ Enter key confirms
- ✅ Escape key cancels
- ✅ Loading states
- ✅ Icon indicators
- ✅ Accessible buttons

#### Usage Example

```tsx
import { ConfirmDialog } from "@/components/common";

<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  onConfirm={handleDelete}
  title="Delete Account?"
  description="This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  variant="danger"
  isLoading={isDeleting}
>
  <p>Additional warning text here</p>
</ConfirmDialog>
```

**Keyboard Shortcuts**:
- `Enter` - Confirm action
- `Escape` - Cancel/close

---

## Accessibility

### WCAG 2.1 Level AA Compliance

#### Color Contrast
All text meets WCAG AA standards:
- **Normal text**: 4.5:1 contrast ratio
- **Large text**: 3:1 contrast ratio
- **Interactive elements**: Clear focus indicators

#### Keyboard Navigation
All interactive elements are keyboard accessible:
- `Tab` - Navigate forward
- `Shift + Tab` - Navigate backward
- `Enter` / `Space` - Activate
- `Escape` - Close dialogs/modals
- `Arrow Keys` - Navigate within components

#### Screen Readers
- ✅ Semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
- ✅ ARIA labels for icon-only elements
- ✅ ARIA roles for custom components
- ✅ ARIA states (`aria-expanded`, `aria-selected`, etc.)
- ✅ Live regions for dynamic content
- ✅ Skip links for navigation

#### Focus Management
- ✅ Visible focus indicators (rings)
- ✅ Logical tab order
- ✅ Focus trap in modals
- ✅ Focus return after modal close
- ✅ Auto-focus on primary actions

---

## Keyboard Navigation

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open command palette |
| `⌘D` / `Ctrl+D` | Go to dashboard |
| `⌘S` / `Ctrl+S` | Go to sessions |
| `⌘B` / `Ctrl+B` | Go to bulk users |
| `⌘R` / `Ctrl+R` | Go to roles |
| `⌘H` / `Ctrl+H` | Go to session health |
| `⌘,` / `Ctrl+,` | Open settings |

### Dialog/Modal Shortcuts

| Shortcut | Action |
|----------|--------|
| `Escape` | Close dialog |
| `Enter` | Confirm (in ConfirmDialog) |
| `Tab` | Next focusable element |
| `Shift+Tab` | Previous focusable element |

### Form Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Submit form (when focused on input) |
| `Tab` | Next field |
| `Shift+Tab` | Previous field |

---

## Dark Mode

### Implementation

Dark mode uses Tailwind's `dark:` variant system with automatic OS detection.

### Color Adjustments

- **Background**: `white` → `slate-900`
- **Text**: `slate-900` → `white`
- **Secondary Text**: `slate-600` → `slate-400`
- **Borders**: `slate-200` → `slate-800`
- **Hover**: Slightly lighter/darker variants

### Examples

```tsx
// Light & dark background
<div className="bg-white dark:bg-slate-900">

// Light & dark text
<p className="text-slate-900 dark:text-white">

// Light & dark border
<div className="border-slate-200 dark:border-slate-800">
```

---

## Best Practices

### Component Usage

1. **Always use semantic colors**
   ```tsx
   // ✅ Good - semantic meaning
   <Badge variant="success">Active</Badge>
   
   // ❌ Bad - arbitrary color
   <span className="bg-green-500">Active</span>
   ```

2. **Provide ARIA labels for icon-only elements**
   ```tsx
   // ✅ Good
   <Button ariaLabel="Delete item">
     <Trash />
   </Button>
   
   // ❌ Bad - no label
   <Button>
     <Trash />
   </Button>
   ```

3. **Use proper heading hierarchy**
   ```tsx
   // ✅ Good
   <h1>Page Title</h1>
   <h2>Section Title</h2>
   <h3>Subsection</h3>
   
   // ❌ Bad - skipping levels
   <h1>Page Title</h1>
   <h3>Section</h3>
   ```

4. **Use loading states for async actions**
   ```tsx
   // ✅ Good
   <Button 
     isLoading={isSubmitting}
     loadingText="Saving..."
   >
     Save
   </Button>
   
   // ❌ Bad - no feedback
   <Button onClick={handleSubmit}>
     Save
   </Button>
   ```

5. **Group related actions**
   ```tsx
   // ✅ Good
   <div className="flex gap-2">
     <Button variant="outline">Cancel</Button>
     <Button variant="primary">Save</Button>
   </div>
   
   // ❌ Bad - inconsistent spacing
   <Button variant="outline">Cancel</Button>
   <Button variant="primary" className="ml-4">Save</Button>
   ```

### Accessibility Checklist

- [ ] All images have `alt` text
- [ ] All form inputs have labels
- [ ] All buttons have descriptive text or `aria-label`
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators are visible
- [ ] Color is not the only means of conveying information
- [ ] Text contrast meets WCAG AA standards
- [ ] Interactive elements have adequate touch targets (44×44px min)

---

## Component Inventory

### Common Components (`components/common/`)

✅ **Implemented & Polished**:
- `Accordion.tsx` - Expandable sections
- `Alert.tsx` - Notification messages
- `Avatar.tsx` - User profile images
- `Badge.tsx` - Status indicators (8 variants) ⭐
- `Breadcrumb.tsx` - Navigation trail
- `Button.tsx` - Interactive buttons (icons, loading) ⭐
- `Card.tsx` - Content containers (accents) ⭐
- `Checkbox.tsx` - Selection inputs
- `Combobox.tsx` - Searchable select
- `CommandPalette.tsx` - Quick navigation (enhanced) ⭐
- `ConfirmDialog.tsx` - Confirmation prompts (keyboard nav) ⭐
- `ContextMenu.tsx` - Right-click menus
- `CookieConsent.tsx` - GDPR compliance
- `DatePicker.tsx` - Date selection
- `Dialog.tsx` - Modal dialogs (enhanced) ⭐
- `DropdownMenu.tsx` - Dropdown actions
- `EmptyState.tsx` - No data states
- `HoverCard.tsx` - Hover tooltips
- `Input.tsx` - Text inputs (icons, labels, errors) ⭐
- `Label.tsx` - Form labels
- `MarkdownEditor.tsx` - Rich text editing
- `Popover.tsx` - Floating content
- `Progress.tsx` - Progress indicators
- `RadioGroup.tsx` - Radio selections
- `Select.tsx` - Dropdown selections
- `Separator.tsx` - Visual dividers
- `Skeleton.tsx` - Loading placeholders
- `Spinner.tsx` - Loading indicators
- `Switch.tsx` - Toggle switches
- `TableSkeleton.tsx` - Table loading states
- `Tabs.tsx` - Tabbed interfaces
- `Tooltip.tsx` - Contextual help

⭐ = Recently enhanced with new design system

---

## Future Enhancements

### Planned Improvements

1. **Component Variants**
   - Button: Add `warning` variant
   - Card: Add `subtle` variant
   - Badge: Add `outline` variant

2. **New Components**
   - Toast notifications (non-blocking)
   - Data tables (sortable, filterable)
   - File upload (drag & drop)
   - Multi-step wizard

3. **Documentation**
   - Interactive component playground
   - Storybook integration
   - Usage analytics

---

## Getting Help

### Resources

- **Component Code**: `components/common/`
- **Documentation**: `docs/DESIGN_SYSTEM.md` (this file)
- **Examples**: `app/admin/components-demo/page.tsx`
- **Accessibility**: `docs/ACCESSIBILITY_PHASE1_GUIDE.md`

### Support

For questions or suggestions:
1. Check component examples in demo page
2. Review component source code
3. Consult accessibility guidelines
4. Create a design system proposal

---

**Design System Status**: ✅ **Production Ready**  
**Version**: 2.0  
**Last Updated**: October 26, 2025

*Built with ❤️ for the Imaginears community*

