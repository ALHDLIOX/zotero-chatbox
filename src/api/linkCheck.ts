/**
 * Wraps the preference panel's test-connection request in a reusable helper.
 * Depends on the browser `fetch` stack so callers can focus on UI feedback/state.
 */
const CHAT_COMPLETIONS_PATH = "/v1/chat/completions";

/**
 * Parameters defining which provider endpoint to ping and which credentials to use.
 */
export interface LinkCheckParams {
  /** Fully qualified provider endpoint URL (e.g., https://api.openai.com). */
  endpoint: string;
  /** API key to include in the Authorization header. */
  apiKey: string;
  /** Provider model identifier used to form the request payload. */
  model: string;
  /** Optional signal to cancel long-running or redundant link checks. */
  signal?: AbortSignal;
}

/**
 * Posts a minimal chat completion payload to the provider to verify the connection.
 * @param params Configuration for the link check request.
 * @throws Error when the network call rejects or the provider responds with a non-2xx status.
 */
export async function linkCheck(params: LinkCheckParams): Promise<void> {
  const url = new URL(CHAT_COMPLETIONS_PATH, params.endpoint);

  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: "system", content: "ping" },
        { role: "user", content: "ping" },
      ],
      stream: false,
      max_tokens: 1,
    }),
  };

  if (params.signal) {
    requestInit.signal = params.signal;
  }

  const response = await fetch(url.toString(), requestInit);

  if (!response.ok) {
    throw new Error(`Link check failed with status ${response.status}`);
  }
}
