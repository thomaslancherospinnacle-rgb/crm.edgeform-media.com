// ╔══════════════════════════════════════════════════════════════════╗
// ║  EDGEFORM CRM — API CLIENT                                     ║
// ║  All data operations go through this module.                    ║
// ║  Talks to GAS backends defined in config.js                     ║
// ╚══════════════════════════════════════════════════════════════════╝

const API = (() => {

  // ── Helper ─────────────────────────────────────────────────────
  async function post(endpoint, payload) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.error("API Error:", err);
      return { ok: false, error: err.message };
    }
  }

  async function get(endpoint, params = {}) {
    const url = new URL(endpoint);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    try {
      const res = await fetch(url.toString());
      return await res.json();
    } catch (err) {
      console.error("API Error:", err);
      return { ok: false, error: err.message };
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  LEADS
  // ══════════════════════════════════════════════════════════════

  async function getLeads(filters = {}) {
    return post(CONFIG.GAS_CRM_API, { action: "get_leads", ...filters });
  }

  async function getLead(leadId) {
    return post(CONFIG.GAS_CRM_API, { action: "get_lead", leadId });
  }

  async function createLead(leadData) {
    const user = Auth.currentUser();
    return post(CONFIG.GAS_CRM_API, {
      action: "create_lead",
      ...leadData,
      ownerId: leadData.ownerId || user?.userId,
      ownerName: leadData.ownerName || user?.name,
      createdBy: user?.userId
    });
  }

  async function updateLead(leadId, updates) {
    const user = Auth.currentUser();
    return post(CONFIG.GAS_CRM_API, {
      action: "update_lead",
      leadId,
      ...updates,
      updatedBy: user?.userId
    });
  }

  async function deleteLead(leadId) {
    return post(CONFIG.GAS_CRM_API, { action: "delete_lead", leadId });
  }

  async function bulkUpdateLeads(leadIds, updates) {
    return post(CONFIG.GAS_CRM_API, { action: "bulk_update_leads", leadIds, ...updates });
  }

  // ══════════════════════════════════════════════════════════════
  //  NOTES
  // ══════════════════════════════════════════════════════════════

  async function getNotes(leadId) {
    return post(CONFIG.GAS_CRM_API, { action: "get_notes", leadId });
  }

  async function addNote(leadId, content) {
    const user = Auth.currentUser();
    return post(CONFIG.GAS_CRM_API, {
      action: "add_note",
      leadId,
      content,
      authorId: user?.userId,
      authorName: user?.name
    });
  }

  async function deleteNote(noteId) {
    return post(CONFIG.GAS_CRM_API, { action: "delete_note", noteId });
  }

  // ══════════════════════════════════════════════════════════════
  //  ACTIVITIES
  // ══════════════════════════════════════════════════════════════

  async function getActivities(leadId) {
    return post(CONFIG.GAS_CRM_API, { action: "get_activities", leadId });
  }

  async function logActivity(leadId, activityData) {
    const user = Auth.currentUser();
    return post(CONFIG.GAS_CRM_API, {
      action: "log_activity",
      leadId,
      ...activityData,
      userId: user?.userId,
      userName: user?.name
    });
  }

  async function getRecentActivities(limit = 50) {
    return post(CONFIG.GAS_CRM_API, { action: "get_recent_activities", limit });
  }

  // ══════════════════════════════════════════════════════════════
  //  PIPELINE / DEALS
  // ══════════════════════════════════════════════════════════════

  async function getDeals(filters = {}) {
    return post(CONFIG.GAS_CRM_API, { action: "get_deals", ...filters });
  }

  async function createDeal(dealData) {
    const user = Auth.currentUser();
    return post(CONFIG.GAS_CRM_API, {
      action: "create_deal",
      ...dealData,
      createdBy: user?.userId
    });
  }

  async function updateDeal(dealId, updates) {
    return post(CONFIG.GAS_CRM_API, { action: "update_deal", dealId, ...updates });
  }

  async function moveDealStage(dealId, newStage) {
    const user = Auth.currentUser();
    return post(CONFIG.GAS_CRM_API, {
      action: "move_deal_stage",
      dealId,
      newStage,
      movedBy: user?.userId
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  TASKS
  // ══════════════════════════════════════════════════════════════

  async function getTasks(filters = {}) {
    return post(CONFIG.GAS_CRM_API, { action: "get_tasks", ...filters });
  }

  async function createTask(taskData) {
    const user = Auth.currentUser();
    return post(CONFIG.GAS_CRM_API, {
      action: "create_task",
      ...taskData,
      createdBy: user?.userId
    });
  }

  async function updateTask(taskId, updates) {
    return post(CONFIG.GAS_CRM_API, { action: "update_task", taskId, ...updates });
  }

  async function completeTask(taskId) {
    return post(CONFIG.GAS_CRM_API, { action: "complete_task", taskId });
  }

  // ══════════════════════════════════════════════════════════════
  //  EMAIL
  // ══════════════════════════════════════════════════════════════

  async function sendEmail(to, subject, body, fromUser) {
    return post(CONFIG.CF_EMAIL_WORKER, {
      to,
      subject,
      htmlBody: body,
      fromName: fromUser || Auth.currentUser()?.name,
      fromEmail: (Auth.currentUser()?.email?.split('@')[0] || 'info') + '@' + CONFIG.EMAIL_DOMAIN
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  REPORTS / DASHBOARD
  // ══════════════════════════════════════════════════════════════

  async function getDashboardStats() {
    return post(CONFIG.GAS_REPORTS_API, { action: "dashboard_stats" });
  }

  async function getConversionReport(dateRange) {
    return post(CONFIG.GAS_REPORTS_API, { action: "conversion_report", ...dateRange });
  }

  async function getAgentPerformance() {
    return post(CONFIG.GAS_REPORTS_API, { action: "agent_performance" });
  }

  async function getLeadsBySource() {
    return post(CONFIG.GAS_REPORTS_API, { action: "leads_by_source" });
  }

  async function getPipelineValue() {
    return post(CONFIG.GAS_REPORTS_API, { action: "pipeline_value" });
  }

  // ══════════════════════════════════════════════════════════════
  //  IMPORT / EXPORT
  // ══════════════════════════════════════════════════════════════

  async function importLeads(csvData) {
    return post(CONFIG.GAS_CRM_API, { action: "import_leads", csvData });
  }

  async function exportLeads(filters = {}) {
    return post(CONFIG.GAS_CRM_API, { action: "export_leads", ...filters });
  }

  return {
    // Leads
    getLeads, getLead, createLead, updateLead, deleteLead, bulkUpdateLeads,
    // Notes
    getNotes, addNote, deleteNote,
    // Activities
    getActivities, logActivity, getRecentActivities,
    // Deals
    getDeals, createDeal, updateDeal, moveDealStage,
    // Tasks
    getTasks, createTask, updateTask, completeTask,
    // Email
    sendEmail,
    // Reports
    getDashboardStats, getConversionReport, getAgentPerformance, getLeadsBySource, getPipelineValue,
    // Import/Export
    importLeads, exportLeads
  };
})();
