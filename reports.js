// ╔══════════════════════════════════════════════════════════════════╗
// ║  EDGEFORM CRM — REPORTS VIEW                                   ║
// ╚══════════════════════════════════════════════════════════════════╝

const Reports = (() => {

  async function render() {
    const view = App.getMainView();
    view.innerHTML = `
      <div class="view-header">
        <h1>Reports</h1>
        <div class="view-actions">
          <select id="report-range" class="filter-select" onchange="Reports.refresh()">
            <option value="7">Last 7 days</option>
            <option value="30" selected>Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>
      <div class="reports-grid">
        <div class="card"><div class="card-header"><h3>Conversion Funnel</h3></div><div class="card-body" id="report-funnel"><div class="loading-skeleton"></div></div></div>
        <div class="card"><div class="card-header"><h3>Leads by Source</h3></div><div class="card-body" id="report-sources"><div class="loading-skeleton"></div></div></div>
        <div class="card"><div class="card-header"><h3>Pipeline Value by Stage</h3></div><div class="card-body" id="report-pipeline"><div class="loading-skeleton"></div></div></div>
        <div class="card"><div class="card-header"><h3>Agent Performance</h3></div><div class="card-body" id="report-agents"><div class="loading-skeleton"></div></div></div>
        <div class="card full-width"><div class="card-header"><h3>Lead Activity (Last 30 Days)</h3></div><div class="card-body" id="report-activity"><div class="loading-skeleton"></div></div></div>
      </div>
    `;
    feather.replace();
    await loadReports();
  }

  async function loadReports() {
    const days = parseInt(document.getElementById('report-range')?.value || 30);
    const after = new Date(Date.now() - days * 86400000).toISOString();
    const [conv, src, pipe, agents] = await Promise.all([
      API.getConversionReport({ after }),
      API.getLeadsBySource(),
      API.getPipelineValue(),
      API.getAgentPerformance()
    ]);

    if (conv.ok) renderFunnel(conv);
    if (src.ok) renderSources(src.sources || []);
    if (pipe.ok) renderPipelineValue(pipe.stages || []);
    if (agents.ok) renderAgents(agents.agents || []);
  }

  function renderFunnel(data) {
    const el = document.getElementById('report-funnel');
    if (!el) return;
    const stages = [
      { label: 'Total Leads', value: data.total || 0, color: '#6366f1' },
      { label: 'Contacted', value: data.contacted || 0, color: '#f59e0b' },
      { label: 'Qualified', value: data.qualified || 0, color: '#3b82f6' },
      { label: 'Converted', value: data.converted || 0, color: '#10b981' },
    ];
    const max = stages[0].value || 1;
    el.innerHTML = `<div class="funnel">${stages.map(s => {
      const pct = Math.round(s.value / max * 100);
      return `<div class="funnel-stage">
        <div class="funnel-bar" style="width:${Math.max(pct, 5)}%;background:${s.color}">
          <span class="funnel-value">${s.value}</span>
        </div>
        <span class="funnel-label">${s.label} (${pct}%)</span>
      </div>`;
    }).join('')}</div>`;
  }

  function renderSources(sources) {
    const el = document.getElementById('report-sources');
    if (!el || !sources.length) { if (el) el.innerHTML = '<div class="empty-state">No data</div>'; return; }
    const max = Math.max(...sources.map(s => s.count));
    const colors = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
    el.innerHTML = `<div class="bar-chart">${sources.map((s, i) => `
      <div class="bar-row">
        <div class="bar-label">${s.source}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${s.count/max*100}%;background:${colors[i%colors.length]}"></div></div>
        <div class="bar-value">${s.count}</div>
      </div>
    `).join('')}</div>`;
  }

  function renderPipelineValue(stages) {
    const el = document.getElementById('report-pipeline');
    if (!el || !stages.length) { if (el) el.innerHTML = '<div class="empty-state">No data</div>'; return; }
    const max = Math.max(...stages.map(s => s.value));
    el.innerHTML = `<div class="bar-chart">${stages.map(s => {
      const cfg = CONFIG.PIPELINE_STAGES.find(p => p.id === s.stage) || { label: s.stage, color: '#6366f1' };
      return `<div class="bar-row">
        <div class="bar-label">${cfg.label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${max?s.value/max*100:0}%;background:${cfg.color}"></div></div>
        <div class="bar-value">$${Number(s.value).toLocaleString()}</div>
      </div>`;
    }).join('')}</div>`;
  }

  function renderAgents(agents) {
    const el = document.getElementById('report-agents');
    if (!el || !agents.length) { if (el) el.innerHTML = '<div class="empty-state">No data</div>'; return; }
    el.innerHTML = `<div class="agent-leaderboard">
      ${agents.sort((a,b) => (b.closed||0) - (a.closed||0)).map((a, i) => `
        <div class="agent-row">
          <div class="agent-rank">#${i+1}</div>
          <div class="agent-avatar">${(a.name||'?')[0]}</div>
          <div class="agent-info">
            <div class="agent-name">${a.name}</div>
            <div class="agent-stats">${a.leads||0} leads · ${a.closed||0} closed · $${(a.revenue||0).toLocaleString()}</div>
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  function refresh() { loadReports(); }

  return { render, refresh };
})();
