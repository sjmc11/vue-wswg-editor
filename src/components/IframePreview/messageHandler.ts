import type {
   IframeMessage,
   ParentMessage,
   UpdatePageDataMessage,
   UpdateHTMLMessage,
   SetActiveBlockMessage,
   SetHoveredBlockMessage,
   SetSettingsOpenMessage,
   SetViewportMessage,
   ScrollToBlockMessage,
} from "./types";
import type { Block } from "../../types/Block";

/**
 * Serialize data for postMessage (handles Vue reactive proxies)
 */
function serializeForPostMessage(data: any): any {
   try {
      return JSON.parse(JSON.stringify(data));
   } catch (error) {
      console.warn("Failed to serialize data for postMessage:", error);
      return undefined;
   }
}

/**
 * Send a message to the iframe
 */
export function sendToIframe(iframe: HTMLIFrameElement | null, message: IframeMessage): void {
   if (!iframe || !iframe.contentWindow) {
      console.warn("Cannot send message: iframe not ready");
      return;
   }

   // Serialize message to handle Vue reactive proxies
   const serializedMessage = serializeForPostMessage(message) as IframeMessage;
   if (!serializedMessage) {
      console.error("Failed to serialize message for postMessage");
      return;
   }

   // Security: Only send to same origin
   try {
      iframe.contentWindow.postMessage(serializedMessage, "*");
   } catch (error) {
      console.error("Error sending message to iframe:", error);
   }
}

/**
 * Send page data update to iframe
 */
export function sendPageDataUpdate(
   iframe: HTMLIFrameElement | null,
   pageData: Record<string, any>,
   blocksKey: string,
   settingsKey: string,
   theme: string
): void {
   // Serialize pageData to avoid Vue reactive proxy issues
   const serializedPageData = serializeForPostMessage(pageData);
   const message: UpdatePageDataMessage = {
      type: "UPDATE_PAGE_DATA",
      pageData: serializedPageData,
      blocksKey,
      settingsKey,
      theme,
   };
   sendToIframe(iframe, message);
}

/**
 * Send rendered HTML to iframe
 */
export function sendHTMLUpdate(
   iframe: HTMLIFrameElement | null,
   html: string,
   pageData?: Record<string, any>,
   blocksKey?: string,
   settingsKey?: string
): void {
   // Serialize pageData to avoid Vue reactive proxy issues
   const serializedPageData = pageData ? serializeForPostMessage(pageData) : undefined;
   const message: UpdateHTMLMessage = {
      type: "UPDATE_HTML",
      html,
      pageData: serializedPageData,
      blocksKey,
      settingsKey,
   };
   sendToIframe(iframe, message);
}

/**
 * Send active block update to iframe
 */
export function sendActiveBlock(iframe: HTMLIFrameElement | null, block: Block | null): void {
   const message: SetActiveBlockMessage = {
      type: "SET_ACTIVE_BLOCK",
      block,
   };
   sendToIframe(iframe, message);
}

/**
 * Send hovered block update to iframe
 */
export function sendHoveredBlock(iframe: HTMLIFrameElement | null, blockId: string | null): void {
   const message: SetHoveredBlockMessage = {
      type: "SET_HOVERED_BLOCK",
      blockId,
   };
   sendToIframe(iframe, message);
}

/**
 * Send settings open state update to iframe
 */
export function sendSettingsOpen(iframe: HTMLIFrameElement | null, settingsOpen: boolean): void {
   const message: SetSettingsOpenMessage = {
      type: "SET_SETTINGS_OPEN",
      settingsOpen,
   };
   sendToIframe(iframe, message);
}

/**
 * Send viewport update to iframe
 */
export function sendViewport(iframe: HTMLIFrameElement | null, viewport: "desktop" | "mobile"): void {
   const message: SetViewportMessage = {
      type: "SET_VIEWPORT",
      viewport,
   };
   sendToIframe(iframe, message);
}

/**
 * Send scroll to block command to iframe
 */
export function sendScrollToBlock(iframe: HTMLIFrameElement | null, blockId: string): void {
   const message: ScrollToBlockMessage = {
      type: "SCROLL_TO_BLOCK",
      blockId,
   };
   sendToIframe(iframe, message);
}

/**
 * Validate incoming message from iframe
 */
export function isValidParentMessage(message: any): message is ParentMessage {
   if (!message || typeof message !== "object" || !message.type) {
      return false;
   }

   const validTypes: string[] = [
      "BLOCK_CLICK",
      "BLOCK_HOVER",
      "BLOCK_REORDER",
      "BLOCK_ADD",
      "IFRAME_READY",
      "BLOCK_ELEMENT_POSITION",
      "CLICK_PARTIAL",
   ];

   return validTypes.includes(message.type);
}

/**
 * Handle incoming message from iframe
 */
export function handleIframeMessage(
   event: MessageEvent,
   callbacks: {
      onBlockClick?: (blockId: string, block: any) => void;
      onBlockHover?: (blockId: string | null) => void;
      onBlockReorder?: (oldIndex: number, newIndex: number) => void;
      onBlockAdd?: (blockType: string, index: number) => void;
      onPartialClick?: (partialValue: string) => void;
      onIframeReady?: () => void;
      onBlockPosition?: (
         blockId: string,
         position: { top: number; left: number; width: number; height: number }
      ) => void;
   }
): void {
   // Security: Validate origin (in production, check against expected origin)
   // For now, we'll accept messages from any origin since we're using blob URLs
   if (!isValidParentMessage(event.data)) {
      return;
   }

   const message = event.data as ParentMessage;

   switch (message.type) {
      case "BLOCK_CLICK":
         callbacks.onBlockClick?.(message.blockId, message.block);
         break;
      case "BLOCK_HOVER":
         callbacks.onBlockHover?.(message.blockId);
         break;
      case "BLOCK_REORDER":
         callbacks.onBlockReorder?.(message.oldIndex, message.newIndex);
         break;
      case "BLOCK_ADD":
         callbacks.onBlockAdd?.(message.blockType, message.index);
         break;
      case "CLICK_PARTIAL":
         callbacks.onPartialClick?.(message.partial);
         break;
      case "IFRAME_READY":
         callbacks.onIframeReady?.();
         break;
      case "BLOCK_ELEMENT_POSITION":
         callbacks.onBlockPosition?.(message.blockId, message.position);
         break;
   }
}
