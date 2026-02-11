import type { Component } from "vue";

/**
 * Validator function that returns:
 * - `true` if the value is valid
 * - `false` if the value is invalid (generic error)
 * - `string` if the value is invalid (specific error message)
 */
export type ValidatorFunction = (value: any) => Promise<boolean | string>;

/**
 * Editor field types for the page builder sidebar
 */
export type EditorFieldType =
   | "text" // ✅
   | "textarea" // ✅
   | "number" // ✅
   | "boolean" // ✅
   | "email" // ✅
   | "url" // ✅
   | "select" // ✅
   | "checkbox" // ✅
   | "radio" // ✅
   | "color" // ✅
   | "range" // ✅
   | "repeater" // ✅
   | "margin" // ✅
   | "info" // ✅
   | "image" // ✅
   | "object" // ✅
   | "custom"; // 🔌 (image, json, video, richtext, etc)

/**
 * Simple utility for defining page builder props with editor field metadata
 * This approach separates Vue props from editor field configuration
 */

export interface EditorFieldConfig {
   type: EditorFieldType;
   component?: Component; // if providing a custom editor field component
   required?: boolean;
   default?: any;
   label?: string;
   description?: string;
   placeholder?: string;
   rows?: number;
   options?: Array<{ label: string; value: any; id: string }>;
   step?: number;
   hidden?: boolean;
   group?: string;
   clearable?: boolean;
   /**
    * Validator function that returns:
    * - `true` if the value is valid
    * - `false` if the value is invalid (generic error)
    * - `string` if the value is invalid (specific error message)
    */
   validator?: ValidatorFunction;
   // Repeater-specific properties
   repeaterFields?: Record<string, EditorFieldConfig>;
   repeaterFieldLabel?: string; // attribute key for the repeater field label
   // Object-specific properties
   objectFields?: Record<string, EditorFieldConfig>; // nested fields for object type
   // String length validation
   minLength?: number;
   maxLength?: number;
   // Number validation
   min?: number;
   max?: number;
   // Repeater validation
   minItems?: number;
   maxItems?: number;
   // Image specific
   // Whether the image is responsive eg: xs, sm, md, lg, xl, primary
   responsive?: boolean;
   // Range specific
   // Suffix to display after the range value (e.g., "px", "%", "rem")
   valueSuffix?: string;
   // Conditions specific
   // Function to check if the field should be visible
   conditions?: (blockData: any) => boolean;
}

/**
 * Helper function to create editor field configurations
 */
export const createField = {
   custom: (config: Partial<EditorFieldConfig> = {}): EditorFieldConfig => ({
      type: "custom",
      ...config,
   }),

   text: (config: Partial<EditorFieldConfig> = {}): EditorFieldConfig => ({
      type: "text",
      ...config,
   }),

   textarea: (config: Partial<EditorFieldConfig> = {}): EditorFieldConfig => ({
      type: "textarea",
      ...config,
   }),

   number: (config: Partial<EditorFieldConfig> = {}): EditorFieldConfig => ({
      type: "number",
      ...config,
   }),

   boolean: (config: Partial<EditorFieldConfig> = {}): EditorFieldConfig => ({
      type: "boolean",
      ...config,
   }),

   email: (config: Partial<EditorFieldConfig> = {}): EditorFieldConfig => ({
      type: "email",
      ...config,
   }),

   url: (config: Partial<EditorFieldConfig> = {}): EditorFieldConfig => ({
      type: "url",
      ...config,
   }),

   select: <T>(
      options: Array<{ label: string; value: T; id: string }>,
      config: Partial<Omit<EditorFieldConfig, "options">> = {}
   ): EditorFieldConfig => ({
      type: "select",
      options,
      ...config,
   }),

   radio: <T>(
      options: Array<{ label: string; value: T; id: string }>,
      config: Partial<Omit<EditorFieldConfig, "options">> = {}
   ): EditorFieldConfig => ({
      type: "radio",
      options,
      ...config,
   }),

   checkbox: <T>(
      options: Array<{ label: string; value: T; id: string }>,
      config: Partial<Omit<EditorFieldConfig, "options">> = {}
   ): EditorFieldConfig => ({
      type: "checkbox",
      options,
      ...config,
   }),

   color: (config: Partial<EditorFieldConfig> = {}): EditorFieldConfig => ({
      type: "color",
      ...config,
   }),

   range: (config: Partial<EditorFieldConfig> = {}): EditorFieldConfig => ({
      type: "range",
      ...config,
   }),

   repeater: (
      repeaterFields: Record<string, EditorFieldConfig>,
      config: Partial<EditorFieldConfig> = {}
   ): EditorFieldConfig => ({
      type: "repeater",
      repeaterFields,
      ...config,
   }),

   image: (config: Partial<EditorFieldConfig> = {}): EditorFieldConfig => ({
      type: "image",
      ...config,
   }),

   margin: (config: Partial<EditorFieldConfig> = {}): EditorFieldConfig => ({
      type: "margin",
      options: [
         { label: "None", value: "none", id: "margin-none" },
         { label: "Small", value: "small", id: "margin-small" },
         { label: "Medium", value: "medium", id: "margin-medium" },
         { label: "Large", value: "large", id: "margin-large" },
      ],
      default: "none",
      description: "Vertical margin spacing",
      group: "settings",
      placeholder: "Select a margin...",
      label: "Margin",
      ...config,
   }),

   // Display an info message
   info: (config: Partial<EditorFieldConfig> = {}): EditorFieldConfig => ({
      type: "info",
      ...config,
   }),

   // Object field for nested properties (e.g., meta.description)
   object: (
      objectFields: Record<string, EditorFieldConfig>,
      config: Partial<EditorFieldConfig> = {}
   ): EditorFieldConfig => ({
      type: "object",
      objectFields,
      ...config,
   }),
};
