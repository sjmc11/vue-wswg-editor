# Custom Fields

When the built-in field types don't meet your needs, you can create custom field components. Custom fields allow you to build completely custom UI controls for editing block properties.

## Overview

Custom fields are Vue components that you provide to handle specific editing needs. They integrate seamlessly with the editor's validation system and data flow.

## When to Use Custom Fields

Consider custom fields when you need:

- **Rich text editing** - WYSIWYG editors like TinyMCE, Quill, or TipTap
- **Advanced image/media uploads** - Custom upload workflows, multiple files, or specialized processing
- **Complex data structures** - JSON editors, code editors, or nested forms
- **Third-party integrations** - Date pickers, color palettes, or specialized controls
- **Custom UI patterns** - Any interface that doesn't fit standard input types

::: tip Built-in Image Field
For basic image uploads, use the built-in `image` field type instead of creating a custom field. See the [Fields Guide](/guide/fields) for details.
:::

## Creating a Custom Field Component

A custom field component is a standard Vue component that receives specific props and emits updates via `v-model`.

### Component Props

Your custom component will receive:

| Prop          | Type      | Description                                    |
| ------------- | --------- | ---------------------------------------------- |
| `modelValue`  | `any`     | The current field value (for `v-model`)        |
| `editable`    | `boolean` | Whether the field is editable                  |
| `label`       | `string`  | Field label (from field config)                |
| `description` | `string`  | Field description (from field config)           |
| `required`    | `boolean` | Whether the field is required                  |
| `...`         | `any`     | All other properties from `EditorFieldConfig`  |

### Component Requirements

1. **Accept `v-model`** - Use `defineModel()` or `modelValue` prop with `update:modelValue` emit
2. **Respect `editable`** - Disable editing when `editable` is `false`
3. **Handle validation** - Validation is handled automatically by the editor, but you can display custom error states

### Basic Example

```vue
<!-- src/components/ImageUploadField.vue -->
<template>
   <div class="image-upload-field">
      <div v-if="imageUrl" class="image-preview">
         <img :src="imageUrl" alt="Preview" />
         <button v-if="editable" @click="clearImage">Remove</button>
      </div>
      <div v-else>
         <input
            v-if="editable"
            type="file"
            accept="image/*"
            @change="handleFileSelect"
         />
         <p v-else class="text-gray-500">No image selected</p>
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
   modelValue?: string | null;
   editable: boolean;
   label?: string;
   description?: string;
}>();

const emit = defineEmits<{
   "update:modelValue": [value: string | null];
}>();

const imageUrl = computed(() => props.modelValue);

function handleFileSelect(event: Event) {
   const file = (event.target as HTMLInputElement).files?.[0];
   if (file) {
      // In a real app, you'd upload the file and get a URL
      const reader = new FileReader();
      reader.onload = (e) => {
         emit("update:modelValue", e.target?.result as string);
      };
      reader.readAsDataURL(file);
   }
}

function clearImage() {
   emit("update:modelValue", null);
}
</script>
```

### Using `defineModel()` (Vue 3.4+)

```vue
<!-- src/components/RichTextField.vue -->
<template>
   <div class="rich-text-field">
      <div v-if="editable">
         <!-- Your rich text editor component -->
         <QuillEditor v-model="content" />
      </div>
      <div v-else v-html="content"></div>
   </div>
</template>

<script setup lang="ts">
import { QuillEditor } from "@vueup/vue-quill";

defineProps<{
   editable: boolean;
   label?: string;
   description?: string;
}>();

// Use defineModel for simpler v-model handling
const content = defineModel<string>({ default: "" });
</script>
```

## Registering Custom Fields

Once you've created your custom component, register it in your `fields.ts` file:

```typescript
// src/page-builder/blocks/hero/fields.ts
import { createField } from "vue-wswg-editor";
import ImageUploadField from "@/components/ImageUploadField.vue";
import RichTextField from "@/components/RichTextField.vue";

export default {
   heading: createField.text({
      label: "Heading",
      required: true,
   }),

   image: createField.custom({
      label: "Hero Image",
      description: "Upload a hero image",
      component: ImageUploadField,
      required: true,
   }),

   content: createField.custom({
      label: "Content",
      component: RichTextField,
      default: "",
   }),
};
```

## Advanced Examples

### JSON Editor Field

```vue
<!-- src/components/JsonEditorField.vue -->
<template>
   <div class="json-editor-field">
      <textarea
         v-if="editable"
         v-model="jsonString"
         @blur="updateValue"
         class="font-mono text-sm"
         rows="10"
      ></textarea>
      <pre v-else class="text-sm">{{ formattedJson }}</pre>
   </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
   modelValue?: any;
   editable: boolean;
}>();

const emit = defineEmits<{
   "update:modelValue": [value: any];
}>();

const jsonString = ref(JSON.stringify(props.modelValue || {}, null, 2));

const formattedJson = computed(() => {
   try {
      return JSON.stringify(props.modelValue, null, 2);
   } catch {
      return "Invalid JSON";
   }
});

function updateValue() {
   try {
      const parsed = JSON.parse(jsonString.value);
      emit("update:modelValue", parsed);
   } catch (error) {
      // Handle invalid JSON - validation will catch this
      console.error("Invalid JSON:", error);
   }
}
</script>
```

### Date Range Picker Field

```vue
<!-- src/components/DateRangeField.vue -->
<template>
   <div class="date-range-field">
      <div v-if="editable" class="flex gap-2">
         <input
            v-model="startDate"
            type="date"
            @change="updateValue"
         />
         <span>to</span>
         <input
            v-model="endDate"
            type="date"
            @change="updateValue"
         />
      </div>
      <div v-else>
         {{ formattedRange }}
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = defineProps<{
   modelValue?: { start: string; end: string } | null;
   editable: boolean;
}>();

const emit = defineEmits<{
   "update:modelValue": [value: { start: string; end: string } | null];
}>();

const startDate = ref(props.modelValue?.start || "");
const endDate = ref(props.modelValue?.end || "");

watch(
   () => props.modelValue,
   (newValue) => {
      startDate.value = newValue?.start || "";
      endDate.value = newValue?.end || "";
   }
);

const formattedRange = computed(() => {
   if (!props.modelValue) return "No date range selected";
   return `${props.modelValue.start} to ${props.modelValue.end}`;
});

function updateValue() {
   if (startDate.value && endDate.value) {
      emit("update:modelValue", {
         start: startDate.value,
         end: endDate.value,
      });
   } else {
      emit("update:modelValue", null);
   }
}
</script>
```

## Validation with Custom Fields

Custom fields automatically integrate with the editor's validation system. You can add validators to custom fields just like built-in fields:

```typescript
// src/page-builder/blocks/hero/fields.ts
import { createField } from "vue-wswg-editor";
import ImageUploadField from "@/components/ImageUploadField.vue";
import * as yup from "yup";

export default {
   image: createField.custom({
      label: "Hero Image",
      component: ImageUploadField,
      required: true,
      validator: async (value) => {
         if (!value) {
            return "An image is required";
         }
         // Check if URL is valid
         try {
            new URL(value);
            return true;
         } catch {
            return "Invalid image URL";
         }
      },
   }),

   // Using yup for complex validation
   content: createField.custom({
      label: "Content",
      component: RichTextField,
      validator: async (value) => {
         const schema = yup.string().min(10, "Content must be at least 10 characters");
         try {
            await schema.validate(value);
            return true;
         } catch (error) {
            return (error as yup.ValidationError).message;
         }
      },
   }),
};
```

## Accessing Field Config in Custom Components

All properties from `EditorFieldConfig` are passed to your component via `v-bind`, so you can access any custom properties:

```vue
<!-- src/components/CustomField.vue -->
<template>
   <div>
      <label>{{ label }}</label>
      <p v-if="description" class="text-sm text-gray-500">{{ description }}</p>
      <!-- Your custom UI -->
   </div>
</template>

<script setup lang="ts">
defineProps<{
   modelValue: any;
   editable: boolean;
   label?: string;
   description?: string;
   // Access any custom properties you add to fieldConfig
   customProperty?: string;
}>();
</script>
```

## Best Practices

### 1. Handle Loading States

```vue
<template>
   <div>
      <div v-if="uploading">Uploading...</div>
      <div v-else>
         <!-- Your field UI -->
      </div>
   </div>
</template>
```

### 2. Provide Default Values

```typescript
createField.custom({
   component: MyField,
   default: null, // or appropriate default
});
```

### 3. Handle Null/Undefined Values

```vue
<script setup lang="ts">
const value = defineModel<any>({ default: null });

// Always handle null/undefined
const displayValue = computed(() => value.value ?? "");
</script>
```

### 4. Respect the `editable` Prop

Always check `editable` before allowing user interaction:

```vue
<template>
   <button v-if="editable" @click="doSomething">Action</button>
   <span v-else>{{ displayValue }}</span>
</template>
```

### 5. Use Scoped Styles

Prevent style conflicts by using scoped styles:

```vue
<style scoped>
.my-custom-field {
   /* Styles won't leak to other components */
}
</style>
```

## Common Use Cases

### Image Upload with Preview

```typescript
createField.custom({
   label: "Image",
   component: ImageUploadField,
   required: true,
});
```

### Rich Text Editor

```typescript
createField.custom({
   label: "Content",
   component: RichTextField,
   default: "",
});
```

### Code/JSON Editor

```typescript
createField.custom({
   label: "Configuration",
   component: JsonEditorField,
   default: {},
});
```

### Date/Time Pickers

```typescript
createField.custom({
   label: "Publish Date",
   component: DateTimePickerField,
   required: true,
});
```

## See Also

- [Fields Guide](/guide/fields) - Learn about built-in field types
- [Validation Guide](/guide/validation) - Learn about field validation
- [Components Guide](/guide/components) - Learn about using the editor component

