// ╔══════════════════════════════════════════════════════════════════╗
// ║  EDGEFORM CRM — LEADS VIEW                                     ║
// ║  Table, filters, CRUD, detail panel with sketch display         ║
// ╚══════════════════════════════════════════════════════════════════╝

const Leads = (() => {
  let allLeads = [];
  let filteredLeads = [];
  let selectedIds = new Set();
  let currentPage = 1;
  let sortField = 'timestamp';
  let sortDir = 'desc';
  let activeFilters = {};

  async function render(preloaded) {
    const view = App.getMainView();
    view.innerHTML = `
      <div class="view-header">
        <h1>Leads</h1>
        <div class="view-actions">
          <button class="btn btn-ghost btn-sm" onclick="Leads.showImportModal()"><i data-feather="upload"></i> Import</button>
          <button class="btn btn-ghost btn-sm" onclick="Leads.exportCSV()"><i data-feather="download"></i> Export</button>
          <button class="btn btn-primary btn-sm" onclick="Leads.showCreateModal()"><i data-feather="plus"></i> Add Lead</button>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="filters-bar">
        <div class="filter-group">
          <select id="filter-status" class="filter-select" onchange="Leads.applyFilters()">
            <option value="">All Statuses</option>
            ${CONFIG.LEAD_STATUSES.map(s => `<option value="${s.id}">${s.label}</option>`).join('')}
          </select>
          <select id="filter-source" class="filter-select" onchange="Leads.applyFilters()">
            <option value="">All Sources</option>
            ${CONFIG.LEAD_SOURCES.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
          <select id="filter-owner" class="filter-select" onchange="Leads.applyFilters()">
            <option value="">All Owners</option>
          </select>
          <select id="filter-business" class="filter-select" onchange="Leads.applyFilters()">
            <option value="">All Business Types</option>
            ${CONFIG.BUSINESS_TYPES.map(b => `<option value="${b}">${b}</option>`).join('')}
          </select>
        </div>
        <div class="filter-search">
          <i data-feather="search"></i>
          <input type="text" placeholder="Search by name, phone, email..." id="leads-search" oninput="Leads.searchLeads(this.value)">
        </div>
      </div>

      <!-- Bulk Actions -->
      <div class="bulk-bar hidden" id="bulk-bar">
        <span id="bulk-count">0 selected</span>
        <select id="bulk-status" class="filter-select">
          <option value="">Change Status...</option>
          ${CONFIG.LEAD_STATUSES.map(s => `<option value="${s.id}">${s.label}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-ghost" onclick="Leads.bulkUpdateStatus()">Apply</button>
        <button class="btn btn-sm btn-danger" onclick="Leads.bulkDelete()"><i data-feather="trash-2"></i></button>
      </div>

      <!-- Table -->
      <div class="table-container">
        <table class="data-table" id="leads-table">
          <thead>
            <tr>
              <th class="th-check"><input type="checkbox" onchange="Leads.toggleAll(this.checked)"></th>
              <th class="sortable" onclick="Leads.sort('name')">Name ${sortIcon('name')}</th>
              <th class="sortable" onclick="Leads.sort('phone')">Phone ${sortIcon('phone')}</th>
              <th class="sortable" onclick="Leads.sort('businessType')">Business ${sortIcon('businessType')}</th>
              <th class="sortable" onclick="Leads.sort('status')">Status ${sortIcon('status')}</th>
              <th class="sortable" onclick="Leads.sort('source')">Source ${sortIcon('source')}</th>
              <th class="sortable" onclick="Leads.sort('ownerName')">Owner ${sortIcon('ownerName')}</th>
              <th>Sketch</th>
              <th class="sortable" onclick="Leads.sort('timestamp')">Created ${sortIcon('timestamp')}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="leads-tbody">
            <tr><td colspan="10" class="loading-cell"><div class="loading-skeleton"></div></td></tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" id="leads-pagination"></div>
    `;
    feather.replace();

    if (preloaded) {
      allLeads = preloaded;
      filteredLeads = [...allLeads];
      renderTable();
    } else {
      await loadLeads();
    }
  }

  async function loadLeads() {
    const res = await API.getLeads();
    if (res.ok) {
      allLeads = res.leads || [];
      filteredLeads = [...allLeads];
      applyFilters();
    } else {
      App.toast('Failed to load leads', 'error');
    }
  }

  function renderTable() {
    const tbody = document.getElementById('leads-tbody');
    if (!tbody) return;

    // Sort
    filteredLeads.sort((a, b) => {
      const av = (a[sortField] || '').toString().toLowerCase();
      const bv = (b[sortField] || '').toString().toLowerCase();
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    // Paginate
    const start = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const page = filteredLeads.slice(start, start + CONFIG.ITEMS_PER_PAGE);

    if (!page.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="empty-cell">No leads found</td></tr>';
      return;
    }

    tbody.innerHTML = page.map(lead => {
      const status = CONFIG.LEAD_STATUSES.find(s => s.id === lead.status) || { label: lead.status || 'New', color: '#6366f1' };
      const hasSketch = lead.sketchUrl && lead.sketchUrl.startsWith('http');
      return `
        <tr class="lead-row ${selectedIds.has(lead.id) ? 'selected' : ''}" data-id="${lead.id}">
          <td class="td-check">
            <input type="checkbox" ${selectedIds.has(lead.id) ? 'checked' : ''} onchange="Leads.toggleSelect('${lead.id}', this.checked)">
          </td>
          <td class="td-name">
            <a onclick="Leads.openDetail('${lead.id}')">${lead.name || '—'}</a>
          </td>
          <td>${lead.phone || '—'}</td>
          <td>${lead.businessType || '—'}</td>
          <td><span class="status-badge" style="--badge-color:${status.color}">${status.label}</span></td>
          <td>${lead.source || '—'}</td>
          <td>${lead.ownerName || 'Unassigned'}</td>
          <td class="td-sketch">
            ${hasSketch ? `<button class="btn-icon sketch-btn" onclick="Leads.viewSketch('${lead.sketchUrl}', '${(lead.name||'').replace(/'/g,'')}')"><i data-feather="image"></i></button>` : '<span class="text-muted">—</span>'}
          </td>
          <td>${Utils.formatDate(lead.timestamp)}</td>
          <td class="td-actions">
            <button class="btn-icon" onclick="Leads.openDetail('${lead.id}')" title="View"><i data-feather="eye"></i></button>
            <button class="btn-icon" onclick="Leads.showEditModal('${lead.id}')" title="Edit"><i data-feather="edit-2"></i></button>
            <button class="btn-icon text-danger" onclick="Leads.deleteLead('${lead.id}')" title="Delete"><i data-feather="trash-2"></i></button>
          </td>
        </tr>
      `;
    }).join('');

    feather.replace();
    renderPagination();
  }

  function renderPagination() {
    const el = document.getElementById('leads-pagination');
    if (!el) return;
    const total = Math.ceil(filteredLeads.length / CONFIG.ITEMS_PER_PAGE);
    if (total <= 1) { el.innerHTML = ''; return; }
    let html = '';
    for (let i = 1; i <= total; i++) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="Leads.goToPage(${i})">${i}</button>`;
    }
    el.innerHTML = `<span class="page-info">${filteredLeads.length} leads</span>${html}`;
  }

  function goToPage(page) { currentPage = page; renderTable(); }

  function sort(field) {
    if (sortField === field) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    else { sortField = field; sortDir = 'asc'; }
    renderTable();
  }

  function sortIcon(field) {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? '↑' : '↓';
  }

  // ── Filters ──────────────────────────────────────────────────
  function applyFilters() {
    const status = document.getElementById('filter-status')?.value;
    const source = document.getElementById('filter-source')?.value;
    const owner = document.getElementById('filter-owner')?.value;
    const business = document.getElementById('filter-business')?.value;
    const search = document.getElementById('leads-search')?.value?.toLowerCase();

    filteredLeads = allLeads.filter(l => {
      if (status && l.status !== status) return false;
      if (source && l.source !== source) return false;
      if (owner && l.ownerId !== owner) return false;
      if (business && l.businessType !== business) return false;
      if (search) {
        const hay = `${l.name} ${l.phone} ${l.email} ${l.businessType} ${l.description}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
    currentPage = 1;
    renderTable();
  }

  let searchDebounce;
  function searchLeads(q) {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => applyFilters(), 300);
  }

  // ── Selection / Bulk ────────────────────────────────────────
  function toggleSelect(id, checked) {
    checked ? selectedIds.add(id) : selectedIds.delete(id);
    updateBulkBar();
    renderTable();
  }

  function toggleAll(checked) {
    const start = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const page = filteredLeads.slice(start, start + CONFIG.ITEMS_PER_PAGE);
    page.forEach(l => checked ? selectedIds.add(l.id) : selectedIds.delete(l.id));
    updateBulkBar();
    renderTable();
  }

  function updateBulkBar() {
    const bar = document.getElementById('bulk-bar');
    const count = document.getElementById('bulk-count');
    if (selectedIds.size > 0) {
      bar?.classList.remove('hidden');
      if (count) count.textContent = `${selectedIds.size} selected`;
    } else {
      bar?.classList.add('hidden');
    }
  }

  async function bulkUpdateStatus() {
    const status = document.getElementById('bulk-status')?.value;
    if (!status || !selectedIds.size) return;
    const res = await API.bulkUpdateLeads([...selectedIds], { status });
    if (res.ok) {
      App.toast(`Updated ${selectedIds.size} leads`, 'success');
      selectedIds.clear();
      updateBulkBar();
      await loadLeads();
    }
  }

  async function bulkDelete() {
    App.confirm(`Delete ${selectedIds.size} leads? This cannot be undone.`, async () => {
      for (const id of selectedIds) { await API.deleteLead(id); }
      App.toast(`Deleted ${selectedIds.size} leads`, 'success');
      selectedIds.clear();
      updateBulkBar();
      await loadLeads();
    });
  }

  // ── CRUD Modals ──────────────────────────────────────────────
  function showCreateModal() {
    App.openModal('New Lead', leadFormHTML(), { wide: true, onOpen: () => feather.replace() });
  }

  async function showEditModal(id) {
    const lead = allLeads.find(l => l.id === id);
    if (!lead) return;
    App.openModal('Edit Lead', leadFormHTML(lead), { wide: true, onOpen: () => feather.replace() });
  }

  function leadFormHTML(lead = {}) {
    return `
      <form id="lead-form" class="form-grid" onsubmit="return false">
        <div class="form-group">
          <label>Full Name *</label>
          <input type="text" name="name" value="${lead.name || ''}" required>
        </div>
        <div class="form-group">
          <label>Phone *</label>
          <input type="tel" name="phone" value="${lead.phone || ''}" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" value="${lead.email || ''}">
        </div>
        <div class="form-group">
          <label>Business Type</label>
          <select name="businessType">
            <option value="">Select...</option>
            ${CONFIG.BUSINESS_TYPES.map(b => `<option value="${b}" ${lead.businessType === b ? 'selected' : ''}>${b}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Has Website?</label>
          <select name="hasWebsite">
            <option value="" ${!lead.hasWebsite ? 'selected' : ''}>Unknown</option>
            <option value="yes" ${lead.hasWebsite === 'yes' ? 'selected' : ''}>Yes</option>
            <option value="no" ${lead.hasWebsite === 'no' ? 'selected' : ''}>No</option>
          </select>
        </div>
        <div class="form-group">
          <label>Source</label>
          <select name="source">
            <option value="">Select...</option>
            ${CONFIG.LEAD_SOURCES.map(s => `<option value="${s}" ${lead.source === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select name="status">
            ${CONFIG.LEAD_STATUSES.map(s => `<option value="${s.id}" ${(lead.status || 'new') === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Deal Value ($)</label>
          <input type="number" name="dealValue" value="${lead.dealValue || ''}" min="0" step="100">
        </div>
        <div class="form-group full-width">
          <label>Description / Notes</label>
          <textarea name="description" rows="3">${lead.description || ''}</textarea>
        </div>
        <div class="form-actions full-width">
          <button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-primary" type="button" onclick="Leads.saveLead('${lead.id || ''}')">
            ${lead.id ? 'Update Lead' : 'Create Lead'}
          </button>
        </div>
      </form>
    `;
  }

  async function saveLead(existingId) {
    const form = document.getElementById('lead-form');
    if (!form) return;
    const data = Object.fromEntries(new FormData(form));
    if (!data.name || !data.phone) { App.toast('Name and phone are required', 'error'); return; }

    let res;
    if (existingId) {
      res = await API.updateLead(existingId, data);
    } else {
      res = await API.createLead(data);
    }
    if (res.ok) {
      App.toast(existingId ? 'Lead updated' : 'Lead created', 'success');
      App.closeModal();
      await loadLeads();
    } else {
      App.toast(res.error || 'Failed to save', 'error');
    }
  }

  async function deleteLead(id) {
    App.confirm('Delete this lead? This cannot be undone.', async () => {
      const res = await API.deleteLead(id);
      if (res.ok) {
        App.toast('Lead deleted', 'success');
        await loadLeads();
      }
    });
  }

  // ── Detail Panel ─────────────────────────────────────────────
  async function openDetail(id) {
    const lead = allLeads.find(l => l.id === id);
    if (!lead) return;

    const status = CONFIG.LEAD_STATUSES.find(s => s.id === lead.status) || { label: lead.status || 'New', color: '#6366f1' };
    const hasSketch = lead.sketchUrl && lead.sketchUrl.startsWith('http');

    App.openPanel(`
      <div class="lead-detail">
        <!-- Header -->
        <div class="detail-header-card">
          <div class="detail-avatar">${(lead.name || 'L')[0].toUpperCase()}</div>
          <div class="detail-info">
            <h2>${lead.name || 'Unknown'}</h2>
            <p>${lead.phone || ''} ${lead.email ? '· ' + lead.email : ''}</p>
            <span class="status-badge" style="--badge-color:${status.color}">${status.label}</span>
          </div>
          <div class="detail-actions">
            <button class="btn btn-sm btn-ghost" onclick="Leads.showEditModal('${id}')"><i data-feather="edit-2"></i> Edit</button>
            <button class="btn btn-sm btn-primary" onclick="Email.composeForLead('${id}')"><i data-feather="mail"></i> Email</button>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="detail-section">
          <h4>Details</h4>
          <div class="detail-grid">
            <div class="detail-field"><label>Business Type</label><span>${lead.businessType || '—'}</span></div>
            <div class="detail-field"><label>Has Website</label><span>${lead.hasWebsite || '—'}</span></div>
            <div class="detail-field"><label>Source</label><span>${lead.source || '—'}</span></div>
            <div class="detail-field"><label>Owner</label><span>${lead.ownerName || 'Unassigned'}</span></div>
            <div class="detail-field"><label>Deal Value</label><span>${lead.dealValue ? '$' + Number(lead.dealValue).toLocaleString() : '—'}</span></div>
            <div class="detail-field"><label>Created</label><span>${Utils.formatDate(lead.timestamp)}</span></div>
          </div>
        </div>

        <!-- Description -->
        ${lead.description ? `
        <div class="detail-section">
          <h4>Description</h4>
          <p class="detail-desc">${lead.description}</p>
        </div>` : ''}

        <!-- Sketch Preview -->
        ${hasSketch ? `
        <div class="detail-section">
          <h4>Client Sketch</h4>
          <div class="sketch-preview">
            <img src="${convertDriveUrl(lead.sketchUrl)}" alt="Client sketch" onclick="Leads.viewSketch('${lead.sketchUrl}', '${(lead.name||'').replace(/'/g,'')}')">
          </div>
        </div>` : ''}

        <!-- Tabs: Notes, Activity, Tasks -->
        <div class="detail-tabs">
          <button class="tab-btn active" onclick="Leads.switchDetailTab(this, 'notes', '${id}')">Notes</button>
          <button class="tab-btn" onclick="Leads.switchDetailTab(this, 'activity', '${id}')">Activity</button>
          <button class="tab-btn" onclick="Leads.switchDetailTab(this, 'tasks', '${id}')">Tasks</button>
        </div>
        <div id="detail-tab-content">
          <div class="loading-skeleton"></div>
        </div>

        <!-- Quick Note -->
        <div class="quick-note">
          <textarea id="quick-note-input" placeholder="Add a note..." rows="2"></textarea>
          <button class="btn btn-primary btn-sm" onclick="Leads.addQuickNote('${id}')">Add Note</button>
        </div>

        <!-- Quick Task -->
        <div class="quick-task">
          <input type="text" id="quick-task-input" placeholder="Add a task...">
          <input type="datetime-local" id="quick-task-due">
          <button class="btn btn-primary btn-sm" onclick="Leads.addQuickTask('${id}')">Add Task</button>
        </div>
      </div>
    `);
    feather.replace();

    // Load notes by default
    loadDetailNotes(id);
  }

  function switchDetailTab(btn, tab, leadId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (tab === 'notes') loadDetailNotes(leadId);
    else if (tab === 'activity') loadDetailActivities(leadId);
    else if (tab === 'tasks') loadDetailTasks(leadId);
  }

  async function loadDetailNotes(leadId) {
    const el = document.getElementById('detail-tab-content');
    if (!el) return;
    const res = await API.getNotes(leadId);
    const notes = res.ok ? (res.notes || []) : [];
    if (!notes.length) { el.innerHTML = '<div class="empty-state">No notes yet</div>'; return; }
    el.innerHTML = notes.map(n => `
      <div class="note-item">
        <div class="note-header">
          <strong>${n.authorName || 'Unknown'}</strong>
          <span>${Utils.timeAgo(n.timestamp)}</span>
          <button class="btn-icon text-danger" onclick="Leads.deleteNote('${n.id}', '${leadId}')"><i data-feather="x"></i></button>
        </div>
        <div class="note-body">${n.content}</div>
      </div>
    `).join('');
    feather.replace();
  }

  async function loadDetailActivities(leadId) {
    const el = document.getElementById('detail-tab-content');
    if (!el) return;
    const res = await API.getActivities(leadId);
    const acts = res.ok ? (res.activities || []) : [];
    if (!acts.length) { el.innerHTML = '<div class="empty-state">No activity yet</div>'; return; }
    el.innerHTML = `<div class="timeline">${acts.map(a => `
      <div class="timeline-item">
        <div class="timeline-dot activity-${a.type}"></div>
        <div class="timeline-content">
          <strong>${a.userName || 'System'}</strong> ${a.description}
          <div class="timeline-time">${Utils.timeAgo(a.timestamp)}</div>
        </div>
      </div>
    `).join('')}</div>`;
  }

  async function loadDetailTasks(leadId) {
    const el = document.getElementById('detail-tab-content');
    if (!el) return;
    const res = await API.getTasks({ leadId });
    const tasks = res.ok ? (res.tasks || []) : [];
    if (!tasks.length) { el.innerHTML = '<div class="empty-state">No tasks yet</div>'; return; }
    el.innerHTML = tasks.map(t => `
      <div class="task-item ${t.completed ? 'task-done' : ''} ${t.overdue ? 'task-overdue' : ''}">
        <button class="task-check" onclick="Tasks.complete('${t.id}')">
          <i data-feather="${t.completed ? 'check-square' : 'square'}"></i>
        </button>
        <div class="task-content">
          <div class="task-title">${t.title}</div>
          <div class="task-meta">${Utils.formatDate(t.dueDate)}</div>
        </div>
      </div>
    `).join('');
    feather.replace();
  }

  async function addQuickNote(leadId) {
    const input = document.getElementById('quick-note-input');
    if (!input?.value.trim()) return;
    const res = await API.addNote(leadId, input.value.trim());
    if (res.ok) {
      input.value = '';
      App.toast('Note added', 'success');
      loadDetailNotes(leadId);
    }
  }

  async function addQuickTask(leadId) {
    const input = document.getElementById('quick-task-input');
    const due = document.getElementById('quick-task-due');
    if (!input?.value.trim()) return;
    const res = await API.createTask({
      title: input.value.trim(),
      leadId,
      dueDate: due?.value || null
    });
    if (res.ok) {
      input.value = '';
      if (due) due.value = '';
      App.toast('Task created', 'success');
      loadDetailTasks(leadId);
    }
  }

  async function deleteNote(noteId, leadId) {
    const res = await API.deleteNote(noteId);
    if (res.ok) loadDetailNotes(leadId);
  }

  // ── Sketch Viewer ────────────────────────────────────────────
  function viewSketch(url, name) {
    const imgUrl = convertDriveUrl(url);
    App.openModal(`Sketch — ${name}`, `
      <div class="sketch-modal">
        <img src="${imgUrl}" alt="Client sketch" class="sketch-full">
        <a href="${url}" target="_blank" class="btn btn-ghost btn-sm" style="margin-top:12px">
          <i data-feather="external-link"></i> Open in Drive
        </a>
      </div>
    `, { wide: true });
  }

  function convertDriveUrl(url) {
    // Convert Google Drive sharing URL to direct image URL
    if (!url) return '';
    const match = url.match(/\/d\/([^/]+)/);
    if (match) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
    return url;
  }

  // ── Import ───────────────────────────────────────────────────
  function showImportModal() {
    App.openModal('Import Leads', `
      <div class="import-modal">
        <p>Upload a CSV file with columns: Name, Phone, Email, Business Type, Source</p>
        <input type="file" id="import-file" accept=".csv" class="file-input">
        <div class="form-actions" style="margin-top:16px">
          <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="Leads.processImport()">Import</button>
        </div>
      </div>
    `);
  }

  async function processImport() {
    const file = document.getElementById('import-file')?.files[0];
    if (!file) return;
    const text = await file.text();
    const res = await API.importLeads(text);
    if (res.ok) {
      App.toast(`Imported ${res.count || 0} leads`, 'success');
      App.closeModal();
      await loadLeads();
    } else {
      App.toast(res.error || 'Import failed', 'error');
    }
  }

  async function exportCSV() {
    const res = await API.exportLeads();
    if (res.ok && res.csv) {
      const blob = new Blob([res.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `leads_export_${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      App.toast('Export downloaded', 'success');
    }
  }

  return {
    render, loadLeads, applyFilters, searchLeads, sort, goToPage,
    toggleSelect, toggleAll, bulkUpdateStatus, bulkDelete,
    showCreateModal, showEditModal, saveLead, deleteLead,
    openDetail, switchDetailTab, addQuickNote, addQuickTask, deleteNote,
    viewSketch, showImportModal, processImport, exportCSV
  };
})();
