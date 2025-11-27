import type { ValidatorFunction } from "./fieldConfig";
import { getBlockComponent, getLayoutFields } from "./registry";
import { toNiceName } from "./helpers";

export function validateField(value: any, validator: ValidatorFunction) {
   return validator(value);
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
         const result = await validateField(value[settingsKey][field], fieldConfig.validator);
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
         title: toNiceName(blockType),
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
         // If the field has a validator, validate it
         if (fieldConfig?.validator) {
            const result = await validateField(block[field], fieldConfig.validator);
            // If validation fails (returns false or a string), add to validation results
            if (result !== true) {
               validationResults[blockType].errors[field] = result;
               validationResults[blockType].isValid = false;
            }
         }
      }
   }
   // Return validation results if there are any errors, otherwise return true
   return validationResults;
}
