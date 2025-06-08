"use client";

import { useState } from "react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { validateGeminiApiKey } from "@/services/geminiImageService";

type ProviderType = "openai" | "gemini";

interface ProviderConfig {
  name: string;
  description: string;
  placeholder: string;
  validator: (key: string) => boolean;
  asyncValidator?: (key: string) => Promise<boolean>;
}

const PROVIDERS: Record<ProviderType, ProviderConfig> = {
  openai: {
    name: "OpenAI",
    description: "Add your OpenAI API key to use DALL-E for image generation.",
    placeholder: "sk-...",
    validator: (key: string) => key.startsWith("sk-"),
    asyncValidator: async (key: string) => {
      try {
        const response = await fetch("/api/validate-openai-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: key }),
        });
        return response.ok;
      } catch {
        return false;
      }
    },
  },
  gemini: {
    name: "Google Gemini",
    description:
      "Add your Google AI API key to use Imagen 3 for image generation.",
    placeholder: "AI...",
    validator: (key: string) => key.length > 10,
    asyncValidator: validateGeminiApiKey,
  },
};

export function ApiKeyManager() {
  const { apiKeys, isLoaded, setApiKey, removeApiKey, hasApiKey, getApiKey } =
    useApiKeys();
  const [activeProvider, setActiveProvider] = useState<ProviderType>("openai");
  const [inputValue, setInputValue] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<ProviderType | null>(
    null
  );

  const currentProvider = PROVIDERS[activeProvider];
  const hasCurrentKey = hasApiKey(activeProvider);
  const currentKey = getApiKey(activeProvider);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const showSuccessMessage = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const validateApiKey = async (
    provider: ProviderType,
    key: string
  ): Promise<boolean> => {
    const config = PROVIDERS[provider];

    if (!config.validator(key)) {
      setError(`Invalid ${config.name} API key format`);
      return false;
    }

    if (config.asyncValidator) {
      setIsValidating(true);
      try {
        const isValid = await config.asyncValidator(key);
        if (!isValid) {
          setError(`${config.name} API key validation failed`);
          return false;
        }
      } catch (err) {
        setError(`Failed to validate ${config.name} API key`);
        return false;
      } finally {
        setIsValidating(false);
      }
    }

    return true;
  };

  const handleSave = async () => {
    clearMessages();

    if (!inputValue.trim()) {
      setError("API key cannot be empty");
      return;
    }

    const isValid = await validateApiKey(activeProvider, inputValue);
    if (isValid) {
      setApiKey(activeProvider, inputValue);
      setInputValue("");
      showSuccessMessage(`${currentProvider.name} API key saved successfully`);
    }
  };

  const handleDelete = (provider: ProviderType) => {
    setShowDeleteModal(provider);
  };

  const confirmDelete = () => {
    if (showDeleteModal) {
      removeApiKey(showDeleteModal);
      showSuccessMessage(`${PROVIDERS[showDeleteModal].name} API key deleted`);
      setShowDeleteModal(null);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#00F5FF]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1A1E33] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Delete API Key</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Are you sure you want to delete your{" "}
              {PROVIDERS[showDeleteModal].name} API key? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold">API Keys</h2>
      <p className="text-sm text-muted-foreground">
        Manage your API keys for different AI providers. Keys are stored locally
        in your browser.
      </p>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(Object.keys(PROVIDERS) as ProviderType[]).map((provider) => (
          <button
            key={provider}
            onClick={() => {
              setActiveProvider(provider);
              setInputValue("");
              clearMessages();
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeProvider === provider
                ? "border-[#00F5FF] text-[#00F5FF]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {PROVIDERS[provider].name}
            {hasApiKey(provider) && (
              <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-md font-medium">
            {currentProvider.name} API Key
          </h3>
          <p className="text-sm text-muted-foreground">
            {currentProvider.description}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="apiKey"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder={currentProvider.placeholder}
            />
          </div>

          {hasCurrentKey && (
            <div className="text-sm text-muted-foreground">
              Current API key: {currentKey?.substring(0, 8)}...
              {currentKey?.substring(currentKey.length - 4)}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-500 bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
              {success}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isValidating || !inputValue.trim()}
              className="flex-1 bg-[#00F5FF] text-[#1A1E33] hover:bg-[#00F5FF]/90 py-2 px-4 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#1A1E33] mr-2"></div>
                  Validating...
                </div>
              ) : hasCurrentKey ? (
                "Update API Key"
              ) : (
                "Save API Key"
              )}
            </button>

            {hasCurrentKey && (
              <button
                onClick={() => handleDelete(activeProvider)}
                className="bg-red-500 text-white hover:bg-red-600 py-2 px-4 rounded-md text-sm font-medium"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-sm font-medium mb-2">Configured Providers</h3>
        <div className="space-y-1">
          {(Object.keys(PROVIDERS) as ProviderType[]).map((provider) => (
            <div
              key={provider}
              className="flex items-center justify-between text-sm"
            >
              <span>{PROVIDERS[provider].name}</span>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  hasApiKey(provider)
                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {hasApiKey(provider) ? "Configured" : "Not configured"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
