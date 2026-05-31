export interface Message {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "seven-days-later-conversation";

export function getMessages(): Message[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function appendUser(content: string): void {
  const messages = getMessages();
  messages.push({ role: "user", content });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export function appendAssistant(content: string): void {
  const messages = getMessages();
  messages.push({ role: "assistant", content });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export function clearMessages(): void {
  localStorage.removeItem(STORAGE_KEY);
}
