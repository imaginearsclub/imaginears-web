# ContextMenu User Guide

## 🖱️ What is a ContextMenu?

A **ContextMenu** (right-click menu) provides quick access to actions on table rows. Instead of clicking the dropdown button, just right-click anywhere on the row!

---

## 📍 Where to Find Context Menus

Context menus are available on:

### 1. **Events Table** (`/admin/events`)
Right-click on any event row to:
- **Edit Event** - Modify event details
- **Publish** - Make event public
- **Unpublish** - Hide event from public view

### 2. **Applications Table** (`/admin/applications`)
Right-click on any application row to:
- **Edit Application** - View/edit details
- **View Notes** - See reviewer notes
- **Change Status** → Sub-menu with:
  - New
  - In Review
  - Approved
  - Rejected
- **Change Role** → Sub-menu with:
  - Developer
  - Imaginear
  - Guest Services
- **Delete Application** - Remove (destructive)

### 3. **Players Table** (`/admin/players`)
Right-click on any player row to:
- **Teleport to Player** - Jump to their location (only if online)
- **Mute Player** - Silence their chat
- **Kick Player** - Remove from server (destructive)

---

## ⌨️ Keyboard Navigation

All context menus support full keyboard navigation:

| Key | Action |
|-----|--------|
| **Right Click** | Open menu |
| **↑ / ↓** | Navigate up/down |
| **→** | Open sub-menu |
| **←** | Close sub-menu |
| **Enter** | Execute action |
| **Esc** | Close menu |

---

## 🎨 Visual Indicators

### Icons
Every action has an icon for quick recognition:
- ✏️ **Edit** - Pencil icon
- 👁️ **View** - Eye icon
- ✅ **Approve** - Check icon
- ❌ **Reject** - X icon
- 🗑️ **Delete** - Trash icon

### Colors
Actions are color-coded by importance:
- **Normal actions** - Default text color
- **Destructive actions** - Red text (Delete, Kick, etc.)

### Sub-menus
Actions with **→** arrow have sub-menus:
- **Change Status →** - Hover or press → to see options
- **Change Role →** - Multiple role options

---

## 🚀 Power User Tips

### 1. **Muscle Memory**
After using context menus a few times, you'll develop muscle memory for common actions:
- Right-click → Down → Enter = Quick edit
- Right-click → Down x3 → Right → Down = Change status to In Review

### 2. **No Mouse Required**
Combine with keyboard shortcuts:
1. Use `Tab` to focus on table
2. Use `↑ / ↓` to select row
3. Press `Shift + F10` or `Menu` key to open context menu
4. Navigate with arrow keys
5. Press `Enter` to execute

### 3. **Faster Than Clicking**
Context menus are **~50% faster** than:
1. Moving mouse to dropdown button
2. Clicking dropdown
3. Moving mouse to action
4. Clicking action

With context menu:
1. Right-click row
2. Click action
✅ **Done!**

---

## 🎯 Use Cases

### Bulk Status Changes
Working through applications:
1. Right-click first application
2. Change Status → Approved
3. Right-click next application
4. Repeat

Much faster than using individual dropdowns!

### Quick Player Moderation
When managing multiple players:
1. Right-click problematic player
2. Mute Player (if warning)
3. Or Kick Player (if serious)

No need to open separate moderation panel!

### Event Publishing Workflow
Preparing events for launch:
1. Right-click draft event
2. Publish
3. Event goes live immediately

One action instead of opening edit panel!

---

## 💡 Design Philosophy

### Why Context Menus?

**Traditional UI:**
```
Row → Dropdown Button → Dropdown Menu → Action
(4 interactions, lots of mouse movement)
```

**With Context Menu:**
```
Row → Right Click → Action
(2 interactions, minimal movement)
```

### Benefits
1. **Reduced Friction** - Fewer steps to common actions
2. **Spatial Efficiency** - No UI clutter from buttons
3. **Discoverable** - All actions visible in one place
4. **Accessible** - Full keyboard support
5. **Familiar** - Standard OS pattern (like File Explorer)

---

## 🧪 Try It Now!

### Quick Test
1. Go to `/admin/events`
2. Right-click on any event row
3. See the context menu appear!
4. Try navigating with arrow keys
5. Press `Esc` to close

### Challenge Yourself
Can you:
1. Edit an event using only keyboard?
2. Change an application status in <2 seconds?
3. Navigate a sub-menu without looking at the screen?

---

## 🎨 Theme Support

Context menus adapt to your theme:

### Light Mode
- White background
- Dark text
- Blue highlights on hover
- Subtle shadows

### Dark Mode
- Dark slate background
- Light text
- Slate highlights on hover
- Deeper shadows

**The theme respects your toggle**, not your OS theme! This was a critical fix in Phase 10.

---

## 🐛 Troubleshooting

### Menu Doesn't Open
- **Make sure you're right-clicking** on the table row (not the header)
- **Try clicking directly on a cell** in the row

### Menu Has Wrong Theme
- **Check your theme toggle** in the header
- **Hard refresh** (Ctrl + Shift + R) to clear cache
- **Verify** `document.documentElement.classList.contains('dark')` in console

### Actions Don't Work
- **Check permissions** - Some actions may be disabled
- **Verify the action exists** - Not all tables have all actions
- **Check console** for errors

### Keyboard Navigation Not Working
- **Focus the table** first by clicking on it
- **Some tables may require focus** on a specific row

---

## 📚 For Developers

Want to add context menus to your own tables?

### Basic Pattern
```tsx
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "@/components/common";

<ContextMenu>
  <ContextMenuTrigger asChild>
    <tr className="cursor-pointer">
      {/* Your table cells */}
    </tr>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onSelect={() => doAction()}>
      <Icon className="w-4 h-4 mr-2" />
      Action Name
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### With Sub-menu
```tsx
<ContextMenuSub>
  <ContextMenuSubTrigger>
    <Icon className="w-4 h-4 mr-2" />
    Change Status
  </ContextMenuSubTrigger>
  <ContextMenuSubContent>
    <ContextMenuItem onSelect={() => setStatus("new")}>
      New
    </ContextMenuItem>
    <ContextMenuItem onSelect={() => setStatus("approved")}>
      Approved
    </ContextMenuItem>
  </ContextMenuSubContent>
</ContextMenuSub>
```

### Destructive Action
```tsx
<ContextMenuItem 
  onSelect={() => deleteItem()}
  className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
>
  <Trash2 className="w-4 h-4 mr-2" />
  Delete
</ContextMenuItem>
```

---

## 🎉 Enjoy!

Context menus make the admin interface feel more professional and powerful. They're a small detail that makes a big difference in daily workflow!

**Pro tip**: After a week of using context menus, try going back to regular dropdown buttons. You'll realize how much faster you've become! 🚀

