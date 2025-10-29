"use client";

import { useState, useTransition, useCallback, memo } from "react";
import { Button, Alert } from "@/components/common";
import { UserPlus } from "lucide-react";
import { PasswordField } from "./PasswordField";
import { RoleDescriptions } from "./RoleDescriptions";
import { StaffFormFields } from "./StaffFormFields";

interface CreateStaffFormProps {
  /* eslint-disable-next-line no-unused-vars */
  action: (formData: FormData) => Promise<{ success: boolean; message?: string; userId?: string | undefined }>;
}

export const CreateStaffForm = memo(function CreateStaffForm({ action }: CreateStaffFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [password, setPassword] = useState("");
  const [minecraftName, setMinecraftName] = useState("");

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await action(formData);
        setResult(res);
        
        if (res.success) {
          e.currentTarget.reset();
          setPassword("");
          setMinecraftName("");
        }
      } catch (error) {
        setResult({
          success: false,
          message: error instanceof Error ? error.message : "Failed to create staff member",
        });
      }
    });
  }, [action]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {result && (
        <Alert 
          variant={result.success ? "success" : "error"}
          dismissible
          onDismiss={() => setResult(null)}
        >
          {result.message}
        </Alert>
      )}

      <StaffFormFields
        minecraftName={minecraftName}
        onMinecraftNameChange={setMinecraftName}
        disabled={isPending}
      />

      <PasswordField value={password} onChange={setPassword} disabled={isPending} />

      <RoleDescriptions />

      <div className="flex justify-end">
        <Button 
          type="submit" 
          variant="primary"
          size="lg"
          isLoading={isPending}
          loadingText="Creating Staff Member..."
          leftIcon={<UserPlus />}
          ariaLabel="Create new staff member"
        >
          Create Staff Member
        </Button>
      </div>
    </form>
  );
});

