# Data Management

This guide covers best practices for handling page data in your application, including fetching, saving, autosaving, versioning, and publishing workflows.

## Basic Data Flow

The `WswgPageBuilder` component uses Vue's `v-model` for two-way data binding. The component emits `update:modelValue` whenever the page data changes, allowing you to handle updates in your application.

```vue
<template>
   <WswgPageBuilder v-model="pageData" :editable="true" />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { WswgPageBuilder } from "vue-wswg-editor";

const pageData = ref({
   blocks: [],
   settings: { layout: "default" },
});

// Watch for changes
watch(pageData, (newData) => {
   console.log("Page data changed:", newData);
});
</script>
```

## Fetching Page Data

### Loading Initial Data

Fetch page data from your API when the component mounts:

```vue
<template>
   <WswgPageBuilder v-model="pageData" :editable="true" :loading="loading" />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { WswgPageBuilder } from "vue-wswg-editor";

const pageData = ref({
   blocks: [],
   settings: { layout: "default" },
});
const loading = ref(true);

onMounted(async () => {
   try {
      const response = await fetch(`/api/pages/${pageId}`);
      const data = await response.json();
      pageData.value = data;
   } catch (error) {
      console.error("Failed to load page:", error);
   } finally {
      loading.value = false;
   }
});
</script>
```

### Using a Composable

Create a reusable composable for page data management:

```typescript
// composables/usePageData.ts
import { ref, computed } from "vue";

export function usePageData(pageId: string) {
   const pageData = ref({
      blocks: [],
      settings: { layout: "default" },
   });
   const loading = ref(false);
   const error = ref<string | null>(null);

   async function loadPage() {
      loading.value = true;
      error.value = null;
      try {
         const response = await fetch(`/api/pages/${pageId}`);
         if (!response.ok) throw new Error("Failed to load page");
         pageData.value = await response.json();
      } catch (e) {
         error.value = e instanceof Error ? e.message : "Unknown error";
      } finally {
         loading.value = false;
      }
   }

   async function savePage() {
      loading.value = true;
      error.value = null;
      try {
         const response = await fetch(`/api/pages/${pageId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pageData.value),
         });
         if (!response.ok) throw new Error("Failed to save page");
         return await response.json();
      } catch (e) {
         error.value = e instanceof Error ? e.message : "Unknown error";
         throw e;
      } finally {
         loading.value = false;
      }
   }

   return {
      pageData,
      loading,
      error,
      loadPage,
      savePage,
   };
}
```

## Saving Updates

### Manual Save

Implement a save button that saves data on demand:

```vue
<template>
   <div>
      <header class="editor-header">
         <button @click="handleSave" :disabled="saving">
            {{ saving ? "Saving..." : "Save" }}
         </button>
      </header>
      <WswgPageBuilder v-model="pageData" :editable="true" />
   </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { WswgPageBuilder } from "vue-wswg-editor";

const pageData = ref({ blocks: [], settings: {} });
const saving = ref(false);

async function handleSave() {
   saving.value = true;
   try {
      const response = await fetch("/api/pages/123", {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(pageData.value),
      });
      if (!response.ok) throw new Error("Save failed");
      alert("Saved successfully!");
   } catch (error) {
      alert("Failed to save: " + error);
   } finally {
      saving.value = false;
   }
}
</script>
```

### Using a Header for Actions

Place save and publish buttons in a header above the editor:

```vue
<template>
   <div>
      <header class="editor-header">
         <button @click="handleSave" :disabled="saving">
            {{ saving ? "Saving..." : "Save" }}
         </button>
         <button @click="handlePublish" :disabled="publishing">
            {{ publishing ? "Publishing..." : "Publish" }}
         </button>
      </header>
      <WswgPageBuilder v-model="pageData" :editable="true" />
   </div>
</template>
```

## Autosaving

Implement autosave to save changes automatically after a delay:

```vue
<template>
   <WswgPageBuilder v-model="pageData" :editable="true" />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { WswgPageBuilder } from "vue-wswg-editor";

const pageData = ref({ blocks: [], settings: {} });
const saving = ref(false);
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

// Debounced autosave
watch(
   pageData,
   () => {
      // Clear existing timer
      if (autosaveTimer) {
         clearTimeout(autosaveTimer);
      }

      // Set new timer (save after 2 seconds of inactivity)
      autosaveTimer = setTimeout(async () => {
         await autosave();
      }, 2000);
   },
   { deep: true }
);

async function autosave() {
   if (saving.value) return; // Don't save if already saving

   saving.value = true;
   try {
      await fetch("/api/pages/123/autosave", {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(pageData.value),
      });
      console.log("Autosaved");
   } catch (error) {
      console.error("Autosave failed:", error);
   } finally {
      saving.value = false;
   }
}

// Cleanup on unmount
import { onBeforeUnmount } from "vue";
onBeforeUnmount(() => {
   if (autosaveTimer) {
      clearTimeout(autosaveTimer);
   }
});
</script>
```

### Autosave with Visual Feedback

Show autosave status to users:

```vue
<template>
   <div>
      <div class="autosave-status" :class="{ saving: saving.value }">
         {{ saving.value ? "Saving..." : lastSaved ? `Saved ${lastSaved}` : "" }}
      </div>
      <WswgPageBuilder v-model="pageData" :editable="true" />
   </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { WswgPageBuilder } from "vue-wswg-editor";

const pageData = ref({ blocks: [], settings: {} });
const saving = ref(false);
const lastSaved = ref<string | null>(null);
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

watch(
   pageData,
   () => {
      if (autosaveTimer) clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(autosave, 2000);
   },
   { deep: true }
);

async function autosave() {
   if (saving.value) return;
   saving.value = true;
   try {
      await fetch("/api/pages/123/autosave", {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(pageData.value),
      });
      lastSaved.value = new Date().toLocaleTimeString();
   } catch (error) {
      console.error("Autosave failed:", error);
   } finally {
      saving.value = false;
   }
}
</script>
```

## Edit and View Modes

Toggle between editing and viewing modes:

```vue
<template>
   <div>
      <div class="mode-toggle">
         <button @click="isEditing = !isEditing">
            {{ isEditing ? "View Mode" : "Edit Mode" }}
         </button>
      </div>
      <WswgPageBuilder v-model="pageData" :editable="isEditing" />
   </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { WswgPageBuilder, PageRenderer } from "vue-wswg-editor";

const pageData = ref({ blocks: [], settings: {} });
const isEditing = ref(false);
</script>
```

### Using URL Parameters

Control edit mode via URL parameters:

```vue
<template>
   <WswgPageBuilder v-model="pageData" :editable="isEditMode" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { WswgPageBuilder } from "vue-wswg-editor";

const route = useRoute();
const pageData = ref({ blocks: [], settings: {} });

const isEditMode = computed(() => {
   return route.query.mode === "edit";
});
</script>
```

## Validating All Fields

Before saving or publishing, you should validate all fields in the page data to ensure data integrity. The `validateAllFields` function validates all blocks and settings fields according to their field configurations.

### Basic Validation

```typescript
import { validateAllFields } from "vue-wswg-editor";

async function validatePage(pageData: any) {
   const results = await validateAllFields(pageData);

   // Check if all validations passed
   const isValid = Object.values(results).every((result) => result.isValid);

   return { isValid, results };
}
```

### Validation Result Structure

The `validateAllFields` function returns a `Record<string, ValidationResult>`:

```typescript
interface ValidationResult {
   title: string; // Display name (e.g., "Hero", "Settings")
   isValid: boolean; // Whether all fields in this section are valid
   errors: Record<string, string | boolean>; // Field errors
}
```

### Blocking Save/Publish on Validation Errors

Prevent saving or publishing when validation fails:

```typescript
async function handleSave() {
   // Validate before saving
   const validation = await validateAllFields(pageData.value);
   const isValid = Object.values(validation).every((r) => r.isValid);

   if (!isValid) {
      alert("Please fix validation errors before saving");
      return;
   }

   // Proceed with save
   await savePage();
}
```

### Displaying Validation Errors

Show validation errors to users in a user-friendly way:

```vue
<template>
   <div>
      <!-- Validation errors banner -->
      <div v-if="validationErrors && Object.keys(validationErrors).length > 0" class="validation-errors">
         <h3>Please fix the following errors:</h3>
         <ul>
            <li v-for="(result, section) in validationErrors" :key="section">
               <strong>{{ result.title }}:</strong>
               <ul>
                  <li v-for="(error, field) in result.errors" :key="field">
                     {{ field }}: {{ typeof error === "string" ? error : "Invalid" }}
                  </li>
               </ul>
            </li>
         </ul>
      </div>

      <WswgPageBuilder v-model="pageData" :editable="true" />
   </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { WswgPageBuilder, validateAllFields, type ValidationResult } from "vue-wswg-editor";

const pageData = ref({ blocks: [], settings: {} });
const validationErrors = ref<Record<string, ValidationResult>>({});

async function checkValidation() {
   const results = await validateAllFields(pageData.value);
   // Only show sections with errors
   validationErrors.value = Object.fromEntries(Object.entries(results).filter(([, result]) => !result.isValid));
}

async function handleSave() {
   await checkValidation();

   if (Object.keys(validationErrors.value).length > 0) {
      return; // Don't save if there are errors
   }

   // Save logic here
}
</script>
```

### Real-time Validation Status

Show validation status in the UI:

```vue
<template>
   <div>
      <div class="editor-header">
         <div class="validation-status">
            <span v-if="isValidating">Validating...</span>
            <span v-else-if="hasErrors" class="status-error">
               {{ errorCount }} validation error{{ errorCount !== 1 ? "s" : "" }}
            </span>
            <span v-else class="status-valid">All fields valid</span>
         </div>
         <button @click="handleSave" :disabled="hasErrors || saving">Save</button>
         <button @click="handlePublish" :disabled="hasErrors || publishing">Publish</button>
      </div>

      <WswgPageBuilder v-model="pageData" :editable="true" />
   </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { WswgPageBuilder, validateAllFields, type ValidationResult } from "vue-wswg-editor";

const pageData = ref({ blocks: [], settings: {} });
const validationResults = ref<Record<string, ValidationResult>>({});
const isValidating = ref(false);
const saving = ref(false);
const publishing = ref(false);

const hasErrors = computed(() => {
   return Object.values(validationResults.value).some((r) => !r.isValid);
});

const errorCount = computed(() => {
   return Object.values(validationResults.value).reduce((count, result) => {
      return count + Object.keys(result.errors).length;
   }, 0);
});

async function validatePage() {
   isValidating.value = true;
   try {
      validationResults.value = await validateAllFields(pageData.value);
   } finally {
      isValidating.value = false;
   }
}

// Validate on data changes (debounced)
let validationTimer: ReturnType<typeof setTimeout> | null = null;
watch(
   pageData,
   () => {
      if (validationTimer) clearTimeout(validationTimer);
      validationTimer = setTimeout(validatePage, 500);
   },
   { deep: true }
);

async function handleSave() {
   await validatePage();
   if (hasErrors.value) {
      alert(`Cannot save: ${errorCount.value} validation error(s)`);
      return;
   }

   saving.value = true;
   try {
      await fetch("/api/pages/123", {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(pageData.value),
      });
   } finally {
      saving.value = false;
   }
}

async function handlePublish() {
   await validatePage();
   if (hasErrors.value) {
      alert(`Cannot publish: ${errorCount.value} validation error(s)`);
      return;
   }

   publishing.value = true;
   try {
      await fetch("/api/pages/123/publish", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(pageData.value),
      });
   } finally {
      publishing.value = false;
   }
}

// Validate on mount
import { onMounted } from "vue";
onMounted(() => {
   validatePage();
});
</script>
```

### Validation Error Modal

Display validation errors in a modal for better UX:

```vue
<template>
   <div>
      <header class="editor-header">
         <button @click="handleSave">Save</button>
         <button @click="handlePublish">Publish</button>
      </header>
      <WswgPageBuilder v-model="pageData" :editable="true" />

      <!-- Validation Error Modal -->
      <div v-if="showValidationModal" class="modal-overlay" @click="showValidationModal = false">
         <div class="modal-content" @click.stop>
            <h2>Validation Errors</h2>
            <p>Please fix the following errors before continuing:</p>
            <div class="validation-errors-list">
               <div v-for="(result, section) in validationErrors" :key="section" class="error-section">
                  <h3>{{ result.title }}</h3>
                  <ul>
                     <li v-for="(error, field) in result.errors" :key="field">
                        <strong>{{ field }}:</strong>
                        {{ typeof error === "string" ? error : "Invalid value" }}
                     </li>
                  </ul>
               </div>
            </div>
            <button @click="showValidationModal = false">Close</button>
         </div>
      </div>
   </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { WswgPageBuilder, validateAllFields, type ValidationResult } from "vue-wswg-editor";

const pageData = ref({ blocks: [], settings: {} });
const validationErrors = ref<Record<string, ValidationResult>>({});
const showValidationModal = ref(false);

async function validateAndShowErrors() {
   const results = await validateAllFields(pageData.value);
   validationErrors.value = Object.fromEntries(Object.entries(results).filter(([, result]) => !result.isValid));
   return Object.keys(validationErrors.value).length === 0;
}

async function handleSave() {
   const isValid = await validateAndShowErrors();
   if (!isValid) {
      showValidationModal.value = true;
      return;
   }

   // Save logic
   await fetch("/api/pages/123", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pageData.value),
   });
}

async function handlePublish() {
   const isValid = await validateAndShowErrors();
   if (!isValid) {
      showValidationModal.value = true;
      return;
   }

   // Publish logic
   await fetch("/api/pages/123/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pageData.value),
   });
}
</script>

<style scoped>
.modal-overlay {
   position: fixed;
   inset: 0;
   background: rgba(0, 0, 0, 0.5);
   display: flex;
   align-items: center;
   justify-content: center;
   z-index: 1000;
}

.modal-content {
   background: white;
   padding: 2rem;
   border-radius: 8px;
   max-width: 600px;
   max-height: 80vh;
   overflow-y: auto;
}

.validation-errors-list {
   margin: 1rem 0;
}

.error-section {
   margin-bottom: 1rem;
   padding: 1rem;
   background: #fee;
   border-radius: 4px;
}

.error-section h3 {
   margin-top: 0;
   color: #c00;
}

.error-section ul {
   margin: 0.5rem 0 0 1.5rem;
}
</style>
```

### Custom Validation Keys

If your page data uses different keys, specify them:

```typescript
import { validateAllFields } from "vue-wswg-editor";

// Custom keys
const results = await validateAllFields(pageData, "content", "meta");
// Validates pageData.content (blocks) and pageData.meta (settings)
```

For more details on validation, see the [Validation Guide](/guide/validation).

## Publishing Workflow

Implement a publishing workflow with draft and published states:

```typescript
interface PageState {
   id: string;
   draft: any;
   published: any | null;
   publishedAt: string | null;
   status: "draft" | "published" | "archived";
}

async function publishPage(pageId: string) {
   // Load draft
   const draft = await fetch(`/api/pages/${pageId}/draft`).then((r) => r.json());

   // Validate before publishing
   const validation = await validatePage(draft);
   if (!validation.isValid) {
      throw new Error("Page validation failed");
   }

   // Publish
   const response = await fetch(`/api/pages/${pageId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
         data: draft,
         publishedAt: new Date().toISOString(),
      }),
   });

   return response.json();
}

async function unpublishPage(pageId: string) {
   const response = await fetch(`/api/pages/${pageId}/unpublish`, {
      method: "POST",
   });
   return response.json();
}
```

### Publishing UI

```vue
<template>
   <div>
      <header class="editor-header">
         <button @click="handleSaveDraft" :disabled="saving">
            {{ saving ? "Saving..." : "Save Draft" }}
         </button>
         <button @click="handlePublish" :disabled="publishing || !canPublish">
            {{ publishing ? "Publishing..." : "Publish" }}
         </button>
         <span v-if="publishedAt" class="published-badge"> Published: {{ formatDate(publishedAt) }} </span>
      </header>
      <WswgPageBuilder v-model="draftData" :editable="true" />
   </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { WswgPageBuilder, validateAllFields, type ValidationResult } from "vue-wswg-editor";

const draftData = ref({ blocks: [], settings: {} });
const publishedData = ref(null);
const publishedAt = ref<string | null>(null);
const saving = ref(false);
const publishing = ref(false);
const validationResults = ref<Record<string, ValidationResult>>({});

// Validate and update validation results
async function validateDraft() {
   validationResults.value = await validateAllFields(draftData.value);
}

const canPublish = computed(() => {
   // Check if validation has been run and all fields are valid
   if (Object.keys(validationResults.value).length === 0) return false;
   return Object.values(validationResults.value).every((r) => r.isValid);
});

onMounted(async () => {
   // Load draft
   const draft = await fetch(`/api/pages/123/draft`).then((r) => r.json());
   draftData.value = draft;

   // Load published version
   const published = await fetch(`/api/pages/123/published`).then((r) => r.json());
   if (published) {
      publishedData.value = published.data;
      publishedAt.value = published.publishedAt;
   }

   // Validate on mount
   await validateDraft();
});

async function handleSaveDraft() {
   // Validate before saving
   await validateDraft();
   const isValid = Object.values(validationResults.value).every((r) => r.isValid);

   if (!isValid) {
      const errorCount = Object.values(validationResults.value).reduce(
         (count, r) => count + Object.keys(r.errors).length,
         0
      );
      alert(`Cannot save draft: ${errorCount} validation error(s)`);
      return;
   }

   saving.value = true;
   try {
      await fetch("/api/pages/123/draft", {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(draftData.value),
      });
   } finally {
      saving.value = false;
   }
}

async function handlePublish() {
   // Validate before publishing
   await validateDraft();
   const isValid = Object.values(validationResults.value).every((r) => r.isValid);

   if (!isValid) {
      const errorCount = Object.values(validationResults.value).reduce(
         (count, r) => count + Object.keys(r.errors).length,
         0
      );
      alert(`Cannot publish: ${errorCount} validation error(s). Please fix errors before publishing.`);
      return;
   }

   publishing.value = true;
   try {
      const result = await publishPage("123");
      publishedData.value = result.data;
      publishedAt.value = result.publishedAt;
      alert("Published successfully!");
   } catch (error) {
      alert("Failed to publish: " + error);
   } finally {
      publishing.value = false;
   }
}

function formatDate(date: string) {
   return new Date(date).toLocaleString();
}
</script>
```

## Best Practices

### 1. Optimistic Updates

Update the UI immediately, then sync with the server:

```typescript
async function savePageOptimistic(pageData: any) {
   // Save local copy immediately
   const localCopy = { ...pageData };

   try {
      await fetch("/api/pages/123", {
         method: "PUT",
         body: JSON.stringify(pageData),
      });
   } catch (error) {
      // Revert on error
      pageData.value = localCopy;
      throw error;
   }
}
```

### 2. Conflict Resolution

Handle concurrent edits:

```typescript
async function saveWithConflictResolution(pageData: any, lastModified: string) {
   const response = await fetch("/api/pages/123", {
      method: "PUT",
      headers: {
         "Content-Type": "application/json",
         "If-Unmodified-Since": lastModified,
      },
      body: JSON.stringify(pageData),
   });

   if (response.status === 412) {
      // Conflict - reload and show merge UI
      const latest = await fetch("/api/pages/123").then((r) => r.json());
      return { conflict: true, latest };
   }

   return response.json();
}
```

### 3. Data Normalization

Normalize data before saving:

```typescript
function normalizePageData(data: any) {
   return {
      blocks: data.blocks.map((block) => ({
         id: block.id,
         type: block.type,
         ...block,
      })),
      settings: {
         layout: data.settings?.layout || "default",
         ...data.settings,
      },
   };
}

async function savePage(pageData: any) {
   const normalized = normalizePageData(pageData);
   await fetch("/api/pages/123", {
      method: "PUT",
      body: JSON.stringify(normalized),
   });
}
```

### 4. Error Handling

Implement robust error handling:

```vue
<template>
   <div>
      <div v-if="error" class="error-banner">
         {{ error }}
         <button @click="error = null">Dismiss</button>
      </div>
      <WswgPageBuilder v-model="pageData" :editable="true" />
   </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { WswgPageBuilder } from "vue-wswg-editor";

const pageData = ref({ blocks: [], settings: {} });
const error = ref<string | null>(null);

async function savePage() {
   try {
      error.value = null;
      const response = await fetch("/api/pages/123", {
         method: "PUT",
         body: JSON.stringify(pageData.value),
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || "Save failed");
      }
   } catch (e) {
      error.value = e instanceof Error ? e.message : "Unknown error";
      // Optionally retry or show recovery options
   }
}
</script>
```

### 5. Performance Optimization

Debounce autosave and use shallow watching for large datasets:

```typescript
import { watch, shallowRef } from "vue";

const pageData = shallowRef({ blocks: [], settings: {} });

// Use shallow watch for better performance with large datasets
watch(
   () => pageData.value,
   () => {
      // Handle changes
   },
   { deep: false } // Shallow watch
);
```

## Complete Example

Here's a complete example combining all concepts:

```vue
<template>
   <div class="page-editor">
      <div class="editor-header">
         <h1>{{ pageTitle }}</h1>
         <div class="editor-actions">
            <span v-if="saving" class="status-saving">Saving...</span>
            <span v-else-if="lastSaved" class="status-saved"> Saved {{ formatTime(lastSaved) }} </span>
            <button @click="handleSave" :disabled="saving">Save</button>
            <button @click="handlePublish" :disabled="!canPublish">Publish</button>
         </div>
      </div>

      <WswgPageBuilder
         v-model="pageData"
         :editable="isEditMode"
         :loading="loading"
         @update:modelValue="handleDataChange"
      />
   </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { WswgPageBuilder, validateAllFields } from "vue-wswg-editor";

const route = useRoute();
const pageId = computed(() => route.params.id as string);

const pageData = ref({ blocks: [], settings: {} });
const pageTitle = ref("Untitled Page");
const loading = ref(true);
const saving = ref(false);
const lastSaved = ref<Date | null>(null);
const isEditMode = computed(() => route.query.mode === "edit");

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

onMounted(async () => {
   await loadPage();
});

async function loadPage() {
   loading.value = true;
   try {
      const response = await fetch(`/api/pages/${pageId.value}`);
      const data = await response.json();
      pageData.value = data.data;
      pageTitle.value = data.title;
   } catch (error) {
      console.error("Failed to load page:", error);
   } finally {
      loading.value = false;
   }
}

function handleDataChange() {
   // Debounced autosave
   if (autosaveTimer) clearTimeout(autosaveTimer);
   autosaveTimer = setTimeout(autosave, 2000);
}

async function autosave() {
   if (saving.value) return;
   saving.value = true;
   try {
      await fetch(`/api/pages/${pageId.value}/autosave`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(pageData.value),
      });
      lastSaved.value = new Date();
   } catch (error) {
      console.error("Autosave failed:", error);
   } finally {
      saving.value = false;
   }
}

async function handleSave() {
   // Validate before saving
   const validation = await validateAllFields(pageData.value);
   const isValid = Object.values(validation).every((r) => r.isValid);

   if (!isValid) {
      const errorCount = Object.values(validation).reduce((count, r) => count + Object.keys(r.errors).length, 0);
      alert(`Cannot save: ${errorCount} validation error(s). Please fix errors before saving.`);
      return;
   }

   saving.value = true;
   try {
      await fetch(`/api/pages/${pageId.value}`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(pageData.value),
      });
      lastSaved.value = new Date();
   } catch (error) {
      alert("Failed to save: " + error);
   } finally {
      saving.value = false;
   }
}

const canPublish = computed(() => {
   return pageData.value.blocks.length > 0;
});

async function handlePublish() {
   // Validate before publishing
   const validation = await validateAllFields(pageData.value);
   const isValid = Object.values(validation).every((r) => r.isValid);

   if (!isValid) {
      const errorCount = Object.values(validation).reduce((count, r) => count + Object.keys(r.errors).length, 0);
      alert(`Cannot publish: ${errorCount} validation error(s). Please fix errors before publishing.`);
      return;
   }

   try {
      await fetch(`/api/pages/${pageId.value}/publish`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(pageData.value),
      });
      alert("Published successfully!");
   } catch (error) {
      alert("Failed to publish: " + error);
   }
}

function formatTime(date: Date) {
   return date.toLocaleTimeString();
}

onBeforeUnmount(() => {
   if (autosaveTimer) {
      clearTimeout(autosaveTimer);
   }
});
</script>
```
