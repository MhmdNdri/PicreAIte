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
  type ApiKeySource,
} from "../components/ProviderSelect";
import { GROK_IMAGE_MODELS } from "@/lib/grok-models";

async function fetchPrompt(name: string) {
  const response = await fetch(`/api/prompts/${name}`);
  if (!response.ok) {
    throw new Error("Failed to fetch prompt");
  }
  return response.json();
}

async function generateImageOpenAI(data: FormData) {
  const response = await fetch("/api/generateImage", {
    method: "POST",
    body: data,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate image");
  }

  return response.json();
}

async function generateImageGemini(data: FormData) {
  const response = await fetch("/api/generateImageGemini", {
    method: "POST",
    body: data,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate image");
  }

  return response.json();
}

async function generateImageGrok(data: FormData) {
  const response = await fetch("/api/generateImageGrok", {
    method: "POST",
    body: data,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate image");
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
  const { hasApiKey } = useApiKeys();
  const [images, setImages] = useState<File[]>([]);
  const [quality, setQuality] = useState<"low" | "medium" | "high">("high");
  const [size, setSize] = useState<"1024x1024" | "1536x1024" | "1024x1536">(
    "1024x1024"
  );
  const [selectedProvider, setSelectedProvider] = useState<
    ProviderType | undefined
  >(undefined);
  const [selectedApiKey, setSelectedApiKey] = useState<string>("");
  const [selectedKeySource, setSelectedKeySource] = useState<
    ApiKeySource | null
  >(null);

  const resolvedParams = use(params);
  const promptName = resolvedParams.name;

  const { data: prompt, isLoading: isPromptLoading } = useQuery({
    queryKey: ["prompt", promptName],
    queryFn: () => fetchPrompt(promptName),
    enabled: !!promptName,
  });

  const {
    mutate: generateOpenAIMutation,
    isPending: isOpenAIPending,
    error: openAIError,
    data: openAIData,
    reset: resetOpenAI,
  } = useMutation({
    mutationFn: generateImageOpenAI,
  });

  const {
    mutate: generateGeminiMutation,
    isPending: isGeminiPending,
    error: geminiError,
    data: geminiData,
    reset: resetGemini,
  } = useMutation({
    mutationFn: generateImageGemini,
  });

  const {
    mutate: generateGrokMutation,
    isPending: isGrokPending,
    error: grokError,
    data: grokData,
    reset: resetGrok,
  } = useMutation({
    mutationFn: generateImageGrok,
  });

  const isPending = isOpenAIPending || isGeminiPending || isGrokPending;
  const error =
    openAIError?.message ||
    geminiError?.message ||
    grokError?.message ||
    null;
  const data = openAIData || geminiData || grokData;

  const getImageResult = useCallback(() => {
    if (!data?.data?.[0]) return null;
    const imageData = data.data[0];
    return imageData.b64_json || null;
  }, [data]);

  const getUsageData = useCallback(() => {
    if (!data?.usage) return undefined;
    return data.usage;
  }, [data]);

  const handleProviderSelect = useCallback(
    (provider: ProviderType, apiKey: string, keySource: ApiKeySource) => {
      if (
        provider !== selectedProvider ||
        apiKey !== selectedApiKey ||
        keySource !== selectedKeySource
      ) {
        setSelectedProvider(provider);
        setSelectedApiKey(apiKey);
        setSelectedKeySource(keySource);
        resetOpenAI();
        resetGemini();
        resetGrok();
      }
    },
    [
      selectedProvider,
      selectedApiKey,
      selectedKeySource,
      resetOpenAI,
      resetGemini,
      resetGrok,
    ]
  );

  const handleImagesChange = useCallback((files: File[]) => {
    setImages(files);
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setImages((images) => images.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedProvider || !selectedApiKey || !selectedKeySource) {
        alert("Please select a provider first");
        return;
      }

      // All providers require image for editing
      if (images.length === 0) {
        alert("Please upload an image first");
        return;
      }

      const formData = new FormData();
      formData.append("prompt", prompt.promptDesc);

      if (selectedProvider === "openai" || selectedProvider === "openai-mini") {
        formData.append("apiKey", selectedApiKey);
        formData.append(
          "model",
          selectedProvider === "openai-mini"
            ? "gpt-image-1-mini"
            : "gpt-image-2"
        );
        formData.append("quality", quality);
        formData.append("size", size);
        formData.append("n", "1");

        images.forEach((image) => {
          formData.append("image[]", image);
        });
        if (selectedKeySource === "openrouter") {
          formData.append("sourceProvider", "openai");
        }

        generateOpenAIMutation(formData);
      } else if (selectedProvider && selectedProvider in GROK_IMAGE_MODELS) {
        // Grok models (image editing)
        formData.append("apiKey", selectedApiKey);
        formData.append("model", selectedProvider);
        const aspectRatioMap: Record<string, string> = {
          "1024x1024": "1:1",
          "1536x1024": "16:9",
          "1024x1536": "9:16",
        };
        formData.append("aspectRatio", aspectRatioMap[size] || "1:1");
        formData.append("image", images[0]!);
        if (selectedKeySource === "openrouter") {
          formData.append("sourceProvider", "grok");
        }
        generateGrokMutation(formData);
      } else if (selectedProvider) {
        // Nano Banana models (image editing)
        formData.append("apiKey", selectedApiKey);
        formData.append("model", selectedProvider);
        // Map size to Gemini aspect ratio (1:1, 3:4, 4:3, 9:16, 16:9)
        // 1536x1024 = 3:2 → 4:3 (closest landscape); 1024x1536 = 2:3 → 3:4 (closest portrait)
        const aspectRatioMap: Record<string, string> = {
          "1024x1024": "1:1",
          "1536x1024": "4:3",
          "1024x1536": "3:4",
        };
        formData.append("aspectRatio", aspectRatioMap[size] || "1:1");
        formData.append("image", images[0]!);
        if (selectedKeySource === "openrouter") {
          formData.append("sourceProvider", "gemini");
        }
        generateGeminiMutation(formData);
      }
    },
    [
      selectedProvider,
      selectedApiKey,
      selectedKeySource,
      prompt?.promptDesc,
      quality,
      size,
      images,
      generateOpenAIMutation,
      generateGeminiMutation,
      generateGrokMutation,
    ]
  );

  const handleReset = useCallback(() => {
    resetOpenAI();
    resetGemini();
    resetGrok();
    setImages([]);
  }, [resetOpenAI, resetGemini, resetGrok]);

  const hasAnyApiKey =
    hasApiKey("openai") ||
    hasApiKey("gemini") ||
    hasApiKey("grok") ||
    hasApiKey("openrouter");

  useEffect(() => {
    if (isLoaded && !selectedProvider) {
      const openaiKey = localStorage.getItem("openai_api_key");
      const geminiKey = localStorage.getItem("gemini_api_key");
      const grokKey = localStorage.getItem("grok_api_key");
      const openrouterKey = localStorage.getItem("openrouter_api_key");

      if (openaiKey) {
        // Default to cost-effective gpt-image-1-mini model
        setSelectedProvider("openai-mini");
        setSelectedApiKey(openaiKey);
        setSelectedKeySource("openai");
      } else if (geminiKey) {
        setSelectedProvider("gemini-nano-banana");
        setSelectedApiKey(geminiKey);
        setSelectedKeySource("gemini");
      } else if (grokKey) {
        setSelectedProvider("grok-imagine");
        setSelectedApiKey(grokKey);
        setSelectedKeySource("grok");
      } else if (openrouterKey) {
        // OpenRouter key enables all providers; default to the most compatible path.
        setSelectedProvider("openai");
        setSelectedApiKey(openrouterKey);
        setSelectedKeySource("openrouter");
      }
    }
  }, [isLoaded, selectedProvider]);

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
                  size={size}
                  onSizeChange={setSize}
                  onSubmit={handleSubmit}
                  isLoading={isPending}
                  result={getImageResult()}
                  error={error}
                  onReset={handleReset}
                  selectedProvider={selectedProvider}
                  usage={getUsageData()}
                />

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
                  isLoading={isPending}
                  result={getImageResult()}
                  error={error}
                  onReset={handleReset}
                  selectedProvider={selectedProvider}
                  usage={getUsageData()}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
