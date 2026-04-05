// ╔══════════════════════════════════════════════════════════════════╗
// ║  EDGEFORM CRM — SETTINGS VIEW                                  ║
// ╚══════════════════════════════════════════════════════════════════╝

const Settings = (() => {

  function render() {
    const user = Auth.currentUser();
    const view = App.getMainView();
    view.innerHTML = `
      <div class="view-header"><h1>Settings</h1></div>
      <div class="settings-grid">
        <div class="card">
          <div class="card-header"><h3>Profile</h3></div>
          <div class="card-body">
            <div class="form-grid">
              <div class="form-group"><label>Name</label><input id="set-name" value="${user?.name || ''}"></div>
              <div class="form-group"><label>Email</label><input id="set-email" value="${user?.email || ''}" readonly class="input-readonly"></div>
              <div class="form-group"><label>Role</label><input value="${user?.role || ''}" readonly class="input-readonly"></div>
              <div class="form-actions full-width">
                <button class="btn btn-primary btn-sm" onclick="Settings.saveProfile()">Save Profile</button>
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Email Signature</h3></div>
          <div class="card-body">
            <textarea id="set-signature" rows="6" placeholder="Enter your email signature...">${localStorage.getItem('email_signature') || ''}</textarea>
            <button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="Settings.saveSignature()">Save Signature</button>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Change Password</h3></div>
          <div class="card-body">
            <div class="form-grid">
              <div class="form-group"><label>New Password</label><input type="password" id="set-newpass" minlength="6"></div>
              <div class="form-group"><label>Confirm Password</label><input type="password" id="set-confirmpass"></div>
              <div class="form-actions full-width">
                <button class="btn btn-primary btn-sm" onclick="Settings.changePassword()">Update Password</button>
              </div>
            </div>
          </div>
        </div>
        ${Auth.hasRole('admin') ? `
        <div class="card full-width">
          <div class="card-header"><h3>System Configuration</h3></div>
          <div class="card-body">
            <div class="config-info">
              <div class="config-row"><label>App Version</label><span>${CONFIG.APP_VERSION}</span></div>
              <div class="config-row"><label>Email Domain</label><span>${CONFIG.EMAIL_DOMAIN}</span></div>
              <div class="config-row"><label>Pipeline Stages</label><span>${CONFIG.PIPELINE_STAGES.map(s=>s.label).join(' → ')}</span></div>
              <div class="config-row"><label>Sheet ID</label><span class="mono">${CONFIG.SHEET_ID}</span></div>
            </div>
          </div>
        </div>` : ''}
      </div>
    `;
    feather.replace();
  }

  async function saveProfile() {
    const name = document.getElementById('set-name')?.value;
    if (!name) { App.toast('Name required', 'error'); return; }
    const user = Auth.currentUser();
    const res = await Auth.updateUser(user.userId, { name });
    if (res.ok) {
      const session = Auth.getSession();
      session.name = name;
      Auth.setSession(session);
      App.toast('Profile saved', 'success');
    }
  }

  function saveSignature() {
    const sig = document.getElementById('set-signature')?.value || '';
    localStorage.setItem('email_signature', sig);
    App.toast('Signature saved', 'success');
  }

  async function changePassword() {
    const pass = document.getElementById('set-newpass')?.value;
    const confirm = document.getElementById('set-confirmpass')?.value;
    if (!pass || pass.length < 6) { App.toast('Password must be 6+ characters', 'error'); return; }
    if (pass !== confirm) { App.toast('Passwords do not match', 'error'); return; }
    const user = Auth.currentUser();
    const res = await Auth.updateUser(user.userId, { password: pass });
    if (res.ok) App.toast('Password updated', 'success');
  }

  return { render, saveProfile, saveSignature, changePassword };
})();
