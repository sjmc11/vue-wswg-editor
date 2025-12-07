# Fields

Fields define the editable properties of blocks. They control what users can edit in the sidebar editor.

## Creating Fields

Fields are defined in a `fields.ts` file within your block directory:

```typescript
// src/page-builder/blocks/hero/fields.ts
import { createField } from "vue-wswg-editor";

export default {
   heading: createField({
      type: "text",
      label: "Heading",
      required: true,
      default: "Welcome",
   }),
   description: createField({
      type: "textarea",
      label: "Description",
      rows: 4,
   }),
};
```

## Supported Field Types

- `text` - Single-line text input
- `textarea` - Multi-line text input
- `number` - Number input with min/max/step
- `boolean` - Checkbox
- `email` - Email input with validation
- `url` - URL input with validation
- `select` - Dropdown select
- `checkbox` - Checkbox group
- `radio` - Radio button group
- `color` - Color picker
- `range` - Range slider with optional value suffix
- `image` - Image upload with preview and drag & drop
   - ⚠️ Not recommended for production - uses base64 encoding ([read more](/api/utilities/create-field#image))
- `repeater` - Repeating field groups
- `margin` - Margin configuration (top/bottom)
- `info` - Read-only information display
- `custom` - Custom field component

## Field Options

| Option        | Type                        | Description                                           |
| ------------- | --------------------------- | ----------------------------------------------------- |
| `type`        | `EditorFieldType`           | Field type (required)                                 |
| `label`       | `string`                    | Field label                                           |
| `description` | `string`                    | Help text below field                                 |
| `placeholder` | `string`                    | Input placeholder                                     |
| `required`    | `boolean`                   | Whether field is required                             |
| `default`     | `any`                       | Default value                                         |
| `hidden`      | `boolean`                   | Hide field from editor                                |
| `group`       | `string`                    | Group field in sidebar                                |
| `options`     | `Array<{label, value, id}>` | Options for select/radio/checkbox                     |
| `min` / `max` | `number`                    | Min/max for number/range                              |
| `step`        | `number`                    | Step for number/range                                 |
| `rows`        | `number`                    | Rows for textarea                                     |
| `validator`   | `ValidatorFunction`         | Custom validation function                            |
| `component`   | `Component`                 | Custom component for `custom` type                    |
| `valueSuffix` | `string`                    | Suffix to display after range value (e.g., "px", "%") |
| `responsive`  | `boolean`                   | Whether image is responsive                           |

## Validation

Fields support both built-in validations (based on field properties) and custom validator functions. Both types run automatically, with built-in validations running first.

### Built-in Validations

Built-in validations are configured using field properties:

```typescript
export default {
   // Required field
   title: createField.text({
      label: "Title",
      required: true,
   }),

   // String length validation
   description: createField.textarea({
      label: "Description",
      minLength: 10,
      maxLength: 500,
   }),

   // Number range validation
   count: createField.number({
      label: "Count",
      min: 0,
      max: 100,
   }),

   // Repeater item count validation
   items: createField.repeater(
      { name: createField.text({ label: "Name" }) },
      {
         label: "Items",
         minItems: 1,
         maxItems: 10,
      }
   ),
};
```

### Custom Validators

Custom validators allow complex validation logic:

```typescript
export default {
   text: createField.text({
      label: "Announcement Text",
      maxLength: 50, // Built-in validation
      required: true, // Built-in validation
      validator: async (value) => {
         // Custom validation runs after built-in validations
         if (value && value.length >= 50) {
            return "Text must be less than 50 characters";
         }
         if (value && value.includes("spam")) {
            return "Text cannot contain the word 'spam'";
         }
         return true;
      },
   }),
};
```

### Validation Properties

| Property    | Type                | Description                      | Field Types                |
| ----------- | ------------------- | -------------------------------- | -------------------------- |
| `required`  | `boolean`           | Whether field is required        | All                        |
| `minLength` | `number`            | Minimum string length            | text, textarea, email, url |
| `maxLength` | `number`            | Maximum string length            | text, textarea, email, url |
| `min`       | `number`            | Minimum numeric value            | number, range              |
| `max`       | `number`            | Maximum numeric value            | number, range              |
| `minItems`  | `number`            | Minimum number of repeater items | repeater                   |
| `maxItems`  | `number`            | Maximum number of repeater items | repeater                   |
| `validator` | `ValidatorFunction` | Custom validation function       | All                        |

For detailed validation examples, see the [Validation Guide](/guide/validation).

## Field Examples

### Image Field Example

```typescript
export default {
   logo: createField.image({
      label: "Logo",
      required: true,
      description: "Upload your company logo",
      responsive: false,
   }),
};
```

The image field provides a compact upload interface with:

- Thumbnail preview (64x64px)
- Drag & drop support
- Click to upload/replace
- Remove image functionality
- Returns a URL string after upload

### Range Field with Suffix Example

```typescript
export default {
   logoWidth: createField.range({
      label: "Logo Width",
      min: 50,
      max: 300,
      step: 5,
      default: 144,
      valueSuffix: "px", // Displays "144px" in the slider
   }),
};
```

See the [API Reference](/api/utilities/create-field) for detailed examples of each field type.
