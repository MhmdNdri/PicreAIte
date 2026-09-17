"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useState, useCallback, useEffect } from "react";
import { use } from "react";
import { MobileLayout } from "../components/MobileLayout";
import { DesktopLayout } from "../components/DesktopLayout";
import { useApiKeys } from "@/hooks/useApiKeys";
import {
  ProviderSelect,
  type ProviderType,
} from "../components/ProviderSelect";
import {
  IMAGE_MODELS,
  getModelSettings,
  resolveKeySource,
  type ImageQuality,
  type ImageResolution,
  type ImageSize,
} from "@/lib/image-models";
import { createImageForm } from "@/lib/image-form";
import type { ImageGenerationResponse } from "@/lib/image-result";

async function fetchPrompt(name: string) {
  const response = await fetch(`/api/prompts/${encodeURIComponent(name)}`);
  if (!response.ok) throw new Error("Failed to fetch style");
  return response.json();
}

async function requestImage(form: FormData): Promise<ImageGenerationResponse> {
  const model = form.get("model") as ProviderType;
  const routes = {
    openai: "/api/generateImage",
    gemini: "/api/generateImageGemini",
    grok: "/api/generateImageGrok",
  };
  const response = await fetch(routes[IMAGE_MODELS[model].provider], {
    method: "POST",
    body: form,
  });
  const body = await response.json().catch(() => {
    throw new Error(
      "The server could not complete this image request. Please try again.",
    );
  });
  if (!response.ok) throw new Error(body.error || "Failed to generate image");
  return body;
}

export default function PromptPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { hasApiKey, getApiKey } = useApiKeys();
  const [images, setImages] = useState<File[]>([]);
  const [quality, setQuality] = useState<ImageQuality>("high");
  const [resolution, setResolution] = useState<ImageResolution>("1K");
  const [size, setSize] = useState<ImageSize>("1024x1024");
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>();
  const { name: promptName } = use(params);
  const { data: prompt, isLoading: isPromptLoading } = useQuery({
    queryKey: ["prompt", promptName],
    queryFn: () => fetchPrompt(promptName),
    enabled: !!promptName && !!userId,
  });
  const {
    mutate,
    isPending,
    error: requestError,
    data,
    reset,
  } = useMutation({ mutationFn: requestImage, retry: false });
  const error = requestError?.message ?? null;
  const result = data?.data[0]?.b64_json ?? null;

  useEffect(() => {
    if (isLoaded && !userId) router.replace("/sign-in");
  }, [isLoaded, userId, router]);

  const handleProviderSelect = useCallback(
    (provider: ProviderType) => {
      setSelectedProvider(provider);
      const settings = getModelSettings(provider, quality, resolution);
      setQuality(settings.quality);
      setResolution(settings.resolution);
      reset();
    },
    [quality, resolution, reset],
  );

  const handleImagesChange = useCallback(
    (files: File[]) => setImages(files),
    [],
  );
  const handleRemoveImage = useCallback(
    (index: number) =>
      setImages((current) => current.filter((_, i) => i !== index)),
    [],
  );
  const handleReset = useCallback(() => {
    reset();
    setImages([]);
  }, [reset]);
  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const selectedKeySource = selectedProvider
        ? resolveKeySource(selectedProvider, hasApiKey)
        : null;
      const selectedApiKey = selectedKeySource
        ? getApiKey(selectedKeySource)
        : undefined;
      if (
        !selectedProvider ||
        !selectedApiKey ||
        !selectedKeySource ||
        !images[0] ||
        !prompt?.promptDesc ||
        isPending
      )
        return;
      reset();
      mutate(
        createImageForm({
          model: selectedProvider,
          apiKey: selectedApiKey,
          keySource: selectedKeySource,
          prompt: prompt.promptDesc,
          image: images[0],
          quality,
          resolution,
          size,
        }),
      );
    },
    [
      selectedProvider,
      hasApiKey,
      getApiKey,
      images,
      prompt,
      quality,
      resolution,
      size,
      isPending,
      reset,
      mutate,
    ],
  );
  const hasAnyApiKey =
    hasApiKey("openai") ||
    hasApiKey("gemini") ||
    hasApiKey("grok") ||
    hasApiKey("openrouter");

  if (!isLoaded) {
    return null;
  }

  if (!userId) {
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
    return (
      <p className="p-6">
        This style could not be loaded.{" "}
        <Link href="/playground" className="underline">
          Back to styles
        </Link>
      </p>
    );
  }

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
            {!hasAnyApiKey ? (
              <div className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    API Key Required
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    You need to configure your API keys to generate images.
                  </p>
                  <Button asChild>
                    <Link href="/api-key">Setup API Keys</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                  <ProviderSelect
                    onProviderSelect={handleProviderSelect}
                    selectedProvider={selectedProvider}
                    disabled={isPending}
                  />
                </div>

                <DesktopLayout
                  prompt={prompt}
                  images={images}
                  onImagesChange={handleImagesChange}
                  onRemoveImage={handleRemoveImage}
                  quality={quality}
                  onQualityChange={setQuality}
                  resolution={resolution}
                  onResolutionChange={setResolution}
                  size={size}
                  onSizeChange={setSize}
                  onSubmit={handleSubmit}
                  isLoading={isPending}
                  result={result}
                  error={error}
                  onReset={handleReset}
                  selectedProvider={selectedProvider}
                  resultInfo={data}
                />

                <MobileLayout
                  prompt={prompt}
                  images={images}
                  onImagesChange={handleImagesChange}
                  onRemoveImage={handleRemoveImage}
                  quality={quality}
                  onQualityChange={setQuality}
                  resolution={resolution}
                  onResolutionChange={setResolution}
                  size={size}
                  onSizeChange={setSize}
                  onSubmit={handleSubmit}
                  isLoading={isPending}
                  result={result}
                  error={error}
                  onReset={handleReset}
                  selectedProvider={selectedProvider}
                  resultInfo={data}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
