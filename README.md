# Abide — QT Mentorship App (React + Supabase)

A two-role app for a QT (Quiet Time) mentorship family:

- **Mentees** upload a photo of their daily QT page, watch their streak and consistency graph grow, read songs and the monthly prayer letter, send prayer/praise points, give via UPI (optionally anonymously), and share poetry & writings.
- **The mentor (admin)** reviews QT pages (which grows each mentee's streak), sees giving graphs, gets pinged live for new prayer points and uploads, publishes the monthly letter, and sends songs.

Built with React + Vite + Tailwind, backed by Supabase (Postgres, Auth, Storage, Realtime).

---

## 1. Create the Supabase project (~3 minutes)

1. Go to [supabase.com](https://supabase.com) → sign in → **New project** (free tier is plenty).
2. Pick any name/password/region and wait for it to finish provisioning.

## 2. Set up the database

1. In the dashboard, open **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.

That one script creates every table, all the security rules (row-level security), the private photo bucket, live notifications, and some starter songs + a sample prayer letter.

## 3. Make email sign-in instant (recommended for quick start)

**Authentication → Sign In / Providers → Email** → turn **off** "Confirm email".

(You can turn it back on later once you've set up an email sender — with it on, people must click a link in their inbox before they can sign in.)

## 4. Connect the app

1. In the dashboard: **Project Settings → API** → copy the **Project URL** and the **anon public** key.
2. In this folder:

```bash
cp .env.example .env
```

3. Open `.env` and fill in:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your anon key...
VITE_UPI_ID=your-real-upi@bank
```

## 5. Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173 and **create your account** (this will be the mentor's account).

## 6. Make yourself the admin (one time)

Everyone who signs up is a **mentee** by default. Back in **SQL Editor**, run this with your own email:

```sql
update public.profiles set role = 'admin'
  where id = (select id from auth.users where email = 'you@example.com');
```

Sign out and back in — you'll land on the admin dashboard. Everyone else who signs up simply becomes a mentee. 🎉

## 7. Try the full loop

1. Create a second account (a test mentee) in a private/incognito window.
2. As the mentee: **Upload QT** → pick a photo → **Submit for review**. The admin window gets a live "New QT uploaded 📖" ping.
3. As the admin: **QT Reviews → Mark reviewed**. The mentee gets a live "Your QT was reviewed — streak grew 🔥" ping, and their heatmap square turns deep purple.
4. Send a prayer point as the mentee and watch the admin's bell light up instantly.

---

## Deploying (free)

1. Push this folder to GitHub.
2. On [Vercel](https://vercel.com) or [Netlify](https://netlify.com): import the repo, framework = Vite.
3. Add the three environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_UPI_ID`) in the project settings.
4. Deploy. Then in Supabase, set **Authentication → URL Configuration → Site URL** to your deployed URL (keeps password-reset links pointing to the right place).

## Good to know

- **Photos are private.** QT pages live in a private bucket; the app shows them through short-lived signed links. Only the mentee who uploaded them and the admin can open them.
- **Anonymous gifts are truly anonymous.** When someone gives anonymously, the database stores no name and no account id — there is nothing for the admin to look up.
- **Streaks count reviewed days.** A pending (or missing) *today* doesn't break a run; the streak grows the moment the admin marks the page reviewed.
- **The QR on the Pay page is decorative** — the "Open UPI app" button uses your real `VITE_UPI_ID`. To show your bank's actual scannable QR, replace the `FakeQR` component in `src/ui.jsx` with an `<img>` of your QR.
- **Where things live:** database rules in `supabase/schema.sql` · all data calls in `src/lib/api.js` · mentee screens in `src/MenteePages.jsx` · admin screens in `src/AdminPages.jsx`.
