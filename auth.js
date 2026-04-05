// ╔══════════════════════════════════════════════════════════════════╗
// ║  EDGEFORM CRM — AUTH MODULE                                     ║
// ║  Account creation, login, session management, RBAC              ║
// ╚══════════════════════════════════════════════════════════════════╝

const Auth = (() => {
  // ── Session Management ─────────────────────────────────────────
  function getSession() {
    try {
      const raw = localStorage.getItem(CONFIG.SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      const now = Date.now();
      const maxAge = CONFIG.SESSION_DURATION_HOURS * 60 * 60 * 1000;
      if (now - session.loginAt > maxAge) {
        localStorage.removeItem(CONFIG.SESSION_KEY);
        return null;
      }
      return session;
    } catch { return null; }
  }

  function setSession(user) {
    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      loginAt: Date.now()
    };
    localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    localStorage.removeItem(CONFIG.SESSION_KEY);
  }

  function isLoggedIn() {
    return getSession() !== null;
  }

  function currentUser() {
    return getSession();
  }

  function hasRole(requiredRole) {
    const session = getSession();
    if (!session) return false;
    const hierarchy = { admin: 3, manager: 2, agent: 1 };
    return (hierarchy[session.role] || 0) >= (hierarchy[requiredRole] || 0);
  }

  // ── API Calls ──────────────────────────────────────────────────
  async function login(email, password) {
    const res = await fetch(CONFIG.GAS_AUTH_API, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "login", email, password })
    });
    const data = await res.json();
    if (data.ok && data.user) {
      setSession(data.user);
    }
    return data;
  }

  async function register(name, email, password, role = "agent") {
    const res = await fetch(CONFIG.GAS_AUTH_API, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "register", name, email, password, role })
    });
    return await res.json();
  }

  async function getAllUsers() {
    const res = await fetch(CONFIG.GAS_AUTH_API, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "list_users" })
    });
    return await res.json();
  }

  async function updateUser(userId, updates) {
    const res = await fetch(CONFIG.GAS_AUTH_API, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "update_user", userId, ...updates })
    });
    return await res.json();
  }

  async function deleteUser(userId) {
    const res = await fetch(CONFIG.GAS_AUTH_API, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "delete_user", userId })
    });
    return await res.json();
  }

  function logout() {
    clearSession();
    window.location.reload();
  }

  // ── Guard ──────────────────────────────────────────────────────
  function requireAuth() {
    if (!isLoggedIn()) {
      showLoginScreen();
      return false;
    }
    return true;
  }

  function showLoginScreen() {
    document.getElementById('app').innerHTML = '';
    document.getElementById('auth-screen').classList.remove('hidden');
  }

  function hideLoginScreen() {
    document.getElementById('auth-screen').classList.add('hidden');
  }

  return {
    getSession, setSession, clearSession,
    isLoggedIn, currentUser, hasRole,
    login, register, logout, getAllUsers, updateUser, deleteUser,
    requireAuth, showLoginScreen, hideLoginScreen
  };
})();
