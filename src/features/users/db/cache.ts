import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { insertUser, updateUser, deleteUser } from "./users";
import { UserTable } from "@/drizzle/schema";

// Query keys
export const userKeys = {
  all: ["users"] as const,
  detail: (clerkUserId: string) => [...userKeys.all, clerkUserId] as const,
};

// Custom hook for fetching user data
export function useUser(clerkUserId: string) {
  return useQuery({
    queryKey: userKeys.detail(clerkUserId),
    queryFn: async () => {
      // TODO: Implement user fetch logic
      return null;
    },
  });
}

// Custom hook for updating user data
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clerkUserId,
      data,
    }: {
      clerkUserId: string;
      data: Partial<typeof UserTable.$inferInsert>;
    }) => {
      return updateUser({ clerkUserId }, data);
    },
    onSuccess: (data, { clerkUserId }) => {
      queryClient.setQueryData(userKeys.detail(clerkUserId), data);
    },
  });
}

// Custom hook for deleting user
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clerkUserId }: { clerkUserId: string }) => {
      return deleteUser({ clerkUserId });
    },
    onSuccess: (_, { clerkUserId }) => {
      queryClient.setQueryData(userKeys.detail(clerkUserId), null);
    },
  });
}
