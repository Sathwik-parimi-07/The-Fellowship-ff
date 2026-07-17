import { supabase } from "./supabase";
import { daysAgo, todayKey, monthKey, shrinkImage } from "./helpers";

/* ---------------- profile ---------------- */
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) throw error;
  return data;
}

/* ---------------- signed URLs for private QT photos ---------------- */
async function signPages(rows) {
  const paths = rows.flatMap((r) => r.pages || []);
  if (!paths.length) return rows;
  const { data, error } = await supabase.storage.from("qt-pages").createSignedUrls(paths, 3600);
  if (error) throw error;
  const map = {};
  data.forEach((d, i) => { if (d.signedUrl) map[d.path || paths[i]] = d.signedUrl; });
  return rows.map((r) => ({ ...r, pageUrls: (r.pages || []).map((p) => map[p]).filter(Boolean) }));
}

/* ---------------- QT uploads ---------------- */
export async function fetchMyUploads(uid) {
  const { data, error } = await supabase
    .from("qt_uploads")
    .select("id, qt_date, status, note, pages")
    .eq("mentee_id", uid)
    .gte("qt_date", daysAgo(130))
    .order("qt_date", { ascending: false });
  if (error) throw error;
  const recent = await signPages(data.slice(0, 8)); // thumbnails for the recent list
  return [...recent, ...data.slice(8)];
}

export async function uploadQT(uid, files, note) {
  const date = todayKey();
  const pages = [];
  const toSend = files.slice(0, 2);
  for (let i = 0; i < toSend.length; i++) {
    const blob = await shrinkImage(toSend[i]);
    const path = `${uid}/${date}-p${i + 1}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("qt-pages").upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    pages.push(path);
  }
  const { error } = await supabase.from("qt_uploads").insert({ mentee_id: uid, qt_date: date, pages, note });
  if (error) throw error;
}

export async function fetchReviewQueue() {
  const { data, error } = await supabase
    .from("qt_uploads")
    .select("id, qt_date, status, note, pages, mentee:profiles(name)")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  const pending = data.filter((d) => d.status === "pending").sort((a, b) => a.qt_date.localeCompare(b.qt_date));
  const reviewed = data.filter((d) => d.status === "reviewed").slice(0, 8);
  const signed = await signPages([...pending, ...reviewed]);
  return { pending: signed.slice(0, pending.length), reviewed: signed.slice(pending.length) };
}

export async function reviewUpload(id) {
  const { error } = await supabase
    .from("qt_uploads")
    .update({ status: "reviewed", reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/* ---------------- songs ---------------- */
export async function fetchSongs() {
  const { data, error } = await supabase.from("songs").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function addSong(title, lyrics) {
  const { error } = await supabase.from("songs").insert({ title, lyrics });
  if (error) throw error;
}

/* ---------------- payments ---------------- */
export async function recordPayment({ name, amount }) {
  const { error } = await supabase.from("payments").insert({ giver_name: name, amount });
  if (error) throw error;
}
export async function fetchPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("paid_on", { ascending: false })
    .limit(300);
  if (error) throw error;
  return data;
}

/* ---------------- prayers ---------------- */
export async function addPrayer(uid, type, content) {
  const { error } = await supabase.from("prayers").insert({ author_id: uid, type, content });
  if (error) throw error;
}
export async function fetchPrayers() {
  const { data, error } = await supabase
    .from("prayers")
    .select("*, author:profiles(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}
export async function setPrayerRead(id) {
  const { error } = await supabase.from("prayers").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}
export async function markAllPrayersRead() {
  const { error } = await supabase.from("prayers").update({ is_read: true }).eq("is_read", false);
  if (error) throw error;
}

/* ---------------- prayer letter ---------------- */
export async function fetchLetter() {
  const { data, error } = await supabase.from("prayer_letters").select("*").eq("month", monthKey()).maybeSingle();
  if (error) throw error;
  return data;
}
export async function saveLetter(content) {
  const { error } = await supabase
    .from("prayer_letters")
    .upsert({ month: monthKey(), content, updated_at: new Date().toISOString() }, { onConflict: "month" });
  if (error) throw error;
}

/* ---------------- literature ---------------- */
export async function fetchLiterature(uid) {
  const { data, error } = await supabase
    .from("literature")
    .select("*, author:profiles(name), literature_likes(user_id)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data.map((p) => ({
    ...p,
    likes: p.literature_likes.length,
    liked: p.literature_likes.some((l) => l.user_id === uid),
  }));
}
export async function addLiterature(uid, post) {
  const { error } = await supabase.from("literature").insert({ author_id: uid, ...post });
  if (error) throw error;
}
export async function toggleLike(uid, postId, liked) {
  const q = liked
    ? supabase.from("literature_likes").delete().match({ post_id: postId, user_id: uid })
    : supabase.from("literature_likes").insert({ post_id: postId, user_id: uid });
  const { error } = await q;
  if (error) throw error;
}

/* ---------------- admin counts ---------------- */
export async function fetchCounts() {
  const [{ count: reviews }, { count: prayers }] = await Promise.all([
    supabase.from("qt_uploads").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("prayers").select("id", { count: "exact", head: true }).eq("is_read", false),
  ]);
  return { reviews: reviews ?? 0, prayers: prayers ?? 0 };
}

/* ---------------- realtime ---------------- */
// Admin: ping the moment a prayer point or QT upload arrives
export function onAdminEvents(cb) {
  const ch = supabase
    .channel("admin-feed")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "prayers" }, (p) => cb("prayer", p.new))
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "qt_uploads" }, (p) => cb("upload", p.new))
    .subscribe();
  return () => supabase.removeChannel(ch);
}

// Mentee: ping when the mentor reviews your QT
export function onMyReviews(uid, cb) {
  const ch = supabase
    .channel("my-reviews")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "qt_uploads", filter: `mentee_id=eq.${uid}` },
      (p) => { if (p.new.status === "reviewed") cb(p.new); }
    )
    .subscribe();
  return () => supabase.removeChannel(ch);
}
