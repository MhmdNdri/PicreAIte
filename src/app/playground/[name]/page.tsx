"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { use } from "react";
import { MobileLayout } from "../components/MobileLayout";
import { DesktopLayout } from "../components/DesktopLayout";

async function fetchPrompt(name: string) {
  const response = await fetch(`/api/prompts/${name}`);
  if (!response.ok) {
    throw new Error("Failed to fetch prompt");
  }
  return response.json();
}

export default function PromptPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [quality, setQuality] = useState<"low" | "medium" | "high">("high");
  const [size, setSize] = useState<"1024x1024" | "1536x1024" | "1024x1536">(
    "1024x1024"
  );
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const promptName = resolvedParams.name;

  const { data: prompt, isLoading: isPromptLoading } = useQuery({
    queryKey: ["prompt", promptName],
    queryFn: () => fetchPrompt(promptName),
    enabled: !!promptName,
  });

  if (!isLoaded) {
    return null;
  }

  if (!userId) {
    router.push("/sign-in");
    return null;
  }

  if (isPromptLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00F5FF]"></div>
      </div>
    );
  }

  if (!prompt) {
    router.push("/playground");
    return null;
  }

  const handleImagesChange = (files: File[]) => {
    setImages(files);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("prompt", prompt.promptDesc);
      formData.append("model", "gpt-image-1");
      formData.append("n", "1");
      formData.append("quality", quality);
      formData.append("size", size);

      images.forEach((img) => {
        formData.append("image[]", img);
      });

      formData.append("mask", "");

      const response = await fetch("/api/generateImage", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to edit image");
      }

      const data = await response.json();
      setResult(data.data[0].b64_json);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setImages([]);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-6">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md px-2.5 py-1.5 h-auto"
        >
          <Link
            href="/playground"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-[#1A1E33] dark:hover:text-[#E6F0FA] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Styles
          </Link>
        </Button>

        <Card className="bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md border border-gray-200/10 dark:border-gray-700/10 shadow-lg dark:shadow-none mb-4">
          <CardHeader className="py-4 sm:py-5 px-4 sm:px-6 border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-xl sm:text-2xl font-bold text-[#1A1E33] dark:text-[#E6F0FA]">
              {prompt.name}
            </CardTitle>
            <CardDescription className="mt-1">
              Style: {prompt.type}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {/* Desktop layout */}
            <DesktopLayout
              prompt={prompt}
              images={images}
              onImagesChange={handleImagesChange}
              onRemoveImage={handleRemoveImage}
              quality={quality}
              onQualityChange={setQuality}
              size={size}
              onSizeChange={setSize}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              result={result}
              error={error}
            />

            {/* Mobile layout */}
            <MobileLayout
              prompt={prompt}
              images={images}
              onImagesChange={handleImagesChange}
              onRemoveImage={handleRemoveImage}
              quality={quality}
              onQualityChange={setQuality}
              size={size}
              onSizeChange={setSize}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              result={result}
              error={error}
              onReset={handleReset}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
