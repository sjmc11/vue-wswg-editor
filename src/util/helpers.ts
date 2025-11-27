////////////////////////////////////////////////////////////
// File name traversal
////////////////////////////////////////////////////////////

/**
 * File lookup utility for finding Vue components with flexible naming conventions
 *
 * This utility handles different naming formats (snake_case, camelCase, kebab-case, PascalCase)
 * and various file/folder structures to provide maximum flexibility in component organization.
 */

/**
 * Converts a string to different naming conventions
 */
export function generateNameVariations(name: string): string[] {
   const variations = new Set<string>();

   // Original name
   variations.add(name);

   // Convert to different formats
   // snake_case
   const snakeCase = name
      .replace(/([A-Z])/g, "_$1")
      .replace(/-/g, "_")
      .toLowerCase()
      .replace(/^_+/, "");
   variations.add(snakeCase);

   // kebab-case
   const kebabCase = name
      .replace(/([A-Z])/g, "-$1")
      .replace(/_/g, "-")
      .toLowerCase()
      .replace(/^-+/, "");
   variations.add(kebabCase);

   // camelCase
   const camelCase = name
      .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
      .replace(/^[A-Z]/, (char) => char.toLowerCase());
   variations.add(camelCase);

   // PascalCase
   const pascalCase = name
      .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
      .replace(/^[a-z]/, (char) => char.toUpperCase());
   variations.add(pascalCase);

   return Array.from(variations);
}

/**
 * Generates file path patterns to try for a given block name and optional file name
 * If fileName is provided, generates patterns using variations of both blockName (for directory) and fileName (for file)
 * If fileName is not provided, uses blockName variations for both directory and file
 *
 * @param basePath - Base path (e.g., "@page-builder/blocks/")
 * @param blockName - Block name in any format (e.g., "heroSection", "hero-section")
 * @param fileName - Optional file name (e.g., "options.ts", "fields.ts"). If not provided, uses blockName
 * @returns Array of path patterns to try
 */
export function generateFilePathPatterns(basePath: string, blockName: string, fileName?: string): string[] {
   const patterns: string[] = [];

   // Generate name variations for blockName (directory) and fileName (file)
   const blockNameVariations = generateNameVariations(blockName);
   const fileNameVariations = fileName ? generateNameVariations(fileName.replace(/\.\w+$/, "")) : blockNameVariations;
   const fileExtension = fileName ? fileName.split(".").pop() || "" : "vue";

   // For each block name variation (directory), try each file name variation
   for (const blockVariation of blockNameVariations) {
      // Convert block variation to different cases for directory
      const blockKebab = blockVariation
         .replace(/([A-Z])/g, "-$1")
         .replace(/_/g, "-")
         .toLowerCase()
         .replace(/^-+/, "");
      const blockPascal = blockVariation
         .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
         .replace(/^[a-z]/, (char) => char.toUpperCase());
      const blockCamel = blockVariation
         .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
         .replace(/^[A-Z]/, (char) => char.toLowerCase());
      const blockSnake = blockVariation
         .replace(/([A-Z])/g, "_$1")
         .replace(/-/g, "_")
         .toLowerCase();

      for (const fileVariation of fileNameVariations) {
         // Convert file variation to different cases
         const fileKebab = fileVariation
            .replace(/([A-Z])/g, "-$1")
            .replace(/_/g, "-")
            .toLowerCase()
            .replace(/^-+/, "");
         const filePascal = fileVariation
            .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
            .replace(/^[a-z]/, (char) => char.toUpperCase());
         const fileCamel = fileVariation
            .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
            .replace(/^[A-Z]/, (char) => char.toLowerCase());
         const fileSnake = fileVariation
            .replace(/([A-Z])/g, "_$1")
            .replace(/-/g, "_")
            .toLowerCase();

         // Generate patterns: {blockVariation}/{fileVariation}.{ext}
         patterns.push(`${basePath}${blockKebab}/${fileKebab}.${fileExtension}`);
         patterns.push(`${basePath}${blockKebab}/${filePascal}.${fileExtension}`);
         patterns.push(`${basePath}${blockKebab}/${fileCamel}.${fileExtension}`);
         patterns.push(`${basePath}${blockKebab}/${fileSnake}.${fileExtension}`);

         patterns.push(`${basePath}${blockPascal}/${fileKebab}.${fileExtension}`);
         patterns.push(`${basePath}${blockPascal}/${filePascal}.${fileExtension}`);
         patterns.push(`${basePath}${blockPascal}/${fileCamel}.${fileExtension}`);
         patterns.push(`${basePath}${blockPascal}/${fileSnake}.${fileExtension}`);

         patterns.push(`${basePath}${blockCamel}/${fileKebab}.${fileExtension}`);
         patterns.push(`${basePath}${blockCamel}/${filePascal}.${fileExtension}`);
         patterns.push(`${basePath}${blockCamel}/${fileCamel}.${fileExtension}`);
         patterns.push(`${basePath}${blockCamel}/${fileSnake}.${fileExtension}`);

         patterns.push(`${basePath}${blockSnake}/${fileKebab}.${fileExtension}`);
         patterns.push(`${basePath}${blockSnake}/${filePascal}.${fileExtension}`);
         patterns.push(`${basePath}${blockSnake}/${fileCamel}.${fileExtension}`);
         patterns.push(`${basePath}${blockSnake}/${fileSnake}.${fileExtension}`);
      }
   }

   // Remove duplicates and return
   return [...new Set(patterns)];
}
/**
 * Converts a any type of string to camelCase
 * e.g., "hero_section" or "HeroSection" or "hero-section" or "heroSection" -> "HeroSection"
 * e.g., "component_not_found" or "ComponentNotFound" or "component-not-found" or "componentNotFound" -> "ComponentNotFound"
 */
export function toCamelCase(input: string): string {
   if (!input) return "";

   // Replace all non-alphanumeric characters with spaces
   const cleaned = input.replace(/[^a-zA-Z0-9]+/g, " ").trim();

   // Split on spaces or uppercase-to-lowercase boundaries
   const parts = cleaned.split(/\s+/).flatMap((part) => part.split(/([A-Z][a-z]*)/).filter(Boolean));

   if (parts.length === 0) return "";

   return (
      parts[0].toLowerCase() +
      parts
         .slice(1)
         .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
         .join("")
   );
}

export function toNiceName(input: string): string {
   if (!input) return "";

   // Replace underscores and hyphens with spaces
   const cleaned = input.replace(/[_-]/g, " ");

   // Split on uppercase-to-lowercase boundaries (e.g., "FaqSection" -> ["Faq", "Section"])
   // This regex finds positions where a lowercase letter is followed by an uppercase letter
   const parts = cleaned
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(/\s+/)
      .filter(Boolean);

   if (parts.length === 0) return "";

   // Capitalize first letter of each word and join with spaces
   return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ");
}
