// ╔══════════════════════════════════════════════════════════════════╗
// ║  EDGEFORM CRM — APP SHELL & ROUTER                             ║
// ║  Navigation, view rendering, modal system, toast notifications  ║
// ╚══════════════════════════════════════════════════════════════════╝

const App = (() => {
  let currentView = 'dashboard';
  let sidebarCollapsed = false;

  // ── Toast Notifications ────────────────────────────────────────
  function toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const icons = { success: 'check-circle', error: 'alert-circle', info: 'info', warning: 'alert-triangle' };
    el.innerHTML = `<i data-feather="${icons[type] || 'info'}"></i><span>${message}</span>`;
    container.appendChild(el);
    feather.replace({ width: 16, height: 16 });
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  // ── Modal System ───────────────────────────────────────────────
  function openModal(title, contentHTML, opts = {}) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = contentHTML;
    if (opts.wide) modal.classList.add('modal-wide');
    else modal.classList.remove('modal-wide');
    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
      overlay.classList.add('show');
      modal.classList.add('show');
    });
    if (opts.onOpen) setTimeout(opts.onOpen, 50);
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    overlay.classList.remove('show');
    modal.classList.remove('show');
    setTimeout(() => {
      overlay.classList.add('hidden');
      modal.classList.add('hidden');
    }, 300);
  }

  // ── Confirm Dialog ─────────────────────────────────────────────
  function confirm(message, onConfirm) {
    openModal('Confirm', `
      <p style="margin-bottom:24px;color:var(--text-secondary)">${message}</p>
      <div style="display:flex;gap:12px;justify-content:flex-end">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-danger" id="confirm-yes">Confirm</button>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('confirm-yes').onclick = () => { App.closeModal(); onConfirm(); };
    }, 50);
  }

  // ── Slide Panel (Lead Detail) ──────────────────────────────────
  function openPanel(contentHTML) {
    const panel = document.getElementById('detail-panel');
    const overlay = document.getElementById('panel-overlay');
    document.getElementById('panel-content').innerHTML = contentHTML;
    panel.classList.add('open');
    overlay.classList.add('show');
    feather.replace();
  }

  function closePanel() {
    document.getElementById('detail-panel').classList.remove('open');
    document.getElementById('panel-overlay').classList.remove('show');
  }

  // ── Navigation ─────────────────────────────────────────────────
  const views = {
    dashboard:  { label: 'Dashboard',  icon: 'grid',          render: () => Dashboard.render() },
    leads:      { label: 'Leads',      icon: 'users',         render: () => Leads.render() },
    pipeline:   { label: 'Pipeline',   icon: 'git-branch',    render: () => Pipeline.render() },
    deals:      { label: 'Deals',      icon: 'dollar-sign',   render: () => Deals.render() },
    tasks:      { label: 'Tasks',      icon: 'check-square',  render: () => Tasks.render() },
    email:      { label: 'Email',      icon: 'mail',          render: () => Email.render() },
    reports:    { label: 'Reports',    icon: 'bar-chart-2',   render: () => Reports.render() },
    team:       { label: 'Team',       icon: 'briefcase',     render: () => Team.render(), role: 'manager' },
    settings:   { label: 'Settings',   icon: 'settings',      render: () => Settings.render() },
  };

  function navigate(viewId) {
    if (!views[viewId]) return;
    if (views[viewId].role && !Auth.hasRole(views[viewId].role)) {
      toast('Access denied', 'error');
      return;
    }
    currentView = viewId;
    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === viewId);
    });
    // Render the view
    views[viewId].render();
    // Update URL hash
    window.location.hash = viewId;
    // Close mobile sidebar
    if (window.innerWidth < 1024) toggleSidebar(true);
  }

  function toggleSidebar(forceClose = false) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (forceClose) {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('show');
    } else {
      sidebar.classList.toggle('mobile-open');
      overlay.classList.toggle('show');
    }
  }

  // ── Build Shell ────────────────────────────────────────────────
  function buildShell() {
    const user = Auth.currentUser();
    const app = document.getElementById('app');
    app.innerHTML = `
      <!-- Sidebar Overlay (mobile) -->
      <div id="sidebar-overlay" class="sidebar-overlay" onclick="App.toggleSidebar(true)"></div>

      <!-- Sidebar -->
      <aside id="sidebar" class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <div class="logo-icon">E</div>
            <span class="logo-text">Edgeform</span>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${Object.entries(views).map(([id, v]) => {
            if (v.role && !Auth.hasRole(v.role)) return '';
            return `<a class="nav-item ${id === currentView ? 'active' : ''}" data-view="${id}" onclick="App.navigate('${id}')">
              <i data-feather="${v.icon}"></i>
              <span>${v.label}</span>
            </a>`;
          }).join('')}
        </nav>
        <div class="sidebar-footer">
          <div class="user-badge">
            <div class="user-avatar">${(user?.name || 'U')[0].toUpperCase()}</div>
            <div class="user-info">
              <div class="user-name">${user?.name || 'User'}</div>
              <div class="user-role">${user?.role || 'agent'}</div>
            </div>
            <button class="btn-icon" onclick="Auth.logout()" title="Logout">
              <i data-feather="log-out"></i>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="topbar">
          <button class="btn-icon mobile-menu" onclick="App.toggleSidebar()">
            <i data-feather="menu"></i>
          </button>
          <div class="topbar-search">
            <i data-feather="search"></i>
            <input type="text" placeholder="Search leads, deals, contacts..." id="global-search" oninput="App.globalSearch(this.value)">
          </div>
          <div class="topbar-actions">
            <button class="btn btn-primary btn-sm" onclick="Leads.showCreateModal()">
              <i data-feather="plus"></i> New Lead
            </button>
          </div>
        </header>
        <div id="main-view" class="main-view"></div>
      </main>

      <!-- Detail Panel (slide-out) -->
      <div id="panel-overlay" class="panel-overlay" onclick="App.closePanel()"></div>
      <aside id="detail-panel" class="detail-panel">
        <div class="panel-header">
          <button class="btn-icon" onclick="App.closePanel()"><i data-feather="x"></i></button>
        </div>
        <div id="panel-content" class="panel-body"></div>
      </aside>

      <!-- Modal -->
      <div id="modal-overlay" class="modal-overlay hidden" onclick="App.closeModal()"></div>
      <div id="modal" class="modal hidden">
        <div class="modal-header">
          <h2 id="modal-title"></h2>
          <button class="btn-icon" onclick="App.closeModal()"><i data-feather="x"></i></button>
        </div>
        <div id="modal-body" class="modal-body"></div>
      </div>

      <!-- Toast Container -->
      <div id="toast-container" class="toast-container"></div>
    `;
    feather.replace();
  }

  // ── Global Search ──────────────────────────────────────────────
  let searchTimeout;
  function globalSearch(query) {
    clearTimeout(searchTimeout);
    if (query.length < 2) return;
    searchTimeout = setTimeout(async () => {
      const res = await API.getLeads({ search: query });
      if (res.ok && res.leads?.length) {
        navigate('leads');
        Leads.render(res.leads);
      }
    }, 400);
  }

  // ── Init ───────────────────────────────────────────────────────
  function init() {
    if (!Auth.isLoggedIn()) {
      Auth.showLoginScreen();
      return;
    }
    Auth.hideLoginScreen();
    buildShell();
    const hash = window.location.hash.slice(1);
    navigate(views[hash] ? hash : 'dashboard');
  }

  return {
    init, navigate, toast, openModal, closeModal, confirm,
    openPanel, closePanel, toggleSidebar, globalSearch,
    getCurrentView: () => currentView,
    getMainView: () => document.getElementById('main-view')
  };
})();

// Boot
document.addEventListener('DOMContentLoaded', App.init);
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1);
  if (hash) App.navigate(hash);
});
