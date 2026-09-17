import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export interface ImagePreviewProps {
  src: string | File;
  alt: string;
  className?: string;
  onRemove?: () => void;
  badge?: string;
  disabled?: boolean;
}

export function ImagePreview({
  src,
  alt,
  className = "",
  onRemove,
  badge,
  disabled = false,
}: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (typeof src === "string") return;
    const url = URL.createObjectURL(src);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [src]);

  const imageSrc = typeof src === "string" ? src : previewUrl;

  return (
    <div className={`relative group rounded-lg overflow-hidden ${className}`}>
      {imageSrc && (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes="(max-width: 640px) 25vw, 160px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
      {badge && (
        <span className="absolute bottom-1 left-1 rounded bg-background/90 px-2 py-1 text-xs">
          {badge}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-70 transition-opacity shadow-md hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Remove image"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
