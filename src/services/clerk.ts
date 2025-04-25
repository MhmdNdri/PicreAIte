import { clerkClient } from "@clerk/nextjs/server";

export async function syncClerkUserMetadata(user: {
  id: string;
  clerkUserId: string;
}) {
  const client = await clerkClient();
  return client.users.updateUserMetadata(user.clerkUserId, {
    publicMetadata: {
      dbId: user.id,
    },
  });
}
