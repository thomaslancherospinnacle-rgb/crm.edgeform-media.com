// ╔══════════════════════════════════════════════════════════════════╗
// ║  EDGEFORM CRM — PIPELINE VIEW (Kanban)                         ║
// ║  Drag-and-drop deal board across pipeline stages                ║
// ╚══════════════════════════════════════════════════════════════════╝

const Pipeline = (() => {
  let deals = [];

  async function render() {
    const view = App.getMainView();
    view.innerHTML = `
      <div class="view-header">
        <h1>Pipeline</h1>
        <div class="view-actions">
          <button class="btn btn-ghost btn-sm" onclick="Pipeline.refresh()"><i data-feather="refresh-cw"></i></button>
          <button class="btn btn-primary btn-sm" onclick="Deals.showCreateModal()"><i data-feather="plus"></i> New Deal</button>
        </div>
      </div>
      <div class="pipeline-summary" id="pipeline-summary"></div>
      <div class="kanban-board" id="kanban-board">
        ${CONFIG.PIPELINE_STAGES.map(stage => `
          <div class="kanban-column" data-stage="${stage.id}"
               ondragover="Pipeline.onDragOver(event)"
               ondrop="Pipeline.onDrop(event, '${stage.id}')">
            <div class="kanban-header" style="--stage-color:${stage.color}">
              <span class="kanban-title"><i data-feather="${stage.icon}"></i> ${stage.label}</span>
              <span class="kanban-count" id="count-${stage.id}">0</span>
            </div>
            <div class="kanban-cards" id="cards-${stage.id}">
              <div class="loading-skeleton"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    feather.replace();
    await loadDeals();
  }

  async function loadDeals() {
    const res = await API.getDeals();
    if (res.ok) {
      deals = res.deals || [];
      renderCards();
      renderSummary();
    }
  }

  function renderCards() {
    CONFIG.PIPELINE_STAGES.forEach(stage => {
      const container = document.getElementById(`cards-${stage.id}`);
      const countEl = document.getElementById(`count-${stage.id}`);
      const stageDeals = deals.filter(d => d.stage === stage.id);

      if (countEl) countEl.textContent = stageDeals.length;
      if (!container) return;

      if (!stageDeals.length) {
        container.innerHTML = '<div class="kanban-empty">No deals</div>';
        return;
      }

      container.innerHTML = stageDeals.map(deal => `
        <div class="kanban-card" draggable="true"
             ondragstart="Pipeline.onDragStart(event, '${deal.id}')"
             onclick="Deals.openDetail('${deal.id}')">
          <div class="card-title">${deal.title || deal.leadName || 'Untitled'}</div>
          <div class="card-value">${deal.value ? '$' + Number(deal.value).toLocaleString() : '—'}</div>
          <div class="card-meta">
            <span>${deal.leadName || ''}</span>
            ${deal.expectedClose ? `<span>${Utils.formatDate(deal.expectedClose)}</span>` : ''}
          </div>
          <div class="card-owner">
            <div class="mini-avatar">${(deal.ownerName || 'U')[0]}</div>
            <span>${deal.ownerName || 'Unassigned'}</span>
          </div>
        </div>
      `).join('');
    });
  }

  function renderSummary() {
    const el = document.getElementById('pipeline-summary');
    if (!el) return;
    const totalValue = deals.filter(d => d.stage !== 'closed_lost').reduce((s, d) => s + (Number(d.value) || 0), 0);
    const wonValue = deals.filter(d => d.stage === 'closed_won').reduce((s, d) => s + (Number(d.value) || 0), 0);
    const activeDeals = deals.filter(d => !d.stage.startsWith('closed_')).length;

    el.innerHTML = `
      <div class="summary-item"><span class="summary-value">$${totalValue.toLocaleString()}</span><span class="summary-label">Pipeline Value</span></div>
      <div class="summary-item"><span class="summary-value">$${wonValue.toLocaleString()}</span><span class="summary-label">Won</span></div>
      <div class="summary-item"><span class="summary-value">${activeDeals}</span><span class="summary-label">Active Deals</span></div>
      <div class="summary-item"><span class="summary-value">${deals.length}</span><span class="summary-label">Total Deals</span></div>
    `;
  }

  // ── Drag & Drop ──────────────────────────────────────────────
  let draggedDealId = null;

  function onDragStart(e, dealId) {
    draggedDealId = dealId;
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('dragging');
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
  }

  function onDrop(e, newStage) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

    if (!draggedDealId) return;
    const deal = deals.find(d => d.id === draggedDealId);
    if (!deal || deal.stage === newStage) return;

    const oldStage = deal.stage;
    deal.stage = newStage;
    renderCards();

    // Update server
    API.moveDealStage(draggedDealId, newStage).then(res => {
      if (res.ok) {
        const stageLabel = CONFIG.PIPELINE_STAGES.find(s => s.id === newStage)?.label || newStage;
        App.toast(`Deal moved to ${stageLabel}`, 'success');
        renderSummary();
      } else {
        deal.stage = oldStage;
        renderCards();
        App.toast('Failed to update stage', 'error');
      }
    });
    draggedDealId = null;
  }

  function refresh() { render(); }

  return { render, refresh, onDragStart, onDragOver, onDrop, loadDeals };
})();
