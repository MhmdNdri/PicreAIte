import { Image as ImageIcon } from "lucide-react";

export type StatusOverlayType = "loading" | "empty" | "error";

export interface StatusOverlayProps {
  type: StatusOverlayType;
  message: string;
  submessage?: string;
}

export function StatusOverlay({
  type,
  message,
  submessage,
}: StatusOverlayProps) {
  const getIcon = () => {
    switch (type) {
      case "loading":
        return (
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00F5FF] mx-auto mb-4" />
        );
      case "empty":
        return <ImageIcon className="h-10 w-10 mx-auto mb-4 text-gray-400" />;
      case "error":
        return (
          <div className="w-10 h-10 mx-auto mb-4 text-red-500 flex items-center justify-center border-2 border-red-500 rounded-full">
            !
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex items-center justify-center h-full w-full ${
        type === "error" ? "bg-red-50/30 dark:bg-red-900/10" : ""
      }`}
    >
      <div className="text-center p-6 max-w-[280px]">
        {getIcon()}
        <p
          className={`text-sm font-medium mb-2 ${
            type === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-muted-foreground"
          }`}
        >
          {message}
        </p>
        {submessage && (
          <p
            className={`text-xs ${
              type === "error"
                ? "text-red-500 dark:text-red-300"
                : "text-muted-foreground"
            }`}
          >
            {submessage}
          </p>
        )}
      </div>
    </div>
  );
}
