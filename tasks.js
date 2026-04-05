// ╔══════════════════════════════════════════════════════════════════╗
// ║  EDGEFORM CRM — TASKS VIEW                                     ║
// ╚══════════════════════════════════════════════════════════════════╝

const Tasks = (() => {
  let allTasks = [];
  let filter = 'pending';

  async function render() {
    const view = App.getMainView();
    view.innerHTML = `
      <div class="view-header">
        <h1>Tasks</h1>
        <div class="view-actions">
          <button class="btn btn-primary btn-sm" onclick="Tasks.showCreateModal()"><i data-feather="plus"></i> New Task</button>
        </div>
      </div>
      <div class="filters-bar">
        <div class="tab-filters">
          <button class="tab-filter ${filter==='pending'?'active':''}" onclick="Tasks.setFilter('pending')">Pending</button>
          <button class="tab-filter ${filter==='overdue'?'active':''}" onclick="Tasks.setFilter('overdue')">Overdue</button>
          <button class="tab-filter ${filter==='today'?'active':''}" onclick="Tasks.setFilter('today')">Due Today</button>
          <button class="tab-filter ${filter==='completed'?'active':''}" onclick="Tasks.setFilter('completed')">Completed</button>
          <button class="tab-filter ${filter==='all'?'active':''}" onclick="Tasks.setFilter('all')">All</button>
        </div>
      </div>
      <div class="tasks-list" id="tasks-list"><div class="loading-skeleton"></div></div>
    `;
    feather.replace();
    await loadTasks();
  }

  async function loadTasks() {
    const res = await API.getTasks({});
    if (res.ok) { allTasks = res.tasks || []; renderTasks(); }
  }

  function setFilter(f) { filter = f; renderTasks(); 
    document.querySelectorAll('.tab-filter').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase().replace(' ','') === f || (b.textContent === 'Due Today' && f === 'today')));
  }

  function renderTasks() {
    const el = document.getElementById('tasks-list');
    if (!el) return;
    const now = new Date();
    const todayStr = now.toISOString().slice(0,10);

    let filtered = allTasks;
    if (filter === 'pending') filtered = allTasks.filter(t => !t.completed);
    else if (filter === 'overdue') filtered = allTasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr);
    else if (filter === 'today') filtered = allTasks.filter(t => t.dueDate && t.dueDate.startsWith(todayStr));
    else if (filter === 'completed') filtered = allTasks.filter(t => t.completed);

    if (!filtered.length) { el.innerHTML = '<div class="empty-state">No tasks found</div>'; return; }

    filtered.sort((a, b) => (a.dueDate || 'z').localeCompare(b.dueDate || 'z'));

    el.innerHTML = filtered.map(t => {
      const overdue = !t.completed && t.dueDate && t.dueDate < todayStr;
      return `
        <div class="task-card ${t.completed ? 'task-done' : ''} ${overdue ? 'task-overdue' : ''}">
          <button class="task-check" onclick="Tasks.complete('${t.id}')">
            <i data-feather="${t.completed ? 'check-square' : 'square'}"></i>
          </button>
          <div class="task-content">
            <div class="task-title">${t.title}</div>
            <div class="task-meta">
              ${t.leadName ? `<span class="task-lead" onclick="Leads.openDetail('${t.leadId}')">${t.leadName}</span>` : ''}
              ${t.dueDate ? `<span class="${overdue ? 'text-danger' : ''}">${Utils.formatDate(t.dueDate)}</span>` : ''}
              ${t.assigneeName ? `<span>→ ${t.assigneeName}</span>` : ''}
            </div>
          </div>
          <div class="task-actions">
            <button class="btn-icon" onclick="Tasks.showEditModal('${t.id}')"><i data-feather="edit-2"></i></button>
          </div>
        </div>
      `;
    }).join('');
    feather.replace();
  }

  async function complete(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    task.completed = !task.completed;
    renderTasks();
    const res = await API.updateTask(taskId, { completed: task.completed });
    if (res.ok) App.toast(task.completed ? 'Task completed' : 'Task reopened', 'success');
  }

  function showCreateModal(prefill = {}) {
    App.openModal('New Task', taskFormHTML(prefill));
  }

  function showEditModal(id) {
    const task = allTasks.find(t => t.id === id);
    if (task) App.openModal('Edit Task', taskFormHTML(task));
  }

  function taskFormHTML(task = {}) {
    return `
      <form id="task-form" class="form-grid" onsubmit="return false">
        <div class="form-group full-width"><label>Task Title *</label><input name="title" value="${task.title||''}" required></div>
        <div class="form-group"><label>Due Date</label><input type="datetime-local" name="dueDate" value="${task.dueDate||''}"></div>
        <div class="form-group"><label>Related Lead</label><input name="leadName" value="${task.leadName||''}" placeholder="Lead name"></div>
        <div class="form-group full-width"><label>Notes</label><textarea name="notes" rows="3">${task.notes||''}</textarea></div>
        <div class="form-actions full-width">
          <button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-primary" type="button" onclick="Tasks.saveTask('${task.id||''}')">${task.id?'Update':'Create'}</button>
        </div>
      </form>`;
  }

  async function saveTask(existingId) {
    const data = Object.fromEntries(new FormData(document.getElementById('task-form')));
    if (!data.title) { App.toast('Title required','error'); return; }
    const res = existingId ? await API.updateTask(existingId, data) : await API.createTask(data);
    if (res.ok) { App.toast('Saved','success'); App.closeModal(); loadTasks(); }
  }

  return { render, setFilter, complete, showCreateModal, showEditModal, saveTask, loadTasks };
})();
