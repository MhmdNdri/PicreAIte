"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export function ApiKeyManager() {
  const { user } = useUser();
  const [newApiKey, setNewApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: apiKey,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["apiKey", user?.id],
    queryFn: async () => {
      try {
        const response = await fetch("/api/user/api-key");

        if (response.status === 404) {
          // Not an error, just means the user hasn't set an API key yet
          return null;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch API key");
        }

        const data = await response.json();
        return data.apiKey;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!user?.id,
    retry: false,
  });

  // Save API key mutation
  const { mutate: setApiKey, isPending: isSaving } = useMutation({
    mutationFn: async (apiKey: string) => {
      const response = await fetch("/api/user/api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        throw new Error("Failed to save API key");
      }

      return response.text();
    },
    onSuccess: () => {
      setSuccess(
        apiKey ? "API key updated successfully" : "API key saved successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["apiKey", user?.id] });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    },
    onError: () => {
      setError("Failed to save API key. Please try again.");
    },
  });

  // Delete API key mutation
  const { mutate: deleteApiKey, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/user/api-key", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete API key");
      }

      return response.text();
    },
    onSuccess: () => {
      setSuccess("API key deleted successfully");
      setShowDeleteModal(false);
      queryClient.invalidateQueries({ queryKey: ["apiKey", user?.id] });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    },
    onError: () => {
      setError("Failed to delete API key. Please try again.");
      setShowDeleteModal(false);
    },
  });

  // Validate OpenAI API key
  const validateApiKey = async (apiKey: string): Promise<boolean> => {
    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch("/api/validate-openai-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid API key");
      }

      return true;
    } catch (err) {
      if (err instanceof Error) {
        setError(`API key validation failed: ${err.message}`);
      } else {
        setError("API key validation failed. Please check your key.");
      }
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newApiKey.trim()) {
      setError("API key cannot be empty");
      return;
    }

    if (!newApiKey.startsWith("sk-")) {
      setError(
        "Invalid API key format. OpenAI API keys should start with 'sk-'"
      );
      return;
    }

    try {
      // Validate the API key before saving
      const isValid = await validateApiKey(newApiKey);
      if (isValid) {
        setApiKey(newApiKey);
        setNewApiKey("");
      }
    } catch (err) {
      setError("Failed to validate API key. Please try again.");
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setError(null);
    setSuccess(null);
    deleteApiKey();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#00F5FF]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1A1E33] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Delete API Key</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Are you sure you want to delete your API key? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold">OpenAI API Key</h2>
      <p className="text-sm text-muted-foreground">
        Add your OpenAI API key to use your own account for image generation.
        Your key is encrypted and stored securely.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="apiKey"
            className="block text-sm font-medium text-muted-foreground mb-1"
          >
            API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={newApiKey}
            onChange={(e) => setNewApiKey(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="sk-..."
            required
          />
        </div>

        {apiKey && (
          <div className="text-sm text-muted-foreground">
            Current API key: {apiKey}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-2 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-500 bg-green-50 p-2 rounded-md">
            {success}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving || isValidating}
            className="flex-1 bg-[#00F5FF] text-[#1A1E33] hover:bg-[#00F5FF]/90 py-2 px-4 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#1A1E33] mr-2"></div>
                Validating...
              </div>
            ) : isSaving ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#1A1E33] mr-2"></div>
                {apiKey ? "Updating..." : "Saving..."}
              </div>
            ) : apiKey ? (
              "Update API Key"
            ) : (
              "Save API Key"
            )}
          </button>

          {apiKey && (
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600 py-2 px-4 rounded-md text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
