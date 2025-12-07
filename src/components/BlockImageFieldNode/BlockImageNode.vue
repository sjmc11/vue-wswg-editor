<template>
   <div class="image-upload-field mb-2">
      <!-- Image Preview with Upload Area (Compact Layout) -->
      <div
         v-if="imageUrl && editable"
         class="flex gap-2"
         @dragover.prevent="handleDragOver"
         @dragleave.prevent="handleDragLeave"
         @drop.prevent="handleDrop"
      >
         <!-- Hidden file input -->
         <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="sr-only"
            :disabled="isUploading || !editable"
            @change="handleFileSelect"
         />

         <!-- Thumbnail Preview -->
         <div class="relative shrink-0">
            <img :src="imageUrl" alt="Uploaded image" class="size-16 rounded border border-gray-300 object-cover" />
            <button
               type="button"
               class="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white shadow-sm hover:bg-red-600"
               title="Remove image"
               @click.stop="removeImage"
            >
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2.5"
                  stroke="currentColor"
                  class="size-3"
               >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
         </div>

         <!-- Upload Button -->
         <button
            type="button"
            :class="[
               'flex-1rounded w-full rounded border px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors',
               isUploading && 'pointer-events-none opacity-50',
               isDragging && 'border-blue-500 bg-blue-50',
               !isDragging && 'border-gray-300 bg-white hover:bg-gray-50',
            ]"
            @click="triggerFileInput"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
         >
            <span v-if="!isUploading" class="flex items-center justify-center gap-1.5">
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-3.5"
               >
                  <path
                     stroke-linecap="round"
                     stroke-linejoin="round"
                     d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
               </svg>
               Replace image
            </span>
            <span v-else class="flex items-center justify-center gap-1.5">
               <svg
                  class="size-3.5 animate-spin text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
               >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path
                     class="opacity-75"
                     fill="currentColor"
                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
               </svg>
               Uploading...
            </span>
         </button>
      </div>

      <!-- Upload Area (No Image) -->
      <div
         v-else-if="editable"
         :class="[
            'relative cursor-pointer rounded border border-dashed transition-colors',
            isDragging
               ? 'border-blue-500 bg-blue-50'
               : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100',
            isUploading && 'pointer-events-none opacity-50',
         ]"
         @click="triggerFileInput"
         @dragover.prevent="handleDragOver"
         @dragleave.prevent="handleDragLeave"
         @drop.prevent="handleDrop"
      >
         <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="sr-only"
            :disabled="isUploading || !editable"
            @change="handleFileSelect"
         />

         <div class="flex items-center justify-center gap-2 p-3">
            <!-- Upload Icon -->
            <svg
               v-if="!isUploading"
               xmlns="http://www.w3.org/2000/svg"
               fill="none"
               viewBox="0 0 24 24"
               stroke-width="1.5"
               stroke="currentColor"
               class="size-4 text-gray-400"
            >
               <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
               />
            </svg>

            <!-- Loading Spinner -->
            <svg
               v-else
               class="size-4 animate-spin text-blue-500"
               xmlns="http://www.w3.org/2000/svg"
               fill="none"
               viewBox="0 0 24 24"
            >
               <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
               <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
               ></path>
            </svg>

            <!-- Upload Text -->
            <span v-if="!isUploading" class="text-xs font-medium text-gray-700">Click to upload image</span>
            <span v-else class="text-xs font-medium text-blue-600">Uploading...</span>
         </div>
      </div>

      <!-- Read-only display -->
      <div v-else-if="imageUrl" class="flex items-center gap-2">
         <img :src="imageUrl" alt="Image" class="size-16 rounded border border-gray-300 object-cover" />
         <span class="text-xs text-gray-500">Image uploaded</span>
      </div>
      <div v-else class="rounded border border-gray-200 bg-gray-50 p-2 text-center text-xs text-gray-400">No image</div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mt-1.5 rounded bg-red-50 px-2 py-1 text-xs text-red-600">
         {{ errorMessage }}
      </div>
   </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

interface Props {
   modelValue?: string | null;
   editable?: boolean;
   uploadUrl?: string; // Optional: custom upload endpoint URL
   maxSizeMB?: number; // Maximum file size in MB
   acceptedTypes?: string[]; // Accepted MIME types
}

const props = withDefaults(defineProps<Props>(), {
   modelValue: null,
   editable: true,
   uploadUrl: undefined,
   maxSizeMB: 10,
   acceptedTypes: () => ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
});

const emit = defineEmits<{
   "update:modelValue": [value: string | null];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const imageUrl = ref<string | null>(props.modelValue || null);
const isUploading = ref(false);
const isDragging = ref(false);
const errorMessage = ref<string | null>(null);
const selectedFile = ref<File | null>(null);

// Watch for external changes to modelValue
watch(
   () => props.modelValue,
   (newValue) => {
      imageUrl.value = newValue || null;
   }
);

// Watch for internal changes and emit updates
watch(imageUrl, (newValue) => {
   emit("update:modelValue", newValue);
});

function triggerFileInput() {
   if (!props.editable || isUploading.value) return;
   fileInputRef.value?.click();
}

function handleFileSelect(event: Event) {
   const target = event.target as HTMLInputElement;
   const file = target.files?.[0];
   if (file) {
      processFile(file);
   }
}

function handleDragOver(event: DragEvent) {
   if (!props.editable || isUploading.value) return;
   event.preventDefault();
   isDragging.value = true;
}

function handleDragLeave() {
   isDragging.value = false;
}

function handleDrop(event: DragEvent) {
   if (!props.editable || isUploading.value) return;
   event.preventDefault();
   isDragging.value = false;

   const file = event.dataTransfer?.files[0];
   if (file) {
      processFile(file);
   }
}

function validateFile(file: File): boolean {
   errorMessage.value = null;

   // Check file type
   if (!props.acceptedTypes.includes(file.type)) {
      errorMessage.value = `File type not supported. Accepted types: ${props.acceptedTypes.join(", ")}`;
      return false;
   }

   // Check file size
   const fileSizeMB = file.size / (1024 * 1024);
   if (fileSizeMB > props.maxSizeMB) {
      errorMessage.value = `File size exceeds ${props.maxSizeMB}MB limit`;
      return false;
   }

   return true;
}

async function processFile(file: File) {
   if (!validateFile(file)) {
      return;
   }

   selectedFile.value = file;
   isUploading.value = true;
   errorMessage.value = null;

   try {
      // Create preview URL immediately
      const previewUrl = URL.createObjectURL(file);
      imageUrl.value = previewUrl;

      // Upload the file
      const uploadedUrl = await uploadFile(file);

      // Replace preview URL with uploaded URL
      if (uploadedUrl) {
         // Clean up preview URL
         URL.revokeObjectURL(previewUrl);
         imageUrl.value = uploadedUrl;
      } else {
         // If upload fails, keep preview URL but show error
         errorMessage.value = "Upload failed. Please try again.";
      }
   } catch (error) {
      console.error("File upload error:", error);
      errorMessage.value = error instanceof Error ? error.message : "Upload failed. Please try again.";
      // Keep preview URL on error
   } finally {
      isUploading.value = false;
      // Reset file input
      if (fileInputRef.value) {
         fileInputRef.value.value = "";
      }
   }
}

async function uploadFile(file: File): Promise<string | null> {
   // If a custom upload URL is provided, use it
   if (props.uploadUrl) {
      return uploadToCustomEndpoint(file, props.uploadUrl);
   }

   // Default implementation: Create a data URL (for basic use cases)
   // In production, you should replace this with actual API call
   return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
         const result = e.target?.result as string;
         resolve(result);
      };
      reader.onerror = () => {
         resolve(null);
      };
      reader.readAsDataURL(file);
   });
}

async function uploadToCustomEndpoint(file: File, endpoint: string): Promise<string | null> {
   try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(endpoint, {
         method: "POST",
         body: formData,
      });

      if (!response.ok) {
         throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      // Expect response to have a 'url' property
      return data.url || data.imageUrl || data.path || null;
   } catch (error) {
      console.error("Custom upload error:", error);
      throw error;
   }
}

function removeImage() {
   if (!props.editable || isUploading.value) return;

   // Clean up object URL if it's a preview
   if (imageUrl.value && imageUrl.value.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl.value);
   }

   imageUrl.value = null;
   selectedFile.value = null;
   errorMessage.value = null;

   // Reset file input
   if (fileInputRef.value) {
      fileInputRef.value.value = "";
   }
}
</script>

<style scoped>
.image-upload-field {
   width: 100%;
}
</style>
