"use client";

import { useState, useEffect, useCallback } from "react";

export interface ApiKeys {
  openai?: string;
  gemini?: string;
}

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKeys: ApiKeys = {};

      const openaiKey = localStorage.getItem("openai_api_key");
      const geminiKey = localStorage.getItem("gemini_api_key");

      if (openaiKey) savedKeys.openai = openaiKey;
      if (geminiKey) savedKeys.gemini = geminiKey;

      setApiKeys(savedKeys);
      setIsLoaded(true);
    }
  }, []);

  const setApiKey = useCallback((provider: keyof ApiKeys, key: string) => {
    if (typeof window !== "undefined") {
      const storageKey = `${provider}_api_key`;
      localStorage.setItem(storageKey, key);

      setApiKeys((prev) => ({
        ...prev,
        [provider]: key,
      }));
    }
  }, []);

  const removeApiKey = useCallback((provider: keyof ApiKeys) => {
    if (typeof window !== "undefined") {
      const storageKey = `${provider}_api_key`;
      localStorage.removeItem(storageKey);

      setApiKeys((prev) => {
        const newKeys = { ...prev };
        delete newKeys[provider];
        return newKeys;
      });
    }
  }, []);

  const clearAllKeys = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("openai_api_key");
      localStorage.removeItem("gemini_api_key");
      setApiKeys({});
    }
  }, []);

  const hasApiKey = useCallback(
    (provider: keyof ApiKeys): boolean => {
      return Boolean(apiKeys[provider]);
    },
    [apiKeys]
  );

  const getApiKey = useCallback(
    (provider: keyof ApiKeys): string | undefined => {
      return apiKeys[provider];
    },
    [apiKeys]
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
