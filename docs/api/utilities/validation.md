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
   errors: Record<string, string | boolean>; // Field errors
}
```

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

## Built-in Validations

Built-in validations are automatically applied based on field configuration properties. These run before any custom validator.

### Supported Built-in Validations

| Property   | Type     | Description                    | Field Types                    |
| ---------- | -------- | ------------------------------ | ------------------------------ |
| `required` | `boolean` | Field is required              | All                            |
| `minLength` | `number` | Minimum string length          | text, textarea, email, url     |
| `maxLength` | `number` | Maximum string length          | text, textarea, email, url     |
| `min`      | `number` | Minimum numeric value          | number, range                  |
| `max`      | `number` | Maximum numeric value          | number, range                  |
| `minItems` | `number` | Minimum repeater items         | repeater                       |
| `maxItems` | `number` | Maximum repeater items         | repeater                       |

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

