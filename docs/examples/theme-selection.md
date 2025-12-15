# Theme Selection Example

This example shows how to create a theme selection interface using the `getThemes()` and `getThemeThumbnail()` utilities from `vue-wswg-editor`.

## Compact Example

```vue
<template>
   <div class="theme-selector">
      <input v-model="searchQuery" type="text" placeholder="Search themes..." class="search-input" />

      <div class="theme-grid">
         <button
            v-for="theme in filteredThemes"
            :key="theme.id"
            :class="['theme-card', { 'theme-card--selected': selectedThemeId === theme.id }]"
            @click="selectTheme(theme.id)"
         >
            <img
               v-if="getThemeThumbnail(theme.path)"
               :src="getThemeThumbnail(theme.path)"
               :alt="theme.title"
               class="theme-thumbnail"
            />
            <div class="theme-info">
               <h3>{{ theme.title }}</h3>
               <p>{{ theme.description }}</p>
            </div>
         </button>
      </div>

      <button @click="saveTheme" :disabled="!selectedThemeId">Save Theme</button>
   </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { getThemes, getThemeThumbnail, type Theme } from "vue-wswg-editor";

const searchQuery = ref("");
const selectedThemeId = ref<string | null>(null);

// Get all available themes
const availableThemes = computed(() => getThemes());

// Filter themes based on search query
const filteredThemes = computed(() => {
   if (!searchQuery.value.trim()) {
      return availableThemes.value;
   }

   const query = searchQuery.value.toLowerCase();
   return availableThemes.value.filter((theme: Theme) => {
      return (
         theme.title.toLowerCase().includes(query) ||
         theme.description.toLowerCase().includes(query) ||
         theme.tags.some((tag: string) => tag.toLowerCase().includes(query))
      );
   });
});

function selectTheme(themeId: string) {
   selectedThemeId.value = themeId;
}

async function saveTheme() {
   if (!selectedThemeId.value) return;

   // Save theme to your application state/database
   // The theme ID should be stored separately from pageData
   await fetch("/api/settings/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeId: selectedThemeId.value }),
   });

   // Update your application's theme state
   // Then pass the theme ID to WswgPageBuilder and PageRenderer components
}
</script>

<style scoped>
.theme-selector {
   padding: 1rem;
}

.search-input {
   width: 100%;
   padding: 0.5rem;
   margin-bottom: 1rem;
   border: 1px solid #ccc;
   border-radius: 4px;
}

.theme-grid {
   display: grid;
   grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
   gap: 1rem;
   margin-bottom: 1rem;
}

.theme-card {
   border: 2px solid #e5e7eb;
   border-radius: 8px;
   overflow: hidden;
   cursor: pointer;
   transition: all 0.2s;
   background: white;
}

.theme-card:hover {
   border-color: #9ca3af;
   box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.theme-card--selected {
   border-color: #3b82f6;
   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.theme-thumbnail {
   width: 100%;
   aspect-ratio: 16/9;
   object-fit: cover;
}

.theme-info {
   padding: 1rem;
}

.theme-info h3 {
   margin: 0 0 0.5rem 0;
   font-size: 1rem;
   font-weight: 600;
}

.theme-info p {
   margin: 0;
   font-size: 0.875rem;
   color: #6b7280;
}
</style>
```

## Usage with Components

After selecting a theme, pass it to your `WswgPageBuilder` and `PageRenderer` components:

```vue
<template>
   <WswgPageBuilder v-model="pageData" :theme="currentThemeId" :editable="true" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { WswgPageBuilder } from "vue-wswg-editor";

const currentThemeId = ref("default"); // Load from your application state
const pageData = ref({
   blocks: [],
   settings: { layout: "default" },
});
</script>
```

## Key Points

- **Theme is separate from pageData**: The theme ID should be stored separately in your application state or database
- **Use `getThemes()`**: Fetches all available themes discovered by the library
- **Use `getThemeThumbnail()`**: Gets the thumbnail image URL for a theme
- **Pass theme prop**: Both `WswgPageBuilder` and `PageRenderer` accept a `theme` prop
- **Fallback to default**: If no theme is provided, the library falls back to a `default` theme directory
