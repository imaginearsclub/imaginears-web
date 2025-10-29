import { useState, useTransition, useCallback, useEffect, useRef } from "react";

interface StaffMember {
  id: string;
  name: string | null;
  email: string | null;
  minecraftName: string | null;
  role: string;
  image: string | null;
  emailVerified: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    sessions: number;
    createdEvents: number;
    createdApplications: number;
  };
}

interface UseStaffActionsProps {
  /* eslint-disable-next-line no-unused-vars */
  updateAction: (formData: FormData) => Promise<{ success: boolean; message?: string }>;
  /* eslint-disable-next-line no-unused-vars */
  deleteAction: (formData: FormData) => Promise<{ success: boolean; message?: string }>;
}

export function useStaffActions({ updateAction, deleteAction }: UseStaffActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [editingMinecraftName, setEditingMinecraftName] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const clearResultAfterDelay = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setResult(null), 3000);
  }, []);

  const handleUpdate = useCallback((staffId: string, newMinecraftName: string) => {
    setResult(null);
    const formData = new FormData();
    formData.append("userId", staffId);
    formData.append("minecraftName", newMinecraftName);

    startTransition(async () => {
      try {
        const res = await updateAction(formData);
        setResult(res);
        if (res.success) {
          setSelectedStaff(null);
          clearResultAfterDelay();
        }
      } catch (error) {
        setResult({
          success: false,
          message: error instanceof Error ? error.message : "Failed to update staff member",
        });
      }
    });
  }, [updateAction, clearResultAfterDelay]);

  const handleDelete = useCallback((staffId: string) => {
    if (!confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) {
      return;
    }

    setResult(null);
    const formData = new FormData();
    formData.append("userId", staffId);

    startTransition(async () => {
      try {
        const res = await deleteAction(formData);
        setResult(res);
        if (res.success) clearResultAfterDelay();
      } catch (error) {
        setResult({
          success: false,
          message: error instanceof Error ? error.message : "Failed to delete staff member",
        });
      }
    });
  }, [deleteAction, clearResultAfterDelay]);

  const openEditDialog = useCallback((member: StaffMember) => {
    setSelectedStaff(member);
    setEditingMinecraftName(member.minecraftName || "");
    setResult(null);
  }, []);

  const closeEditDialog = useCallback(() => {
    setSelectedStaff(null);
    setEditingMinecraftName("");
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (selectedStaff) {
      handleUpdate(selectedStaff.id, editingMinecraftName);
    }
  }, [selectedStaff, editingMinecraftName, handleUpdate]);

  return {
    isPending,
    result,
    selectedStaff,
    editingMinecraftName,
    setEditingMinecraftName,
    handleUpdate,
    handleDelete,
    openEditDialog,
    closeEditDialog,
    handleSaveEdit,
  };
}

