import type { Env, OutgoingMessage, QuoteData, ServiceType, Session, ValidationResult } from "./types";

const FIELD_LABELS: Record<string, string> = {
  name: "Ad Soyad",
  service: "Hizmet türü",
  from: "Çıkış adresi",
  to: "Varış adresi",
  date: "Taşınma tarihi",
  floorElevator: "Kat / asansör",
  rooms: "Oda sayısı",
  items: "Eşya listesi",
};

export function createSession(phone: string): Session {
  return {
    phone,
    state: "idle",
    data: {},
    updatedAt: new Date().toISOString(),
  };
}

export function welcomeMessage(companyName: string): OutgoingMessage {
  return {
    type: "buttons",
    text: [
      `Merhaba, ${companyName}'a hoş geldiniz.`,
      "",
      "Size en hızlı teklifi verebilmemiz için aşağıdaki seçeneklerden birini kullanabilirsiniz:",
      "",
      "• Butonlardan hizmet türünü seçin — adım adım sorular sorarız",
      "• VEYA tüm bilgileri tek mesajda yazın (şablon aşağıda)",
      "",
      "📋 Tek mesaj şablonu:",
      "Ad Soyad: ...",
      "Hizmet: Evden Eve / Parça Eşya",
      "Çıkış: ...",
      "Varış: ...",
      "Tarih: ...",
      "Kat/Asansör: ...",
      "Oda sayısı veya eşya listesi: ...",
      "Ek notlar: ...",
      "",
      "İptal veya baştan başlamak için *menu* yazın.",
    ].join("\n"),
    buttons: [
      { id: "evden_eve", title: "Evden Eve" },
      { id: "parca_esya", title: "Parça Eşya" },
    ],
  };
}

export function getRequiredFields(service: ServiceType): Array<keyof QuoteData> {
  const common: Array<keyof QuoteData> = [
    "name",
    "from",
    "to",
    "date",
    "floorElevator",
  ];
  if (service === "evden-eve") return [...common, "rooms"];
  return [...common, "items"];
}

export function validateData(data: QuoteData, service?: ServiceType): ValidationResult {
  const resolvedService = service ?? data.service;
  if (!resolvedService) {
    return {
      complete: false,
      missing: [FIELD_LABELS.service],
      data,
    };
  }

  const missing: string[] = [];
  for (const field of getRequiredFields(resolvedService)) {
    const value = data[field];
    if (!value || !String(value).trim()) {
      missing.push(FIELD_LABELS[field] ?? field);
    }
  }

  return {
    complete: missing.length === 0,
    missing,
    data: { ...data, service: resolvedService },
  };
}

export function mergeData(session: Session, patch: Partial<QuoteData>): QuoteData {
  return { ...session.data, ...patch };
}

export function questionForState(state: Session["state"], service?: ServiceType): string {
  switch (state) {
    case "awaiting_from":
      return "Çıkış adresinizi yazın (ilçe, mahalle, kat):";
    case "awaiting_to":
      return "Varış adresinizi yazın (ilçe, mahalle, kat):";
    case "awaiting_date":
      return "Taşınma tarihinizi yazın (ör. 15.08.2026 veya esnek):";
    case "awaiting_floor":
      return "Kat bilgisi ve asansör durumunu yazın (ör. 3. kat, asansör var):";
    case "awaiting_rooms_or_items":
      return service === "parca"
        ? "Taşınacak eşyaları listeleyin (adet ve boyut varsa belirtin):"
        : "Oda sayısını yazın (ör. 2+1, 3+1):";
    case "awaiting_name":
      return "Ad soyadınızı yazın:";
    default:
      return "";
  }
}

export function nextState(current: Session["state"]): Session["state"] {
  const order: Session["state"][] = [
    "awaiting_from",
    "awaiting_to",
    "awaiting_date",
    "awaiting_floor",
    "awaiting_rooms_or_items",
    "awaiting_name",
  ];
  const idx = order.indexOf(current);
  if (idx === -1 || idx === order.length - 1) return "idle";
  return order[idx + 1];
}

export function applyStepAnswer(session: Session, text: string): Session {
  const trimmed = text.trim();
  const data = { ...session.data };

  switch (session.state) {
    case "awaiting_from":
      data.from = trimmed;
      break;
    case "awaiting_to":
      data.to = trimmed;
      break;
    case "awaiting_date":
      data.date = trimmed;
      break;
    case "awaiting_floor":
      data.floorElevator = trimmed;
      break;
    case "awaiting_rooms_or_items":
      if (data.service === "parca") data.items = trimmed;
      else data.rooms = trimmed;
      break;
    case "awaiting_name":
      data.name = trimmed;
      break;
    default:
      break;
  }

  const next = nextState(session.state);
  return {
    ...session,
    data,
    state: next,
    updatedAt: new Date().toISOString(),
  };
}

export function startFlow(service: ServiceType): Session {
  return {
    phone: "",
    state: "awaiting_from",
    data: { service },
    updatedAt: new Date().toISOString(),
  };
}

export function formatSummary(data: QuoteData, phone: string): string {
  const serviceLabel =
    data.service === "parca" ? "Parça Eşya Taşıma" : "Evden Eve Nakliyat";

  const lines = [
    "✅ Teklif talebiniz alındı!",
    "",
    `Hizmet: ${serviceLabel}`,
    `Ad Soyad: ${data.name ?? "-"}`,
    `WhatsApp: ${phone}`,
    `Çıkış: ${data.from ?? "-"}`,
    `Varış: ${data.to ?? "-"}`,
    `Tarih: ${data.date ?? "-"}`,
    `Kat/Asansör: ${data.floorElevator ?? "-"}`,
  ];

  if (data.service === "parca") {
    lines.push(`Eşya listesi: ${data.items ?? "-"}`);
  } else {
    lines.push(`Oda sayısı: ${data.rooms ?? "-"}`);
  }

  if (data.notes?.trim()) lines.push(`Ek notlar: ${data.notes.trim()}`);

  lines.push("", "Operasyon ekibimiz en kısa sürede size dönüş yapacaktır.");
  lines.push("Yeni talep için *menu* yazabilirsiniz.");

  return lines.join("\n");
}

export function formatMissingMessage(missing: string[]): OutgoingMessage {
  return {
    type: "text",
    text: [
      "Teşekkürler! Teklif için şu bilgiler eksik:",
      "",
      ...missing.map((m) => `• ${m}`),
      "",
      "Eksik alanları tek mesajda yazabilir veya adım adım devam edebilirsiniz.",
      "Adım adım devam için hizmet türünü seçin:",
    ].join("\n"),
    buttons: [
      { id: "evden_eve", title: "Evden Eve" },
      { id: "parca_esya", title: "Parça Eşya" },
    ],
  };
}

export function formatAdminNotification(data: QuoteData, phone: string, companyName: string): object {
  return {
    source: "varol-whatsapp-bot",
    company: companyName,
    receivedAt: new Date().toISOString(),
    customerPhone: phone,
    quote: {
      service: data.service,
      name: data.name,
      from: data.from,
      to: data.to,
      date: data.date,
      floorElevator: data.floorElevator,
      rooms: data.rooms,
      items: data.items,
      notes: data.notes,
    },
  };
}

export function isResetCommand(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return ["menu", "başla", "basla", "iptal", "yeniden", "start"].includes(lower);
}

export function serviceFromButtonId(id: string): ServiceType | undefined {
  if (id === "evden_eve") return "evden-eve";
  if (id === "parca_esya") return "parca";
  return undefined;
}

export async function notifyTeam(env: Env, payload: object): Promise<void> {
  if (!env.NOTIFY_WEBHOOK_URL) return;
  await fetch(env.NOTIFY_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
