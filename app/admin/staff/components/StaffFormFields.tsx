import { memo } from "react";
import { Input } from "@/components/common";
import { User, Mail, Gamepad2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffFormFieldsProps {
  minecraftName: string;
  /* eslint-disable-next-line no-unused-vars */
  onMinecraftNameChange: (value: string) => void;
  disabled?: boolean;
}

const ROLES = [
  { value: "STAFF", label: "Staff" },
  { value: "MODERATOR", label: "Moderator" },
  { value: "ADMIN", label: "Admin" },
  { value: "OWNER", label: "Owner" },
] as const;

export const StaffFormFields = memo(function StaffFormFields({ 
  minecraftName, 
  onMinecraftNameChange, 
  disabled 
}: StaffFormFieldsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Input
        id="name"
        name="name"
        type="text"
        label="Full Name"
        placeholder="John Doe"
        leftIcon={<User />}
        required
        disabled={disabled}
        helperText="Staff member's legal or display name"
      />

      <Input
        id="email"
        name="email"
        type="email"
        label="Email Address"
        placeholder="john.doe@imaginears.club"
        leftIcon={<Mail />}
        required
        disabled={disabled}
        helperText="Used for login and notifications"
      />

      <Input
        id="minecraftName"
        name="minecraftName"
        type="text"
        label="Minecraft Username"
        placeholder="Steve123"
        leftIcon={<Gamepad2 />}
        value={minecraftName}
        onChange={(e) => onMinecraftNameChange(e.target.value)}
        disabled={disabled}
        pattern="[a-zA-Z0-9_]{3,16}"
        helperText="3-16 characters, alphanumeric and underscores only"
      />

      <div className="space-y-2">
        <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Role <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <select
            id="role"
            name="role"
            required
            disabled={disabled}
            className={cn(
              "w-full rounded-xl border-2 pl-10 pr-4 py-2.5 outline-none transition-all duration-200",
              "bg-white dark:bg-slate-900",
              "border-slate-300 dark:border-slate-700",
              "text-slate-700 dark:text-slate-300",
              "hover:border-slate-400 dark:hover:border-slate-600",
              "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Determines permissions and access level
        </p>
      </div>
    </div>
  );
});

