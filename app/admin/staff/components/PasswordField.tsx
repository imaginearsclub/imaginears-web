import { memo, useCallback } from "react";
import { Input, Button } from "@/components/common";
import { Key } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordFieldProps {
  value: string;
  /* eslint-disable-next-line no-unused-vars */
  onChange: (value: string) => void;
  disabled?: boolean;
}

const getPasswordStrength = (password: string) => {
  if (password.length >= 12) return "strong";
  if (password.length >= 8) return "medium";
  return "weak";
};

const generateSecurePassword = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
};

export const PasswordField = memo(function PasswordField({ value, onChange, disabled }: PasswordFieldProps) {
  const handleGenerate = useCallback(() => {
    onChange(generateSecurePassword());
  }, [onChange]);

  const strength = getPasswordStrength(value);

  return (
    <div className="space-y-3">
      <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Initial Password <span className="text-red-500 ml-1">*</span>
      </label>
      <div className="flex gap-2">
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Minimum 8 characters"
          leftIcon={<Key />}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={8}
          disabled={disabled}
          containerClassName="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleGenerate}
          disabled={disabled}
          ariaLabel="Generate secure random password"
        >
          Generate
        </Button>
      </div>
      {value && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                strength === "strong" && "w-full bg-green-500",
                strength === "medium" && "w-2/3 bg-amber-500",
                strength === "weak" && "w-1/3 bg-red-500"
              )}
            />
          </div>
          <span className={cn(
            "text-xs font-medium capitalize",
            strength === "strong" && "text-green-600 dark:text-green-400",
            strength === "medium" && "text-amber-600 dark:text-amber-400",
            strength === "weak" && "text-red-600 dark:text-red-400"
          )}>
            {strength}
          </span>
        </div>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        The staff member will use this password to log in. Make sure to securely share it with them.
      </p>
    </div>
  );
});

