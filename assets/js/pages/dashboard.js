import { requireAuth, logout } from '../core/auth.js';
import { apiGet } from '../core/api.js';
import { qs, toast, formatDateISO, pill } from '../core/ui.js';
import { initNotifications } from '../core/notifications.js';

const kpiDate = qs('#kpiDate');
const btnRefresh = qs('#btnRefresh');
const kpiGrid = qs('#kpiGrid');
const summaryBox = qs('#summaryBox');
const actionsBox = qs('#actionsBox');
const userPill = qs('#userPill');
const btnLogout = qs('#btnLogout');
const adminUsersSide = qs('#adminUsersSide');
const adminUsersTop = qs('#adminUsersTop');

const KPI_DEFS = [
  { key: 'safety', name: 'Safety', good: 'lower' },
  { key: 'quality', name: 'Quality', good: 'higher' },
  { key: 'delivery', name: 'Delivery', good: 'higher' },
  { key: 'cost', name: 'Cost', good: 'lower' },
  { key: 'oee', name: 'OEE', good: 'higher' },
  { key: 'people', name: 'People', good: 'lower' },
];

await boot();

async function boot() {
  const user = await requireAuth();
  if (!user) return;

  userPill.textContent = user.full_name;
  if (String(user.role || '').toLowerCase().trim() === 'admin') {
    if (adminUsersSide) adminUsersSide.classList.remove('hidden');
    if (adminUsersTop) adminUsersTop.classList.remove('hidden');
  }
  initNotifications({ intervalMs: 5000 });

  kpiDate.value = formatDateISO(new Date());
  btnRefresh.addEventListener('click', () => load());
  btnLogout.addEventListener('click', async () => {
    await logout();
    window.location.href = './login.html';
  });

  await load();
}

async function load() {
  try {
    const date = kpiDate.value;
    const data = await apiGet(`/kpis/daily?date=${encodeURIComponent(date)}&area=Planta`);
    renderKpis(data.kpis);
    await renderTopActions();
  } catch (e) {
    toast({ title: 'No se pudo cargar dashboard', body: e.message, variant: 'err' });
  }
}

function renderKpis(row) {
  kpiGrid.innerHTML = '';

  const totals = { green: 0, red: 0, amber: 0 };

  KPI_DEFS.forEach(def => {
    const value = row ? row[`${def.key}_value`] : null;
    const target = row ? row[`${def.key}_target`] : null;

    const status = calcStatus(def.good, value, target);
    totals[status] += 1;

    const card = document.createElement('div');
    card.className = 'card kpi-card';

    const top = document.createElement('div');
    top.className = 'kpi-top';

    const name = document.createElement('div');
    name.className = 'kpi-name';
    name.textContent = def.name;

    const sema = document.createElement('div');
    sema.className = `sema ${status}`;

    top.appendChild(name);
    top.appendChild(sema);

    const meta = document.createElement('div');
    meta.className = 'kpi-meta';

    const prog = document.createElement('div');
    prog.className = 'progress';

    const bar = document.createElement('div');
    const pct = calcPct(def.good, value, target);
    bar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    prog.appendChild(bar);

    const vals = document.createElement('div');
    vals.className = 'kpi-values';
    vals.textContent = `Actual: ${fmt(value)}    Meta: ${fmt(target)}`;

    meta.appendChild(prog);
    meta.appendChild(vals);

    card.appendChild(top);
    card.appendChild(meta);

    kpiGrid.appendChild(card);
  });

  summaryBox.innerHTML = '';
  summaryBox.appendChild(pill(`En meta: ${totals.green}`, 'green'));
  summaryBox.appendChild(document.createTextNode(' '));
  summaryBox.appendChild(pill(`Fuera de meta: ${totals.red}`, 'red'));
  summaryBox.appendChild(document.createTextNode(' '));
  summaryBox.appendChild(pill(`Sin dato/meta: ${totals.amber}`, 'amber'));
}

async function renderTopActions() {
  actionsBox.innerHTML = '';
  const data = await apiGet('/actions?status=open');
  const items = (data.items || []).slice(0, 6);

  if (!items.length) {
    const el = document.createElement('div');
    el.className = 'muted';
    el.textContent = 'Sin acciones abiertas.';
    actionsBox.appendChild(el);
    return;
  }

  items.forEach(a => {
    const it = document.createElement('div');
    it.className = 'list-item';

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.gap = '10px';

    const left = document.createElement('div');
    left.style.fontWeight = '800';
    left.textContent = a.title;

    const right = document.createElement('div');
    right.className = 'muted small';
    right.textContent = `Compromiso: ${a.due_date}`;

    const sub = document.createElement('div');
    sub.className = 'muted';
    sub.style.marginTop = '6px';
    sub.textContent = `${a.owner_name} • ${a.priority}`;

    row.appendChild(left);
    row.appendChild(right);
    it.appendChild(row);
    it.appendChild(sub);

    actionsBox.appendChild(it);
  });
}

function calcStatus(good, value, target) {
  if (value === null || target === null || value === '' || target === '') return 'amber';
  const v = Number(value);
  const t = Number(target);
  if (!Number.isFinite(v) || !Number.isFinite(t)) return 'amber';
  if (good === 'higher') return v >= t ? 'green' : 'red';
  return v <= t ? 'green' : 'red';
}

function calcPct(good, value, target) {
  if (value === null || target === null) return 0;
  const v = Number(value);
  const t = Number(target);
  if (!Number.isFinite(v) || !Number.isFinite(t) || t === 0) return 0;
  if (good === 'higher') return (v / t) * 100;
  return (t / Math.max(v, 0.0001)) * 100;
}

function fmt(x) {
  if (x === null || x === undefined || x === '') return '-';
  const n = Number(x);
  if (!Number.isFinite(n)) return String(x);
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}
