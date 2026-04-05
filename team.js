// ╔══════════════════════════════════════════════════════════════════╗
// ║  EDGEFORM CRM — TEAM VIEW                                      ║
// ║  User management, roles, admin controls                        ║
// ╚══════════════════════════════════════════════════════════════════╝

const Team = (() => {
  let users = [];

  async function render() {
    const view = App.getMainView();
    view.innerHTML = `
      <div class="view-header">
        <h1>Team Management</h1>
        <div class="view-actions">
          ${Auth.hasRole('admin') ? '<button class="btn btn-primary btn-sm" onclick="Team.showInviteModal()"><i data-feather="user-plus"></i> Add User</button>' : ''}
        </div>
      </div>
      <div class="team-grid" id="team-grid"><div class="loading-skeleton"></div></div>
    `;
    feather.replace();
    await loadUsers();
  }

  async function loadUsers() {
    const res = await Auth.getAllUsers();
    if (res.ok) { users = res.users || []; renderUsers(); }
  }

  function renderUsers() {
    const el = document.getElementById('team-grid');
    if (!el) return;
    if (!users.length) { el.innerHTML = '<div class="empty-state">No team members yet</div>'; return; }
    el.innerHTML = users.map(u => `
      <div class="team-card">
        <div class="team-avatar" style="background:${roleColor(u.role)}">${(u.name||'?')[0].toUpperCase()}</div>
        <div class="team-info">
          <div class="team-name">${u.name}</div>
          <div class="team-email">${u.email}</div>
          <span class="status-badge" style="--badge-color:${roleColor(u.role)}">${u.role}</span>
        </div>
        ${Auth.hasRole('admin') ? `
        <div class="team-actions">
          <button class="btn-icon" onclick="Team.editUser('${u.id}')" title="Edit"><i data-feather="edit-2"></i></button>
          <button class="btn-icon text-danger" onclick="Team.removeUser('${u.id}')" title="Remove"><i data-feather="trash-2"></i></button>
        </div>` : ''}
      </div>
    `).join('');
    feather.replace();
  }

  function roleColor(role) {
    return { admin: '#ef4444', manager: '#f59e0b', agent: '#3b82f6' }[role] || '#6366f1';
  }

  function showInviteModal() {
    App.openModal('Add Team Member', `
      <form id="invite-form" class="form-grid" onsubmit="return false">
        <div class="form-group"><label>Full Name *</label><input name="name" required></div>
        <div class="form-group"><label>Email *</label><input type="email" name="email" required></div>
        <div class="form-group"><label>Password *</label><input type="password" name="password" required minlength="6"></div>
        <div class="form-group"><label>Role</label>
          <select name="role">
            <option value="agent">Agent</option>
            <option value="manager">Manager</option>
            ${Auth.hasRole('admin') ? '<option value="admin">Admin</option>' : ''}
          </select>
        </div>
        <div class="form-actions full-width">
          <button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-primary" type="button" onclick="Team.createUser()">Create Account</button>
        </div>
      </form>
    `);
  }

  async function createUser() {
    const data = Object.fromEntries(new FormData(document.getElementById('invite-form')));
    if (!data.name || !data.email || !data.password) { App.toast('All fields required', 'error'); return; }
    const res = await Auth.register(data.name, data.email, data.password, data.role);
    if (res.ok) { App.toast('User created', 'success'); App.closeModal(); loadUsers(); }
    else App.toast(res.error || 'Failed', 'error');
  }

  function editUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    App.openModal('Edit User', `
      <form id="edit-user-form" class="form-grid" onsubmit="return false">
        <div class="form-group"><label>Name</label><input name="name" value="${user.name}"></div>
        <div class="form-group"><label>Email</label><input name="email" value="${user.email}" readonly class="input-readonly"></div>
        <div class="form-group"><label>Role</label>
          <select name="role">
            <option value="agent" ${user.role==='agent'?'selected':''}>Agent</option>
            <option value="manager" ${user.role==='manager'?'selected':''}>Manager</option>
            <option value="admin" ${user.role==='admin'?'selected':''}>Admin</option>
          </select>
        </div>
        <div class="form-group"><label>New Password (leave blank to keep)</label><input type="password" name="password"></div>
        <div class="form-actions full-width">
          <button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-primary" type="button" onclick="Team.saveUser('${id}')">Save</button>
        </div>
      </form>
    `);
  }

  async function saveUser(id) {
    const data = Object.fromEntries(new FormData(document.getElementById('edit-user-form')));
    if (!data.password) delete data.password;
    const res = await Auth.updateUser(id, data);
    if (res.ok) { App.toast('Updated', 'success'); App.closeModal(); loadUsers(); }
  }

  function removeUser(id) {
    const user = users.find(u => u.id === id);
    App.confirm(`Remove ${user?.name || 'this user'}?`, async () => {
      const res = await Auth.deleteUser(id);
      if (res.ok) { App.toast('User removed', 'success'); loadUsers(); }
    });
  }

  return { render, showInviteModal, createUser, editUser, saveUser, removeUser };
})();
