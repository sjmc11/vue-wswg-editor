# Fields

Fields define the editable properties of blocks. They control what users can edit in the sidebar editor.

## Fields and Themes

Fields are organized within themes in two ways:

1. **Block fields** - Defined in `fields.ts` files within block directories (theme-specific)
2. **Custom field components** - Located in a theme's `fields/` directory (theme-specific)

Since blocks are theme-specific, their fields are automatically scoped to their theme. Custom field components are also theme-specific and can be shared across blocks within the same theme.

## Creating Block Fields

Fields are defined in a `fields.ts` file within your block directory:

```typescript
// src/page-builder/default/blocks/hero/fields.ts
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

## Custom Field Components

Themes can include custom field components in a `fields/` directory:

```
src/page-builder/
  default/
    fields/
      rich-text/
        RichTextField.vue
        RichTextToolbar.vue
    blocks/
      hero/
        Hero.vue
        fields.ts  # Can use custom fields from theme's fields/ directory
```

Custom field components can be used in block fields using the `custom` field type. See the [Custom Fields Guide](/guide/custom-fields) for more information.

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
- `object` - Nested object fields for targeting nested data (e.g., `details.title`, `details.image`)
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
| `conditions`  | `(blockData: any) => boolean` | Condition function to show/hide field dynamically     |
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

## Conditional Fields

Fields can be shown or hidden dynamically based on the values of other fields in the same block using the `conditions` option. This is useful when certain fields are only relevant depending on the current state of the block.

### How It Works

The `conditions` option accepts a function that receives the entire block's data object and returns a `boolean`:

- Return `true` to show the field
- Return `false` to hide the field
- If no `conditions` function is provided, the field is always visible

```typescript
import { createField } from "vue-wswg-editor";

export default {
   layout: createField.select(
      [
         { label: "Simple", value: "simple", id: "layout-simple" },
         { label: "Advanced", value: "advanced", id: "layout-advanced" },
      ],
      {
         label: "Layout",
         default: "simple",
         group: "content",
      }
   ),

   // This field is always visible (no conditions)
   heading: createField.text({
      label: "Heading",
      required: true,
      group: "content",
   }),

   // This field only appears when layout is "advanced"
   subtitle: createField.text({
      label: "Subtitle",
      group: "content",
      conditions: (blockData) => blockData.layout === "advanced",
   }),
};
```

In the example above, the `subtitle` field is only displayed in the editor sidebar when the user has selected the "Advanced" layout. The `heading` field has no `conditions` function, so it is always visible.

### Conditions and Validation

Fields that are hidden by a `conditions` function are excluded from validation entirely. This applies to both:

- **Inline validation** in the editor sidebar (the field component is not rendered, so its validators do not run)
- **`validateAllFields`** used before saving or publishing (hidden fields are skipped)

This means you can safely mark a conditional field as `required` without it blocking validation when the field is not visible:

```typescript
export default {
   showCta: createField.boolean({
      label: "Show CTA",
      default: false,
   }),

   // Required, but only validated when showCta is true
   ctaText: createField.text({
      label: "CTA Text",
      required: true,
      conditions: (blockData) => blockData.showCta === true,
   }),

   ctaUrl: createField.url({
      label: "CTA URL",
      required: true,
      conditions: (blockData) => blockData.showCta === true,
   }),
};
```

### Conditions and Field Groups

If every field within a [field group](#field-options) is conditionally hidden, the group tab itself is automatically removed from the sidebar. It will reappear as soon as at least one field in the group becomes visible again.

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

### Object Field Example

The `object` field variant allows you to target nested object data, such as `details.title` and `details.image`. This is useful when your block data structure contains nested objects.

```typescript
export default {
   details: createField.object(
      {
         title: createField.text({
            label: "Title",
            required: true,
            placeholder: "Enter title",
         }),
         image: createField.image({
            label: "Image",
            description: "Upload an image",
         }),
         description: createField.textarea({
            label: "Description",
            rows: 3,
         }),
      },
      {
         label: "Details",
         description: "Configure the details section",
      }
   ),
};
```

In your block component, you can access these nested properties:

```vue
<template>
   <div>
      <h2>{{ block.details?.title }}</h2>
      <img v-if="block.details?.image" :src="block.details.image" alt="" />
      <p>{{ block.details?.description }}</p>
   </div>
</template>
```

The object field creates a nested structure in your block data:

```json
{
   "details": {
      "title": "My Title",
      "image": "https://example.com/image.jpg",
      "description": "My description"
   }
}
```

See the [API Reference](/api/utilities/create-field) for detailed examples of each field type.
