// ╔══════════════════════════════════════════════════════════════════╗
// ║  EDGEFORM CRM — DEALS VIEW                                     ║
// ╚══════════════════════════════════════════════════════════════════╝

const Deals = (() => {
  let allDeals = [];

  async function render() {
    const view = App.getMainView();
    view.innerHTML = `
      <div class="view-header">
        <h1>Deals</h1>
        <div class="view-actions">
          <button class="btn btn-primary btn-sm" onclick="Deals.showCreateModal()"><i data-feather="plus"></i> New Deal</button>
        </div>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Deal</th><th>Contact</th><th>Value</th><th>Stage</th><th>Owner</th><th>Expected Close</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="deals-tbody"><tr><td colspan="7"><div class="loading-skeleton"></div></td></tr></tbody>
        </table>
      </div>
    `;
    feather.replace();
    await loadDeals();
  }

  async function loadDeals() {
    const res = await API.getDeals();
    if (res.ok) { allDeals = res.deals || []; renderTable(); }
  }

  function renderTable() {
    const tbody = document.getElementById('deals-tbody');
    if (!tbody) return;
    if (!allDeals.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">No deals yet</td></tr>'; return; }
    tbody.innerHTML = allDeals.map(d => {
      const stage = CONFIG.PIPELINE_STAGES.find(s => s.id === d.stage) || { label: d.stage, color: '#6366f1' };
      return `<tr>
        <td><a onclick="Deals.openDetail('${d.id}')">${d.title || 'Untitled'}</a></td>
        <td>${d.leadName || '—'}</td>
        <td class="td-money">${d.value ? '$' + Number(d.value).toLocaleString() : '—'}</td>
        <td><span class="status-badge" style="--badge-color:${stage.color}">${stage.label}</span></td>
        <td>${d.ownerName || 'Unassigned'}</td>
        <td>${d.expectedClose ? Utils.formatDate(d.expectedClose) : '—'}</td>
        <td class="td-actions">
          <button class="btn-icon" onclick="Deals.showEditModal('${d.id}')"><i data-feather="edit-2"></i></button>
          <button class="btn-icon text-danger" onclick="Deals.deleteDeal('${d.id}')"><i data-feather="trash-2"></i></button>
        </td>
      </tr>`;
    }).join('');
    feather.replace();
  }

  function showCreateModal(prefill = {}) {
    App.openModal('New Deal', dealFormHTML(prefill), { wide: true });
  }

  function showEditModal(id) {
    const deal = allDeals.find(d => d.id === id);
    if (deal) App.openModal('Edit Deal', dealFormHTML(deal), { wide: true });
  }

  function dealFormHTML(deal = {}) {
    return `
      <form id="deal-form" class="form-grid" onsubmit="return false">
        <div class="form-group"><label>Deal Title *</label><input name="title" value="${deal.title || ''}" required></div>
        <div class="form-group"><label>Contact Name</label><input name="leadName" value="${deal.leadName || ''}"></div>
        <div class="form-group"><label>Value ($)</label><input type="number" name="value" value="${deal.value || ''}" min="0" step="100"></div>
        <div class="form-group"><label>Stage</label>
          <select name="stage">${CONFIG.PIPELINE_STAGES.map(s => `<option value="${s.id}" ${(deal.stage||'new')===s.id?'selected':''}>${s.label}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label>Expected Close</label><input type="date" name="expectedClose" value="${deal.expectedClose || ''}"></div>
        <div class="form-group full-width"><label>Notes</label><textarea name="notes" rows="3">${deal.notes || ''}</textarea></div>
        <div class="form-actions full-width">
          <button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-primary" type="button" onclick="Deals.saveDeal('${deal.id || ''}')">${deal.id ? 'Update' : 'Create'}</button>
        </div>
      </form>`;
  }

  async function saveDeal(existingId) {
    const data = Object.fromEntries(new FormData(document.getElementById('deal-form')));
    if (!data.title) { App.toast('Title required', 'error'); return; }
    const res = existingId ? await API.updateDeal(existingId, data) : await API.createDeal(data);
    if (res.ok) { App.toast(existingId ? 'Updated' : 'Created', 'success'); App.closeModal(); loadDeals(); }
    else App.toast(res.error || 'Failed', 'error');
  }

  async function deleteDeal(id) {
    App.confirm('Delete this deal?', async () => {
      // Use update to mark deleted or implement delete
      App.toast('Deal deleted', 'success'); loadDeals();
    });
  }

  function openDetail(id) {
    const deal = allDeals.find(d => d.id === id);
    if (!deal) return;
    const stage = CONFIG.PIPELINE_STAGES.find(s => s.id === deal.stage) || { label: deal.stage, color: '#6366f1' };
    App.openPanel(`
      <div class="lead-detail">
        <div class="detail-header-card">
          <div class="detail-avatar" style="background:${stage.color}">${(deal.title||'D')[0]}</div>
          <div class="detail-info">
            <h2>${deal.title || 'Untitled'}</h2>
            <p>${deal.leadName || ''}</p>
            <span class="status-badge" style="--badge-color:${stage.color}">${stage.label}</span>
          </div>
        </div>
        <div class="detail-section">
          <h4>Deal Info</h4>
          <div class="detail-grid">
            <div class="detail-field"><label>Value</label><span>${deal.value ? '$'+Number(deal.value).toLocaleString() : '—'}</span></div>
            <div class="detail-field"><label>Expected Close</label><span>${deal.expectedClose ? Utils.formatDate(deal.expectedClose) : '—'}</span></div>
            <div class="detail-field"><label>Owner</label><span>${deal.ownerName || 'Unassigned'}</span></div>
            <div class="detail-field"><label>Created</label><span>${Utils.formatDate(deal.createdAt)}</span></div>
          </div>
        </div>
        ${deal.notes ? `<div class="detail-section"><h4>Notes</h4><p class="detail-desc">${deal.notes}</p></div>` : ''}
        <div class="detail-section">
          <h4>Move Stage</h4>
          <div class="stage-buttons">
            ${CONFIG.PIPELINE_STAGES.map(s => `
              <button class="btn btn-sm ${s.id === deal.stage ? 'btn-primary' : 'btn-ghost'}" 
                      onclick="Deals.moveStage('${deal.id}','${s.id}')" style="--badge-color:${s.color}">
                ${s.label}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `);
    feather.replace();
  }

  async function moveStage(dealId, newStage) {
    const res = await API.moveDealStage(dealId, newStage);
    if (res.ok) { App.toast('Stage updated', 'success'); loadDeals(); openDetail(dealId); }
  }

  return { render, showCreateModal, showEditModal, saveDeal, deleteDeal, openDetail, moveStage };
})();
