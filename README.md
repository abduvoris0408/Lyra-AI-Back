# Lyra API (NestJS)

Lyra AI backend. Gemini'ga **Google AI Studio bepul tarifi** orqali ulanadi —
karta yoki billing **shart emas**.

## 1. Bepul Gemini kalitini olish (billingsiz)

> ⚠️ Muhim: kalitni **Google AI Studio** dan oling, **Google Cloud / Vertex AI** dan emas.
> AI Studio kaliti **`AIza...`** bilan boshlanadi va bepul tarifda (Free Tier) ishlaydi.
> Agar kalitingiz boshqa ko'rinishda bo'lsa yoki `429 / limit: 0` xatosi chiqsa —
> u Cloud loyihasiga bog'langan; quyidagi yo'l bilan yangi kalit oling.

1. https://aistudio.google.com/apikey ga kiring
2. Google akkaunt bilan login qiling
3. **Create API key** → **Create API key in new project**
4. Kalitni nusxalang (`AIza...`)

Bepul limit (taxminan): ~15 so'rov/daqiqa, ~1500 so'rov/kun.

## 2. Sozlash

```bash
cd lyra-api
pnpm install          # bog'liqliklarni o'rnatish
cp .env.example .env  # va .env ichidagi GEMINI_API_KEY ni to'ldiring
```

`.env`:

```
PORT=3001
WEB_ORIGIN=http://localhost:3000
GEMINI_API_KEY=AIza...        # ← AI Studio kaliti
GEMINI_DEFAULT_MODEL=gemini-flash-latest
```

## 3. Ishga tushirish

```bash
pnpm start:dev        # http://localhost:3001
```

Tekshirish: `GET http://localhost:3001/health` → `{"status":"ok",...}`

## 4. Frontend'ni backendga ulash

`lyra-web/.env.local` ga qo'shing:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Shunda frontend avtomatik `chatMode="backend"` ga o'tadi va Gemini'ga
Next.js route o'rniga shu NestJS backend orqali ulanadi.
(`NEXT_PUBLIC_API_URL` bo'sh bo'lsa — eski `/api/chat` route ishlatiladi.)

## Endpointlar

| Method | Path     | Tavsif                                    |
| ------ | -------- | ----------------------------------------- |
| GET    | /health  | Sog'liqni tekshirish                      |
| POST   | /chat    | SSE chat oqimi (delta / done / error)     |

`POST /chat` body:

```json
{
  "model": "gemini-flash-latest",
  "messages": [{ "role": "user", "content": "Salom" }],
  "system": "ixtiyoriy system prompt"
}
```

## Tuzilma

```
src/
  main.ts              # bootstrap, CORS, ValidationPipe
  app.module.ts        # ConfigModule + ChatModule
  app.controller.ts    # /health
  chat/
    chat.module.ts
    chat.controller.ts # POST /chat (SSE)
    chat.service.ts    # oqimni boshqaradi (delta/done/error)
    gemini.service.ts  # Google AI Studio API chaqiruvi
    dto/chat-request.dto.ts
```
