// ╔══════════════════════════════════════════════════════════════════╗
// ║  EDGEFORM CRM — EMAIL VIEW                                     ║
// ║  Compose & send emails via Resend / Cloudflare Worker           ║
// ╚══════════════════════════════════════════════════════════════════╝

const Email = (() => {
  let sentHistory = [];

  function render() {
    const user = Auth.currentUser();
    const fromAddr = (user?.email?.split('@')[0] || user?.name?.toLowerCase().replace(/\s/g,'.') || 'info') + '@' + CONFIG.EMAIL_DOMAIN;
    const view = App.getMainView();
    view.innerHTML = `
      <div class="view-header">
        <h1>Email</h1>
      </div>
      <div class="email-layout">
        <div class="email-compose card">
          <div class="card-header"><h3>Compose Email</h3></div>
          <div class="card-body">
            <div class="form-group">
              <label>From</label>
              <input type="text" id="email-from" value="${fromAddr}" class="input-readonly" readonly>
            </div>
            <div class="form-group">
              <label>To *</label>
              <input type="email" id="email-to" placeholder="recipient@example.com" required>
            </div>
            <div class="form-group">
              <label>Subject *</label>
              <input type="text" id="email-subject" placeholder="Subject line..." required>
            </div>
            <div class="form-group">
              <label>Body</label>
              <div class="email-toolbar">
                <button class="btn-icon" onclick="Email.format('bold')" title="Bold"><b>B</b></button>
                <button class="btn-icon" onclick="Email.format('italic')" title="Italic"><i>I</i></button>
                <button class="btn-icon" onclick="Email.format('insertUnorderedList')" title="List">☰</button>
                <button class="btn-icon" onclick="Email.insertTemplate()" title="Template"><i data-feather="file-text"></i></button>
              </div>
              <div id="email-body" class="email-editor" contenteditable="true" placeholder="Write your email..."></div>
            </div>
            <div class="form-actions">
              <button class="btn btn-ghost" onclick="Email.clear()">Clear</button>
              <button class="btn btn-primary" onclick="Email.send()" id="send-btn">
                <i data-feather="send"></i> Send Email
              </button>
            </div>
          </div>
        </div>
        <div class="email-templates card">
          <div class="card-header"><h3>Templates</h3></div>
          <div class="card-body">
            ${renderTemplates()}
          </div>
        </div>
      </div>
    `;
    feather.replace();
  }

  function renderTemplates() {
    const templates = [
      { name: 'Initial Outreach', subject: 'Website Opportunity for {{business}}', body: 'Hi {{name}},\n\nI noticed that {{business}} doesn\'t currently have a website, and I wanted to reach out because we help local businesses like yours establish a professional online presence.\n\nWould you be open to a quick 10-minute call this week to discuss how a website could help bring in more customers?\n\nBest regards' },
      { name: 'Follow Up', subject: 'Following up — {{business}}', body: 'Hi {{name}},\n\nI wanted to follow up on my previous message about building a website for {{business}}. We\'ve helped several local businesses increase their customer base by 30-50% with a professional web presence.\n\nWould you have 10 minutes to chat this week?\n\nBest regards' },
      { name: 'Proposal Sent', subject: 'Your Website Proposal — {{business}}', body: 'Hi {{name}},\n\nThank you for taking the time to discuss your needs. I\'ve put together a proposal based on our conversation.\n\nPlease take a look and let me know if you have any questions. I\'m happy to hop on a call to walk through it.\n\nBest regards' },
      { name: 'Thank You', subject: 'Welcome aboard, {{name}}!', body: 'Hi {{name}},\n\nThank you for choosing Edgeform Media for your website project! We\'re excited to bring your vision to life.\n\nHere\'s what happens next:\n- We\'ll schedule a discovery call to discuss your requirements\n- Our team will create initial design concepts\n- You\'ll review and provide feedback\n\nLooking forward to working with you!\n\nBest regards' }
    ];

    return templates.map(t => `
      <div class="template-card" onclick="Email.useTemplate(${JSON.stringify(t).replace(/"/g,'&quot;')})">
        <div class="template-name">${t.name}</div>
        <div class="template-preview">${t.body.substring(0, 60)}...</div>
      </div>
    `).join('');
  }

  function useTemplate(template) {
    document.getElementById('email-subject').value = template.subject;
    document.getElementById('email-body').innerHTML = template.body.replace(/\n/g, '<br>');
  }

  function composeForLead(leadId) {
    // Called from lead detail panel
    App.navigate('email');
    // Could prefill with lead data if we had it cached
  }

  function format(cmd) {
    document.execCommand(cmd, false, null);
    document.getElementById('email-body').focus();
  }

  function insertTemplate() {
    // Show template picker
  }

  async function send() {
    const to = document.getElementById('email-to')?.value;
    const subject = document.getElementById('email-subject')?.value;
    const body = document.getElementById('email-body')?.innerHTML;

    if (!to || !subject) { App.toast('To and Subject are required', 'error'); return; }

    const btn = document.getElementById('send-btn');
    btn.disabled = true;
    btn.innerHTML = '<i data-feather="loader"></i> Sending...';
    feather.replace();

    try {
      const res = await API.sendEmail(to, subject, body);
      if (res.ok) {
        App.toast('Email sent successfully', 'success');
        clear();
      } else {
        App.toast(res.error || 'Failed to send', 'error');
      }
    } catch (err) {
      App.toast('Email send failed', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i data-feather="send"></i> Send Email';
      feather.replace();
    }
  }

  function clear() {
    const to = document.getElementById('email-to');
    const subject = document.getElementById('email-subject');
    const body = document.getElementById('email-body');
    if (to) to.value = '';
    if (subject) subject.value = '';
    if (body) body.innerHTML = '';
  }

  return { render, send, clear, format, useTemplate, composeForLead, insertTemplate };
})();
