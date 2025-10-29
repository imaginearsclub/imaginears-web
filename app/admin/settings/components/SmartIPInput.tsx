import { memo, useState, useCallback, useMemo } from "react";
import { Input } from "@/components/common";
import { Badge } from "@/components/common/Badge";
import { X, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import IPCIDR from "ip-cidr";

interface SmartIPInputProps {
  value: string[];
  /* eslint-disable-next-line no-unused-vars */
  onChange: (ips: string[]) => void;
  placeholder?: string;
}

const isValidIP = (ip: string): boolean => {
  try {
    // Support both single IPs and CIDR notation (e.g., 192.168.1.0/24)
    const ipWithCIDR = ip.includes('/') ? ip : `${ip}/32`;
    const cidr = new IPCIDR(ipWithCIDR);
    // If constructor succeeds, the IP/CIDR is valid
    return !!cidr;
  } catch {
    return false;
  }
};

export const SmartIPInput = memo(function SmartIPInput({ value, onChange, placeholder }: SmartIPInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = useCallback(() => {
    if (!inputValue.trim()) return;
    
    const newIPs = inputValue
      .split(/[,\s]+/)
      .map(ip => ip.trim())
      .filter(ip => ip && !value.includes(ip));
    
    if (newIPs.length > 0) {
      onChange([...value, ...newIPs]);
      setInputValue("");
    }
  }, [inputValue, value, onChange]);

  const handleRemove = useCallback((ip: string) => {
    onChange(value.filter(existingIP => existingIP !== ip));
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }, [handleAdd, inputValue, value, onChange]);

  const validationStatus = useMemo(() => {
    if (!inputValue.trim()) return null;
    const ips = inputValue.split(/[,\s]+/).map(ip => ip.trim()).filter(Boolean);
    const allValid = ips.every(isValidIP);
    const anyValid = ips.some(isValidIP);
    return { allValid, anyValid, count: ips.length };
  }, [inputValue]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAdd}
          placeholder={placeholder || "192.168.1.1 or 192.168.0.0/24 (press Enter or comma to add)"}
          className={cn(
            validationStatus?.allValid === false && "border-red-500 focus:ring-red-500",
            validationStatus?.allValid === true && "border-green-500 focus:ring-green-500"
          )}
        />
        {validationStatus && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {validationStatus.allValid ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
        )}
      </div>

      {validationStatus && !validationStatus.allValid && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Invalid IP format. Use IPv4 (192.168.1.1), IPv6, or CIDR notation (192.168.0.0/24).
        </p>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((ip) => {
            const valid = isValidIP(ip);
            return (
              <Badge
                key={ip}
                variant={valid ? "success" : "danger"}
                className="pl-2 pr-1 py-1 flex items-center gap-1.5"
              >
                {valid ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                <span className="font-mono text-xs">{ip}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(ip)}
                  className="ml-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${ip}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
});

