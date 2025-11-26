# vue-wswg-editor

A Vue 3 WYSIWYG JSON Editor component library.

## Installation

```bash
npm install vue-wswg-editor
```

## Usage

```vue
<template>
   <WswgJsonEditor />
</template>

<script setup lang="ts">
import { WswgJsonEditor } from "vue-wswg-editor";
// Import the CSS file for Tailwind styles
import "vue-wswg-editor/style.css";
</script>
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build library
npm run build

# Run tests
npm run test:unit

# Format code
npm run format-fix
```

## Local Development with npm link

To use this package locally in another project (e.g., the admin app) during development:

1. **Build the library** (required before linking):

```bash
npm run build
```

2. **Create a global symlink** in the vue-wswg-editor directory:

```bash
npm link
```

3. **Link the package** in your consuming project (e.g., admin app):

```bash
cd /path/to/your/project
npm link vue-wswg-editor
```

4. **Use the package** in your project as normal:

```vue
<script setup lang="ts">
import { WswgJsonEditor } from "vue-wswg-editor";
</script>
```

**Note:** After making changes to the library, you'll need to rebuild (`npm run build`) for changes to be reflected in the consuming project. The development server (`npm run dev`) is useful for testing the library in isolation, but won't automatically update the linked package.

To unlink:

```bash
# In the consuming project
npm unlink vue-wswg-editor

# In the vue-wswg-editor directory (optional)
npm unlink
```

## Project Structure

- `src/components/` - Vue components
- `src/index.ts` - Library entry point
- `test/` - Test files
