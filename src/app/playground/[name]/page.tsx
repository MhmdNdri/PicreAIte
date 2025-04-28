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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
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
  const [quality, setQuality] = useState("low");
  const [size, setSize] = useState("1024x1024");
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
    return <div>Loading...</div>;
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

  const handleMaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMask(e.target.files[0] as File);
    }
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-6 sm:py-12">
        <Link
          href="/playground"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1A1E33] dark:hover:text-[#E6F0FA] mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Styles
        </Link>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md border border-gray-200/10 dark:border-gray-700/10 shadow-lg dark:shadow-none">
            <CardHeader>
              <CardTitle className="text-xl sm:text-3xl font-bold text-[#1A1E33] dark:text-[#E6F0FA]">
                {prompt.name}
              </CardTitle>
              <CardDescription>Style: {prompt.type}</CardDescription>
            </CardHeader>

            <CardContent>
              {prompt.imageUrl && (
                <div className="relative w-full aspect-square mb-6 sm:mb-8">
                  <Image
                    src={prompt.imageUrl}
                    alt={prompt.name}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              )}

              <div className="prose dark:prose-invert max-w-none mb-6 sm:mb-8">
                <p className="text-sm sm:text-base text-muted-foreground">
                  {prompt.promptDesc}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="image">Upload Your Photo</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      multiple
                      required
                    />
                    {images.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {images.map((img, index) => (
                          <div key={index} className="relative w-24 h-24">
                            <Image
                              src={URL.createObjectURL(img)}
                              alt={`Selected image ${index + 1}`}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="mask">Mask (Optional)</Label>
                    <Input
                      id="mask"
                      type="file"
                      accept="image/*"
                      onChange={handleMaskChange}
                    />
                    {mask && (
                      <div className="mt-2 relative w-24 h-24">
                        <Image
                          src={URL.createObjectURL(mask)}
                          alt="Selected mask"
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quality">Quality</Label>
                      <Select value={quality} onValueChange={setQuality}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="size">Size</Label>
                      <Select value={size} onValueChange={setSize}>
                        <SelectTrigger>
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
                  className="w-full"
                >
                  {isLoading ? "Processing..." : "Transform Image"}
                </Button>
              </form>

              {error && (
                <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-md">
                  Error: {error}
                </div>
              )}

              {result && (
                <div className="mt-6">
                  <h2 className="text-xl font-bold mb-3">Result:</h2>
                  <div className="relative w-full aspect-square max-w-md mx-auto">
                    <Image
                      src={`data:image/png;base64,${result}`}
                      alt="Generated image"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        // Create a canvas element
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");

                        // Create an image element
                        const img = new window.Image();
                        img.onload = () => {
                          // Set canvas dimensions to match the image
                          canvas.width = img.width;
                          canvas.height = img.height;

                          // Draw the image on the canvas
                          ctx?.drawImage(img, 0, 0);

                          // Convert canvas to blob
                          canvas.toBlob((blob) => {
                            if (blob) {
                              // Create a URL for the blob
                              const url = URL.createObjectURL(blob);

                              // Create a download link
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = "edited-image.png";

                              // Trigger the download
                              document.body.appendChild(link);
                              link.click();

                              // Clean up
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                            }
                          }, "image/png");
                        };

                        // Set the image source to the base64 data
                        img.src = `data:image/png;base64,${result}`;
                      }}
                      className="w-full"
                    >
                      Download Image
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
