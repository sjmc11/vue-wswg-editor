# API Reference

Complete API reference for `vue-wswg-editor`. This documentation covers all components, utilities, and types exported by the library.

## Components

The library provides two main components for building and rendering pages:

### WswgPageBuilder

The main editor component for building and editing pages visually.

**Key Features:**

- Drag-and-drop block management
- Sidebar editor for configuring block properties
- Real-time preview with responsive viewport controls
- Layout selection and configuration

[View WswgPageBuilder API →](/api/components/wswg-page-builder)

### PageRenderer

A lightweight component for rendering pages without the editor interface. Designed for production use.

**Key Features:**

- Renders blocks and layouts
- No editing capabilities (production-focused)
- Supports layout wrapping (optional)
- Minimal overhead

[View PageRenderer API →](/api/components/page-renderer)

## Utilities

### Field Configuration

#### createField

Type-safe utility for creating field configurations. Provides helper methods for all field types.

**Supported Field Types:**

- `text` - Single-line text input
- `textarea` - Multi-line text input
- `number` - Number input
- `boolean` - Checkbox
- `email` - Email input with validation
- `url` - URL input with validation
- `select` - Dropdown select
- `checkbox` - Checkbox group
- `radio` - Radio button group
- `color` - Color picker
- `range` - Range slider with optional value suffix
- `image` - Image upload with preview and drag & drop
- `repeater` - Repeating field groups
- `margin` - Margin configuration
- `info` - Read-only information display
- `custom` - Custom field component

[View createField API →](/api/utilities/create-field)

### Registry

Functions for accessing blocks, layouts, and fields discovered by the Vite plugin.

**Available Functions:**

- `getLayouts()` - Get all registered layouts
- `getBlocks()` - Get all registered blocks
- `initialiseRegistry()` - Initialize the registry (called automatically)

[View Registry API →](/api/utilities/registry)

### Validation

Utilities for validating fields and blocks programmatically.

**Available Functions:**

- `validateField()` - Validate a single field value
- `validateAllFields()` - Validate all fields in page data

**Built-in Validations:**

- `required` - Field is required
- `minLength` / `maxLength` - String length validation
- `min` / `max` - Number range validation
- `minItems` / `maxItems` - Repeater item count validation

[View Validation API →](/api/utilities/validation)

## Type Definitions

The library exports TypeScript types for type-safe development:

```typescript
import type { EditorFieldConfig, ValidatorFunction, ValidationResult } from "vue-wswg-editor";
```

### EditorFieldConfig

Configuration object for editor fields. Used with `createField` helpers.

### ValidatorFunction

Type for custom validation functions:

```typescript
type ValidatorFunction = (value: any) => Promise<boolean | string>;
```

### ValidationResult

Result object returned by `validateAllFields`:

```typescript
interface ValidationResult {
   title: string;
   isValid: boolean;
   errors: Record<string, string | boolean>;
}
```

## Quick Import Reference

```typescript
// Components
import { WswgPageBuilder, PageRenderer } from "vue-wswg-editor";

// Utilities
import {
   createField,
   getLayouts,
   getBlocks,
   initialiseRegistry,
   validateField,
   validateAllFields,
} from "vue-wswg-editor";

// Types
import type { EditorFieldConfig, ValidatorFunction, ValidationResult } from "vue-wswg-editor";

// Styles
import "vue-wswg-editor/style.css";
```

## API Sections

### Components

- [WswgPageBuilder](/api/components/wswg-page-builder) - Main editor component
- [PageRenderer](/api/components/page-renderer) - Page renderer component

### Utilities

- [createField](/api/utilities/create-field) - Field configuration utility
- [Registry](/api/utilities/registry) - Registry access functions
- [Validation](/api/utilities/validation) - Validation utilities

## Related Documentation

- [Getting Started Guide](/guide/getting-started) - Learn the basics
- [Components Guide](/guide/components) - Detailed component usage
- [Fields Guide](/guide/fields) - Field configuration guide
- [Validation Guide](/guide/validation) - Validation patterns
