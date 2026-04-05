// ╔══════════════════════════════════════════════════════════════════╗
// ║  EDGEFORM CRM — DASHBOARD VIEW                                  ║
// ╚══════════════════════════════════════════════════════════════════╝

const Dashboard = (() => {

  async function render() {
    const view = App.getMainView();
    view.innerHTML = `
      <div class="view-header">
        <h1>Dashboard</h1>
        <div class="view-actions">
          <button class="btn btn-ghost btn-sm" onclick="Dashboard.refresh()">
            <i data-feather="refresh-cw"></i> Refresh
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid" id="kpi-grid">
        ${kpiCard('Total Leads', '—', 'users', 'blue', '—')}
        ${kpiCard('New Today', '—', 'user-plus', 'green', '—')}
        ${kpiCard('Contacted', '—', 'phone', 'amber', '—')}
        ${kpiCard('Converted', '—', 'check-circle', 'emerald', '—')}
        ${kpiCard('Pipeline Value', '—', 'dollar-sign', 'purple', '—')}
        ${kpiCard('Tasks Due', '—', 'alert-circle', 'red', '—')}
      </div>

      <!-- Charts Row -->
      <div class="dashboard-grid">
        <div class="card chart-card">
          <div class="card-header">
            <h3>Pipeline Overview</h3>
          </div>
          <div class="card-body" id="pipeline-chart"></div>
        </div>
        <div class="card chart-card">
          <div class="card-header">
            <h3>Lead Sources</h3>
          </div>
          <div class="card-body" id="source-chart"></div>
        </div>
      </div>

      <!-- Recent Activity & Upcoming Tasks -->
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <h3>Recent Activity</h3>
            <a class="link-sm" onclick="App.navigate('leads')">View All</a>
          </div>
          <div class="card-body" id="activity-feed">
            <div class="loading-skeleton"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3>Upcoming Tasks</h3>
            <a class="link-sm" onclick="App.navigate('tasks')">View All</a>
          </div>
          <div class="card-body" id="upcoming-tasks">
            <div class="loading-skeleton"></div>
          </div>
        </div>
      </div>
    `;
    feather.replace();
    loadData();
  }

  function kpiCard(label, value, icon, color, sub) {
    return `
      <div class="kpi-card kpi-${color}">
        <div class="kpi-icon"><i data-feather="${icon}"></i></div>
        <div class="kpi-data">
          <div class="kpi-value">${value}</div>
          <div class="kpi-label">${label}</div>
          <div class="kpi-sub">${sub}</div>
        </div>
      </div>
    `;
  }

  async function loadData() {
    try {
      const [statsRes, actRes, tasksRes] = await Promise.all([
        API.getDashboardStats(),
        API.getRecentActivities(10),
        API.getTasks({ upcoming: true, limit: 10 })
      ]);

      if (statsRes.ok) renderKPIs(statsRes);
      if (actRes.ok) renderActivityFeed(actRes.activities || []);
      if (tasksRes.ok) renderUpcomingTasks(tasksRes.tasks || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
  }

  function renderKPIs(stats) {
    const grid = document.getElementById('kpi-grid');
    if (!grid) return;
    grid.innerHTML = `
      ${kpiCard('Total Leads', stats.totalLeads || 0, 'users', 'blue', `${stats.leadsThisWeek || 0} this week`)}
      ${kpiCard('New Today', stats.newToday || 0, 'user-plus', 'green', `${stats.newYesterday || 0} yesterday`)}
      ${kpiCard('Contacted', stats.contacted || 0, 'phone', 'amber', `${stats.contactRate || 0}% rate`)}
      ${kpiCard('Converted', stats.converted || 0, 'check-circle', 'emerald', `${stats.conversionRate || 0}% rate`)}
      ${kpiCard('Pipeline Value', '$' + (stats.pipelineValue || 0).toLocaleString(), 'dollar-sign', 'purple', `${stats.activeDeals || 0} active deals`)}
      ${kpiCard('Tasks Due', stats.tasksDue || 0, 'alert-circle', 'red', `${stats.overdueTasks || 0} overdue`)}
    `;
    feather.replace();

    // Render pipeline chart
    renderPipelineChart(stats.pipelineBreakdown || []);
    renderSourceChart(stats.sourceBreakdown || []);
  }

  function renderPipelineChart(data) {
    const el = document.getElementById('pipeline-chart');
    if (!el || !data.length) {
      if (el) el.innerHTML = '<div class="empty-state">No pipeline data yet</div>';
      return;
    }
    const max = Math.max(...data.map(d => d.count));
    el.innerHTML = `<div class="bar-chart">
      ${data.map(d => {
        const stage = CONFIG.PIPELINE_STAGES.find(s => s.id === d.stage) || { label: d.stage, color: '#6366f1' };
        const pct = max ? (d.count / max * 100) : 0;
        return `<div class="bar-row">
          <div class="bar-label">${stage.label}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%;background:${stage.color}"></div>
          </div>
          <div class="bar-value">${d.count}</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function renderSourceChart(data) {
    const el = document.getElementById('source-chart');
    if (!el || !data.length) {
      if (el) el.innerHTML = '<div class="empty-state">No source data yet</div>';
      return;
    }
    const total = data.reduce((s, d) => s + d.count, 0);
    const colors = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
    el.innerHTML = `<div class="donut-legend">
      ${data.map((d, i) => `
        <div class="legend-item">
          <span class="legend-dot" style="background:${colors[i % colors.length]}"></span>
          <span class="legend-label">${d.source}</span>
          <span class="legend-value">${d.count} (${total ? Math.round(d.count/total*100) : 0}%)</span>
        </div>
      `).join('')}
    </div>`;
  }

  function renderActivityFeed(activities) {
    const el = document.getElementById('activity-feed');
    if (!el) return;
    if (!activities.length) {
      el.innerHTML = '<div class="empty-state">No recent activity</div>';
      return;
    }
    el.innerHTML = activities.map(a => `
      <div class="activity-item">
        <div class="activity-icon activity-${a.type}">
          <i data-feather="${getActivityIcon(a.type)}"></i>
        </div>
        <div class="activity-content">
          <div class="activity-text">
            <strong>${a.userName || 'System'}</strong> ${a.description || a.type}
            ${a.leadName ? `— <a onclick="Leads.openDetail('${a.leadId}')">${a.leadName}</a>` : ''}
          </div>
          <div class="activity-time">${Utils.timeAgo(a.timestamp)}</div>
        </div>
      </div>
    `).join('');
    feather.replace();
  }

  function renderUpcomingTasks(tasks) {
    const el = document.getElementById('upcoming-tasks');
    if (!el) return;
    if (!tasks.length) {
      el.innerHTML = '<div class="empty-state">No upcoming tasks</div>';
      return;
    }
    el.innerHTML = tasks.map(t => `
      <div class="task-item ${t.overdue ? 'task-overdue' : ''}">
        <button class="task-check" onclick="Tasks.complete('${t.id}')">
          <i data-feather="${t.completed ? 'check-square' : 'square'}"></i>
        </button>
        <div class="task-content">
          <div class="task-title">${t.title}</div>
          <div class="task-meta">
            ${t.leadName ? `<span>${t.leadName}</span> · ` : ''}
            <span>${Utils.formatDate(t.dueDate)}</span>
          </div>
        </div>
      </div>
    `).join('');
    feather.replace();
  }

  function getActivityIcon(type) {
    const found = CONFIG.ACTIVITY_TYPES.find(a => a.id === type);
    return found ? found.icon : 'activity';
  }

  function refresh() {
    render();
    App.toast('Dashboard refreshed', 'success');
  }

  return { render, refresh };
})();
