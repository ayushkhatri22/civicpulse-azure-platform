/* ------------------------------------------------------------------
   CivicPulse — public dashboard
   Reads data/dashboard-data.json produced by the Logic Apps workflow.

   IMPORTANT: this file performs NO calculation of required metrics.
   Every published figure is computed in the Logic App and read here
   as-is. The only arithmetic below is presentational: percentage
   shares shown beneath the KPI cards and bar widths as a proportion
   of the largest value in the chart. Nothing is hard-coded.
------------------------------------------------------------------ */

'use strict';

var DATA_URL = 'data/dashboard-data.json';
var AUTO_REFRESH_MS = 60000;   // poll once a minute so the page reflects new runs
var STALE_AFTER_HOURS = 26;    // flag data older than a daily processing cycle

var state = { data: null, dimension: 'category' };

/* ---------- element helpers ---------- */
function el(id) { return document.getElementById(id); }
function show(id) { el(id).classList.remove('hidden'); }
function hide(id) { el(id).classList.add('hidden'); }

/* ---------- data loading ---------- */
function loadData(isManual) {
  var btn = el('refresh-btn');
  if (isManual) { btn.disabled = true; btn.textContent = 'Refreshing…'; }

  // Cache-bust so a replaced blob is picked up rather than served from cache.
  fetch(DATA_URL + '?t=' + Date.now(), { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) { throw new Error('Server responded ' + res.status); }
      return res.json();
    })
    .then(function (data) {
      if (!data || !data.metrics) { throw new Error('Published file is missing the metrics object'); }
      state.data = data;
      hide('loading-state');
      hide('error-state');
      render(data);
    })
    .catch(function (err) {
      hide('loading-state');
      hide('dashboard');
      hide('empty-state');
      el('error-detail').textContent =
        'The dashboard could not retrieve the published dataset (' + err.message +
        '). This is usually temporary — please try again shortly.';
      show('error-state');
    })
    .then(function () {
      if (isManual) { btn.disabled = false; btn.textContent = 'Refresh data'; }
    });
}

/* ---------- rendering ---------- */
function render(data) {
  renderTimestamp(data.lastUpdated);

  var m = data.metrics || {};
  var total = numberOrZero(m.totalIncidents);

  // Empty-state: a processed file that yielded no valid records.
  if (total === 0) {
    hide('dashboard');
    show('empty-state');
    return;
  }
  hide('empty-state');
  show('dashboard');

  renderKpis(m, total);
  renderChart();
  renderRecent(data.recentRecords);
}

function numberOrZero(v) {
  return (typeof v === 'number' && isFinite(v)) ? v : 0;
}

function fmt(n) {
  return numberOrZero(n).toLocaleString('en-AU');
}

function renderKpis(m, total) {
  el('kpi-total').textContent = fmt(m.totalIncidents);
  el('kpi-open').firstChild.nodeValue = fmt(m.openIncidents);
  el('kpi-progress').firstChild.nodeValue = fmt(m.inProgressIncidents);
  el('kpi-resolved').firstChild.nodeValue = fmt(m.resolvedIncidents);

  el('kpi-open-pct').textContent = share(m.openIncidents, total);
  el('kpi-progress-pct').textContent = share(m.inProgressIncidents, total);
  el('kpi-resolved-pct').textContent = share(m.resolvedIncidents, total);
}

/* Presentational only — a share of the published total, not a required metric. */
function share(value, total) {
  if (!total) { return ''; }
  return Math.round((numberOrZero(value) / total) * 100) + '% of all reports';
}

function renderTimestamp(iso) {
  var timeEl = el('updated-time');
  var relEl = el('updated-rel');
  var badge = el('freshness');

  if (!iso) {
    timeEl.textContent = 'Not available';
    relEl.textContent = '';
    badge.classList.add('hidden');
    return;
  }

  var d = new Date(iso);
  if (isNaN(d.getTime())) {
    timeEl.textContent = iso;
    relEl.textContent = '';
    return;
  }

  timeEl.setAttribute('datetime', iso);
  // Published in UTC, displayed in the reader's local time.
  timeEl.textContent = d.toLocaleString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  var hoursAgo = (Date.now() - d.getTime()) / 3600000;
  relEl.textContent = ' · ' + relativeTime(hoursAgo);

  badge.classList.remove('hidden', 'stale', 'live');
  if (hoursAgo > STALE_AFTER_HOURS) {
    badge.classList.add('stale');
    badge.textContent = 'May be out of date';
  } else {
    badge.classList.add('live');
    badge.textContent = 'Current';
  }
}

function relativeTime(hoursAgo) {
  if (hoursAgo < 0.0167) { return 'just now'; }
  if (hoursAgo < 1) {
    var mins = Math.round(hoursAgo * 60);
    return mins + (mins === 1 ? ' minute ago' : ' minutes ago');
  }
  if (hoursAgo < 24) {
    var hrs = Math.round(hoursAgo);
    return hrs + (hrs === 1 ? ' hour ago' : ' hours ago');
  }
  var days = Math.round(hoursAgo / 24);
  return days + (days === 1 ? ' day ago' : ' days ago');
}

/* ---------- chart ---------- */
function renderChart() {
  var data = state.data;
  var byCategory = state.dimension === 'category';
  var rows = (byCategory ? data.byCategory : data.byPriority) || [];
  var keyName = byCategory ? 'category' : 'priority';
  var chart = el('chart');

  el('chart-dimension').textContent = byCategory ? 'category' : 'priority';
  chart.innerHTML = '';

  if (!rows.length) {
    chart.innerHTML = '<p style="margin:0;color:#55555C;font-size:.9rem;">' +
      'No breakdown is available for the current dataset.</p>';
    el('chart-summary').textContent = 'No breakdown data available.';
    return;
  }

  // Sort largest first so the chart reads as a ranking.
  var sorted = rows.slice().sort(function (a, b) {
    return numberOrZero(b.count) - numberOrZero(a.count);
  });

  var max = sorted.reduce(function (acc, r) {
    return Math.max(acc, numberOrZero(r.count));
  }, 0) || 1;

  var summary = [];

  sorted.forEach(function (r) {
    var label = r[keyName] != null ? String(r[keyName]) : 'Unspecified';
    var count = numberOrZero(r.count);
    var pct = (count / max) * 100;

    var row = document.createElement('div');
    row.className = 'bar-row';

    var lab = document.createElement('span');
    lab.className = 'bar-label';
    lab.textContent = label;

    var track = document.createElement('span');
    track.className = 'bar-track';

    var fill = document.createElement('span');
    fill.className = 'bar-fill' + (byCategory ? '' : ' p-' + label.toLowerCase().replace(/\s+/g, ''));
    fill.style.width = pct.toFixed(1) + '%';

    var num = document.createElement('span');
    num.className = 'bar-count';
    num.textContent = fmt(count);

    track.appendChild(fill);
    row.appendChild(lab);
    row.appendChild(track);
    row.appendChild(num);
    chart.appendChild(row);

    summary.push(label + ': ' + count);
  });

  // Screen readers get the same information the bars convey visually.
  el('chart-summary').textContent =
    'Incidents by ' + (byCategory ? 'category' : 'priority') + '. ' + summary.join('. ') + '.';
}

/* ---------- recent records table ---------- */
function renderRecent(records) {
  var body = el('recent-body');
  body.innerHTML = '';

  if (!records || !records.length) {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.colSpan = 6;
    td.textContent = 'No recent records are available in the current dataset.';
    td.style.color = '#55555C';
    tr.appendChild(td);
    body.appendChild(tr);
    return;
  }

  records.forEach(function (r) {
    var tr = document.createElement('tr');

    tr.appendChild(cell(r.incident_id, 'id'));
    tr.appendChild(cell(formatDate(r.reported_date)));
    tr.appendChild(cell(r.suburb));
    tr.appendChild(cell(r.category));

    var statusTd = document.createElement('td');
    var pill = document.createElement('span');
    var s = r.status ? String(r.status) : 'Unknown';
    pill.className = 'pill s-' + s.toLowerCase().replace(/\s+/g, '');
    pill.textContent = s;
    statusTd.appendChild(pill);
    tr.appendChild(statusTd);

    tr.appendChild(cell(r.priority));
    body.appendChild(tr);
  });
}

function cell(value, cls) {
  var td = document.createElement('td');
  // textContent, not innerHTML — published values are never treated as markup.
  td.textContent = (value === null || value === undefined || value === '') ? '—' : String(value);
  if (cls) { td.className = cls; }
  return td;
}

function formatDate(iso) {
  if (!iso) { return '—'; }
  var d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) { return iso; }
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ---------- events ---------- */
el('refresh-btn').addEventListener('click', function () { loadData(true); });
el('retry-btn').addEventListener('click', function () {
  hide('error-state');
  show('loading-state');
  loadData(true);
});

el('btn-category').addEventListener('click', function () { setDimension('category'); });
el('btn-priority').addEventListener('click', function () { setDimension('priority'); });

function setDimension(dim) {
  if (state.dimension === dim) { return; }
  state.dimension = dim;
  el('btn-category').setAttribute('aria-pressed', String(dim === 'category'));
  el('btn-priority').setAttribute('aria-pressed', String(dim === 'priority'));
  if (state.data) { renderChart(); }
}

/* ---------- start ---------- */
loadData(false);
setInterval(function () { loadData(false); }, AUTO_REFRESH_MS);
