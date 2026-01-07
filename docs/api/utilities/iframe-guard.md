# isWswgIframePreview

Utility function to detect if code is running inside the WSWG Editor's iframe preview context.

## Import

```typescript
import { isWswgIframePreview } from "vue-wswg-editor";
```

## Signature

```typescript
function isWswgIframePreview(): boolean;
```

## Returns

- `true` if running inside the iframe preview context
- `false` otherwise

## Description

This function detects when your application code is being executed inside the WSWG Editor's iframe preview. This is useful for preventing your app's router, plugins, and initialization logic from interfering with the preview.

The function checks:

1. The `window.__wswg_iframe_preview` flag (set by the preview HTML)
2. Whether the current URL path ends with `__wswg-iframe-preview.html`

## Usage

### Basic Example

```typescript
import { isWswgIframePreview } from "vue-wswg-editor";

if (isWswgIframePreview()) {
   console.log("Running in iframe preview");
} else {
   console.log("Running in main app");
}
```

### Guarding App Initialization

```typescript
// main.ts
import { createApp } from "vue";
import { isWswgIframePreview } from "vue-wswg-editor";
import App from "./App.vue";

const app = createApp(App);

// Only initialize and mount if not in iframe preview
if (!isWswgIframePreview()) {
   app.mount("#app");
}
```

## When to Use

Use this function when:

- Your app's catch-all route shows a 404 in the iframe preview
- Router navigation guards interfere with the preview
- Plugins or analytics should not run in the preview context
- Any app initialization causes unwanted side effects in the iframe

## See Also

- [Iframe Preview Guard Guide](/guide/iframe-preview-guard) - Detailed explanation and examples
