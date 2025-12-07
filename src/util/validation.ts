import type { EditorFieldConfig, ValidatorFunction } from "./fieldConfig";
import { getBlockComponent, getLayoutFields } from "./registry";
import { toNiceName } from "./helpers";

export function validateField(value: any, fieldConfig: EditorFieldConfig) {
   // Create generic validator from field config properties (minLength, maxLength, etc.)
   const genericValidator = createGenericValidator(fieldConfig);

   // Combine generic validator with custom validator if provided
   const combinedValidator = combineValidators(genericValidator, fieldConfig.validator);

   // If no validator exists, clear any error message
   if (!combinedValidator) return true;

   // Validate the value
   return combinedValidator(value);
}

export interface ValidationResult {
   title: string;
   isValid: boolean;
   errors: Record<string, string | boolean>;
}

/**
 * Validate all fields in the value
 * @param value - The value to validate
 * @param blocksKey - The key of the blocks in the value
 * @param settingsKey - The key of the settings in the value
 * @returns A record of validation results
 */
export async function validateAllFields(
   value: any,
   blocksKey: string = "blocks",
   settingsKey: string = "settings"
): Promise<Record<string, ValidationResult>> {
   const validationResults: Record<string, ValidationResult> = {};

   // Validate settings first so it appears at the top
   const settingsResult = await validateSettings(value, settingsKey);
   if (settingsResult.errors && Object.keys(settingsResult.errors).length > 0) {
      validationResults[settingsKey] = settingsResult;
   }

   // Validate blocks
   const blockResults = await validateBlocks(value, blocksKey);
   Object.assign(validationResults, blockResults);

   return validationResults;
}

async function validateSettings(value: any, settingsKey: string = "settings"): Promise<ValidationResult> {
   const validationResult: ValidationResult = {
      title: "Settings",
      isValid: true,
      errors: {},
   };

   if (!value[settingsKey]) return validationResult;
   const layoutOptions = getLayoutFields(value[settingsKey].layout);

   // Loop each field in the settings
   for (const field in value[settingsKey]) {
      const fieldConfig = layoutOptions[field];
      // If the field has a validator, validate it
      if (fieldConfig?.validator) {
         const result = await validateField(value[settingsKey][field], fieldConfig);
         // If validation fails (returns false or a string), add to validation results
         if (result !== true) {
            validationResult.errors[field] = result;
            validationResult.isValid = false;
         }
      }
   }

   return validationResult;
}

async function validateBlocks(value: any, blocksKey: string = "blocks"): Promise<Record<string, ValidationResult>> {
   const validationResults: Record<string, ValidationResult> = {};
   // Get the blocks from the value
   const blocks = value[blocksKey];
   if (!blocks) return validationResults;

   // Loop each block
   for (const block of blocks) {
      // Get the block type
      const blockType = block.type;
      // Get the block editor fields
      const blockComponent = getBlockComponent(blockType);

      // Add validation results entry for the section
      validationResults[blockType] = {
         title: blockComponent.label || toNiceName(blockType),
         isValid: true,
         errors: {},
      };

      // Skip if no editor fields are found
      if (Object.keys(blockComponent?.fields || {}).length === 0) {
         continue;
      }

      // Loop each field in the block
      for (const field in blockComponent?.fields || {}) {
         const fieldConfig = blockComponent?.fields?.[field];
         if (!fieldConfig) continue;
         // Validate
         const result = await validateField(block[field], fieldConfig);
         // If validation fails (returns false or a string), add to validation results
         if (result !== true) {
            validationResults[blockType].errors[fieldConfig.label || field] = result;
            validationResults[blockType].isValid = false;
         }
      }
   }
   // Return validation results if there are any errors, otherwise return true
   return validationResults;
}

/**
 * Creates a generic validator function based on field config properties
 * Handles: required, minLength, maxLength, min, max, minItems, maxItems
 * Returns a ValidatorFunction that can be combined with custom validators
 */
export function createGenericValidator(fieldConfig: EditorFieldConfig): ValidatorFunction | null {
   const validations: Array<(value: any) => Promise<boolean | string>> = [];

   // Required validation
   if (fieldConfig.required) {
      validations.push(async (value: any) => {
         if (value === null || value === undefined || value === "") {
            return "This field is required";
         }
         if (Array.isArray(value) && value.length === 0) {
            return "This field is required";
         }
         return true;
      });
   }

   // String length validations (for text, textarea, email, url)
   if (
      fieldConfig.type === "text" ||
      fieldConfig.type === "textarea" ||
      fieldConfig.type === "email" ||
      fieldConfig.type === "url"
   ) {
      if (fieldConfig.minLength !== undefined) {
         validations.push(async (value: any) => {
            if (value === null || value === undefined || value === "") return true; // Skip if empty (required handles this)
            const strValue = String(value);
            if (strValue.length < fieldConfig.minLength!) {
               return `Must be at least ${fieldConfig.minLength} characters`;
            }
            return true;
         });
      }

      if (fieldConfig.maxLength !== undefined) {
         validations.push(async (value: any) => {
            if (value === null || value === undefined || value === "") return true; // Skip if empty
            const strValue = String(value);
            if (strValue.length > fieldConfig.maxLength!) {
               return `Must be no more than ${fieldConfig.maxLength} characters`;
            }
            return true;
         });
      }
   }

   // Number validations
   if (fieldConfig.type === "number" || fieldConfig.type === "range") {
      if (fieldConfig.min !== undefined) {
         validations.push(async (value: any) => {
            if (value === null || value === undefined || value === "") return true; // Skip if empty
            const numValue = Number(value);
            if (isNaN(numValue) || numValue < fieldConfig.min!) {
               return `Must be at least ${fieldConfig.min}`;
            }
            return true;
         });
      }

      if (fieldConfig.max !== undefined) {
         validations.push(async (value: any) => {
            if (value === null || value === undefined || value === "") return true; // Skip if empty
            const numValue = Number(value);
            if (isNaN(numValue) || numValue > fieldConfig.max!) {
               return `Must be no more than ${fieldConfig.max}`;
            }
            return true;
         });
      }
   }

   // Repeater validations
   if (fieldConfig.type === "repeater") {
      if (fieldConfig.minItems !== undefined) {
         validations.push(async (value: any) => {
            if (!Array.isArray(value)) return true; // Skip if not array
            if (value.length < fieldConfig.minItems!) {
               return `Must have at least ${fieldConfig.minItems} item${fieldConfig.minItems! > 1 ? "s" : ""}`;
            }
            return true;
         });
      }

      if (fieldConfig.maxItems !== undefined) {
         validations.push(async (value: any) => {
            if (!Array.isArray(value)) return true; // Skip if not array
            if (value.length > fieldConfig.maxItems!) {
               return `Must have no more than ${fieldConfig.maxItems} item${fieldConfig.maxItems! > 1 ? "s" : ""}`;
            }
            return true;
         });
      }
   }

   // If no built-in validations, return null
   if (validations.length === 0) {
      return null;
   }

   // Return a combined validator function
   return async (value: any): Promise<boolean | string> => {
      for (const validation of validations) {
         const result = await validation(value);
         if (result !== true) {
            return result;
         }
      }
      return true;
   };
}

/**
 * Combines a generic validator (built-in validations) with a custom validator
 * Runs built-in validations first, then custom validator if provided
 */
export function combineValidators(
   genericValidator: ValidatorFunction | null,
   customValidator?: ValidatorFunction
): ValidatorFunction | undefined {
   if (!genericValidator && !customValidator) {
      return undefined;
   }

   if (!genericValidator) {
      return customValidator;
   }

   if (!customValidator) {
      return genericValidator;
   }

   // Return combined validator that runs both
   return async (value: any): Promise<boolean | string> => {
      // Run generic validator first
      const genericResult = await genericValidator(value);
      if (genericResult !== true) {
         return genericResult;
      }

      // Then run custom validator
      return await customValidator(value);
   };
}
