// Supabase data access: auth, preferences, tier, anchors, strings (throughlines).
// UI modules never touch `sb` directly.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const onAuthChange = fn => sb.auth.onAuthStateChange((_event, session) => fn(session ? session.user : null));

export function signIn(email, password) {
  return sb.auth.signInWithPassword({ email, password });
}

export function signUp(email, password) {
  return sb.auth.signUp({ email, password });
}

export const signOut = () => sb.auth.signOut();

export function displayName(user) {
  const meta = user.user_metadata || {};
  return meta.full_name || meta.name || user.email.split('@')[0];
}

export const avatarUrl = user => (user.user_metadata || {}).avatar_url || (user.user_metadata || {}).picture || '';

export async function fetchTier(userId) {
  const { data } = await sb.from('users').select('tier').eq('id', userId).single();
  return (data && data.tier) || 'free';
}

// ---- preferences ----
const THEMES = ['night', 'day', 'irl'];

export async function loadPrefs(userId) {
  const { data } = await sb.from('user_preferences').select('theme,home_cities').eq('user_id', userId).maybeSingle();
  if (!data) return {};
  return {
    theme: THEMES.indexOf(data.theme) >= 0 ? THEMES.indexOf(data.theme) : undefined,
    cities: Array.isArray(data.home_cities) && data.home_cities.length ? data.home_cities : undefined
  };
}

export function saveTheme(userId, theme) {
  return sb.from('user_preferences').upsert({ user_id: userId, theme: THEMES[theme] || 'night' }, { onConflict: 'user_id' });
}

export function saveCities(userId, cities) {
  return sb.from('user_preferences').upsert({ user_id: userId, home_cities: cities }, { onConflict: 'user_id' });
}

// ---- personal anchor (RLS: writes require Pro/Team) ----
export async function loadAnchor(userId) {
  const { data } = await sb.from('user_anchors').select('*').eq('user_id', userId).maybeSingle();
  if (!data) return null;
  return {
    title: data.anchor_title || data.birth_place,
    place: data.birth_place,
    lat: data.birth_lat,
    lng: data.birth_lng,
    date: data.birth_date || null,
    time: data.anchor_time || null
  };
}

export async function saveAnchor(userId, a) {
  const { error } = await sb.from('user_anchors').upsert({
    user_id: userId,
    anchor_title: a.title,
    birth_place: a.place,
    birth_lat: a.lat,
    birth_lng: a.lng,
    birth_date: a.date || null,
    anchor_time: a.time || null
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

export const deleteAnchor = userId => sb.from('user_anchors').delete().eq('user_id', userId);

// ---- strings / throughlines (RLS: insert requires Pro/Team, public read by slug) ----
function slug() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), b => chars[b % chars.length]).join('');
}

export async function saveThroughline(userId, title, events) {
  const row = {
    user_id: userId,
    slug: slug(),
    title,
    event_count: events.length,
    events: events.map(e => ({ id: e.id, type: e.type, title: e.title, location: e.location || '', lat: e.lat || 0, lng: e.lng || 0 })),
    is_public: true
  };
  const { error } = await sb.from('throughlines').insert(row);
  if (error) throw error;
  return row.slug;
}

export async function listThroughlines(userId) {
  const { data } = await sb.from('throughlines')
    .select('id,title,event_count,slug,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  return data || [];
}

export async function loadThroughline(slugValue) {
  const { data, error } = await sb.from('throughlines').select('*').eq('slug', slugValue).eq('is_public', true).single();
  if (error) throw error;
  return data;
}

export const stringLink = slugValue => `${location.origin}/?s=${slugValue}`;
