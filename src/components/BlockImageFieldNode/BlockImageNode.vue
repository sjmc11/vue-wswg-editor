<template>
   <div class="image-upload-field">
      <!-- Image Preview with Upload Area (Compact Layout) -->
      <div
         v-if="imageUrl && editable"
         class="image-upload-field__preview-container"
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
         <div class="image-upload-field__thumbnail">
            <img :src="imageUrl" alt="Uploaded image" class="image-upload-field__thumbnail-img" />
            <button type="button" class="image-upload-field__remove-btn" title="Remove image" @click.stop="removeImage">
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2.5"
                  stroke="currentColor"
                  class="image-upload-field__remove-icon"
               >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
         </div>

         <!-- Upload Button -->
         <button
            type="button"
            class="image-upload-field__replace-btn"
            :class="{
               'image-upload-field__replace-btn--uploading': isUploading,
               'image-upload-field__replace-btn--dragging': isDragging,
            }"
            @click="triggerFileInput"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
         >
            <span v-if="!isUploading" class="image-upload-field__replace-content">
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="image-upload-field__replace-icon"
               >
                  <path
                     stroke-linecap="round"
                     stroke-linejoin="round"
                     d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
               </svg>
               Replace image
            </span>
            <span v-else class="image-upload-field__replace-content">
               <svg
                  class="image-upload-field__spinner"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
               >
                  <circle
                     class="image-upload-field__spinner-circle"
                     cx="12"
                     cy="12"
                     r="10"
                     stroke="currentColor"
                     stroke-width="4"
                  ></circle>
                  <path
                     class="image-upload-field__spinner-path"
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
         class="image-upload-field__upload-area"
         :class="{
            'image-upload-field__upload-area--dragging': isDragging,
            'image-upload-field__upload-area--uploading': isUploading,
         }"
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

         <div class="image-upload-field__upload-content">
            <!-- Upload Icon -->
            <svg
               v-if="!isUploading"
               xmlns="http://www.w3.org/2000/svg"
               fill="none"
               viewBox="0 0 24 24"
               stroke-width="1.5"
               stroke="currentColor"
               class="image-upload-field__upload-icon"
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
               class="image-upload-field__spinner"
               xmlns="http://www.w3.org/2000/svg"
               fill="none"
               viewBox="0 0 24 24"
            >
               <circle
                  class="image-upload-field__spinner-circle"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
               ></circle>
               <path
                  class="image-upload-field__spinner-path"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
               ></path>
            </svg>

            <!-- Upload Text -->
            <span v-if="!isUploading" class="image-upload-field__upload-text">Click to upload image</span>
            <span v-else class="image-upload-field__upload-text image-upload-field__upload-text--uploading"
               >Uploading...</span
            >
         </div>
      </div>

      <!-- Read-only display -->
      <div v-else-if="imageUrl" class="image-upload-field__readonly">
         <img :src="imageUrl" alt="Image" class="image-upload-field__readonly-img" />
         <span class="image-upload-field__readonly-text">Image uploaded</span>
      </div>
      <div v-else class="image-upload-field__empty">No image</div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="image-upload-field__error">
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

<style scoped lang="scss">
.image-upload-field {
   width: 100%;
   margin-bottom: 0.5rem;

   &__preview-container {
      display: flex;
      gap: 0.5rem;
   }

   &__thumbnail {
      position: relative;
      flex-shrink: 0;
   }

   &__thumbnail-img {
      width: 4rem;
      height: 4rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      object-fit: cover;
   }

   &__remove-btn {
      position: absolute;
      top: -0.25rem;
      right: -0.25rem;
      padding: 0.125rem;
      color: #fff;
      cursor: pointer;
      background-color: #ef4444;
      border-radius: 9999px;
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);
      transition: background-color 0.15s ease-in-out;

      &:hover {
         background-color: #dc2626;
      }
   }

   &__remove-icon {
      width: 0.75rem;
      height: 0.75rem;
   }

   &__replace-btn {
      display: flex;
      flex: 1 1 0%;
      width: 100%;
      gap: 0.375rem;
      align-items: center;
      justify-content: center;
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      background-color: #fff;
      transition: all 0.15s ease-in-out;

      &--uploading {
         pointer-events: none;
         opacity: 0.5;
      }

      &--dragging {
         border-color: #3b82f6;
         background-color: #eff6ff;
      }

      &:not(&--dragging):hover {
         background-color: #f9fafb;
      }
   }

   &__replace-content {
      display: flex;
      gap: 0.375rem;
      align-items: center;
      justify-content: center;
   }

   &__replace-icon {
      width: 0.875rem;
      height: 0.875rem;
   }

   &__upload-area {
      position: relative;
      cursor: pointer;
      border: 1px dashed #d1d5db;
      border-radius: 0.25rem;
      background-color: #f9fafb;
      transition: all 0.15s ease-in-out;

      &--dragging {
         border-color: #3b82f6;
         background-color: #eff6ff;
      }

      &:not(&--dragging):hover {
         border-color: #9ca3af;
         background-color: #f3f4f6;
      }

      &--uploading {
         pointer-events: none;
         opacity: 0.5;
      }
   }

   &__upload-content {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      justify-content: center;
      padding: 0.75rem;
   }

   &__upload-icon {
      width: 1rem;
      height: 1rem;
      color: #9ca3af;
   }

   &__upload-text {
      font-size: 0.75rem;
      font-weight: 500;
      color: #374151;

      &--uploading {
         color: #2563eb;
      }
   }

   &__spinner {
      width: 1rem;
      height: 1rem;
      color: #3b82f6;
      animation: spin 1s linear infinite;
   }

   &__spinner-circle {
      opacity: 0.25;
   }

   &__spinner-path {
      opacity: 0.75;
   }

   &__readonly {
      display: flex;
      gap: 0.5rem;
      align-items: center;
   }

   &__readonly-img {
      width: 4rem;
      height: 4rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      object-fit: cover;
   }

   &__readonly-text {
      font-size: 0.75rem;
      color: #6b7280;
   }

   &__empty {
      padding: 0.5rem;
      font-size: 0.75rem;
      color: #9ca3af;
      text-align: center;
      border: 1px solid #e5e7eb;
      border-radius: 0.25rem;
      background-color: #f9fafb;
   }

   &__error {
      margin-top: 0.375rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      color: #dc2626;
      background-color: #fef2f2;
      border-radius: 0.25rem;
   }
}

// Screen reader only utility
.sr-only {
   position: absolute;
   width: 1px;
   height: 1px;
   padding: 0;
   margin: -1px;
   overflow: hidden;
   clip: rect(0, 0, 0, 0);
   white-space: nowrap;
   border-width: 0;
}

@keyframes spin {
   from {
      transform: rotate(0deg);
   }
   to {
      transform: rotate(360deg);
   }
}
</style>
