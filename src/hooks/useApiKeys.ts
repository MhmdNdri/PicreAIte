"use client";

import { useState, useEffect, useCallback } from "react";

export interface ApiKeys {
  openai?: string;
  gemini?: string;
  grok?: string;
  openrouter?: string;
}

const KEY_CHANGE_EVENT = "picreaite:api-keys-changed";
const PROVIDERS: (keyof ApiKeys)[] = ["openai", "gemini", "grok", "openrouter"];

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadKeys = () => {
      const savedKeys: ApiKeys = {};
      try {
        for (const provider of PROVIDERS) {
          const key = localStorage.getItem(`${provider}_api_key`)?.trim();
          if (key) savedKeys[provider] = key;
        }
      } catch {
        // Storage can be blocked by browser privacy settings. Still finish loading.
      } finally {
        setApiKeys(savedKeys);
        setIsLoaded(true);
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        PROVIDERS.some((provider) => event.key === `${provider}_api_key`)
      ) {
        loadKeys();
      }
    };
    loadKeys();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(KEY_CHANGE_EVENT, loadKeys);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(KEY_CHANGE_EVENT, loadKeys);
    };
  }, []);

  const setApiKey = useCallback((provider: keyof ApiKeys, key: string) => {
    if (typeof window !== "undefined") {
      const storageKey = `${provider}_api_key`;
      const trimmedKey = key.trim();
      if (trimmedKey) localStorage.setItem(storageKey, trimmedKey);
      else localStorage.removeItem(storageKey);
      window.dispatchEvent(new Event(KEY_CHANGE_EVENT));
    }
  }, []);

  const removeApiKey = useCallback((provider: keyof ApiKeys) => {
    if (typeof window !== "undefined") {
      const storageKey = `${provider}_api_key`;
      localStorage.removeItem(storageKey);

      window.dispatchEvent(new Event(KEY_CHANGE_EVENT));
    }
  }, []);

  const clearAllKeys = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("openai_api_key");
      localStorage.removeItem("gemini_api_key");
      localStorage.removeItem("grok_api_key");
      localStorage.removeItem("openrouter_api_key");
      window.dispatchEvent(new Event(KEY_CHANGE_EVENT));
    }
  }, []);

  const hasApiKey = useCallback(
    (provider: keyof ApiKeys): boolean => {
      return Boolean(apiKeys[provider]);
    },
    [apiKeys],
  );

  const getApiKey = useCallback(
    (provider: keyof ApiKeys): string | undefined => {
      return apiKeys[provider];
    },
    [apiKeys],
  );

  return {
    apiKeys,
    isLoaded,
    setApiKey,
    removeApiKey,
    clearAllKeys,
    hasApiKey,
    getApiKey,
  };
}
