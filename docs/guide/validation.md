# Validation

Field validation ensures data integrity by checking field values against rules. The library supports two types of validation:

1. **Built-in validations** - Based on field configuration properties
2. **Custom validators** - Custom validation functions

Both types of validation run automatically, with built-in validations running first, followed by custom validators.

## Built-in Validations

Built-in validations are automatically applied based on field configuration properties. These validations run first before any custom validator.

### Required Fields

Mark a field as required using the `required` property:

```typescript
import { createField } from "vue-wswg-editor";

export default {
   heading: createField.text({
      label: "Heading",
      required: true,
   }),
};
```

### String Length Validation

For text-based fields (`text`, `textarea`, `email`, `url`), use `minLength` and `maxLength`:

```typescript
export default {
   title: createField.text({
      label: "Title",
      minLength: 5,
      maxLength: 100,
      required: true,
   }),
   description: createField.textarea({
      label: "Description",
      maxLength: 500,
   }),
};
```

### Number Range Validation

For number fields (`number`, `range`), use `min` and `max`:

```typescript
export default {
   count: createField.number({
      label: "Count",
      min: 0,
      max: 100,
      default: 0,
   }),
   percentage: createField.range({
      label: "Percentage",
      min: 0,
      max: 100,
      step: 1,
   }),
};
```

### Repeater Validation

For repeater fields, use `minItems` and `maxItems`:

```typescript
export default {
   items: createField.repeater(
      {
         title: createField.text({ label: "Title", required: true }),
         description: createField.textarea({ label: "Description" }),
      },
      {
         label: "Items",
         minItems: 1,
         maxItems: 10,
      }
   ),
};
```

## Custom Validators

Custom validators allow you to implement complex validation logic beyond built-in validations. Custom validators run after built-in validations have passed.

### Validator Function Signature

A validator function receives the field value and returns:

- `true` - if the value is valid
- `false` - if the value is invalid (generic error)
- `string` - if the value is invalid (specific error message)

```typescript
type ValidatorFunction = (value: any) => Promise<boolean | string>;
```

### Basic Custom Validator

```typescript
export default {
   email: createField.email({
      label: "Email",
      required: true,
      validator: async (value) => {
         // Check if email contains specific domain
         if (!value.includes("@example.com")) {
            return "Email must be from @example.com domain";
         }

         return true;
      },
   }),
};
```

### Combining Built-in and Custom Validation

Built-in validations run first, then custom validators. This allows you to combine both approaches:

```typescript
export default {
   text: createField.text({
      label: "Announcement Text",
      maxLength: 50, // Built-in validation
      required: true, // Built-in validation
      validator: async (value) => {
         // Custom validation runs after maxLength check
         if (value && value.length >= 50) {
            return "Text must be less than 50 characters";
         }

         // Additional custom logic
         if (value && value.includes("spam")) {
            return "Text cannot contain the word 'spam'";
         }

         return true;
      },
   }),
};
```

### Async Validation

Validators can be async, allowing for server-side validation:

```typescript
export default {
   username: createField.text({
      label: "Username",
      required: true,
      validator: async (value) => {
         if (!value) return true;

         // Simulate API call to check username availability
         const isAvailable = await checkUsernameAvailability(value);

         if (!isAvailable) {
            return "Username is already taken";
         }

         return true;
      },
   }),
};
```

### Complex Validation Logic

You can implement complex validation logic:

```typescript
export default {
   password: createField.text({
      label: "Password",
      type: "text", // Use text type for password input
      required: true,
      minLength: 8,
      validator: async (value) => {
         if (!value) return true;

         // Check for uppercase letter
         if (!/[A-Z]/.test(value)) {
            return "Password must contain at least one uppercase letter";
         }

         // Check for lowercase letter
         if (!/[a-z]/.test(value)) {
            return "Password must contain at least one lowercase letter";
         }

         // Check for number
         if (!/[0-9]/.test(value)) {
            return "Password must contain at least one number";
         }

         // Check for special character
         if (!/[!@#$%^&*]/.test(value)) {
            return "Password must contain at least one special character (!@#$%^&*)";
         }

         return true;
      },
   }),
};
```

### Using Third-party Validation

You can use validation libraries like `yup` for validation.
You can use **any validation library or custom logic** you prefer—such as [`yup`](https://github.com/jquense/yup), [`zod`](https://github.com/colinhacks/zod), or even custom API calls—so long as your validator function matches the expected signature:

- The validator should be an `async` function (returning a Promise).
- It must return either:
   - `true` for valid values,
   - `false` for a generic validation failure, **or**
   - a `string` containing a specific error message for invalid values.

```typescript
validator: async (value) => {
   // your validation logic here...
   // return true (valid), false (invalid), or string (specific error message)
};
```

This means your validator has complete flexibility—as long as it returns a `Promise<boolean|string>`.  
For example, here's how you might use `zod`:

```typescript
import { z } from "zod";

validator: async (value) => {
   try {
      const schema = z.string().email();
      schema.parse(value);
      return true;
   } catch (e) {
      return e.errors?.[0]?.message || false;
   }
};
```

Or `yup`:

```typescript
import { createField, type ValidatorFunction } from "vue-wswg-editor";
import * as yup from "yup";

export default {
   email: createField.email({
      label: "Email",
      validator: (async (value) => {
         try {
            const schema = yup.string().email("Invalid email format");
            await schema.validate(value, { abortEarly: true });
            return true;
         } catch (e) {
            const validationErrors = e as yup.ValidationError;
            return validationErrors.errors[0] || false;
         }
      }) satisfies ValidatorFunction,
   }),
};
```

## Validation Error Messages

Validation errors are displayed below the field in the editor. Error messages can be:

- **Generic**: Return `false` for a generic "Field is invalid" message
- **Specific**: Return a `string` for a custom error message

```typescript
export default {
   code: createField.text({
      label: "Promo Code",
      validator: async (value) => {
         if (!value) return true;

         // Generic error
         if (value.length < 3) {
            return false; // Shows "Field is invalid"
         }

         // Specific error
         if (!/^[A-Z0-9]+$/.test(value)) {
            return "Code must contain only uppercase letters and numbers";
         }

         return true;
      },
   }),
};
```

## Complete Example

Here's a complete example combining multiple validation types, including using a third-party validation library like `yup`:

```typescript
import { createField, type ValidatorFunction } from "vue-wswg-editor";
import * as yup from "yup";

export default {
   // Required field with length validation
   title: createField.text({
      label: "Title",
      required: true,
      minLength: 3,
      maxLength: 100,
      placeholder: "Enter a title",
   }),

   // Number with range validation
   quantity: createField.number({
      label: "Quantity",
      min: 1,
      max: 1000,
      default: 1,
   }),

   // Email with custom domain validation
   email: createField.email({
      label: "Email",
      required: true,
      validator: async (value) => {
         if (!value) return true;
         if (!value.endsWith("@company.com")) {
            return "Email must be from @company.com domain";
         }
         return true;
      },
   }),

   // Using yup for complex validation
   description: createField.textarea({
      label: "Description",
      required: true,
      rows: 4,
      validator: (async (value: any): Promise<boolean | string> => {
         try {
            const schema = yup.object({
               type: yup.string().required(),
               content: yup
                  .array()
                  .required()
                  .min(1)
                  .of(
                     yup.object({
                        type: yup.string().required(),
                        content: yup.array().required().min(1),
                     })
                  ),
            });
            await schema.validate(value, { abortEarly: true });
            return true;
         } catch (e) {
            const validationErrors = e as yup.ValidationError;
            if (validationErrors.errors?.length) {
               return validationErrors.errors[0];
            }
            return "Description is invalid";
         }
      }) satisfies ValidatorFunction,
   }),

   // Using yup with built-in validations
   kicker: createField.text({
      label: "Kicker",
      maxLength: 50, // Built-in validation runs first
      validator: (async (value: string): Promise<boolean | string> => {
         try {
            const schema = yup.string().required("Kicker is required");
            await schema.validate(value, { abortEarly: true });
            return true;
         } catch (e) {
            const validationErrors = e as yup.ValidationError;
            if (validationErrors.errors?.length) {
               return validationErrors.errors[0];
            }
            return false;
         }
      }) satisfies ValidatorFunction,
   }),

   // Repeater with item count validation
   features: createField.repeater(
      {
         name: createField.text({ label: "Feature Name", required: true }),
         description: createField.textarea({ label: "Description" }),
      },
      {
         label: "Features",
         minItems: 1,
         maxItems: 5,
      }
   ),
};
```

### Using Third-Party Validation Libraries

You can use validation libraries like `yup`, `zod`, or `joi` in your custom validators. Here's how to integrate `yup`:

```typescript
import { createField, type ValidatorFunction } from "vue-wswg-editor";
import * as yup from "yup";

export default {
   // Simple yup validation
   username: createField.text({
      label: "Username",
      required: true,
      validator: (async (value: string): Promise<boolean | string> => {
         try {
            const schema = yup
               .string()
               .required("Username is required")
               .min(3, "Username must be at least 3 characters")
               .max(20, "Username must be less than 20 characters")
               .matches(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");
            await schema.validate(value, { abortEarly: true });
            return true;
         } catch (e) {
            const validationErrors = e as yup.ValidationError;
            return validationErrors.errors[0] || "Invalid username";
         }
      }) satisfies ValidatorFunction,
   }),

   // Complex object validation with yup
   richText: createField.textarea({
      label: "Rich Text",
      validator: (async (value: any): Promise<boolean | string> => {
         try {
            const schema = yup.object({
               type: yup.string().required(),
               content: yup
                  .array()
                  .required()
                  .min(1, "Content cannot be empty")
                  .of(
                     yup.object({
                        type: yup.string().required(),
                        content: yup.array().required().min(1),
                     })
                  ),
            });
            await schema.validate(value, { abortEarly: true });
            return true;
         } catch (e) {
            const validationErrors = e as yup.ValidationError;
            return validationErrors.errors[0] || "Invalid rich text format";
         }
      }) satisfies ValidatorFunction,
   }),

   // Combining built-in validations with yup
   email: createField.email({
      label: "Email",
      maxLength: 255, // Built-in validation runs first
      validator: (async (value: string): Promise<boolean | string> => {
         try {
            const schema = yup.string().email("Invalid email format").required("Email is required");
            await schema.validate(value, { abortEarly: true });
            return true;
         } catch (e) {
            const validationErrors = e as yup.ValidationError;
            return validationErrors.errors[0] || false;
         }
      }) satisfies ValidatorFunction,
   }),
};
```

**Key Points:**

- Built-in validations (like `maxLength`, `required`) run **before** the custom validator
- Use `satisfies ValidatorFunction` for TypeScript type checking
- Catch `yup.ValidationError` and extract the first error message
- Return `false` for generic errors or a `string` for specific error messages

## Validation Order

When both built-in and custom validations are present, they run in this order:

1. **Required check** (if `required: true`)
2. **Type-specific built-in validations** (minLength, maxLength, min, max, minItems, maxItems)
3. **Custom validator** (if provided)

If any validation fails, the error message is displayed and subsequent validations are skipped.

## Validating All Fields

While individual field validation happens automatically as users edit fields, you should also validate all fields before saving or publishing page data. This ensures data integrity and prevents invalid data from being persisted.

Use the `validateAllFields` function to validate all blocks and settings fields in your page data:

```typescript
import { validateAllFields } from "vue-wswg-editor";

async function handleSave() {
   // Validate all fields before saving
   const validation = await validateAllFields(pageData.value);
   const isValid = Object.values(validation).every((r) => r.isValid);

   if (!isValid) {
      // Handle validation errors
      return;
   }

   // Proceed with save
   await savePage();
}
```

This validates all fields across all blocks and settings according to their field configurations, allowing you to block save/publish workflows when validation errors exist.

### Nested Validation Results

When validating fields that contain nested structures (like `repeater` or `object` fields), the validation results are returned as a nested `ValidationResult` structure. This allows you to pinpoint exactly where validation errors occur within complex data structures.

The `ValidationResult` interface supports nested errors:

```typescript
interface ValidationResult {
   title: string; // Display name for the section
   isValid: boolean; // Whether all fields are valid
   errors: Record<string, string | boolean | ValidationResult>; // Field errors (can be nested)
}
```

**Example: Repeater Field Validation**

For repeater fields, each item's validation errors are nested under the repeater field:

```typescript
const validation = await validateAllFields(pageData);

// If a repeater field has validation errors:
// validation = {
//   "feature-grid": {
//     title: "Feature grid",
//     isValid: false,
//     errors: {
//       "Features": {  // Repeater field
//         title: "Features",
//         isValid: false,
//         errors: {
//           "Item 1": {  // First repeater item
//             title: "Item 1",
//             isValid: false,
//             errors: {
//               "Heading": "This field is required",
//               "Description": "Must be at least 10 characters"
//             }
//           },
//           "Item 2": {  // Second repeater item
//             title: "Item 2",
//             isValid: false,
//             errors: {
//               "Icon": "This field is required"
//             }
//           }
//         }
//       }
//     }
//   }
// }
```

**Example: Object Field Validation**

For object fields, nested field errors are grouped under the object field:

```typescript
// If an object field has validation errors:
// validation = {
//   "hero": {
//     title: "Hero",
//     isValid: false,
//     errors: {
//       "Details": {  // Object field
//         title: "Details",
//         isValid: false,
//         errors: {
//           "Title": "This field is required",
//           "Image": "Invalid image URL"
//         }
//       }
//     }
//   }
// }
```

When displaying validation errors to users, you'll need to recursively traverse the nested `ValidationResult` structure to show all errors at every level.

For comprehensive guidance on validating all fields, displaying validation errors to users, and blocking workflows, see the [Data Management guide](/guide/data-management#validating-all-fields).

## Best Practices

1. **Use built-in validations when possible** - They're simpler and more performant
2. **Provide clear error messages** - Return specific strings instead of `false`
3. **Skip empty values in custom validators** - Let `required` handle empty checks
4. **Keep validators focused** - Each validator should check one concern
5. **Use async validators for server-side checks** - But be mindful of performance
