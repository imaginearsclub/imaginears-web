"use client";

import { useState, useMemo, memo } from "react";
import { ResultMessage } from "./ResultMessage";
import { StaffFilters } from "./StaffFilters";
import { StaffTable } from "./StaffTable";
import { StaffEditDialog } from "./StaffEditDialog";
import { useStaffActions } from "../hooks/useStaffActions";

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

interface StaffListProps {
  staff: StaffMember[];
  currentUserId: string;
  /* eslint-disable-next-line no-unused-vars */
  updateAction: (formData: FormData) => Promise<{ success: boolean; message?: string }>;
  /* eslint-disable-next-line no-unused-vars */
  deleteAction: (formData: FormData) => Promise<{ success: boolean; message?: string }>;
}

export const StaffList = memo(function StaffList({ staff, currentUserId, updateAction, deleteAction }: StaffListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");

  const {
    isPending,
    result,
    selectedStaff,
    editingMinecraftName,
    setEditingMinecraftName,
    handleDelete,
    openEditDialog,
    closeEditDialog,
    handleSaveEdit,
  } = useStaffActions({ updateAction, deleteAction });

  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      const matchesSearch = !searchQuery || 
        member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.minecraftName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = filterRole === "ALL" || member.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [staff, searchQuery, filterRole]);

  return (
    <div className="space-y-4">
      {result && <ResultMessage success={result.success} message={result.message || ""} />}

      <StaffFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterRole={filterRole}
        onRoleChange={setFilterRole}
      />

      <StaffTable
        staff={filteredStaff}
        currentUserId={currentUserId}
        isPending={isPending}
        searchQuery={searchQuery}
        filterRole={filterRole}
        onEdit={openEditDialog}
        onDelete={handleDelete}
      />

      {selectedStaff && (
        <StaffEditDialog
          staff={selectedStaff}
          minecraftName={editingMinecraftName}
          onMinecraftNameChange={setEditingMinecraftName}
          onClose={closeEditDialog}
          onSave={handleSaveEdit}
          isPending={isPending}
        />
      )}
    </div>
  );
});
