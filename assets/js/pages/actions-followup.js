import { requireAuth, logout } from '../core/auth.js';
import { apiGet, apiPost, apiPostForm } from '../core/api.js';
import { qs, toast, openModal, pill } from '../core/ui.js';
import { initNotifications } from '../core/notifications.js';
import { confettiBurst } from '../core/confetti.js';

const userPill = qs('#userPill');
const btnLogout = qs('#btnLogout');
const bucketSel = qs('#bucket');
const btnReload = qs('#btnReload');
const actionList = qs('#actionList');
const actionDetail = qs('#actionDetail');
const adminUsersSide = qs('#adminUsersSide');
const adminUsersTop = qs('#adminUsersTop');

let selectedId = null;

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

  btnLogout.addEventListener('click', async () => {
    await logout();
    window.location.href = './login.html';
  });

  btnReload.addEventListener('click', () => loadList());
  bucketSel.addEventListener('change', () => loadList());

  await loadList();
}

async function loadList() {
  selectedId = null;
  actionDetail.innerHTML = '<div class="muted">Selecciona una acción para ver el detalle.</div>';
  actionList.innerHTML = '';

  try {
    const bucket = bucketSel.value;
    const query = buildQuery(bucket);
    const data = await apiGet(`/actions${query}`);
    renderList(data.items || []);
  } catch (e) {
    toast({ title: 'No se pudo cargar acciones', body: e.message, variant: 'err' });
  }
}

function buildQuery(bucket) {
  if (bucket === 'overdue') return '?filter=overdue';
  if (bucket === 'due_soon') return '?filter=due_soon';
  if (bucket === 'closed') return '?status=closed';
  if (bucket === 'all') return '?status=all';
  return '?status=open';
}

function renderList(items) {
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.textContent = 'Sin registros.';
    actionList.appendChild(empty);
    return;
  }

  items.forEach(a => {
    const it = document.createElement('div');
    it.className = 'list-item';

    const head = document.createElement('div');
    head.style.display = 'flex';
    head.style.justifyContent = 'space-between';
    head.style.gap = '10px';

    const title = document.createElement('div');
    title.style.fontWeight = '800';
    title.textContent = a.title;

    const due = document.createElement('div');
    due.className = 'muted small';
    due.textContent = a.status === 'closed' ? 'Cerrada' : `Compromiso: ${a.due_date}`;

    const sub = document.createElement('div');
    sub.className = 'muted';
    sub.style.marginTop = '6px';
    sub.textContent = `${a.owner_name} • ${a.priority}`;

    const bucketPill = bucketToPill(a.bucket);

    head.appendChild(title);
    head.appendChild(due);
    it.appendChild(head);
    it.appendChild(sub);
    it.appendChild(bucketPill);

    it.addEventListener('click', async () => {
      selectedId = a.id;
      Array.from(actionList.children).forEach(c => c.classList.remove('active'));
      it.classList.add('active');
      await loadDetail(a.id);
    });

    actionList.appendChild(it);
  });
}

function bucketToPill(bucket) {
  if (bucket === 'overdue') return pill('Vencida', 'red');
  if (bucket === 'due_soon') return pill('Por vencer', 'amber');
  if (bucket === 'closed') return pill('Cerrada', 'green');
  return pill('Abierta', 'amber');
}

async function loadDetail(id) {
  try {
    const data = await apiGet(`/actions/view?id=${encodeURIComponent(id)}`);
    renderDetail(data);
  } catch (e) {
    toast({ title: 'No se pudo cargar detalle', body: e.message, variant: 'err' });
  }
}

function renderDetail(data) {
  const a = data.action;
  actionDetail.innerHTML = '';

  const ownerDisplay = a.owner_user_name ? String(a.owner_user_name) : String(a.owner_name || '');
  const assignedBy = a.created_by_name ? String(a.created_by_name) : '';

  const head = document.createElement('div');
  head.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">
      <div>
        <div style="font-weight:900;font-size:16px">${escapeHtml(a.title)}</div>
        <div class="muted">Responsable: ${escapeHtml(ownerDisplay)} ${a.owner_email ? '• ' + escapeHtml(a.owner_email) : ''}</div>
        ${assignedBy ? `<div class="muted">Asignada por: ${escapeHtml(assignedBy)}</div>` : ''}
        <div class="muted">Prioridad: ${escapeHtml(a.priority)} • Compromiso: ${escapeHtml(a.due_date)} • Estatus: ${escapeHtml(a.status)}</div>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <button class="btn" type="button" id="btnEvidence">Subir evidencia</button>
        <button class="btn primary" type="button" id="btnClose" ${a.status === 'closed' ? 'disabled' : ''}>Cerrar</button>
      </div>
    </div>
    <div class="divider"></div>
    <div class="muted" style="white-space:pre-line">${escapeHtml(a.description)}</div>
  `;

  actionDetail.appendChild(head);

  const evTitle = document.createElement('div');
  evTitle.style.marginTop = '12px';
  evTitle.style.fontWeight = '800';
  evTitle.textContent = 'Evidencias';
  actionDetail.appendChild(evTitle);

  const ev = document.createElement('div');
  ev.className = 'list';
  (data.evidence || []).forEach(x => {
    const it = document.createElement('div');
    it.className = 'list-item';
    it.innerHTML = `<div style="font-weight:800">${escapeHtml(x.file_name)}</div><div class="muted small">${escapeHtml(x.created_at)} • ${escapeHtml(x.uploaded_by_name)}</div>`;
    ev.appendChild(it);
  });
  if (!(data.evidence || []).length) {
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.textContent = 'Sin evidencias.';
    ev.appendChild(empty);
  }
  actionDetail.appendChild(ev);

  const tlTitle = document.createElement('div');
  tlTitle.style.marginTop = '14px';
  tlTitle.style.fontWeight = '800';
  tlTitle.textContent = 'Timeline (histórico)';
  actionDetail.appendChild(tlTitle);

  const tl = document.createElement('div');
  tl.className = 'timeline';

  (data.history || []).forEach(h => {
    const item = document.createElement('div');
    item.className = 'tl-item';

    const dot = document.createElement('div');
    dot.className = 'tl-dot';

    const card = document.createElement('div');
    card.className = 'tl-card';

    const head = document.createElement('div');
    head.className = 'tl-head';
    head.innerHTML = `<div>${escapeHtml(h.update_type)} • ${escapeHtml(h.updated_by_name)}</div><div>${escapeHtml(h.created_at)}</div>`;

    const msg = document.createElement('div');
    msg.className = 'muted';
    msg.style.whiteSpace = 'pre-line';
    msg.style.marginTop = '6px';
    msg.textContent = h.message;

    card.appendChild(head);
    card.appendChild(msg);

    item.appendChild(dot);
    item.appendChild(card);

    tl.appendChild(item);
  });

  actionDetail.appendChild(tl);

  const btnClose = qs('#btnClose', actionDetail);
  const btnEvidence = qs('#btnEvidence', actionDetail);

  if (btnClose) {
    btnClose.addEventListener('click', () => confirmClose(a.id));
  }
  if (btnEvidence) {
    btnEvidence.addEventListener('click', () => openEvidenceModal(a.id));
  }
}

function confirmClose(id) {
  const node = document.createElement('div');
  node.className = 'muted';
  node.textContent = '¿Confirmas el cierre de la acción? Esto registrará el evento en el histórico.';

  const cancel = document.createElement('button');
  cancel.className = 'btn';
  cancel.type = 'button';
  cancel.textContent = 'Cancelar';
  cancel.addEventListener('click', () => {
    const host = qs('#modalHost');
    if (host) { host.classList.add('hidden'); host.innerHTML = ''; }
  });

  const ok = document.createElement('button');
  ok.className = 'btn primary';
  ok.type = 'button';
  ok.textContent = 'Cerrar acción';
  ok.addEventListener('click', async () => {
    try {
      await apiPost('/actions/close', { id });
      toast({ title: 'Acción cerrada', body: 'Excelente ejecución.', variant: 'ok' });
      confettiBurst({ durationMs: 1200 });
      const host = qs('#modalHost');
      if (host) { host.classList.add('hidden'); host.innerHTML = ''; }
      await loadList();
    } catch (e) {
      toast({ title: 'No se pudo cerrar', body: e.message, variant: 'err' });
    }
  });

  openModal({ title: 'Cierre', bodyNode: node, footerButtons: [cancel, ok] });
}

function openEvidenceModal(actionId) {
  const node = document.createElement('div');

  const form = document.createElement('form');
  form.className = 'form';

  const f1 = document.createElement('label');
  f1.className = 'field';
  const sp = document.createElement('span');
  sp.textContent = 'Archivo';
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.required = true;

  f1.appendChild(sp);
  f1.appendChild(inp);

  form.appendChild(f1);

  const btn = document.createElement('button');
  btn.className = 'btn primary';
  btn.type = 'submit';
  btn.textContent = 'Subir';

  form.appendChild(btn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = inp.files && inp.files[0];
    if (!file) {
      toast({ title: 'Archivo requerido', variant: 'err' });
      return;
    }

    try {
      const fd = new FormData();
      fd.append('action_id', String(actionId));
      fd.append('file', file);
      await apiPostForm('/actions/evidence', fd);
      toast({ title: 'Evidencia subida', body: 'Se registró en el histórico.', variant: 'ok' });
      const host = qs('#modalHost');
      if (host) { host.classList.add('hidden'); host.innerHTML = ''; }
      await loadDetail(actionId);
    } catch (e2) {
      toast({ title: 'No se pudo subir', body: e2.message, variant: 'err' });
    }
  });

  node.appendChild(form);
  openModal({ title: 'Subir evidencia', bodyNode: node, footerButtons: [] });
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
