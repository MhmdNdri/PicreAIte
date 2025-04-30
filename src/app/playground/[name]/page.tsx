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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Download, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import { use } from "react";

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
  const [mask, setMask] = useState<File | null>(null);
  const [quality, setQuality] = useState("high");
  const [size, setSize] = useState("1024x1024");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setImages(filesArray);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleMaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMask(e.target.files[0] as File);
    }
  };

  const handleRemoveMask = () => {
    setMask(null);
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

      if (mask) {
        formData.append("mask", mask);
      }

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

  const handleDownload = () => {
    if (!result) return;

    // Create a temporary link element
    const link = downloadRef.current || document.createElement("a");

    // Set the href attribute to a data URI
    link.href = `data:image/png;base64,${result}`;

    // Set the download attribute to specify the filename
    link.download = `${prompt.name
      .replace(/\s+/g, "-")
      .toLowerCase()}-transformed.png`;

    // Programmatically click the link to trigger the download
    link.click();
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
            {/* Style Info Section */}
            {prompt.imageUrl && (
              <div className="p-4 sm:p-6 bg-gray-50/80 dark:bg-gray-900/20">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                  {/* Style example image - takes 4 cols on desktop */}
                  <div className="sm:col-span-4 lg:col-span-3">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <Image
                        src={prompt.imageUrl}
                        alt={prompt.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                        priority
                      />
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded">
                        Example
                      </div>
                    </div>
                  </div>

                  {/* Description - takes 8 cols on desktop */}
                  <div className="sm:col-span-8 lg:col-span-9 text-left flex flex-col justify-center">
                    <h3 className="text-base sm:text-lg font-semibold mb-2">
                      About This Style
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {prompt.description ||
                        "Transform your images with this unique style."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload and Transform Section */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Form side */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold">
                    Upload Your Photo
                  </h3>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Input photo */}
                    <div>
                      <Label
                        htmlFor="image"
                        className="mb-1 sm:mb-2 text-sm block"
                      >
                        Upload Photo
                      </Label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-3 sm:p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          multiple
                          required
                        />
                        <label htmlFor="image" className="cursor-pointer block">
                          <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-gray-400" />
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {images.length > 0
                              ? "Add more images"
                              : "Tap to upload image"}
                          </p>
                        </label>
                      </div>

                      {/* Display uploaded images */}
                      {images.length > 0 && (
                        <div className="mt-2 sm:mt-3">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                            Uploaded images: {images.length}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {images.map((img, index) => (
                              <div
                                key={index}
                                className="relative w-16 h-16 sm:w-20 sm:h-20 group"
                              >
                                <Image
                                  src={URL.createObjectURL(img)}
                                  alt={`Selected image ${index + 1}`}
                                  fill
                                  className="object-cover rounded-md"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Optional mask */}
                    <div>
                      <Label htmlFor="mask" className="mb-1 text-sm block">
                        Mask (Optional)
                      </Label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-2 sm:p-3 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <Input
                          id="mask"
                          type="file"
                          accept="image/*"
                          onChange={handleMaskChange}
                          className="hidden"
                        />
                        <label htmlFor="mask" className="cursor-pointer block">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {mask
                              ? "Change mask"
                              : "Upload a mask to edit specific areas"}
                          </p>
                        </label>
                      </div>

                      {mask && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="relative w-12 h-12 sm:w-16 sm:h-16 group">
                            <Image
                              src={URL.createObjectURL(mask)}
                              alt="Selected mask"
                              fill
                              className="object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveMask}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Mask applied
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Configuration options */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <Label
                          htmlFor="quality"
                          className="mb-1 text-xs sm:text-sm block"
                        >
                          Quality
                        </Label>
                        <Select value={quality} onValueChange={setQuality}>
                          <SelectTrigger
                            id="quality"
                            className="text-xs sm:text-sm"
                          >
                            <SelectValue placeholder="Select quality" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">
                              High (Recommended)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor="size"
                          className="mb-1 text-xs sm:text-sm block"
                        >
                          Size
                        </Label>
                        <Select value={size} onValueChange={setSize}>
                          <SelectTrigger
                            id="size"
                            className="text-xs sm:text-sm"
                          >
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1024x1024">
                              1024x1024 (Square)
                            </SelectItem>
                            <SelectItem value="1536x1024">
                              1536x1024 (Landscape)
                            </SelectItem>
                            <SelectItem value="1024x1536">
                              1024x1536 (Portrait)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || images.length === 0}
                    className="w-full bg-[#00F5FF] text-[#1A1E33] hover:bg-[#00F5FF]/90 text-sm sm:text-base py-2"
                  >
                    {isLoading ? "Processing..." : "Transform Image"}
                  </Button>
                </form>

                {/* Result side */}
                <div className="relative flex flex-col">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">
                    Result
                  </h3>

                  {!result && !isLoading && !error && (
                    <div className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center p-4 sm:p-6 min-h-[200px] sm:min-h-[250px]">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1 sm:mb-2">
                          Your transformed image will appear here
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Upload an image and transform it
                        </p>
                      </div>
                    </div>
                  )}

                  {isLoading && (
                    <div className="flex-1 border-2 border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center p-4 sm:p-6 min-h-[200px] sm:min-h-[250px]">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-[#00F5FF] mx-auto mb-2 sm:mb-3"></div>
                        <p className="text-sm text-muted-foreground">
                          Processing your image...
                        </p>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex-1 border-2 border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800 rounded-lg p-4 sm:p-6 min-h-[200px] sm:min-h-[250px]">
                      <div className="text-center">
                        <p className="text-red-600 dark:text-red-400 font-medium mb-1 sm:mb-2 text-sm">
                          Error
                        </p>
                        <p className="text-xs sm:text-sm text-red-500 dark:text-red-300">
                          {error}
                        </p>
                      </div>
                    </div>
                  )}

                  {result && (
                    <div className="flex-1 flex flex-col">
                      <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                        {/* Responsive container that maintains aspect ratio based on size selection */}
                        <div
                          className={`relative ${
                            size === "1024x1024"
                              ? "aspect-square"
                              : size === "1536x1024"
                              ? "aspect-[3/2]"
                              : "aspect-[2/3]"
                          }`}
                        >
                          <Image
                            src={`data:image/png;base64,${result}`}
                            alt="Generated image"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-contain"
                            priority
                          />
                          <div className="absolute top-2 left-2 bg-[#00F5FF] text-[#1A1E33] text-xs font-medium px-2 py-1 rounded">
                            Transformed
                          </div>
                        </div>
                      </div>

                      <a ref={downloadRef} className="hidden" />

                      <Button
                        onClick={handleDownload}
                        className="mt-3 sm:mt-4 w-full bg-[#00F5FF] text-[#1A1E33] hover:bg-[#00F5FF]/90 text-sm sm:text-base py-2"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Image
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
