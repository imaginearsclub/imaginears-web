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

// Feedback Components
export { Alert } from "./Alert";
export type { AlertProps } from "./Alert";

export { Spinner } from "./Spinner";
export type { SpinnerProps } from "./Spinner";

export { Tooltip, TooltipProvider } from "./Tooltip";

// Interactive Components
// (More will be added in future phases)

