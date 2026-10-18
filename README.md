# 🎛️ AI Router Studio

Web app **AI router pribadi** — chat realtime (streaming SSE), studio foto & video, cek model,
highlight kode, ekspor ZIP. Dibangun dengan **Vite + React + Tailwind CSS**, siap deploy ke **Vercel**.

Tema visual: nuansa krem hangat + charcoal gelap dengan tipografi tebal ala studio kreatif.

## ✨ Fitur

| Fitur | Keterangan |
| --- | --- |
| 🔐 Login env | Username & password diambil dari environment variable (VITE_AUTH_USER / VITE_AUTH_PASS) |
| 🔑 API key dari env | `VITE_API_KEY` dipakai otomatis, bisa diganti manual di login/pengaturan |
| 💬 Chat streaming | SSE realtime langsung dari browser ke API (`stream: true`), bukan nunggu respons utuh |
| 🧠 Panel reasoning | Model reasoning → `reasoning_content` tampil di panel "Alur pikir" |
| 🖼️ Vision | Lampirkan gambar (base64) untuk model dengan capability `vision` |
| 🎨 Studio foto | `POST /images/generations` + fallback otomatis (chat multimodal / URL parsing) |
| 🎬 Studio video | `POST /videos/generations` → `/videos` → fallback chat, hasil tampil sebagai player |
| 📦 Ekspor ZIP | Kode blok, percakapan (.md + .json), dan media bisa diunduh sebagai ZIP |
| 💻 Highlight kode | Markdown + syntax highlighting (banyak bahasa), tombol salin & unduh per blok |
| 📊 Cek model | Katalog realtime dari `GET /models` — capabilities, harga, context window, detail `GET /models/{id}` |
| 🌗 Tema | Mode terang (krem) & mode gelap (charcoal) |
| 📱 Responsif | Menu mobile full-screen gelap, sidebar drawer, layout mobile-friendly |

## 🚀 Cara pakai

### 1. Isi environment variable

Salin `.env.example` menjadi `.env` lalu isi:

```bash
VITE_APP_NAME="Nexa Router"          # nama aplikasi (bebas)
VITE_AUTH_USER=admin                 # username login
VITE_AUTH_PASS=ganti-password-ini    # password login
VITE_API_KEY=fm_xxxxxxxx             # API key FreeModel kamu
VITE_API_BASE=https://freemodel.in/v1
```

### 2. Deploy ke Vercel (tanpa terminal)

**Cara A — drag & drop (paling cepat, tanpa terminal sama sekali):**
1. Buka [vercel.com/new](https://vercel.com/new) → pilih **Deploy** dengan upload folder.
2. Upload folder `dist/` (hasil build) — atau upload seluruh folder project, Vercel auto-detect Vite.
3. Di tab *Environment Variables*, tambahkan variabel di atas.
4. Deploy. Selesai. 🎉

**Cayer B — via GitHub (bisa auto-rebuild tiap update):**
1. Push folder project ke repository GitHub.
2. Import repo di Vercel → framework preset **Vite** (otomatis).
3. Tambahkan environment variables → Deploy.

> 💡 Karena Vite membaca env saat **build**, setiap kali ganti env di Vercel lakukan **Redeploy**.

### 3. Jalankan lokal (opsional)

```bash
npm install
npm run dev      # buka http://localhost:5173
npm run build    # hasilnya di dist/
```

## 🔒 Catatan keamanan

- `VITE_API_KEY` ikut ter-*bundle* ke file JS client — wajar untuk app pribadi/privat,
  tapi **jangan** publikasikan repo kalau key-nya sensitif. Kalau perlu, taruh di Vercel
  sebagai *Environment Variable* private dan build lewat Vercel (hasil build tetap client-side).
- Login hanya *gate* UI (client-side). Untuk proteksi ekstra, pasang Vercel Deployment Protection
  atau letakkan app di belakang auth tambahan.

## 🗂 Struktur project

```
ai-router/
├── index.html
├── vercel.json          # SPA rewrite untuk Vercel
├── .env.example         # template environment variable
├── src/
│   ├── main.jsx         # entry
│   ├── App.jsx          # routing + layout
│   ├── index.css        # tema Tailwind + highlight kode
│   ├── lib/
│   │   ├── api.js       # klien API + streaming SSE + generator media
│   │   ├── media.js     # parser media & kode dari teks model
│   │   ├── export.js    # unduh file & ZIP
│   │   ├── config.js    # baca env
│   │   ├── format.js    # format angka/harga/waktu
│   │   └── storage.js   # localStorage
│   ├── context/AppContext.jsx
│   ├── components/      # Navbar, Markdown, CodeBlock, ModelPicker, dll
│   └── pages/           # Login, Chat, Media, Models, Settings
└── public/favicon.svg
```

## 🧩 Kustomisasi cepat

- **Nama brand**: ganti `VITE_APP_NAME` (wordmark otomatis: kata pertama tebal, sisanya tipis).
- **Warna tema**: `tailwind.config.js` (`cream`, `ink`, `muted`, `line`).
- **Warna highlight kode**: blok `.hljs-*` di `src/index.css`.
- **Prompt sistem default**: `src/context/AppContext.jsx` → `DEFAULT_SETTINGS.systemPrompt`.
- **Gaya markdown**: kelas `.md` di `src/index.css`.

## 📡 Endpoint API yang dipakai

| Method | Endpoint | Pemakaian |
| --- | --- | --- |
| GET | `/models` | Katalog model realtime + indikator koneksi |
| GET | `/models/{id}` | Detail model (modal) |
| POST | `/chat/completions` | Chat streaming SSE & fallback generator media |
| POST | `/images/generations` | Studio foto (dengan fallback) |
| POST | `/videos/generations`, `/videos` | Studio video (dengan fallback) |

Dokumen resmi: [freemodel.in/docs/getting-started](https://freemodel.in/docs/getting-started)
