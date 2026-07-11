# Varol Nakliyat Web Sitesi

varolnakliyat.com için profesyonel, SEO uyumlu kurumsal web sitesi.

## Proje Konumu

`/Users/yb_home/varolnakliyat`

## Sayfalar

- **Ana Sayfa** — Hero, hizmetler, süreç, yorumlar, CTA
- **Hakkımızda** — Firma hikayesi, misyon, vizyon
- **Hizmetler** — 7 ayrı hizmet sayfası
- **Teklif Al** — Detaylı teklif formu
- **İletişim** — İletişim formu, harita
- **SSS** — Sık sorulan sorular (FAQ schema)
- **KVKK** — Aydınlatma metni

## Özellikler

- Mobil uyumlu responsive tasarım
- WhatsApp ve telefon floating butonları
- SEO: meta tags, canonical, Open Graph, JSON-LD schema, sitemap.xml, robots.txt
- Teklif ve iletişim formları
- Modern renk paleti: lacivert + turuncu aksan

## Yerel Önizleme

```bash
cd /Users/yb_home/varolnakliyat
python3 -m http.server 8080
```

Tarayıcıda: http://localhost:8080

## Logo

Site logosu: `assets/images/logo.png` (kaynak: `logo-onay-bekliyor/varolnakliyat_newlogo.png`)


`js/main.js` içindeki `SITE` objesinde:

- `phone` / `phoneRaw` — **0552 200 20 18** / `+905522002018`
- `whatsapp` — **905522002018**
- `email` — **info@varolnakliyat.com**
- `locations` — **Uğurmumcu Mah. Kartal / İstanbul** ve **Ataşehir / İstanbul**
- `mapsUrl` / `mapsEmbed` — her lokasyon için ayrı Google Maps bağlantısı

## Form Backend (Web3Forms)

Teklif ve iletişim formları **Web3Forms** ile `info@varolnakliyat.com` adresine e-posta gönderir (ücretsiz plan).

1. https://web3forms.com adresine gidin
2. Alıcı e-posta: **info@varolnakliyat.com**
3. Access key'i `js/form-config.js` dosyasındaki `accessKey` alanına yazın

Her iki formda da:
- **Teklif Talep Et / Gönder** → e-posta
- **WhatsApp'tan Gönder** → wa.me ile önceden doldurulmuş mesaj

## Deploy

Statik site — Netlify, Vercel, GitHub Pages veya herhangi bir web sunucusuna yüklenebilir.
