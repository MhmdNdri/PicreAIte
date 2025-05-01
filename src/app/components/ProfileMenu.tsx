import { UserButton } from "@clerk/nextjs";
import { ApiKeyManager } from "@/components/account/ApiKeyManager";

export function ProfileMenu() {
  return (
    <UserButton
      afterSignOutUrl="/"
      appearance={{
        elements: {
          avatarBox: "w-10 h-10",
          userButtonPopoverCard: "w-[400px]",
        },
      }}
    />
  );
}
