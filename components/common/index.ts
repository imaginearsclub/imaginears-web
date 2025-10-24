/**
 * Common UI Components
 * 
 * Reusable, accessible components built on Radix UI primitives
 * with consistent styling and dark mode support.
 */

// Form Components
export { Input } from "./Input";
export type { InputProps } from "./Input";

export { Checkbox } from "./Checkbox";

export { 
  Select, 
  SelectValue, 
  SelectTrigger, 
  SelectContent, 
  SelectItem, 
  SelectGroup,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./Select";

// Display Components
export { Badge } from "./Badge";
export type { BadgeProps } from "./Badge";

export { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./Card";
export type { CardProps } from "./Card";

export { Avatar } from "./Avatar";
export type { AvatarProps } from "./Avatar";

export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";

// Feedback Components
export { Alert } from "./Alert";
export type { AlertProps } from "./Alert";

export { Spinner } from "./Spinner";
export type { SpinnerProps } from "./Spinner";

export { Progress } from "./Progress";
export type { ProgressProps } from "./Progress";

export { Skeleton, SkeletonText } from "./Skeleton";
export type { SkeletonProps } from "./Skeleton";

export { Tooltip, TooltipProvider } from "./Tooltip";

// Interactive Components
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./Accordion";
export { RadioGroup, RadioGroupItem } from "./RadioGroup";
export { Separator } from "./Separator";
export { Switch } from "./Switch";

// Overlay Components
export { Popover, PopoverTrigger, PopoverContent } from "./Popover";
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./Dialog";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./DropdownMenu";
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
} from "./ContextMenu";

// Advanced Components
export { CommandPalette } from "./CommandPalette";
export type { CommandItem } from "./CommandPalette";
export { Combobox } from "./Combobox";
export type { ComboboxOption } from "./Combobox";
export { DatePicker, DateRangePicker } from "./DatePicker";

// ConfirmDialog
export { ConfirmDialog } from "./ConfirmDialog";
export type { ConfirmDialogProps } from "./ConfirmDialog";

// HoverCard
export { HoverCard, HoverCardTrigger, HoverCardContent } from "./HoverCard";

// TableSkeleton
export { TableSkeleton } from "./TableSkeleton";

// MarkdownEditor
export { default as MarkdownEditor } from "./MarkdownEditor";