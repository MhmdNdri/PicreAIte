"use client";

import { useState } from "react";
import {
  usePrompts,
  useCreatePrompt,
  useUpdatePrompt,
  useDeletePrompt,
} from "@/features/prompts/db/cache";
import { PromptTable } from "@/drizzle/schema";
import { Loader2, Pencil, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type Prompt = typeof PromptTable.$inferSelect;
type PromptFormData = Partial<typeof PromptTable.$inferInsert>;

// Form Input Component
const FormInput = ({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  placeholder = "",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full p-2 border rounded-md shadow-sm ${className}`}
      disabled={disabled}
      placeholder={placeholder}
    />
  </div>
);

// Form Textarea Component
const FormTextarea = ({
  label,
  value,
  onChange,
  disabled = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full p-2 border rounded-md shadow-sm ${className}`}
      disabled={disabled}
    />
  </div>
);

// Action Button Component
const ActionButton = ({
  onClick,
  disabled,
  loading,
  variant = "primary",
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  variant?: "primary" | "secondary" | "danger";
  children: React.ReactNode;
}) => {
  const baseStyles =
    "px-4 py-2 rounded-md flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow";
  const variantStyles = {
    primary: "bg-[#00F5FF] text-[#1A1E33] hover:bg-[#00F5FF]/90",
    secondary: "bg-gray-500 text-white hover:bg-gray-600",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]}`}
      disabled={disabled}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Prompt Form Component
const PromptForm = ({
  data,
  onChange,
  onSubmit,
  onCancel,
  isLoading,
  isEditing = false,
}: {
  data: PromptFormData;
  onChange: (data: PromptFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isEditing?: boolean;
}) => (
  <div className="space-y-4">
    <FormInput
      label="Name"
      value={data.name || ""}
      onChange={(value) => onChange({ ...data, name: value })}
      disabled={isLoading}
    />
    <FormInput
      label="Type"
      value={data.type || ""}
      onChange={(value) => onChange({ ...data, type: value })}
      disabled={isLoading}
    />
    <FormInput
      label="Image URL"
      value={data.imageUrl || ""}
      onChange={(value) => onChange({ ...data, imageUrl: value })}
      type="url"
      disabled={isLoading}
      placeholder="https://example.com/image.jpg"
    />
    <FormTextarea
      label="Prompt Description"
      value={data.promptDesc || ""}
      onChange={(value) => onChange({ ...data, promptDesc: value })}
      disabled={isLoading}
      className="h-72"
    />
    <div className="flex gap-2">
      <ActionButton
        onClick={onSubmit}
        disabled={isLoading}
        loading={isLoading}
        variant="primary"
      >
        {isEditing ? "Apply" : "Create"}
      </ActionButton>
      <ActionButton
        onClick={onCancel}
        disabled={isLoading}
        loading={false}
        variant="secondary"
      >
        Cancel
      </ActionButton>
    </div>
  </div>
);

// Prompt Card Component
const PromptCard = ({
  prompt,
  onEdit,
  onDelete,
  isEditing,
  editingData,
  onEditingChange,
  onUpdate,
  onCancelEdit,
  isUpdating,
  isDeleting,
}: {
  prompt: Prompt;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  editingData: PromptFormData | null;
  onEditingChange: (data: PromptFormData) => void;
  onUpdate: () => void;
  onCancelEdit: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) => (
  <div className="p-6 bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md rounded-lg border border-gray-200/10 dark:border-gray-700/10 shadow-lg dark:shadow-none hover:shadow-xl transition-shadow">
    {isEditing ? (
      <PromptForm
        data={editingData || prompt}
        onChange={onEditingChange}
        onSubmit={onUpdate}
        onCancel={onCancelEdit}
        isLoading={isUpdating}
        isEditing
      />
    ) : (
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          {prompt.imageUrl && (
            <div className="w-32 h-32 flex-shrink-0">
              <img
                src={prompt.imageUrl}
                alt={prompt.name}
                className="w-full h-full object-cover rounded-lg shadow-sm"
              />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold">{prompt.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {prompt.type}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {prompt.promptDesc}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-blue-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            disabled={isUpdating}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    )}
  </div>
);

export default function PromptsPage() {
  const { logout } = useAuth();
  const { data: prompts, isLoading } = usePrompts();
  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt();
  const deletePrompt = useDeletePrompt();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [newPrompt, setNewPrompt] = useState<PromptFormData>({
    name: "",
    type: "",
    promptDesc: "",
    imageUrl: "",
  });

  const handleCreatePrompt = async () => {
    try {
      await createPrompt.mutateAsync(
        newPrompt as typeof PromptTable.$inferInsert
      );
      setIsCreating(false);
      setNewPrompt({
        name: "",
        type: "",
        promptDesc: "",
        imageUrl: "",
      });
    } catch (error) {
      console.error("Failed to create prompt:", error);
    }
  };

  const handleUpdatePrompt = async () => {
    if (!editingPrompt) return;
    try {
      await updatePrompt.mutateAsync(editingPrompt);
      setEditingId(null);
      setEditingPrompt(null);
    } catch (error) {
      console.error("Failed to update prompt:", error);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      await deletePrompt.mutateAsync({ id });
    } catch (error) {
      console.error("Failed to delete prompt:", error);
    }
  };

  const startEditing = (prompt: Prompt) => {
    setEditingId(prompt.id);
    setEditingPrompt({ ...prompt });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Prompts</h1>
        <div className="flex gap-2">
          <ActionButton
            onClick={() => setIsCreating(true)}
            disabled={createPrompt.isPending}
            loading={createPrompt.isPending}
            variant="primary"
          >
            Create New Prompt
          </ActionButton>
          <ActionButton
            onClick={logout}
            disabled={false}
            loading={false}
            variant="danger"
          >
            Logout
          </ActionButton>
        </div>
      </div>

      {isCreating && (
        <div className="mb-8 p-6 bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md rounded-lg border border-gray-200/10 dark:border-gray-700/10 shadow-lg dark:shadow-none">
          <h2 className="text-xl font-semibold mb-4">Create New Prompt</h2>
          <PromptForm
            data={newPrompt}
            onChange={setNewPrompt}
            onSubmit={handleCreatePrompt}
            onCancel={() => setIsCreating(false)}
            isLoading={createPrompt.isPending}
          />
        </div>
      )}

      <div className="grid gap-4">
        {prompts?.map((prompt: Prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onEdit={() => startEditing(prompt)}
            onDelete={() => handleDeletePrompt(prompt.id)}
            isEditing={editingId === prompt.id}
            editingData={editingPrompt}
            onEditingChange={(data) => setEditingPrompt(data as Prompt)}
            onUpdate={handleUpdatePrompt}
            onCancelEdit={() => {
              setEditingId(null);
              setEditingPrompt(null);
            }}
            isUpdating={updatePrompt.isPending}
            isDeleting={deletePrompt.isPending}
          />
        ))}
      </div>
    </div>
  );
}
