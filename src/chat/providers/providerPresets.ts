/** Built-in provider presets (endpoint, model, labels). */
export type ProviderId = "openai" | "deepseek";

export interface ProviderPreset {
  id: string; // e.g. "deepseek:deepseek-chat"
  provider: ProviderId;
  labelKey: string; // Fluent key for display label
  label: string; // Fallback plain text label
  endpoint: string; // HTTPS base URL
  model: string;
}

export const PRESETS: ProviderPreset[] = [
  {
    id: "openai:gpt-4.1",
    provider: "openai",
    labelKey: "zorecto-preset-openai-gpt-4-1",
    label: "ChatGPT 4.1",
    endpoint: "https://api.openai.com",
    model: "gpt-4.1",
  },
  {
    id: "deepseek:deepseek-chat",
    provider: "deepseek",
    labelKey: "zorecto-preset-deepseek-chat",
    label: "deepseek chat",
    endpoint: "https://api.deepseek.com",
    model: "deepseek-chat",
  },
];

export function getDefaultPresetId(): string {
  return "deepseek:deepseek-chat";
}

export function getPresetById(id: string): ProviderPreset | undefined {
  return PRESETS.find((p) => p.id === id);
}

export function findPresetIdByProviderModel(
  provider: ProviderId,
  model: string,
): string | undefined {
  return PRESETS.find((p) => p.provider === provider && p.model === model)?.id;
}
