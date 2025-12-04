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
- `range` - Range slider
- `repeater` - Repeating field groups
- `margin` - Margin configuration (top/bottom)
- `info` - Read-only information display
- `custom` - Custom field component

## Field Options

| Option        | Type                        | Description                        |
| ------------- | --------------------------- | ---------------------------------- |
| `type`        | `EditorFieldType`           | Field type (required)              |
| `label`       | `string`                    | Field label                        |
| `description` | `string`                    | Help text below field              |
| `placeholder` | `string`                    | Input placeholder                  |
| `required`    | `boolean`                   | Whether field is required          |
| `default`     | `any`                       | Default value                      |
| `hidden`      | `boolean`                   | Hide field from editor             |
| `group`       | `string`                    | Group field in sidebar             |
| `options`     | `Array<{label, value, id}>` | Options for select/radio/checkbox  |
| `min` / `max` | `number`                    | Min/max for number/range           |
| `step`        | `number`                    | Step for number/range              |
| `rows`        | `number`                    | Rows for textarea                  |
| `validator`   | `ValidatorFunction`         | Custom validation function         |
| `component`   | `Component`                 | Custom component for `custom` type |

## Field Examples

See the [API Reference](/api/utilities/create-field) for detailed examples of each field type.

