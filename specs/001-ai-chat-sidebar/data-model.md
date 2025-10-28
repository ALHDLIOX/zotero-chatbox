# Data Model: AI Chat Sidebar

This document outlines the key data structures for the AI Chat Sidebar feature.

## Entities

### Message

Represents a single message in the chat conversation.

-   **role**: `string` - The role of the message sender. Can be one of `system`, `user`, or `assistant`.
-   **content**: `string` - The text content of the message.

### ChatResult

Represents the result returned by an AI provider after a chat interaction.

-   **text**: `string` - The full text of the AI's response.
-   **usage**: `object` (optional) - Token usage information.
    -   **promptTokens**: `number` (optional)
    -   **completionTokens**: `number` (optional)
    -   **totalTokens**: `number` (optional)
-   **raw**: `any` (optional) - The original, unprocessed response from the provider.

### LLMProvider (Interface)

Defines the contract for an AI language model provider.

-   **id**: `string` - A unique identifier for the provider (e.g., `deepseek`, `openai`).
-   **displayName**: `string` - The user-facing name of the provider.
-   **chat(options)**: `Promise<ChatResult>` - A method to send a chat request.
    -   **options**: `object`
        -   **endpoint**: `string`
        -   **apiKey**: `string`
        -   **model**: `string`
        -   **messages**: `Message[]`
        -   **signal**: `AbortSignal` (for aborting requests)
        -   **onToken**: `(chunk: string) => void` (for streaming responses)
-   **countTokens(input)**: `Promise<number>` (optional) - A method to count tokens in a message or array of messages.

### Settings

Represents the user-configurable settings for the plugin, stored in Zotero's preferences.

-   **provider**: `string` - The ID of the selected AI provider.
-   **endpoint**: `string` - The API endpoint URL for the AI provider.
-   **model**: `string` - The name of the AI model to use.
-   **apiKey**: `string` - The user's API key (stored as a password).
-   **useSystemPrompt**: `boolean` - Flag to enable/disable the system prompt.
-   **attachDocMeta**: `boolean` - Flag to enable/disable attaching document metadata.