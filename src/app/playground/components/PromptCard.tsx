"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface PromptCardProps {
  name: string;
  type: string;
  imageUrl: string | null;
  orginal_Image?: string | null;
}

export function PromptCard({
  name,
  type,
  imageUrl,
  orginal_Image,
}: PromptCardProps) {
  const [position, setPosition] = useState(70); // Default to 70% generated

  if (!imageUrl && !orginal_Image) {
    return (
      <Link
        href={`/playground/${name}`}
        className="group relative overflow-hidden rounded-lg bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md border border-gray-200/10 dark:border-gray-700/10 shadow-lg dark:shadow-none transition-all hover:shadow-xl dark:hover:shadow-none hover:scale-[1.02]"
      >
        <div className="relative aspect-square w-full">
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="text-center p-4">
              <h3 className="font-semibold text-[#1A1E33] dark:text-[#E6F0FA]">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground">{type}</p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="relative group overflow-hidden rounded-lg bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md border border-gray-200/10 dark:border-gray-700/10 shadow-lg dark:shadow-none transition-all hover:shadow-xl dark:hover:shadow-none hover:scale-[1.02]">
      {/* Slider input for comparison - covers entire card height */}
      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(e) => setPosition(parseInt(e.target.value))}
        className="absolute inset-0 z-50 w-full h-full opacity-0 cursor-ew-resize"
        style={{
          touchAction: "pan-y",
          WebkitAppearance: "none",
          appearance: "none",
        }}
        aria-label="Adjust comparison slider"
      />

      <Link
        href={`/playground/${name}`}
        onClick={(e) => e.stopPropagation()}
        className="block pointer-events-none"
      >
        <div className="relative aspect-square w-full">
          {/* Original Image (Background) */}
          {orginal_Image && (
            <div className="absolute inset-0 z-10">
              <Image
                src={orginal_Image}
                alt={`${name} original`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority
              />
              {/* Original Label */}
              <div className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                Original
              </div>
            </div>
          )}

          {/* Generated Image (Foreground with reveal effect) */}
          {imageUrl && (
            <div
              className="absolute inset-0 z-20 overflow-hidden"
              style={{ width: `${position}%` }}
            >
              <div
                className="absolute inset-0"
                style={{ width: `${(100 / position) * 100}%` }}
              >
                <Image
                  src={imageUrl}
                  alt={`${name} generated`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  priority
                />
              </div>
              {/* Generated Label */}
              <div className="absolute top-3 left-3 bg-black/50 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                Generated
              </div>
            </div>
          )}

          {/* Visual slider handle (for appearance only) - now full height */}
          <div
            className="absolute inset-y-0 z-30 w-1 bg-white/80 pointer-events-none"
            style={{ left: `${position}%` }}
          >
            {/* Handle knob */}
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 bg-white/80 rounded-full flex items-center justify-center shadow-md pointer-events-none">
              <div className="h-6 w-0.5 bg-gray-500 rounded-full mx-0.5"></div>
              <div className="h-6 w-0.5 bg-gray-500 rounded-full mx-0.5"></div>
            </div>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-40"></div>

          {/* Card text */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-50">
            <h3 className="font-semibold line-clamp-1">{name}</h3>
            <p className="text-sm text-white/80 line-clamp-1">{type}</p>
          </div>
        </div>
      </Link>

      {/* Special card action button to navigate (since Link is now pointer-events-none) */}
      <Link
        href={`/playground/${name}`}
        className="absolute bottom-2 right-2 z-[60] bg-white/30 hover:bg-white/60 text-white p-3 rounded-full transition-colors"
        aria-label={`View ${name}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </Link>
    </div>
  );
}
