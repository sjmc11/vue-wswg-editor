declare module "*.vue" {
   import type { DefineComponent } from "vue";

   const component: DefineComponent<object, object, any>;
   export default component;
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
