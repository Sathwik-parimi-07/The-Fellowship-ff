# Abide — QT Mentorship App (React + Supabase)

A two-role app for a QT (Quiet Time) mentorship family:

- **Mentees** upload a photo of their daily QT page, watch their streak and consistency graph grow, read songs and the monthly prayer letter, send prayer/praise points, give via UPI (optionally anonymously), and share poetry & writings.
- **The mentor (admin)** reviews QT pages (which grows each mentee's streak), sees giving graphs, gets pinged live for new prayer points and uploads, publishes the monthly letter, and sends songs.

Built with React + Vite + Tailwind, backed by Supabase (Postgres, Auth, Storage, Realtime).


## Good to know

- **Photos are private.** QT pages live in a private bucket; the app shows them through short-lived signed links. Only the mentee who uploaded them and the admin can open them.
- **Anonymous gifts are truly anonymous.** When someone gives anonymously, the database stores no name and no account id — there is nothing for the admin to look up.
- **Streaks count reviewed days.** A pending (or missing) *today* doesn't break a run; the streak grows the moment the admin marks the page reviewed.
- **The QR on the Pay page is decorative** — the "Open UPI app" button uses your real `VITE_UPI_ID`. To show your bank's actual scannable QR, replace the `FakeQR` component in `src/ui.jsx` with an `<img>` of your QR.
- **Where things live:** database rules in `supabase/schema.sql` · all data calls in `src/lib/api.js` · mentee screens in `src/MenteePages.jsx` · admin screens in `src/AdminPages.jsx`.
