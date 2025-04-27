import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PromptTable } from "@/drizzle/schema";

// Query keys
export const promptKeys = {
  all: ["prompts"] as const,
  detail: (id: string) => [...promptKeys.all, id] as const,
};

// Custom hook for fetching all prompts
export function usePrompts() {
  return useQuery({
    queryKey: promptKeys.all,
    queryFn: async () => {
      const response = await fetch("/api/prompts");
      if (!response.ok) {
        throw new Error("Failed to fetch prompts");
      }
      return response.json();
    },
  });
}

// Custom hook for creating a prompt
export function useCreatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof PromptTable.$inferInsert) => {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create prompt");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.all });
    },
  });
}

// Custom hook for updating a prompt
export function useUpdatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof PromptTable.$inferSelect) => {
      const response = await fetch("/api/prompts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update prompt");
      }
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: promptKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: promptKeys.all });
    },
  });
}

// Custom hook for deleting a prompt
export function useDeletePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const response = await fetch("/api/prompts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete prompt");
      }
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: promptKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: promptKeys.all });
    },
  });
}
