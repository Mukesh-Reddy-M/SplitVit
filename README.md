# SplitVit 💸

Smart expense splitting for groups, trips and roommates.

Built with **React + Vite + Supabase**.

---

## Features

- 🔐 Email/Password & Google OAuth login
- 👥 Create groups and add members
- 💰 Add expenses with split calculations
- 🧮 Auto settlement algorithm (minimizes transactions)
- 🔗 Shareable group links (works across devices)
- 📱 Mobile-first responsive design

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/splitvit.git
cd splitvit
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Go to **Settings → API** and copy your Project URL and anon key

### 4. Add environment variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Google OAuth Setup (optional)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials (Web application)
3. Add redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
4. Paste Client ID & Secret into Supabase → Authentication → Providers → Google

---

## Deploy

```bash
npm run build
```

Upload the `dist/` folder to **Netlify**, **Vercel**, or any static host.

> ⚠️ Never commit your `.env` file. It's already in `.gitignore`.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| Supabase | Auth + Database |
| CSS-in-JS | Styling (no extra libs) |
