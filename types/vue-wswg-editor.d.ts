// Type declarations for vue-wswg-editor library dependencies
// These declarations allow the library to use internal dependencies without requiring
// consumers to install their type definitions

// SortableJS type declaration - self-contained for library consumers
// This allows the library to use sortablejs without requiring consumers to install @types/sortablejs
declare module "sortablejs" {
   interface SortableOptions {
      group?:
         | string
         | {
              name?: string;
              pull?: boolean | string | ((to: any, from: any, dragEl: HTMLElement) => boolean | string);
              put?: boolean | string | ((to: any) => boolean | string);
           };
      sort?: boolean;
      delay?: number;
      delayOnTouchStart?: boolean;
      touchStartThreshold?: number;
      disabled?: boolean;
      store?: { get: (sortable: any) => any[]; set: (sortable: any) => void };
      animation?: number;
      easing?: string;
      handle?: string;
      filter?: string | ((event: Event | TouchEvent) => boolean);
      preventOnFilter?: boolean;
      draggable?: string;
      dataIdAttr?: string;
      ghostClass?: string;
      chosenClass?: string;
      dragClass?: string;
      swapThreshold?: number;
      invertSwap?: boolean;
      invertedSwapThreshold?: number;
      direction?: "vertical" | "horizontal";
      forceFallback?: boolean;
      fallbackClass?: string;
      fallbackOnBody?: boolean;
      fallbackTolerance?: number;
      fallbackOffset?: { x: number; y: number };
      supportPointer?: boolean;
      emptyInsertThreshold?: number;
      setData?: (dataTransfer: DataTransfer, dragEl: HTMLElement) => void;
      onStart?: (evt: any) => void;
      onEnd?: (evt: any) => void;
      onAdd?: (evt: any) => void;
      onUpdate?: (evt: any) => void;
      onSort?: (evt: any) => void;
      onRemove?: (evt: any) => void;
      onFilter?: (evt: any) => void;
      onMove?: (evt: any, originalEvent: Event) => boolean | -1 | 1 | void;
      onClone?: (evt: any) => void;
      [key: string]: any;
   }

   class Sortable {
      constructor(element: HTMLElement, options?: SortableOptions);
      option(name: string, value?: any): any;
      destroy(): void;
      el: HTMLElement;
      options: SortableOptions;
      static active: Sortable | null;
      static utils: {
         on(el: HTMLElement, event: string, fn: (evt: Event) => void): void;
         off(el: HTMLElement, event: string, fn: (evt: Event) => void): void;
         get(el: HTMLElement, path: string): any;
         set(el: HTMLElement, path: string, value: any): void;
         closest(el: HTMLElement, selector: string): HTMLElement | null;
         matches(el: HTMLElement, selector: string): boolean;
         find(el: HTMLElement, selector: string): HTMLElement[];
         create(tag: string, classes?: string): HTMLElement;
         is(el: HTMLElement, selector: string): boolean;
         extend(dest: any, ...src: any[]): any;
         throttle(fn: (...args: any[]) => any, wait: number): (...args: any[]) => any;
         debounce(fn: (...args: any[]) => any, wait: number): (...args: any[]) => any;
         clone(el: HTMLElement): HTMLElement;
         toggleClass(el: HTMLElement, name: string, state?: boolean): void;
         index(el: HTMLElement, selector?: string): number;
         nextTick(fn: () => void): void;
         cancelNextTick(id: number): void;
         detectDirection(el: HTMLElement): "vertical" | "horizontal";
         getChild(el: HTMLElement, childNum: number): HTMLElement | null;
      };
      static mount(...plugins: any[]): void;
      static create(element: HTMLElement, options?: SortableOptions): Sortable;
      static get(element: HTMLElement): Sortable | undefined;
      static readonly version: string;
   }

   export = Sortable;
   export default Sortable;
}

// Yup type declaration - self-contained for library consumers
// This allows the library to use yup without requiring consumers to install yup types
declare module "yup" {
   export interface Schema<T = any> {
      validate(value: any, options?: any): Promise<T>;
      isValid(value: any, options?: any): Promise<boolean>;
      validateSync(value: any, options?: any): T;
      isValidSync(value: any, options?: any): boolean;
      cast(value: any, options?: any): T;
      nullable(isNullable?: boolean): Schema<T | null>;
      required(message?: string): Schema<T>;
      notRequired(): Schema<T | undefined>;
      default(value: T | (() => T)): Schema<T>;
      typeError(message?: string): Schema<T>;
      oneOf(values: any[], message?: string): Schema<T>;
      notOneOf(values: any[], message?: string): Schema<T>;
      when(keys: string | string[], builder: any): Schema<T>;
      test(
         name: string,
         message: string | ((value: any) => string),
         test: (value: any) => boolean | Promise<boolean>
      ): Schema<T>;
      transform(transform: (value: any) => any): Schema<T>;
   }

   export function string(): Schema<string>;
   export function number(): Schema<number>;
   export function boolean(): Schema<boolean>;
   export function date(): Schema<Date>;
   export function object(shape?: Record<string, Schema>): Schema<Record<string, any>>;
   export function array(of?: Schema): Schema<any[]>;
   export function mixed(): Schema<any>;
   export function lazy(fn: () => Schema): Schema;
   export function reach(schema: Schema, path: string, value?: any, context?: any): Schema;
   export function ref(path: string, options?: { contextPrefix?: string }): any;
   export function setLocale(customLocale: Record<string, any>): void;
   export function getLocale(): Record<string, any>;
   export function addMethod(schemaType: string, name: string, method: (...args: any[]) => any): void;
   export class ValidationError extends Error {
      value: any;
      path: string;
      type?: string;
      errors: string[];
      inner: ValidationError[];
      params?: Record<string, any>;
      constructor(errors: string | string[], value: any, path?: string, type?: string);
   }
   export const mixed: {
      (): Schema<any>;
   };
}

// Virtual modules created by vue-wswg-editor vite plugin
declare module "vue-wswg-editor:layouts" {
   export const modules: Record<string, () => Promise<any>>;
}

declare module "vue-wswg-editor:blocks" {
   export const modules: Record<string, () => Promise<any>>;
}

declare module "vue-wswg-editor:fields" {
   export const modules: Record<string, () => Promise<any>>;
}

declare module "vue-wswg-editor:thumbnails" {
   export const modules: Record<string, () => Promise<any>>;
}
