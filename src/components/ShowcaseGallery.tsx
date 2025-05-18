"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

async function fetchPrompts() {
  const res = await fetch("/api/prompts");
  if (!res.ok) throw new Error("Failed to fetch prompts");
  return res.json();
}

export function ShowcaseGallery() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["showcase-prompts"],
    queryFn: fetchPrompts,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Memoize the random selection of 8 images with imageUrl
  const showcaseImages = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    const valid = data.filter(
      (p) => typeof p.imageUrl === "string" && p.imageUrl
    );
    // Shuffle
    for (let i = valid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [valid[i], valid[j]] = [valid[j], valid[i]];
    }
    return valid.slice(0, 8).map((p) => p.imageUrl);
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-lg bg-muted animate-pulse shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            data-aos="fade-up"
          />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <div className="col-span-full text-center py-8 text-red-500">
        Could not load images. Please try again later.
      </div>
    );
  }
  if (showcaseImages.length === 0) {
    return (
      <div className="col-span-full text-center py-8 text-muted-foreground">
        No images to display yet. Check back soon!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {showcaseImages.map((src, index) => (
        <div
          key={src || index}
          className="group relative aspect-square transform overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          data-aos="fade-up"
        >
          <img
            src={src}
            alt={`Showcase image ${index + 1}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            width={400}
            height={400}
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      ))}
    </div>
  );
}
