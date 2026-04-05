// ╔══════════════════════════════════════════════════════════════════╗
// ║  EDGEFORM CRM — UTILITIES                                      ║
// ╚══════════════════════════════════════════════════════════════════╝

const Utils = (() => {

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d)) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d)) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch { return dateStr; }
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return formatDate(dateStr);
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function debounce(fn, ms) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function csvToArray(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj = {};
      headers.forEach((h, i) => obj[h] = vals[i] || '');
      return obj;
    });
  }

  function arrayToCsv(arr) {
    if (!arr.length) return '';
    const headers = Object.keys(arr[0]);
    const lines = [headers.join(',')];
    arr.forEach(row => {
      lines.push(headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','));
    });
    return lines.join('\n');
  }

  return { formatDate, formatDateTime, timeAgo, generateId, debounce, escapeHtml, csvToArray, arrayToCsv };
})();
