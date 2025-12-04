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
})
```

### Textarea

```typescript
createField.textarea({
   label: "Description",
   rows: 4,
   maxLength: 500,
})
```

### Number

```typescript
createField.number({
   label: "Count",
   min: 0,
   max: 100,
   step: 1,
   default: 0,
})
```

### Boolean

```typescript
createField.boolean({
   label: "Enable Feature",
   default: false,
})
```

### Email

```typescript
createField.email({
   label: "Email Address",
   required: true,
   placeholder: "user@example.com",
})
```

### URL

```typescript
createField.url({
   label: "Website URL",
   placeholder: "https://example.com",
})
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
)
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
)
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
)
```

### Color

```typescript
createField.color({
   label: "Background Color",
   default: "#ffffff",
})
```

### Range

```typescript
createField.range({
   label: "Opacity",
   min: 0,
   max: 100,
   step: 1,
   default: 50,
})
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
)
```

### Margin

```typescript
createField.margin({
   label: "Margin",
   default: { top: "small", bottom: "small" },
})
```

### Info

```typescript
createField.info({
   label: "Information",
   description: "This is a read-only information field",
})
```

### Custom

```typescript
createField.custom({
   label: "Custom Field",
   component: MyCustomComponent,
   required: true,
})
```

## Field Configuration Options

All field types accept these common options:

| Option        | Type                        | Description                        |
| ------------- | --------------------------- | ---------------------------------- |
| `label`       | `string`                    | Field label                        |
| `description` | `string`                    | Help text below field              |
| `placeholder` | `string`                    | Input placeholder                  |
| `required`    | `boolean`                   | Whether field is required          |
| `default`     | `any`                       | Default value                      |
| `hidden`      | `boolean`                   | Hide field from editor             |
| `group`       | `string`                    | Group field in sidebar             |
| `clearable`   | `boolean`                   | Show clear button                  |
| `validator`   | `ValidatorFunction`         | Custom validation function         |
| `minLength`   | `number`                    | Minimum string length              |
| `maxLength`   | `number`                    | Maximum string length              |
| `min`         | `number`                    | Minimum numeric value              |
| `max`         | `number`                    | Maximum numeric value              |
| `step`        | `number`                    | Step for number/range              |
| `rows`        | `number`                    | Rows for textarea                  |
| `minItems`    | `number`                    | Minimum repeater items            |
| `maxItems`    | `number`                    | Maximum repeater items            |
| `component`   | `Component`                 | Custom component (for custom type) |

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

