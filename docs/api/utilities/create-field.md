# createField

The `createField` utility function provides a type-safe way to create field configurations for blocks. It includes helper methods for each field type.

## Import

```typescript
import { createField } from "vue-wswg-editor";
```

## Field Type Helpers

The `createField` object provides helper methods for each field type:

### Text Fields

```typescript
createField.text({
   label: "Title",
   required: true,
   placeholder: "Enter title",
   minLength: 3,
   maxLength: 100,
});
```

### Textarea

```typescript
createField.textarea({
   label: "Description",
   rows: 4,
   maxLength: 500,
});
```

### Number

```typescript
createField.number({
   label: "Count",
   min: 0,
   max: 100,
   step: 1,
   default: 0,
});
```

### Boolean

```typescript
createField.boolean({
   label: "Enable Feature",
   default: false,
});
```

### Email

```typescript
createField.email({
   label: "Email Address",
   required: true,
   placeholder: "user@example.com",
});
```

### URL

```typescript
createField.url({
   label: "Website URL",
   placeholder: "https://example.com",
});
```

### Select

```typescript
createField.select(
   [
      { label: "Option 1", value: "option1", id: "opt1" },
      { label: "Option 2", value: "option2", id: "opt2" },
   ],
   {
      label: "Select Option",
      default: "option1",
   }
);
```

### Radio

```typescript
createField.radio(
   [
      { label: "Yes", value: true, id: "yes" },
      { label: "No", value: false, id: "no" },
   ],
   {
      label: "Enable Feature",
      default: true,
   }
);
```

### Checkbox

```typescript
createField.checkbox(
   [
      { label: "Option 1", value: "opt1", id: "chk1" },
      { label: "Option 2", value: "opt2", id: "chk2" },
   ],
   {
      label: "Select Options",
   }
);
```

### Color

```typescript
createField.color({
   label: "Background Color",
   default: "#ffffff",
});
```

### Range

```typescript
createField.range({
   label: "Logo Width",
   min: 50,
   max: 300,
   step: 5,
   default: 144,
   valueSuffix: "px", // Optional: displays "144px" instead of "144"
});
```

### Repeater

```typescript
createField.repeater(
   {
      title: createField.text({ label: "Title", required: true }),
      description: createField.textarea({ label: "Description" }),
   },
   {
      label: "Items",
      minItems: 1,
      maxItems: 10,
   }
);
```

### Object

The `object` field variant allows you to target nested object data, such as `details.title` and `details.image`. This is useful when your block data structure contains nested objects.

```typescript
createField.object(
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
);
```

This creates a nested structure in your block data:

```json
{
   "details": {
      "title": "My Title",
      "image": "https://example.com/image.jpg",
      "description": "My description"
   }
}
```

### Image

```typescript
createField.image({
   label: "Hero Image",
   required: true,
   description: "Upload a hero image",
   responsive: false, // Optional: whether image is responsive
});
```

The image field provides:

- **Drag & drop** file upload
- **Click to upload** functionality
- **Image preview** thumbnail
- **Replace image** option
- **Remove image** button
- Returns a URL string after upload

::: warning Production Use
The built-in `image` field works by converting uploaded images to base64 data URLs. This is suitable for development and testing, but **not recommended for production use** due to:

- Large file sizes embedded in JSON data
- Performance issues with large images
- Increased storage and bandwidth costs

**For production applications**, it is **strongly recommended** to create a custom image field component that:

- Uploads images to your server or a third-party service (e.g., AWS S3, Cloudinary, Imgix)
- Returns an explicit URL string pointing to the uploaded image
- Handles image processing, optimization, and CDN delivery

The field should always return an explicit URL (e.g., `https://cdn.example.com/images/hero.jpg`) rather than a base64 data URL. See the [Custom Fields Guide](/guide/custom-fields) for examples of creating custom image upload components.
:::

### Margin

```typescript
createField.margin({
   label: "Margin",
   default: { top: "small", bottom: "small" },
});
```

### Info

```typescript
createField.info({
   label: "Information",
   description: "This is a read-only information field",
});
```

### Custom

```typescript
createField.custom({
   label: "Custom Field",
   component: MyCustomComponent,
   required: true,
});
```

## Field Configuration Options

All field types accept these common options:

| Option        | Type                | Description                              |
| ------------- | ------------------- | ---------------------------------------- |
| `label`       | `string`            | Field label                              |
| `description` | `string`            | Help text below field                    |
| `placeholder` | `string`            | Input placeholder                        |
| `required`    | `boolean`           | Whether field is required                |
| `default`     | `any`               | Default value                            |
| `hidden`      | `boolean`           | Hide field from editor                   |
| `group`       | `string`            | Group field in sidebar                   |
| `clearable`   | `boolean`           | Show clear button                        |
| `validator`   | `ValidatorFunction` | Custom validation function               |
| `minLength`   | `number`            | Minimum string length                    |
| `maxLength`   | `number`            | Maximum string length                    |
| `min`         | `number`            | Minimum numeric value                    |
| `max`         | `number`            | Maximum numeric value                    |
| `step`        | `number`            | Step for number/range                    |
| `rows`        | `number`            | Rows for textarea                        |
| `minItems`    | `number`            | Minimum repeater items                   |
| `maxItems`    | `number`            | Maximum repeater items                   |
| `component`   | `Component`         | Custom component (for custom type)       |
| `valueSuffix` | `string`            | Suffix for range value (e.g., "px", "%") |
| `responsive`  | `boolean`           | Whether image is responsive (image type) |

## Complete Example

```typescript
import { createField } from "vue-wswg-editor";

export default {
   heading: createField.text({
      label: "Heading",
      required: true,
      placeholder: "Enter heading",
      maxLength: 100,
   }),

   description: createField.textarea({
      label: "Description",
      rows: 4,
      maxLength: 500,
   }),

   count: createField.number({
      label: "Count",
      min: 0,
      max: 100,
      default: 0,
   }),

   theme: createField.select(
      [
         { label: "Light", value: "light", id: "light" },
         { label: "Dark", value: "dark", id: "dark" },
      ],
      {
         label: "Theme",
         default: "light",
      }
   ),

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

## See Also

- [Fields Guide](/guide/fields) - Learn about field types and configuration
- [Validation Guide](/guide/validation) - Learn about field validation
- [Custom Fields Guide](/guide/custom-fields) - Learn about creating custom field components
