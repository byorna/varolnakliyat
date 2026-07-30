import type { OutgoingMessage } from "./types";

const GRAPH_API = "https://graph.facebook.com/v21.0";

export async function sendWhatsAppMessage(
  phoneNumberId: string,
  token: string,
  to: string,
  message: OutgoingMessage
): Promise<Response> {
  const url = `${GRAPH_API}/${phoneNumberId}/messages`;

  let body: Record<string, unknown>;

  if (message.type === "buttons" && message.buttons?.length) {
    body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: truncate(message.text, 1024) },
        action: {
          buttons: message.buttons.slice(0, 3).map((btn) => ({
            type: "reply",
            reply: {
              id: btn.id,
              title: truncate(btn.title, 20),
            },
          })),
        },
      },
    };
  } else {
    body = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: truncate(message.text, 4096) },
    };
  }

  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function markAsRead(
  phoneNumberId: string,
  token: string,
  messageId: string
): Promise<void> {
  const url = `${GRAPH_API}/${phoneNumberId}/messages`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export interface IncomingWhatsAppMessage {
  from: string;
  messageId: string;
  type: "text" | "interactive" | "other";
  text?: string;
  buttonId?: string;
}

export function extractIncomingMessages(payload: unknown): IncomingWhatsAppMessage[] {
  const results: IncomingWhatsAppMessage[] = [];
  const body = payload as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: Array<Record<string, unknown>>;
        };
      }>;
    }>;
  };

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const msg of change.value?.messages ?? []) {
        const from = String(msg.from ?? "");
        const messageId = String(msg.id ?? "");
        const type = String(msg.type ?? "other");

        if (type === "text") {
          const textObj = msg.text as { body?: string } | undefined;
          results.push({
            from,
            messageId,
            type: "text",
            text: textObj?.body ?? "",
          });
        } else if (type === "interactive") {
          const interactive = msg.interactive as {
            type?: string;
            button_reply?: { id?: string; title?: string };
          };
          if (interactive?.type === "button_reply") {
            results.push({
              from,
              messageId,
              type: "interactive",
              buttonId: interactive.button_reply?.id,
              text: interactive.button_reply?.title,
            });
          }
        }
      }
    }
  }

  return results;
}
