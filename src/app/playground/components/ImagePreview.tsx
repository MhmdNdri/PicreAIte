import Image from "next/image";
import { Trash2 } from "lucide-react";

export interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  onRemove?: () => void;
  badge?: string;
}

export function ImagePreview({
  src,
  alt,
  className = "",
  onRemove,
  badge,
}: ImagePreviewProps) {
  return (
    <div className={`relative group rounded-lg overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-70 transition-opacity shadow-md hover:bg-red-600"
          aria-label="Remove image"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
