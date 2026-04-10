const STORAGE_KEY = "aura_guest_session_id";

export function getGuestSessionId(): number | null {
  const val = localStorage.getItem(STORAGE_KEY);
  if (!val) return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

export function setGuestSessionId(id: number): void {
  localStorage.setItem(STORAGE_KEY, String(id));
}

export function clearGuestSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasUsedGuest(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function isGuestSession(sessionId: number): boolean {
  const guestId = getGuestSessionId();
  return guestId !== null && guestId === sessionId;
}

async function guestFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function guestCreateSession(data: { title: string; inputType: string; inputContent: string }): Promise<{ id: number; status: string; title: string; inputType: string; createdAt: string }> {
  return guestFetch("/api/guest/sessions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function guestGenerate(id: number): Promise<void> {
  await guestFetch(`/api/guest/sessions/${id}/generate`, { method: "POST" });
}

export async function guestGetSession(id: number): Promise<any> {
  return guestFetch(`/api/guest/sessions/${id}`);
}

export async function guestGetNotes(id: number): Promise<any> {
  return guestFetch(`/api/guest/sessions/${id}/notes`);
}

export async function guestGetQuiz(id: number): Promise<any> {
  return guestFetch(`/api/guest/sessions/${id}/quiz`);
}

export async function guestGetFlashcards(id: number): Promise<any[]> {
  return guestFetch(`/api/guest/sessions/${id}/flashcards`);
}

export async function guestSendChat(id: number, message: string): Promise<any> {
  return guestFetch(`/api/guest/sessions/${id}/chat`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function guestGetChatHistory(id: number): Promise<any[]> {
  return guestFetch(`/api/guest/sessions/${id}/chat/history`);
}
