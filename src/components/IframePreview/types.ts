// Message types for parent ↔ iframe communication

import type { Block } from "../../types/Block";

export type MessageType =
   | "UPDATE_PAGE_DATA"
   | "UPDATE_HTML"
   | "SET_ACTIVE_BLOCK"
   | "SET_HOVERED_BLOCK"
   | "SET_SETTINGS_OPEN"
   | "SET_VIEWPORT"
   | "CLICK_PARTIAL"
   | "SCROLL_TO_BLOCK"
   | "BLOCK_CLICK"
   | "BLOCK_HOVER"
   | "BLOCK_REORDER"
   | "BLOCK_ADD"
   | "IFRAME_READY"
   | "BLOCK_ELEMENT_POSITION";

export interface BaseMessage {
   type: MessageType;
}

export interface UpdatePageDataMessage extends BaseMessage {
   type: "UPDATE_PAGE_DATA";
   pageData: Record<string, any>;
   blocksKey: string;
   settingsKey: string;
   theme: string;
}

export interface UpdateHTMLMessage extends BaseMessage {
   type: "UPDATE_HTML";
   html: string;
   pageData?: Record<string, any>;
   blocksKey?: string;
   settingsKey?: string;
}

export interface SetActiveBlockMessage extends BaseMessage {
   type: "SET_ACTIVE_BLOCK";
   block: Block | null;
}

export interface SetHoveredBlockMessage extends BaseMessage {
   type: "SET_HOVERED_BLOCK";
   blockId: string | null;
}

export interface SetSettingsOpenMessage extends BaseMessage {
   type: "SET_SETTINGS_OPEN";
   settingsOpen: boolean;
}

export interface SetViewportMessage extends BaseMessage {
   type: "SET_VIEWPORT";
   viewport: "desktop" | "mobile";
}

export interface PartialClickMessage extends BaseMessage {
   type: "CLICK_PARTIAL";
   partial: string;
}

export interface ScrollToBlockMessage extends BaseMessage {
   type: "SCROLL_TO_BLOCK";
   blockId: string;
}

export interface BlockClickMessage extends BaseMessage {
   type: "BLOCK_CLICK";
   blockId: string;
   block: any;
}

export interface BlockHoverMessage extends BaseMessage {
   type: "BLOCK_HOVER";
   blockId: string | null;
}

export interface BlockReorderMessage extends BaseMessage {
   type: "BLOCK_REORDER";
   oldIndex: number;
   newIndex: number;
}

export interface BlockAddMessage extends BaseMessage {
   type: "BLOCK_ADD";
   blockType: string;
   index: number;
}

export interface IframeReadyMessage extends BaseMessage {
   type: "IFRAME_READY";
}

export interface BlockElementPositionMessage extends BaseMessage {
   type: "BLOCK_ELEMENT_POSITION";
   blockId: string;
   position: {
      top: number;
      left: number;
      width: number;
      height: number;
   };
}

export type IframeMessage =
   | UpdatePageDataMessage
   | UpdateHTMLMessage
   | SetActiveBlockMessage
   | SetHoveredBlockMessage
   | SetSettingsOpenMessage
   | SetViewportMessage
   | ScrollToBlockMessage
   | PartialClickMessage;

export type ParentMessage =
   | BlockClickMessage
   | BlockHoverMessage
   | BlockReorderMessage
   | BlockAddMessage
   | IframeReadyMessage
   | BlockElementPositionMessage
   | PartialClickMessage;
