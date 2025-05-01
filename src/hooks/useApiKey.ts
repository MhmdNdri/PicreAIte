import { useMutation, useQuery } from "@tanstack/react-query";

export function useApiKey() {
  const { data: apiKey, isLoading } = useQuery({
    queryKey: ["apiKey"],
    queryFn: async () => {
      const response = await fetch("/api/user/api-key");
      if (!response.ok) {
        throw new Error("Failed to fetch API key");
      }
      const data = await response.json();
      return data.apiKey;
    },
  });

  const { mutate: setApiKey, isPending } = useMutation({
    mutationFn: async (apiKey: string) => {
      const response = await fetch("/api/user/api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });
      if (!response.ok) {
        throw new Error("Failed to set API key");
      }
    },
  });

  return {
    apiKey,
    isLoading,
    setApiKey,
    isPending,
  };
}
