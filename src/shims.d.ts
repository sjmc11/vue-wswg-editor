declare module "*.vue" {
   import type { DefineComponent } from "vue";

   const component: DefineComponent<object, object, any>;
   export default component;
}

// Image imports - Vite returns the URL as a string
declare module "*.jpg" {
   const src: string;
   export default src;
}

declare module "*.jpeg" {
   const src: string;
   export default src;
}

declare module "*.png" {
   const src: string;
   export default src;
}

declare module "*.gif" {
   const src: string;
   export default src;
}

declare module "*.svg" {
   const src: string;
   export default src;
}

declare module "*.webp" {
   const src: string;
   export default src;
}

// Vite import.meta.glob type definitions
interface ImportMeta {
   glob<T = any>(
      pattern: string | string[],
      options?: {
         eager?: boolean;
         import?: string;
         query?: string | Record<string, string | number | boolean>;
         exclude?: string | string[];
         as?: "url" | "raw";
      }
   ): Record<string, () => Promise<T>> | Record<string, T> | Record<string, string>;
}
