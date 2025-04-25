import { clerkClient } from "@clerk/nextjs/server";

const client = await clerkClient();
export function syncClerkUserMetadata(user: {
  id: string;
  clerkUserId: string;
}) {
  return client.users.updateUserMetadata(user.clerkUserId, {
    publicMetadata: {
      dbId: user.id,
    },
  });
}
