# 🚀 New Utilities Migration Guide

This guide shows you how to use the newly installed utilities to simplify your code and improve performance.

---

## 📦 What's New

### 1. **`cn()` Utility** - Better className Management
### 2. **Sonner** - Beautiful Toast Notifications
### 3. **Radix UI Components** - Production-Ready Primitives

---

## 🎯 1. Using the `cn()` Utility

The `cn()` utility (in `lib/utils.ts`) combines `clsx` and `tailwind-merge` to intelligently merge Tailwind classes.

### **Benefits:**
- ✅ Resolves Tailwind class conflicts automatically
- ✅ Cleaner, more readable className strings
- ✅ Conditional classes without messy template literals

### **Before:**
```tsx
// ❌ Hard to read, class conflicts possible
className={`px-2 py-1 text-sm ${isActive ? 'bg-blue-500' : 'bg-gray-200'} ${disabled && 'opacity-50'}`}
```

### **After:**
```tsx
// ✅ Clean, readable, conflict-free
import { cn } from '@/lib/utils'

className={cn(
  'px-2 py-1 text-sm',
  isActive ? 'bg-blue-500' : 'bg-gray-200',
  disabled && 'opacity-50'
)}
```

### **Migration Examples:**

#### Example 1: Simple Conversion
```tsx
// BEFORE
<button className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2 rounded">

// AFTER
<button className={cn(
  'px-4 py-2 rounded',
  'bg-white dark:bg-slate-900',
  'text-slate-900 dark:text-white'
)}>
```

#### Example 2: Conditional Classes
```tsx
// BEFORE
<div className={`card ${isActive ? 'border-blue-500' : 'border-gray-300'} ${loading && 'opacity-50'}`}>

// AFTER
<div className={cn(
  'card',
  isActive ? 'border-blue-500' : 'border-gray-300',
  loading && 'opacity-50'
)}>
```

#### Example 3: Component Props with className Override
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  className?: string
  children: React.ReactNode
}

function Button({ variant = 'primary', className, children }: ButtonProps) {
  return (
    <button className={cn(
      // Base styles
      'px-4 py-2 rounded-lg font-medium transition-colors',
      // Variant styles
      variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600',
      variant === 'secondary' && 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      // User override (will properly merge/override)
      className
    )}>
      {children}
    </button>
  )
}

// Usage:
<Button variant="primary" className="shadow-lg">
  // Result: Base + primary + shadow-lg, all properly merged!
</Button>
```

---

## 🔔 2. Using Sonner Toast Notifications

Sonner is already configured in `app/layout.tsx`. Just import and use!

### **Benefits:**
- ✅ Beautiful, accessible toasts
- ✅ Auto-dismiss with progress bar
- ✅ Promise-based toasts (show loading → success/error)
- ✅ Rich colors for different states
- ✅ Only 3KB gzipped

### **Basic Usage:**

```tsx
import { toast } from 'sonner'

// Success toast
toast.success('Event created successfully!')

// Error toast
toast.error('Failed to save changes')

// Info toast
toast.info('Your session will expire in 5 minutes')

// Warning toast
toast.warning('This action cannot be undone')

// Loading toast
toast.loading('Processing...')
```

### **Promise-Based Toasts (Recommended):**

```tsx
import { toast } from 'sonner'

// Automatically shows loading → success/error
async function handleSubmit() {
  toast.promise(
    fetch('/api/events', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    {
      loading: 'Creating event...',
      success: 'Event created successfully!',
      error: 'Failed to create event',
    }
  )
}
```

### **Migration Examples:**

#### Example 1: Replace `alert()`
```tsx
// BEFORE ❌
if (!res.ok) {
  alert("Something went wrong");
  return;
}

// AFTER ✅
if (!res.ok) {
  toast.error("Something went wrong");
  return;
}
```

#### Example 2: Replace Inline Error Messages
```tsx
// BEFORE ❌
const [errorMsg, setErrorMsg] = useState("")

async function save() {
  try {
    const res = await fetch('/api/save')
    if (!res.ok) throw new Error('Failed')
    setErrorMsg('')
  } catch (e) {
    setErrorMsg('Failed to save')
  }
}

return (
  <div>
    {errorMsg && <div className="error">{errorMsg}</div>}
    <button onClick={save}>Save</button>
  </div>
)

// AFTER ✅
async function save() {
  toast.promise(
    fetch('/api/save'),
    {
      loading: 'Saving...',
      success: 'Saved successfully!',
      error: 'Failed to save',
    }
  )
}

return <button onClick={save}>Save</button>
```

#### Example 3: Complex Promise with Custom Messages
```tsx
async function deleteEvent(id: string) {
  toast.promise(
    fetch(`/api/events/${id}`, { method: 'DELETE' }),
    {
      loading: 'Deleting event...',
      success: (data) => `Event "${data.title}" deleted successfully`,
      error: (err) => `Failed to delete: ${err.message}`,
    }
  )
}
```

#### Example 4: Manual Control
```tsx
async function processData() {
  const toastId = toast.loading('Processing data...')
  
  try {
    await someAsyncOperation()
    toast.success('Data processed!', { id: toastId })
  } catch (error) {
    toast.error('Processing failed', { id: toastId })
  }
}
```

---

## 🎨 3. Current Implementations

### **RowActions Component** (Already Updated!)
Check `components/admin/RowActions.tsx` to see:
- ✅ `cn()` for clean className management
- ✅ `toast.promise()` for action feedback
- ✅ Radix UI Dropdown for better UX

### **Key Changes:**
```tsx
// OLD: Long className string
className="inline-flex items-center justify-center w-8 h-8 rounded-lg border..."

// NEW: Organized with cn()
className={cn(
  "inline-flex items-center justify-center w-8 h-8 rounded-lg",
  "border border-slate-300 dark:border-slate-700",
  "bg-white dark:bg-slate-800",
  // ... more organized classes
)}

// OLD: console.error
catch (error) {
  console.error(`Failed to ${actionName}:`, error);
}

// NEW: User-friendly toast
toast.promise(action, {
  loading: 'Muting player...',
  success: 'Player muted successfully',
  error: 'Failed to mute player'
})
```

---

## 📝 Recommended Migration Order

### **Phase 1: Quick Wins (This Week)**
1. ✅ **Done:** `cn()` utility created
2. ✅ **Done:** Sonner configured in layout
3. ✅ **Done:** RowActions updated as example
4. **TODO:** Replace all `alert()` calls with `toast.error()` or `toast.success()`
5. **TODO:** Update 2-3 more components to use `cn()`

### **Phase 2: Components (Next Week)**
6. Update `PlayerTable.tsx` to use `cn()`
7. Update `Sidebar.tsx` to use `cn()`
8. Update `SignOutButton.tsx` with toast feedback
9. Update form components to use toast for validation errors

### **Phase 3: Drawers (Week 3)**
10. Replace `CreateEventDrawer` with Radix Dialog
11. Replace `EditEventDrawer` with Radix Dialog
12. Replace `EditApplicationDrawer` with Radix Dialog

---

## 🔧 Tips & Best Practices

### **`cn()` Tips:**
1. Group related classes together
2. Put conditional classes at the end
3. One class category per line for readability

```tsx
className={cn(
  // Layout
  'flex items-center gap-2',
  // Spacing
  'px-4 py-2',
  // Colors
  'bg-white dark:bg-slate-900',
  'text-slate-900 dark:text-white',
  // States
  'hover:bg-gray-100',
  // Conditional
  isActive && 'border-blue-500',
  disabled && 'opacity-50 cursor-not-allowed'
)}
```

### **Toast Tips:**
1. Use `toast.promise()` for async operations
2. Keep messages short and actionable
3. Use appropriate types (success/error/warning/info)
4. Don't over-use - only for important user feedback

```tsx
// ✅ Good
toast.success('Event created!')

// ❌ Too verbose
toast.success('Your event has been successfully created and saved to the database')

// ✅ Better for errors
toast.error('Failed to save. Please try again.')

// ❌ Not helpful
toast.error('Error occurred')
```

---

## 🎯 Next Steps

1. **Try it now:** Find a component with complex className strings and refactor it with `cn()`
2. **Replace alerts:** Search for `alert(` in your codebase and replace with `toast.error(` or `toast.success(`
3. **Watch for improvements:** Your code will be cleaner, more maintainable, and more user-friendly!

---

## 📚 Documentation Links

- **Sonner:** https://sonner.emilkowal.ski/
- **clsx:** https://github.com/lukeed/clsx
- **tailwind-merge:** https://github.com/dcastil/tailwind-merge
- **Radix UI:** https://www.radix-ui.com/

---

## 🐛 Troubleshooting

### **Toast not showing?**
Make sure `<Toaster />` is in your `app/layout.tsx` (already done!)

### **Classes not merging correctly?**
Make sure you're using `cn()` from `@/lib/utils`, not plain string concatenation

### **Need help?**
Check the updated `RowActions.tsx` component for real-world examples!

