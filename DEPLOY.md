# Lyra AI — Deploy qo'llanmasi

Loyiha ikki qismdan iborat:

- **lyra-web** — Next.js frontend → **Vercel**
- **lyra-api** — NestJS backend → **Render** (yoki Railway / Fly.io)

---

## 1. Backend (lyra-api) → Render

1. [render.com](https://render.com) → **New → Blueprint** → shu GitHub repo'ni tanlang
   (repo ildizidagi `render.yaml` avtomatik o'qiladi).
2. Environment Variables (Render dashboard):
   - `GEMINI_API_KEY` — AI Studio kaliti
   - `WEB_ORIGIN` — Vercel domeningiz, masalan `https://lyra.vercel.app`
   - (`PORT` ni Render o'zi beradi — qo'lda qo'shmang)
3. Deploy. Tekshirish: `https://<sizning-api>.onrender.com/health`

> Alternativa: Railway/Fly.io — `lyra-api/Dockerfile` ishlatiladi, env'lar bir xil.

---

## 2. Frontend (lyra-web) → Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → repo'ni import qiling.
2. **Root Directory** = `lyra-web` (muhim — monorepo).
3. Framework: Next.js (avtomatik aniqlanadi).
4. Environment Variables:
   - `NEXT_PUBLIC_API_URL` — Render backend manzili (masalan `https://lyra-api.onrender.com`)
   - `NEXT_PUBLIC_SITE_URL` — Vercel domeningiz (masalan `https://lyra.vercel.app`)
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google OAuth Client ID
5. Deploy.

---

## 3. Google OAuth (real kirish uchun)

[Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials →
OAuth Client ID → **Authorized JavaScript origins** ga Vercel domeningizni qo'shing:

```
https://lyra.vercel.app
```

---

## 4. Tartib (muhim)

1. Avval **backend**ni deploy qiling → URL'ini oling.
2. So'ng **frontend**ni deploy qiling (`NEXT_PUBLIC_API_URL` ga backend URL'ini bering).
3. Backend'da `WEB_ORIGIN` ga frontend URL'ini yozing (CORS uchun).

## Eslatma — bepul tarif

Gemini bepul tarifda: ~15 so'rov/daqiqa, ~1500 so'rov/kun. Ko'p foydalanuvchi
bo'lsa kvota tugashi mumkin — u holda billing yoqiladi (yoki kvota cheklanadi).
Render free plan: backend bir muddat ishlatilmasa "uxlaydi", birinchi so'rov sekin bo'ladi.
