"use client";

import { useState, useEffect } from "react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Key, Zap, Sparkles } from "lucide-react";
import Link from "next/link";

type ProviderType = "openai" | "gemini";

interface ProviderInfo {
  id: ProviderType;
  name: string;
  description: string;
  features: string[];
  models: string[];
  icon: React.ReactNode;
  color: string;
  estimatedCost: string;
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: "openai",
    name: "OpenAI gpt-image-1.5",
    description:
      "High-quality image generation with excellent prompt following and artistic capabilities.",
    features: [
      "High quality outputs",
      "Great prompt adherence",
      "Style versatility",
      "Fast generation",
    ],
    models: ["gpt-image-1.5"],
    icon: <Zap className="h-5 w-5" />,
    color: "from-emerald-500 to-teal-600",
    estimatedCost: "~$0.04-0.12 per image",
  },
  {
    id: "gemini",
    name: "Google Imagen 3",
    description:
      "Google's latest image generation model with photorealistic outputs and advanced understanding.",
    features: [
      "Photorealistic quality",
      "Advanced reasoning",
      "Multiple aspect ratios",
      "Safety filters",
    ],
    models: ["Imagen 3"],
    icon: <Sparkles className="h-5 w-5" />,
    color: "from-blue-500 to-purple-600",
    estimatedCost: "~$0.02-0.08 per image",
  },
];

interface ProviderSelectorProps {
  onProviderSelect: (provider: ProviderType, apiKey: string) => void;
  selectedProvider?: ProviderType;
  className?: string;
}

export function ProviderSelector({
  onProviderSelect,
  selectedProvider,
  className,
}: ProviderSelectorProps) {
  const { hasApiKey, getApiKey, isLoaded } = useApiKeys();
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);

  useEffect(() => {
    if (isLoaded && selectedProvider && hasApiKey(selectedProvider)) {
      const apiKey = getApiKey(selectedProvider);
      if (apiKey) {
        onProviderSelect(selectedProvider, apiKey);
      }
    }
  }, [isLoaded, selectedProvider, hasApiKey, getApiKey, onProviderSelect]);

  const handleProviderClick = (provider: ProviderType) => {
    if (hasApiKey(provider)) {
      const apiKey = getApiKey(provider);
      if (apiKey) {
        onProviderSelect(provider, apiKey);
      }
    } else {
      setShowApiKeySetup(true);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#00F5FF]"></div>
      </div>
    );
  }

  const configuredProviders = PROVIDERS.filter((p) => hasApiKey(p.id));
  const availableProviders = PROVIDERS.filter((p) => !hasApiKey(p.id));

  return (
    <div className={className}>
      {/* Configured Providers */}
      {configuredProviders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Ready to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {configuredProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                isConfigured={true}
                isSelected={selectedProvider === provider.id}
                onClick={() => handleProviderClick(provider.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Providers */}
      {availableProviders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            {configuredProviders.length > 0
              ? "Available Providers"
              : "Choose a Provider"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                isConfigured={false}
                isSelected={false}
                onClick={() => handleProviderClick(provider.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* API Key Setup Prompt */}
      {showApiKeySetup && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <Key className="h-5 w-5" />
              API Key Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
              To use AI image generation, you need to configure your API keys.
              Your keys are stored securely in your browser.
            </p>
            <div className="flex gap-2">
              <Button asChild size="sm">
                <Link href="/api-key">
                  <Key className="h-4 w-4 mr-2" />
                  Setup API Keys
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKeySetup(false)}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <div className="text-sm text-muted-foreground mt-4">
        <p>
          Need API keys?{" "}
          <Link href="/api-key" className="text-[#00F5FF] hover:underline">
            Set them up here
          </Link>{" "}
          or get them from{" "}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00F5FF] hover:underline inline-flex items-center gap-1"
          >
            OpenAI <ExternalLink className="h-3 w-3" />
          </a>{" "}
          or{" "}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00F5FF] hover:underline inline-flex items-center gap-1"
          >
            Google AI Studio <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>
    </div>
  );
}

interface ProviderCardProps {
  provider: ProviderInfo;
  isConfigured: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function ProviderCard({
  provider,
  isConfigured,
  isSelected,
  onClick,
}: ProviderCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? "ring-2 ring-[#00F5FF] border-[#00F5FF]"
          : isConfigured
          ? "hover:border-gray-400 dark:hover:border-gray-600"
          : "opacity-75 hover:opacity-100"
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg bg-gradient-to-r ${provider.color} text-white`}
            >
              {provider.icon}
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                {provider.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {isConfigured ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  >
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="outline">Setup Required</Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {provider.estimatedCost}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3">
          {provider.description}
        </p>
        <div className="space-y-2">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Models:
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {provider.models.map((model) => (
                <Badge key={model} variant="outline" className="text-xs">
                  {model}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Features:
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {provider.features.slice(0, 2).map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {provider.features.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{provider.features.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
