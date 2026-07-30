import {
  applyStepAnswer,
  createSession,
  formatAdminNotification,
  formatMissingMessage,
  formatSummary,
  isResetCommand,
  mergeData,
  notifyTeam,
  questionForState,
  serviceFromButtonId,
  startFlow,
  validateData,
  welcomeMessage,
} from "./bot";
import { detectServiceFromText, looksLikeBulkMessage, parseBulkMessage } from "./parser";
import type { Env, OutgoingMessage, Session } from "./types";
import { extractIncomingMessages, markAsRead, sendWhatsAppMessage } from "./whatsapp";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 gün

async function loadSession(kv: KVNamespace, phone: string): Promise<Session | null> {
  const raw = await kv.get(phone, "json");
  return raw as Session | null;
}

async function saveSession(kv: KVNamespace, session: Session): Promise<void> {
  await kv.put(session.phone, JSON.stringify(session), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
}

async function reply(env: Env, to: string, message: OutgoingMessage): Promise<void> {
  const res = await sendWhatsAppMessage(
    env.WHATSAPP_PHONE_NUMBER_ID,
    env.WHATSAPP_TOKEN,
    to,
    message
  );
  if (!res.ok) {
    const err = await res.text();
    console.error("WhatsApp send failed", res.status, err);
  }
}

async function completeQuote(env: Env, session: Session): Promise<OutgoingMessage> {
  const validation = validateData(session.data, session.data.service);
  const data = validation.data;

  await notifyTeam(env, formatAdminNotification(data, session.phone, env.COMPANY_NAME));

  const reset: Session = {
    ...createSession(session.phone),
    phone: session.phone,
  };
  await saveSession(env.SESSIONS, reset);

  return { type: "text", text: formatSummary(data, session.phone) };
}

async function handleBulkMessage(env: Env, session: Session, text: string): Promise<void> {
  const parsed = parseBulkMessage(text);
  let data = mergeData(session, parsed.data);

  if (!data.service) {
    data.service = detectServiceFromText(text) ?? session.data.service;
  }

  const validation = validateData(data, data.service);

  if (validation.complete) {
    const completeSession: Session = {
      ...session,
      data: validation.data,
      state: "idle",
      updatedAt: new Date().toISOString(),
    };
    await reply(env, session.phone, await completeQuote(env, completeSession));
    return;
  }

  // Eksik alan var — kaydet ve tamamlat
  const updated: Session = {
    ...session,
    data: validation.data,
    state: inferNextMissingState(validation.data, validation.missing),
    updatedAt: new Date().toISOString(),
  };
  await saveSession(env.SESSIONS, updated);

  const missingMsg = formatMissingMessage(validation.missing);
  await reply(env, session.phone, missingMsg);

  if (updated.state !== "idle") {
    await reply(env, session.phone, {
      type: "text",
      text: questionForState(updated.state, updated.data.service),
    });
  }
}

function inferNextMissingState(
  data: Session["data"],
  missingLabels: string[]
): Session["state"] {
  const labelToState: Record<string, Session["state"]> = {
    "Çıkış adresi": "awaiting_from",
    "Varış adresi": "awaiting_to",
    "Taşınma tarihi": "awaiting_date",
    "Kat / asansör": "awaiting_floor",
    "Oda sayısı": "awaiting_rooms_or_items",
    "Eşya listesi": "awaiting_rooms_or_items",
    "Ad Soyad": "awaiting_name",
    "Hizmet türü": "idle",
  };

  for (const label of missingLabels) {
    const state = labelToState[label];
    if (state) return state;
  }

  if (!data.from) return "awaiting_from";
  if (!data.to) return "awaiting_to";
  if (!data.date) return "awaiting_date";
  if (!data.floorElevator) return "awaiting_floor";
  if (data.service === "parca" && !data.items) return "awaiting_rooms_or_items";
  if (data.service === "evden-eve" && !data.rooms) return "awaiting_rooms_or_items";
  if (!data.name) return "awaiting_name";
  return "idle";
}

async function handleStepFlow(env: Env, session: Session, text: string): Promise<void> {
  const updated = applyStepAnswer(session, text);
  updated.phone = session.phone;

  if (updated.state === "idle") {
    const validation = validateData(updated.data, updated.data.service);
    if (validation.complete) {
      updated.data = validation.data;
      await reply(env, session.phone, await completeQuote(env, updated));
      return;
    }
    updated.state = inferNextMissingState(validation.data, validation.missing);
    updated.data = validation.data;
  }

  await saveSession(env.SESSIONS, updated);

  if (updated.state === "idle") {
    await reply(env, session.phone, formatMissingMessage(validateData(updated.data).missing));
    return;
  }

  await reply(env, session.phone, {
    type: "text",
    text: questionForState(updated.state, updated.data.service),
  });
}

async function processMessage(env: Env, incoming: {
  from: string;
  messageId: string;
  type: string;
  text?: string;
  buttonId?: string;
}): Promise<void> {
  const phone = incoming.from;
  let session = (await loadSession(env.SESSIONS, phone)) ?? createSession(phone);
  session.phone = phone;

  if (incoming.messageId) {
    await markAsRead(env.WHATSAPP_PHONE_NUMBER_ID, env.WHATSAPP_TOKEN, incoming.messageId);
  }

  // Buton seçimi
  if (incoming.buttonId) {
    const service = serviceFromButtonId(incoming.buttonId);
    if (service) {
      const flow = startFlow(service);
      flow.phone = phone;
      await saveSession(env.SESSIONS, flow);
      await reply(env, phone, {
        type: "text",
        text: [
          service === "evden-eve"
            ? "Evden eve nakliyat talebi alındı."
            : "Parça eşya taşıma talebi alındı.",
          "",
          questionForState("awaiting_from", service),
        ].join("\n"),
      });
      return;
    }
  }

  const text = (incoming.text ?? "").trim();
  if (!text) return;

  if (isResetCommand(text)) {
    const reset = createSession(phone);
    reset.phone = phone;
    await saveSession(env.SESSIONS, reset);
    await reply(env, phone, welcomeMessage(env.COMPANY_NAME));
    return;
  }

  // Adım adım akış devam ediyor
  if (session.state !== "idle") {
    await handleStepFlow(env, session, text);
    return;
  }

  // Toplu mesaj mı?
  if (looksLikeBulkMessage(text)) {
    await handleBulkMessage(env, session, text);
    return;
  }

  // İlk mesaj veya serbest metin — hizmet tespiti dene
  const detectedService = detectServiceFromText(text);
  if (detectedService && text.length < 40) {
    const flow = startFlow(detectedService);
    flow.phone = phone;
    await saveSession(env.SESSIONS, flow);
    await reply(env, phone, {
      type: "text",
      text: questionForState("awaiting_from", detectedService),
    });
    return;
  }

  // Karşılama
  await saveSession(env.SESSIONS, session);
  await reply(env, phone, welcomeMessage(env.COMPANY_NAME));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Meta webhook doğrulama
    if (request.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN && challenge) {
        return new Response(challenge, { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const payload = await request.json();
      const messages = extractIncomingMessages(payload);

      // Meta 200 bekler; işlemi arka planda sürdür
      const tasks = messages.map((msg) => processMessage(env, msg));
      await Promise.all(tasks);

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Webhook error", error);
      return new Response(JSON.stringify({ ok: false }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
