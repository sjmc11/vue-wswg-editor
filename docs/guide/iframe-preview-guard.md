# Iframe Preview Compatibility

When using the WSWG Editor in a Vue application with Vue Router, you may encounter issues where the consuming app's router interferes with the iframe preview. This guide explains why this happens and how to resolve it.

## The Problem

The WSWG Editor renders page previews in an isolated iframe using a special route (`/__wswg-iframe-preview.html`). In production builds, Vite bundles your blocks and layouts together with your application code. When the iframe loads, it imports JavaScript chunks that may contain your app's initialization code.

This can cause issues such as:

- **404 pages appearing in the iframe** - Your app's catch-all route intercepts the preview path
- **Router conflicts** - Your app's Vue Router tries to handle navigation inside the iframe
- **Unwanted side effects** - Plugins, stores, or other initialization code runs in the iframe context

### Why Does This Happen?

Here's the sequence of events:

```
1. Iframe loads /__wswg-iframe-preview.html           ✅
2. HTML loads the JavaScript chunk containing blocks   ✅
3. That chunk imports shared dependencies              ⚠️
4. Shared dependencies include your app's main.ts     ❌
5. Your app initializes → router activates → 404!     ❌
```

Because your blocks and layouts are part of your application, they share chunks with your main application code. When those chunks load in the iframe, any top-level code (like app initialization) executes.

## The Solution

The library exports an `isWswgIframePreview()` utility function that detects when code is running inside the iframe preview context. Use this to guard your app's initialization.

### Basic Usage

Add a simple guard around your app initialization in `main.ts`:

```typescript
// main.ts
import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { isWswgIframePreview } from "vue-wswg-editor";
import App from "./App.vue";

const app = createApp(App);

const router = createRouter({
   history: createWebHistory(),
   routes: [
      /* your routes */
   ],
});

app.use(router);

// Only mount the app if NOT in iframe preview context
if (!isWswgIframePreview()) {
   app.mount("#app");
}
```

### With Async Initialization

If your app has async initialization (common with Pinia, i18n, etc.):

```typescript
// main.ts
import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { createPinia } from "pinia";
import { isWswgIframePreview } from "vue-wswg-editor";
import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();
const router = createRouter({
   history: createWebHistory(),
   routes: [
      /* your routes */
   ],
});

async function initializeApp() {
   app.use(pinia);
   app.use(router);

   // Your async initialization...
   await loadUserSettings();
   await initializePlugins();

   app.mount("#app");
}

// Guard the entire initialization
if (!isWswgIframePreview()) {
   initializeApp();
}
```

## How Detection Works

The `isWswgIframePreview()` function checks two indicators:

1. **Window flag**: The iframe preview HTML sets `window.__wswg_iframe_preview = true` before loading any scripts
2. **URL path**: Checks if the current path ends with `__wswg-iframe-preview.html`

```typescript
// What the function checks internally
function isWswgIframePreview(): boolean {
   if (typeof window === "undefined") return false;

   // Check flag set by iframe HTML
   if (window.__wswg_iframe_preview === true) return true;

   // Check URL path
   const { pathname } = window.location;
   return pathname.endsWith("__wswg-iframe-preview.html");
}
```

## Common Scenarios

### Catch-All 404 Route

If you have a catch-all route for 404 pages:

```vue
<!-- pages/[...all].vue or similar -->
<template>
   <div class="not-found">
      <h1>404 - Page Not Found</h1>
   </div>
</template>
```

Without the guard, this route will match `/__wswg-iframe-preview.html` and display inside the iframe. The `isWswgIframePreview()` guard in `main.ts` prevents the router from initializing at all in the iframe context.

### Authentication Redirects

If your router has navigation guards that redirect to login:

```typescript
router.beforeEach((to, from, next) => {
   if (!isAuthenticated() && to.path !== "/login") {
      next("/login");
   } else {
      next();
   }
});
```

Without the guard, this would try to redirect the iframe to your login page. With the guard, the router never initializes in the iframe.

### Plugin Side Effects

Some plugins have side effects when installed:

```typescript
// This would run in the iframe without the guard
app.use(AnalyticsPlugin); // Might track page views
app.use(IntercomPlugin); // Might initialize chat widget
```

The guard prevents all plugin initialization in the iframe context.

## Best Practices

1. **Place the guard at the end of main.ts** - Let all imports and setup code run, but guard the actual initialization/mounting

2. **Don't guard individual imports** - The guard should wrap the initialization call, not individual imports

3. **Keep the guard simple** - Just check `isWswgIframePreview()` and skip initialization if true

```typescript
// ✅ Good - simple guard at the end
if (!isWswgIframePreview()) {
   initializeApp();
}

// ❌ Bad - complex conditional logic
if (!isWswgIframePreview()) {
   // lots of code here
} else {
   // alternative initialization
}
```

## TypeScript Support

The function is fully typed:

```typescript
import { isWswgIframePreview } from "vue-wswg-editor";

// Returns boolean
const isPreview: boolean = isWswgIframePreview();
```

## Troubleshooting

### Still seeing 404 in iframe?

1. Make sure you've rebuilt your app after adding the guard
2. Check that the import is correct: `import { isWswgIframePreview } from 'vue-wswg-editor'`
3. Verify the guard is around your `app.mount()` or initialization function call

### Guard not working in development?

The guard checks for the `__wswg_iframe_preview` flag which is set by the iframe HTML. In development, the Vite dev server middleware handles this automatically. If you're seeing issues:

1. Check browser console for errors
2. Ensure the WSWG Editor Vite plugin is properly configured
3. Try clearing your browser cache and Vite's cache (`.vite` folder)
