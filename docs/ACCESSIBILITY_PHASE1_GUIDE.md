# Accessibility Phase 1 - Implementation Guide

**Date**: October 26, 2025  
**Goal**: WCAG 2.1 AA Compliance  
**Status**: 🚧 In Progress

---

## 🎯 **Accessibility Audit Results**

### **Current State**
- ✅ Some components have ARIA labels (Breadcrumb, Sidebar, CommandPalette)
- ⚠️ Missing ARIA attributes in core components (Button, Input, Card, Dialog)
- ⚠️ Missing keyboard navigation in some modals
- ⚠️ Missing focus management
- ⚠️ Missing ARIA live regions for dynamic content

**ARIA Attributes Found**: 32 across 13 files  
**Coverage**: ~60% (needs improvement to 100%)

---

## 📋 **WCAG 2.1 AA Requirements**

###Element **Perceivable**
- ✅ Text alternatives (alt text, ARIA labels)
- ⚠️ Adaptable content (semantic HTML)
- ✅ Distinguishable (color contrast, text spacing)

### **Operable**
- ⚠️ Keyboard accessible (all functionality via keyboard)
- ⚠️ Enough time (no time limits or adjustable)
- ⚠️ Navigable (skip links, focus indicators)

### **Understandable**
- ⚠️ Readable (clear language, abbreviations explained)
- ⚠️ Predictable (consistent navigation)
- ⚠️ Input assistance (error identification, labels)

### **Robust**
- ✅ Compatible (valid HTML, ARIA)

---

## 🔧 **Components Needing ARIA Improvements**

### **Priority 1 - Critical (Forms & Inputs)**

#### **1. Button Component**
**File**: `components/common/Button.tsx`

**Current Issues**:
- No `aria-label` for icon-only buttons
- No `aria-pressed` for toggle buttons
- No `aria-expanded` for dropdown triggers
- No `aria-busy` for loading states

**Improvements Needed**:
```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "success" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;          // NEW: Loading state
  loadingText?: string;          // NEW: Loading text
  leftIcon?: React.ReactNode;   // NEW: Icon support
  rightIcon?: React.ReactNode;  // NEW: Icon support
}

<button
  ref={ref}
  aria-busy={isLoading}
  aria-disabled={disabled || isLoading}
  aria-label={ariaLabel}
  {...props}
>
  {leftIcon}
  {isLoading ? loadingText || children : children}
  {rightIcon}
</button>
```

---

#### **2. Input Component**
**File**: `components/common/Input.tsx`

**Current Issues**:
- No `aria-label` or `aria-labelledby`
- No `aria-describedby` for helper text/errors
- No `aria-invalid` for error states
- No `aria-required` for required fields

**Improvements Needed**:
```typescript
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;   // NEW
  rightIcon?: React.ReactNode;  // NEW
}

<div>
  {label && (
    <Label htmlFor={id} required={required}>
      {label}
    </Label>
  )}
  <input
    id={id}
    ref={ref}
    aria-label={label || ariaLabel}
    aria-describedby={`${id}-helper ${id}-error`}
    aria-invalid={!!error}
    aria-required={required}
    {...props}
  />
  {helperText && (
    <p id={`${id}-helper`} className="text-sm text-slate-500">
      {helperText}
    </p>
  )}
  {error && (
    <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
      {error}
    </p>
  )}
</div>
```

---

#### **3. Dialog/Modal Component**
**File**: `components/common/Dialog.tsx`

**Current Issues**:
- Focus trap may not be working properly
- No `aria-labelledby` connecting title to dialog
- No `aria-describedby` for description
- Missing focus restoration on close

**Improvements Needed**:
```typescript
// Radix UI Dialog already handles most ARIA, but ensure:
<DialogContent
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  onOpenAutoFocus={(e) => {
    // Focus first interactive element
  }}
  onCloseAutoFocus={(e) => {
    // Restore focus to trigger
  }}
>
  <DialogTitle id="dialog-title">...</DialogTitle>
  <DialogDescription id="dialog-description">...</DialogDescription>
</DialogContent>
```

---

### **Priority 2 - High (Navigation & Feedback)**

#### **4. Alert Component**
**File**: `components/common/Alert.tsx`

**Current Issues**:
- Some alerts don't have `role="alert"`
- Missing `aria-live` for dynamic alerts
- No `aria-atomic` for screen readers

**Improvements Needed**:
```typescript
<div
  role={variant === "error" ? "alert" : "status"}
  aria-live={dismissible ? "polite" : "assertive"}
  aria-atomic="true"
  className={...}
>
  {children}
</div>
```

---

#### **5. Breadcrumb Component**
**File**: `components/common/Breadcrumb.tsx`

**Status**: ✅ **Already Good!**
- Has `aria-label="Breadcrumb"`
- Has `aria-current="page"` on last item
- Icons have `aria-hidden="true"`

**No changes needed** - this is a good example!

---

#### **6. Sidebar Navigation**
**File**: `components/admin/Sidebar.tsx`

**Status**: ✅ **Mostly Good**
- Has `aria-label="Main navigation"`
- Has `aria-current="page"` on active items
- Icons have `aria-hidden="true"`

**Minor Improvements**:
- Add `aria-expanded` to submenu toggles
- Add `aria-controls` linking toggle to submenu

```typescript
<button
  onClick={() => setIsOpen(!isOpen)}
  aria-expanded={isOpen}
  aria-controls={`submenu-${id}`}
>
  {label}
  <ChevronDown />
</button>
<div id={`submenu-${id}`} aria-hidden={!isOpen}>
  {/* Submenu items */}
</div>
```

---

### **Priority 3 - Medium (Data Display)**

#### **7. Card Component**
**File**: `components/common/Card.tsx`

**Current Issues**:
- Interactive cards missing `role="article"` or `role="button"`
- No `aria-label` for card context
- No focus indicator for interactive cards

**Improvements Needed**:
```typescript
export interface CardProps {
  children: ReactNode;
  variant?: "default" | "bordered" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
  onClick?: () => void;
  ariaLabel?: string;  // NEW
  className?: string;
}

<div
  role={interactive ? (onClick ? "button" : "article") : undefined}
  tabIndex={interactive && onClick ? 0 : undefined}
  onClick={onClick}
  onKeyDown={(e) => {
    if (interactive && onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  }}
  aria-label={ariaLabel}
  className={...}
>
  {children}
</div>
```

---

#### **8. Badge Component**
**File**: `components/common/Badge.tsx`

**Current Issues**:
- No `aria-label` for status badges
- No `role="status"` for live updates

**Improvements Needed**:
```typescript
<span
  role="status"
  aria-label={`Status: ${children}`}
  className={...}
>
  {children}
</span>
```

---

#### **9. Spinner Component**
**File**: `components/common/Spinner.tsx`

**Current Issues**:
- Missing `role="status"`
- Missing `aria-label="Loading"`
- No `aria-live` for screen readers

**Improvements Needed**:
```typescript
<div
  role="status"
  aria-label={label || "Loading"}
  aria-live="polite"
  className={...}
>
  <svg className="animate-spin" aria-hidden="true">
    {/* SVG content */}
  </svg>
  <span className="sr-only">{label || "Loading"}</span>
</div>
```

---

#### **10. Table Components**
**Files**: `components/admin/*.tsx` (Various tables)

**Current Issues**:
- Missing `aria-label` on tables
- Missing `aria-sort` on sortable columns
- No `aria-rowcount` for large tables
- No `aria-selected` for selectable rows

**Improvements Needed**:
```typescript
<table aria-label="User list">
  <thead>
    <tr>
      <th
        aria-sort={sortDirection}
        onClick={() => handleSort("name")}
      >
        Name
      </th>
    </tr>
  </thead>
  <tbody>
    <tr aria-selected={isSelected}>
      <td>...</td>
    </tr>
  </tbody>
</table>
```

---

## ⌨️ **Keyboard Navigation Requirements**

### **General Rules**
- ✅ All interactive elements must be keyboard accessible
- ✅ Logical tab order (use `tabIndex` sparingly)
- ✅ Focus indicators visible (outline, ring)
- ✅ Escape key closes modals/dropdowns
- ✅ Arrow keys navigate menus/comboboxes
- ✅ Enter/Space activates buttons

### **Keyboard Shortcuts Summary**
| Key | Action |
|-----|--------|
| `Tab` | Move focus forward |
| `Shift + Tab` | Move focus backward |
| `Enter` | Activate button/link |
| `Space` | Activate button, toggle checkbox |
| `Escape` | Close modal/dropdown |
| `Arrow Keys` | Navigate menus, select options |
| `Home/End` | Jump to first/last item |

---

## 🎨 **Focus Management**

### **Focus Indicators**
All interactive elements need visible focus indicators:

```css
.focus-visible:focus {
  outline: 2px solid var(--brand-start);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### **Focus Traps**
Modals must trap focus within:

```typescript
// Using Radix UI Dialog (already handles this)
<Dialog.Root>
  <Dialog.Trigger />
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content
      onOpenAutoFocus={(e) => {
        // Focus first focusable element
        const firstFocusable = e.currentTarget.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
          e.preventDefault();
          (firstFocusable as HTMLElement).focus();
        }
      }}
    >
      {/* Content */}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

---

## 📊 **Screen Reader Support**

### **ARIA Live Regions**
For dynamic content updates:

```typescript
// Toast notifications
<div role="status" aria-live="polite" aria-atomic="true">
  {notification}
</div>

// Error messages
<div role="alert" aria-live="assertive" aria-atomic="true">
  {error}
</div>

// Loading states
<div role="status" aria-live="polite">
  <span className="sr-only">Loading...</span>
</div>
```

### **Screen Reader Only Text**
Use for icons and visual-only indicators:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

```typescript
<button>
  <TrashIcon aria-hidden="true" />
  <span className="sr-only">Delete item</span>
</button>
```

---

## ✅ **Implementation Checklist**

### **Phase 1A: Core Components**
- [ ] Update Button with ARIA support
- [ ] Update Input with comprehensive ARIA
- [ ] Update Dialog focus management
- [ ] Update Alert with role/aria-live
- [ ] Update Spinner with status role

### **Phase 1B: Navigation**
- [ ] Enhance Sidebar submenu ARIA
- [ ] Add Card keyboard support
- [ ] Add Table ARIA attributes
- [ ] Add Badge status roles

### **Phase 1C: Forms**
- [ ] Add Checkbox ARIA labels
- [ ] Add Select ARIA support
- [ ] Add RadioGroup ARIA
- [ ] Add DatePicker keyboard nav

### **Phase 1D: Testing**
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Test keyboard-only navigation
- [ ] Run automated accessibility audit (axe, Lighthouse)
- [ ] Test with different zoom levels (200%, 400%)
- [ ] Test color contrast (all text meets 4.5:1)

---

## 🧪 **Testing Tools**

1. **Automated**:
   - Chrome Lighthouse (Accessibility audit)
   - axe DevTools browser extension
   - WAVE browser extension

2. **Manual**:
   - NVDA (Windows screen reader)
   - JAWS (Windows screen reader)
   - VoiceOver (Mac screen reader)
   - Keyboard-only navigation

3. **CI/CD**:
   - `@axe-core/react` for Jest/Playwright tests
   - `jest-axe` for automated accessibility testing

---

## 📈 **Success Metrics**

- [ ] 100% WCAG 2.1 AA compliance
- [ ] Zero automated accessibility errors
- [ ] All interactive elements keyboard accessible
- [ ] All form inputs properly labeled
- [ ] All modals have focus traps
- [ ] All dynamic content has ARIA live regions
- [ ] Lighthouse accessibility score: 100

---

**Next Steps**:
1. Start with Priority 1 components (Button, Input, Dialog)
2. Add comprehensive ARIA attributes
3. Test with keyboard and screen reader
4. Move to Priority 2 and 3
5. Run full accessibility audit

**Last Updated**: October 26, 2025  
**Status**: Ready for implementation

