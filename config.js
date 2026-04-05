// ╔══════════════════════════════════════════════════════════════════╗
// ║  EDGEFORM MEDIA CRM — MASTER CONFIGURATION                     ║
// ║  All API keys, URLs, and service endpoints live HERE ONLY.      ║
// ║  No other file should contain hardcoded URLs or keys.           ║
// ╚══════════════════════════════════════════════════════════════════╝

const CONFIG = {

  // ── APP INFO ──────────────────────────────────────────────────────
  APP_NAME: "Edgeform CRM",
  APP_VERSION: "1.0.0",
  APP_DOMAIN: "crm.edgeform-media.com",

  // ── GOOGLE APPS SCRIPT ENDPOINTS ─────────────────────────────────
  // Deploy each .gs file as a Web App (Execute as: Me, Access: Anyone)
  // Then paste the deployment URL here.

  // GAS #1 — Lead Intake (your existing script, unchanged)
  // Purpose: Receives new leads from your website contact form
  GAS_LEAD_INTAKE: "https://script.google.com/macros/s/AKfycbxHw65LmydBEOBaYvsyUwj8UJqovXU116eU0RJ0pXsdIBNCAFrtjZpRVLrXSpJBzUilnA/exec",

  // GAS #2 — CRM Core API (deploy crm-api.gs)
  // Purpose: CRUD operations for leads, notes, activities, pipeline, users
  GAS_CRM_API: "https://script.google.com/macros/s/AKfycby1vhgVzjCOiO0p4NYQ3999Bx20aK1bp2yO_tzeof_dNAcV28cBPfSaSynKN2mYSJM/exec",

  // GAS #3 — Dashboard & Reporting (deploy crm-reports.gs)
  // Purpose: Aggregated stats, charts data, activity feed
  GAS_REPORTS_API: "https://script.google.com/macros/s/AKfycbwbwXBz9BJF3-AGYGuyWc080OJFKwz8h9he9X9pfnCdIME1t-CCql5jAHUM6hrncFMHvQ/exec",

  // GAS #4 — Auth & User Management (deploy crm-auth.gs)
  // Purpose: Account creation, login verification, role management
  GAS_AUTH_API: "https://script.google.com/macros/s/AKfycbwycdVOJ5B2xqhcXtPY37vCHqGVT2egY9IA7PLzYElB-TzPbEAVlD4aHZbFYkNtkLZe/exec",

  // ── GOOGLE SHEET ID ──────────────────────────────────────────────
  // The master spreadsheet that holds all CRM data
  // Tabs: Leads, Notes, Activities, Pipeline, Users, Settings
  SHEET_ID: "1tO7e87N0J5fssr5bUkItMIazBhL-ehLvsoaH-EPXB4I",

  // ── GOOGLE DRIVE FOLDER ──────────────────────────────────────────
  // Folder where sketch images / attachments are stored
  DRIVE_FOLDER_ID: "1QgmzgAJteunlAnbVyuX96Un2SvDssr7i",

  // ── RESEND (Email Service) ───────────────────────────────────────
  // Used by the Cloudflare Worker to send emails
  // Get your API key at https://resend.com/api-keys
  RESEND_API_KEY: "re_YcjESHgq_51pMXBNSVUaoyp7Wu2RibHaF",

  // Default sending domain — emails sent as (user)@edgeform-media.com
  EMAIL_DOMAIN: "edgeform-media.com",

  // ── CLOUDFLARE WORKER (Email Proxy) ──────────────────────────────
  // Deploy email-worker.js to Cloudflare Workers
  // This proxies email sends so your Resend key stays server-side
  CF_EMAIL_WORKER: "https://email.edgeformmedia.workers.dev",

  // ── PIPELINE STAGES ──────────────────────────────────────────────
  // Customize your sales pipeline stages here
  PIPELINE_STAGES: [
    { id: "new",           label: "New Inquiry",    color: "#6366f1", icon: "inbox" },
    { id: "contacted",     label: "Contacted",      color: "#f59e0b", icon: "phone" },
    { id: "discovery",     label: "Discovery Call",  color: "#3b82f6", icon: "search" },
    { id: "proposal",      label: "Proposal Sent",  color: "#8b5cf6", icon: "file-text" },
    { id: "negotiation",   label: "Negotiation",    color: "#ec4899", icon: "message-circle" },
    { id: "closed_won",    label: "Closed Won",     color: "#10b981", icon: "check-circle" },
    { id: "closed_lost",   label: "Closed Lost",    color: "#ef4444", icon: "x-circle" }
  ],

  // ── LEAD STATUSES ────────────────────────────────────────────────
  LEAD_STATUSES: [
    { id: "new",        label: "New",          color: "#6366f1" },
    { id: "contacted",  label: "Contacted",    color: "#f59e0b" },
    { id: "qualified",  label: "Qualified",    color: "#3b82f6" },
    { id: "unqualified",label: "Unqualified",  color: "#94a3b8" },
    { id: "follow_up",  label: "Follow Up",    color: "#ec4899" },
    { id: "converted",  label: "Converted",    color: "#10b981" },
    { id: "lost",       label: "Lost",         color: "#ef4444" }
  ],

  // ── LEAD SOURCES ─────────────────────────────────────────────────
  LEAD_SOURCES: [
    "Website Form",
    "Cold Call",
    "Referral",
    "Social Media",
    "Google Ads",
    "Facebook Ads",
    "Walk-in",
    "LeadHunter",
    "Manual Entry",
    "Other"
  ],

  // ── BUSINESS TYPES ───────────────────────────────────────────────
  BUSINESS_TYPES: [
    "Plumbing",
    "HVAC",
    "Electrical",
    "Roofing",
    "Landscaping",
    "Auto Repair",
    "Nail Salon",
    "Barbershop",
    "Restaurant",
    "Cleaning Service",
    "General Contractor",
    "Other"
  ],

  // ── USER ROLES ───────────────────────────────────────────────────
  ROLES: {
    ADMIN: "admin",       // Full access, can manage users
    MANAGER: "manager",   // Can view all leads, run reports
    AGENT: "agent"        // Can only see own leads
  },

  // ── ACTIVITY TYPES ───────────────────────────────────────────────
  ACTIVITY_TYPES: [
    { id: "call",     label: "Call",         icon: "phone" },
    { id: "email",    label: "Email",        icon: "mail" },
    { id: "note",     label: "Note",         icon: "edit-3" },
    { id: "meeting",  label: "Meeting",      icon: "calendar" },
    { id: "task",     label: "Task",         icon: "check-square" },
    { id: "status",   label: "Status Change",icon: "refresh-cw" },
    { id: "pipeline", label: "Stage Change", icon: "git-branch" }
  ],

  // ── UI SETTINGS ──────────────────────────────────────────────────
  ITEMS_PER_PAGE: 25,
  DATE_FORMAT: "MM/DD/YYYY",
  TIME_FORMAT: "hh:mm A",
  TIMEZONE: "America/New_York",

  // ── SESSION ──────────────────────────────────────────────────────
  SESSION_DURATION_HOURS: 24,
  SESSION_KEY: "edgeform_crm_session",
};

// Make config globally accessible
if (typeof window !== 'undefined') {
  window.CRM_CONFIG = CONFIG;
}
