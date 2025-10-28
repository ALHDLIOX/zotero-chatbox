# Quickstart: AI Chat Sidebar

This guide provides the basic steps to get the AI Chat Sidebar feature running for development and testing.

## Prerequisites

-   Node.js and npm installed.
-   A local copy of the Zotero desktop application.

## Build and Install

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Build the plugin**:
    ```bash
    npm run build
    ```
    This will create the plugin `.xpi` file in the `build` directory.

3.  **Install the plugin in Zotero**:
    -   Open Zotero.
    -   Go to `Tools > Add-ons`.
    -   Click the gear icon and select `Install Add-on From File...`.
    -   Select the `.xpi` file from the `build` directory.

## Testing

1.  **Run unit tests**:
    ```bash
    npm test
    ```

2.  **Manual testing**:
    -   Open Zotero and go to a PDF in the reader.
    -   Open the AI Chat Sidebar.
    -   Configure the AI provider in the preferences (`Tools > Preferences > zotero-chatbox`).
    -   Test the chat functionality, including sending messages, stopping responses, and clearing the chat.