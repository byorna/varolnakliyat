export type ServiceType = "evden-eve" | "parca";

export type BotState =
  | "idle"
  | "awaiting_from"
  | "awaiting_to"
  | "awaiting_date"
  | "awaiting_floor"
  | "awaiting_rooms_or_items"
  | "awaiting_name";

export interface QuoteData {
  name?: string;
  service?: ServiceType;
  from?: string;
  to?: string;
  date?: string;
  floorElevator?: string;
  rooms?: string;
  items?: string;
  notes?: string;
}

export interface Session {
  phone: string;
  state: BotState;
  data: QuoteData;
  updatedAt: string;
}

export interface Env {
  SESSIONS: KVNamespace;
  WHATSAPP_TOKEN: string;
  WHATSAPP_VERIFY_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  NOTIFY_WEBHOOK_URL?: string;
  COMPANY_NAME: string;
  COMPANY_PHONE_DISPLAY: string;
}

export interface OutgoingMessage {
  type: "text" | "buttons";
  text: string;
  buttons?: Array<{ id: string; title: string }>;
}

export interface ParsedBulkResult {
  data: QuoteData;
  filledCount: number;
}

export interface ValidationResult {
  complete: boolean;
  missing: string[];
  data: QuoteData;
}
