# Validation Utilities

The library provides utilities for validating fields and blocks programmatically.

## validateField

Validates a single field value using a validator function.

```typescript
import { validateField } from "vue-wswg-editor";

const result = await validateField(value, validator);
// Returns: true | false | string
```

### Parameters

- `value` - The value to validate
- `validator` - A `ValidatorFunction` that validates the value

### Returns

- `true` - Value is valid
- `false` - Value is invalid (generic error)
- `string` - Value is invalid (specific error message)

### Example

```typescript
import { validateField, createField } from "vue-wswg-editor";

const fieldConfig = createField.text({
   label: "Email",
   validator: async (value) => {
      if (!value.includes("@")) {
         return "Invalid email format";
      }
      return true;
   },
});

const result = await validateField("user@example.com", fieldConfig.validator);
// result === true
```

## validateAllFields

Validates all fields in a page data object, including blocks and settings.

```typescript
import { validateAllFields } from "vue-wswg-editor";

const results = await validateAllFields(pageData, "blocks", "settings");
```

### Parameters

- `value` - The page data object to validate
- `blocksKey` - Key for blocks array (default: `"blocks"`)
- `settingsKey` - Key for settings object (default: `"settings"`)

### Returns

A `Record<string, ValidationResult>` where each key is a block type or `"settings"`, and the value contains validation results.

### ValidationResult

```typescript
interface ValidationResult {
   title: string; // Display name for the section
   isValid: boolean; // Whether all fields are valid
   errors: Record<string, string | boolean | ValidationResult>; // Field errors (can be nested for repeater/object fields)
}
```

The `errors` field can contain:

- `string` - A specific error message for a field
- `boolean` - A generic error (typically `false`)
- `ValidationResult` - A nested validation result for `repeater` or `object` fields

When validating `repeater` or `object` fields, validation errors are returned as nested `ValidationResult` objects. This allows you to pinpoint exactly where validation errors occur within complex nested data structures.

### Example

```typescript
import { validateAllFields } from "vue-wswg-editor";

const pageData = {
   blocks: [
      {
         id: "block-1",
         type: "hero",
         heading: "", // Invalid: required field is empty
      },
   ],
   settings: {
      layout: "default",
   },
};

const results = await validateAllFields(pageData);

// results = {
//   hero: {
//     title: "Hero",
//     isValid: false,
//     errors: {
//       heading: "This field is required"
//     }
//   }
// }
```

### Nested Validation Example

When validating repeater or object fields, the results are nested:

```typescript
const pageData = {
   blocks: [
      {
         id: "block-1",
         type: "feature-grid",
         features: [
            {
               heading: "", // Invalid: required
               description: "Short", // Invalid: minLength
            },
            {
               heading: "Valid heading",
               description: "", // Invalid: required
            },
         ],
      },
   ],
};

const results = await validateAllFields(pageData);

// results = {
//   "feature-grid": {
//     title: "Feature grid",
//     isValid: false,
//     errors: {
//       "Features": {  // Repeater field - nested ValidationResult
//         title: "Features",
//         isValid: false,
//         errors: {
//           "Item 1": {  // First repeater item - nested ValidationResult
//             title: "Item 1",
//             isValid: false,
//             errors: {
//               "Heading": "This field is required",
//               "Description": "Must be at least 10 characters"
//             }
//           },
//           "Item 2": {  // Second repeater item - nested ValidationResult
//             title: "Item 2",
//             isValid: false,
//             errors: {
//               "Description": "This field is required"
//             }
//           }
//         }
//       }
//     }
//   }
// }
```

When displaying validation errors, you'll need to recursively traverse the nested structure:

```typescript
function hasAnyErrors(result: ValidationResult): boolean {
   if (!result.isValid) return true;
   for (const error of Object.values(result.errors)) {
      if (typeof error === "object" && "isValid" in error) {
         // Nested ValidationResult
         if (hasAnyErrors(error)) return true;
      }
   }
   return false;
}
```

## Built-in Validations

Built-in validations are automatically applied based on field configuration properties. These run before any custom validator.

### Supported Built-in Validations

| Property    | Type      | Description            | Field Types                |
| ----------- | --------- | ---------------------- | -------------------------- |
| `required`  | `boolean` | Field is required      | All                        |
| `minLength` | `number`  | Minimum string length  | text, textarea, email, url |
| `maxLength` | `number`  | Maximum string length  | text, textarea, email, url |
| `min`       | `number`  | Minimum numeric value  | number, range              |
| `max`       | `number`  | Maximum numeric value  | number, range              |
| `minItems`  | `number`  | Minimum repeater items | repeater                   |
| `maxItems`  | `number`  | Maximum repeater items | repeater                   |

### Example

```typescript
import { createField } from "vue-wswg-editor";

export default {
   // Built-in validations only
   title: createField.text({
      label: "Title",
      required: true,
      minLength: 3,
      maxLength: 100,
   }),

   // Built-in + custom validation
   email: createField.email({
      label: "Email",
      required: true,
      maxLength: 255, // Built-in
      validator: async (value) => {
         // Custom validation runs after built-in checks
         if (!value.endsWith("@company.com")) {
            return "Email must be from @company.com domain";
         }
         return true;
      },
   }),
};
```

## Validation Order

When both built-in and custom validations are present:

1. **Required check** (if `required: true`)
2. **Type-specific built-in validations** (minLength, maxLength, min, max, minItems, maxItems)
3. **Custom validator** (if provided)

If any validation fails, subsequent validations are skipped and the error is returned.

## ValidatorFunction Type

```typescript
type ValidatorFunction = (value: any) => Promise<boolean | string>;
```

A validator function:

- Receives the field value as a parameter
- Returns `true` if valid
- Returns `false` or a `string` error message if invalid
- Can be async for server-side validation

### Example Validator

```typescript
const validator: ValidatorFunction = async (value) => {
   if (!value) return true; // Skip if empty (let required handle it)

   if (value.length < 5) {
      return "Value must be at least 5 characters";
   }

   if (value.includes("forbidden")) {
      return false; // Generic error message
   }

   return true;
};
```
