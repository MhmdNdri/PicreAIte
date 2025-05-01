import React from "react";
import Image from "next/image";
import { Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MaskUploadProps {
  mask: File | null;
  onMaskChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveMask: () => void;
  className?: string;
}

export function MaskUpload({
  mask,
  onMaskChange,
  onRemoveMask,
  className = "",
}: MaskUploadProps) {
  return (
    <div className={className}>
      <Label htmlFor="mask" className="mb-1 text-xs block">
        Mask (Optional)
      </Label>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-2 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <Input
          id="mask"
          type="file"
          accept="image/*"
          onChange={onMaskChange}
          className="hidden"
        />
        <label
          htmlFor="mask"
          className="cursor-pointer flex flex-col gap-2 text-base text-center justify-center items-center"
        >
          <Upload className="h-4 w-4" />
          <p className="text-xs text-muted-foreground">
            {mask ? "Change mask" : "Upload a mask to edit specific areas"}
          </p>
        </label>
      </div>

      {mask && (
        <div className="mt-2 flex items-center gap-2">
          <div className="relative w-12 h-12">
            <Image
              src={URL.createObjectURL(mask)}
              alt="Selected mask"
              fill
              className="object-cover rounded-md"
            />
            <button
              type="button"
              onClick={onRemoveMask}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Mask applied</p>
        </div>
      )}
    </div>
  );
}
