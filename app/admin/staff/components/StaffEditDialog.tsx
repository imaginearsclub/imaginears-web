import { memo } from "react";
import { Button, Input, Label } from "@/components/common";
import { Loader2 } from "lucide-react";

interface StaffMember {
  id: string;
  name: string | null;
  email: string | null;
}

interface StaffEditDialogProps {
  staff: StaffMember;
  minecraftName: string;
  /* eslint-disable-next-line no-unused-vars */
  onMinecraftNameChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  isPending: boolean;
}

export const StaffEditDialog = memo(function StaffEditDialog({
  staff,
  minecraftName,
  onMinecraftNameChange,
  onClose,
  onSave,
  isPending,
}: StaffEditDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-slate-300 dark:border-slate-700">
        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Edit Staff Member</h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Name</p>
            <p className="font-semibold text-slate-900 dark:text-white">{staff.name}</p>
          </div>

          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Email</p>
            <p className="font-semibold text-slate-900 dark:text-white">{staff.email}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editMinecraftName">Minecraft Username</Label>
            <Input
              id="editMinecraftName"
              type="text"
              placeholder="Steve123"
              value={minecraftName}
              onChange={(e) => onMinecraftNameChange(e.target.value)}
              disabled={isPending}
              pattern="[a-zA-Z0-9_]{3,16}"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              3-16 characters, alphanumeric and underscores only
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isPending} className="flex-1">
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

