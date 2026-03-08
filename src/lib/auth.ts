"use client";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const USERS_KEY = "mealswipe-users";
const SESSION_KEY = "mealswipe-session";

function getUsers(): Array<User & { passwordHash: string }> {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: Array<User & { passwordHash: string }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Simple hash (not cryptographically secure — demo only)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (Math.imul(31, hash) + password.charCodeAt(i)) | 0;
  }
  return hash.toString(16);
}

export function register(name: string, email: string, password: string): User {
  const users = getUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("E-Mail-Adresse bereits registriert");
  }
  const user: User & { passwordHash: string } = {
    id: `user-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  saveUsers([...users, user]);
  const session: User = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function login(email: string, password: string): User {
  const users = getUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === hashPassword(password)
  );
  if (!user) throw new Error("E-Mail oder Passwort falsch");
  const session: User = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): User | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
