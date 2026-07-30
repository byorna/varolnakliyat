# Varol Nakliyat — WhatsApp Bot (Cloudflare Worker)

WhatsApp Cloud API webhook botu. **Hibrit model:**

1. İlk mesajda karşılama + **Evden Eve / Parça Eşya** butonları + tek mesajda bilgi şablonu
2. Kullanıcı buton seçerse → adım adım sorular (çıkış → varış → tarih → kat/asansör → oda/eşya → ad soyad)
3. Kullanıcı tek mesajda yazarsa → parser alanları çıkarır, eksik varsa tamamlatır

Numara: **0552 200 20 18** (`+905522002018`)

---

## Gereksinimler

- [Meta Business](https://business.facebook.com) hesabı
- WhatsApp Business API erişimi ([Meta Developers](https://developers.facebook.com))
- [Cloudflare](https://dash.cloudflare.com) hesabı
- Node.js 18+

---

## 1) Meta / WhatsApp kurulumu

### 1.1 Uygulama oluştur
1. [developers.facebook.com](https://developers.facebook.com) → **Create App** → **Business**
2. **WhatsApp** ürününü ekle
3. **API Setup** sayfasından:
   - **Phone number ID** → kopyala
   - **Temporary access token** → test için (kalıcı token için System User oluştur)
   - **WhatsApp Business Account ID** not al

### 1.2 Kalıcı token (production)
1. Business Settings → **System Users** → Add
2. WhatsApp hesabına tam yetki ver
3. **Generate token** → `whatsapp_business_messaging`, `whatsapp_business_management`
4. Token'ı güvenli sakla → `WHATSAPP_TOKEN`

### 1.3 Webhook verify token
Kendiniz belirleyin (rastgele string), örn: `varol-wa-verify-2026-xK9m`

→ `WHATSAPP_VERIFY_TOKEN`

### 1.4 Telefon numarası
- Test: Meta'nın verdiği test numarası ile başlayın
- Production: **0552 200 20 18** numarasını WhatsApp Business API'ye taşıyın  
  (Normal WhatsApp uygulaması ile **aynı anda** kullanılamaz)

---

## 2) Cloudflare Worker deploy

```bash
cd whatsapp-bot
npm install
```

### 2.1 KV namespace
```bash
npx wrangler kv namespace create SESSIONS
```

Çıktıdaki `id` değerini `wrangler.toml` içinde `REPLACE_WITH_KV_NAMESPACE_ID` yerine yazın.

### 2.2 Secret'lar
```bash
npx wrangler secret put WHATSAPP_TOKEN
npx wrangler secret put WHATSAPP_VERIFY_TOKEN
npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID
# Opsiyonel — Make/Zapier/Telegram webhook
npx wrangler secret put NOTIFY_WEBHOOK_URL
```

### 2.3 Deploy
```bash
npm run deploy
```

Worker URL örneği: `https://varol-whatsapp-bot.<subdomain>.workers.dev`

### 2.4 Meta webhook bağlantısı
Meta Developer → WhatsApp → **Configuration**:

| Alan | Değer |
|------|-------|
| Callback URL | `https://varol-whatsapp-bot.<subdomain>.workers.dev` |
| Verify token | `WHATSAPP_VERIFY_TOKEN` ile aynı |

**Subscribe** alanları: `messages`

---

## 3) Yerel test

`.dev.vars` oluşturun (git'e eklenmez):

```env
WHATSAPP_TOKEN=EAAxxxxx
WHATSAPP_VERIFY_TOKEN=varol-wa-verify-2026-xK9m
WHATSAPP_PHONE_NUMBER_ID=123456789012345
NOTIFY_WEBHOOK_URL=
```

```bash
npm run dev
```

Webhook testi için ngrok veya `wrangler dev --remote` kullanın.

---

## 4) Bot akışı

```
Müşteri yazar
    ↓
Karşılama + butonlar + tek mesaj şablonu
    ↓
┌─────────────────┬──────────────────────┐
│ Buton seçer     │ Tek mesajda yazar    │
│ (Evden/Parça)   │ (Ad Soyad: ... vb.)  │
└────────┬────────┴──────────┬───────────┘
         ↓                   ↓
   Adım adım sorular    Parser + eksik kontrol
         ↓                   ↓
         └─────── Tamamlandı ───────┘
                    ↓
         Özet mesaj + NOTIFY_WEBHOOK
```

**Reset:** `menu`, `iptal`, `başla`

---

## 5) Operasyon bildirimi

`NOTIFY_WEBHOOK_URL` tanımlıysa tamamlanan talep JSON olarak POST edilir:

```json
{
  "source": "varol-whatsapp-bot",
  "company": "Varol Nakliyat",
  "customerPhone": "905xxxxxxxxx",
  "quote": {
    "service": "evden-eve",
    "name": "Ali Yılmaz",
    "from": "İstanbul Kartal 3. kat",
    "to": "Ankara Çankaya",
    "date": "20.08.2026",
    "floorElevator": "Asansör var",
    "rooms": "2+1"
  }
}
```

Make.com / Zapier ile e-posta, Telegram veya Google Sheets'e bağlayabilirsiniz.

---

## 6) Dosya yapısı

```
whatsapp-bot/
├── src/
│   ├── index.ts      # Webhook handler
│   ├── bot.ts        # Konuşma mantığı
│   ├── parser.ts     # Tek mesaj parser
│   ├── whatsapp.ts   # Graph API client
│   └── types.ts
├── wrangler.toml
└── package.json
```

---

## 7) Maliyet (yaklaşık)

- **Cloudflare Workers:** Ücretsiz planda günde 100k istek
- **Cloudflare KV:** Ücretsiz kotanın içinde (düşük trafik)
- **Meta WhatsApp:** İlk ~1000 hizmet konuşması/ay ücretsiz; sonrası mesaj başına ücret

---

## Sorun giderme

| Sorun | Çözüm |
|-------|-------|
| Webhook verify fail | `WHATSAPP_VERIFY_TOKEN` Meta ile birebir aynı mı? |
| Mesaj gitmiyor | Token süresi dolmuş olabilir; kalıcı token kullanın |
| Bot cevap vermiyor | `wrangler tail` ile logları izleyin |
| 24 saat kuralı | Müşteri 24 saat içinde yazmadıysa sadece onaylı template gönderilebilir |

```bash
npm run tail
```
