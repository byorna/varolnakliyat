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

- `phone` / `phoneRaw` — **0551 709 88 75** / `+905517098875`
- `whatsapp` — **905517098875**
- `address` — **Fenerbahçe Mah. İğrip Sok. No:13/1 Kadıköy, İstanbul**

## Form Backend

Formlar şu an localStorage'a kaydediyor. Canlıya almadan önce Formspree, Netlify Forms veya kendi backend API'nize bağlayın.

## Deploy

Statik site — Netlify, Vercel, GitHub Pages veya herhangi bir web sunucusuna yüklenebilir.
