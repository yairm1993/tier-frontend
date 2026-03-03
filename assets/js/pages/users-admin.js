import { requireAuth, logout } from '../core/auth.js';
import { apiGet, apiPost } from '../core/api.js';
import { qs, toast, openModal, closeModal } from '../core/ui.js';
import { initNotifications } from '../core/notifications.js';

const userPill = qs('#userPill');
const btnLogout = qs('#btnLogout');
const btnReload = qs('#btnReload');
const btnNewUser = qs('#btnNewUser');
const usersMeta = qs('#usersMeta');
const usersTable = qs('#usersTable');

const btnReloadDomains = qs('#btnReloadDomains');
const btnNewDomain = qs('#btnNewDomain');
const domainsMeta = qs('#domainsMeta');
const domainsTable = qs('#domainsTable');

await boot();

async function boot() {
  const user = await requireAuth();
  if (!user) return;

  if (String(user.role) !== 'admin') {
    window.location.href = './dashboard.html';
    return;
  }

  userPill.textContent = user.full_name;
  initNotifications({ intervalMs: 5000 });

  btnLogout.addEventListener('click', async () => {
    await logout();
    window.location.href = './login.html';
  });

  btnReload.addEventListener('click', () => load());
  btnNewUser.addEventListener('click', () => openCreateModal());

  btnReloadDomains.addEventListener('click', () => loadDomains());
  btnNewDomain.addEventListener('click', () => openCreateDomainModal());

  await load();
  await loadDomains();
}

async function load() {
  usersMeta.textContent = 'Cargando...';
  usersTable.innerHTML = '';

  try {
    const data = await apiGet('/admin/users');
    const items = data.items || [];
    usersMeta.textContent = `${items.length} usuarios`;
    renderTable(items);
  } catch (e) {
    usersMeta.textContent = '';
    toast({ title: 'No se pudo cargar', body: e.message, variant: 'err' });
  }
}

function renderTable(items) {
  const table = document.createElement('table');
  table.className = 'table';
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';

  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  ['Id', 'Nombre', 'Email', 'Rol', 'Activo', 'Acciones'].forEach(t => {
    const th = document.createElement('th');
    th.textContent = t;
    th.style.textAlign = 'left';
    th.style.padding = '10px 8px';
    th.style.borderBottom = '1px solid rgba(0,0,0,.08)';
    hr.appendChild(th);
  });
  thead.appendChild(hr);

  const tbody = document.createElement('tbody');

  items.forEach(u => {
    const tr = document.createElement('tr');

    const tdId = td(String(u.id));
    const tdName = td(String(u.full_name || ''));
    const tdEmail = td(String(u.email || ''));
    const tdRole = td(String(u.role || ''));
    const tdActive = td(String(u.is_active) === '1' || u.is_active === 1 ? 'Sí' : 'No');

    const tdActions = document.createElement('td');
    tdActions.style.padding = '10px 8px';
    tdActions.style.borderBottom = '1px solid rgba(0,0,0,.06)';

    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn';
    btnEdit.type = 'button';
    btnEdit.textContent = 'Editar';
    btnEdit.addEventListener('click', () => openEditModal(u));

    const btnPwd = document.createElement('button');
    btnPwd.className = 'btn';
    btnPwd.type = 'button';
    btnPwd.style.marginLeft = '8px';
    btnPwd.textContent = 'Password';
    btnPwd.addEventListener('click', () => openPasswordModal(u));

    tdActions.appendChild(btnEdit);
    tdActions.appendChild(btnPwd);

    tr.appendChild(tdId);
    tr.appendChild(tdName);
    tr.appendChild(tdEmail);
    tr.appendChild(tdRole);
    tr.appendChild(tdActive);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  usersTable.appendChild(table);

  function td(text) {
    const el = document.createElement('td');
    el.textContent = text;
    el.style.padding = '10px 8px';
    el.style.borderBottom = '1px solid rgba(0,0,0,.06)';
    return el;
  }
}

function openCreateModal() {
  const body = document.createElement('div');
  body.innerHTML = `
    <div class="grid two">
      <label class="field"><span>Nombre</span><input id="u_full_name" /></label>
      <label class="field"><span>Email</span><input id="u_email" type="email" /></label>
    </div>
    <div class="grid two" style="margin-top:10px">
      <label class="field"><span>Rol</span>
        <select id="u_role">
          <option value="member" selected>member</option>
          <option value="leader">leader</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <label class="field"><span>Activo</span>
        <select id="u_active">
          <option value="1" selected>Sí</option>
          <option value="0">No</option>
        </select>
      </label>
    </div>
    <div style="margin-top:10px">
      <label class="field"><span>Password (mín. 8)</span><input id="u_password" type="password" /></label>
    </div>
  `;

  const btnSave = document.createElement('button');
  btnSave.className = 'btn primary';
  btnSave.type = 'button';
  btnSave.textContent = 'Crear';
  btnSave.addEventListener('click', async () => {
    const payload = {
      full_name: String(qs('#u_full_name', body).value || '').trim(),
      email: String(qs('#u_email', body).value || '').trim(),
      role: String(qs('#u_role', body).value || 'member'),
      is_active: Number(qs('#u_active', body).value || 1),
      password: String(qs('#u_password', body).value || ''),
    };

    try {
      await apiPost('/admin/users/create', payload);
      closeModal();
      toast({ title: 'Usuario creado', variant: 'ok' });
      await load();
    } catch (e) {
      toast({ title: 'No se pudo crear', body: e.message, variant: 'err' });
    }
  });

  const btnCancel = document.createElement('button');
  btnCancel.className = 'btn';
  btnCancel.type = 'button';
  btnCancel.textContent = 'Cancelar';
  btnCancel.addEventListener('click', () => closeModal());

  openModal({
    title: 'Nuevo usuario',
    bodyNode: body,
    footerButtons: [btnCancel, btnSave],
  });
}

function openEditModal(u) {
  const body = document.createElement('div');
  body.innerHTML = `
    <div class="grid two">
      <label class="field"><span>Nombre</span><input id="u_full_name" /></label>
      <label class="field"><span>Email</span><input id="u_email" type="email" /></label>
    </div>
    <div class="grid two" style="margin-top:10px">
      <label class="field"><span>Rol</span>
        <select id="u_role">
          <option value="member">member</option>
          <option value="leader">leader</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <label class="field"><span>Activo</span>
        <select id="u_active">
          <option value="1">Sí</option>
          <option value="0">No</option>
        </select>
      </label>
    </div>
  `;

  qs('#u_full_name', body).value = String(u.full_name || '');
  qs('#u_email', body).value = String(u.email || '');
  qs('#u_role', body).value = String(u.role || 'member');
  qs('#u_active', body).value = (String(u.is_active) === '1' || u.is_active === 1) ? '1' : '0';

  const btnSave = document.createElement('button');
  btnSave.className = 'btn primary';
  btnSave.type = 'button';
  btnSave.textContent = 'Guardar';
  btnSave.addEventListener('click', async () => {
    const payload = {
      id: Number(u.id),
      full_name: String(qs('#u_full_name', body).value || '').trim(),
      email: String(qs('#u_email', body).value || '').trim(),
      is_active: Number(qs('#u_active', body).value || 1),
    };

    try {
      await apiPost('/admin/users/update', payload);
      await apiPost('/admin/users/set-role', { id: Number(u.id), role: String(qs('#u_role', body).value || 'member') });
      closeModal();
      toast({ title: 'Usuario actualizado', variant: 'ok' });
      await load();
    } catch (e) {
      toast({ title: 'No se pudo actualizar', body: e.message, variant: 'err' });
    }
  });

  const btnCancel = document.createElement('button');
  btnCancel.className = 'btn';
  btnCancel.type = 'button';
  btnCancel.textContent = 'Cancelar';
  btnCancel.addEventListener('click', () => closeModal());

  openModal({
    title: `Editar usuario #${u.id}`,
    bodyNode: body,
    footerButtons: [btnCancel, btnSave],
  });
}

async function loadDomains() {
  domainsMeta.textContent = 'Cargando...';
  domainsTable.innerHTML = '';

  try {
    const data = await apiGet('/admin/domains');
    const items = data.items || [];
    domainsMeta.textContent = `${items.length} empresas`;
    renderDomainsTable(items);
  } catch (e) {
    domainsMeta.textContent = '';
    toast({ title: 'No se pudo cargar empresas', body: e.message, variant: 'err' });
  }
}

function renderDomainsTable(items) {
  const table = document.createElement('table');
  table.className = 'table';
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';

  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  ['Id', 'Empresa', 'Dominio', 'Activo', 'Acciones'].forEach(t => {
    const th = document.createElement('th');
    th.textContent = t;
    th.style.textAlign = 'left';
    th.style.padding = '10px 8px';
    th.style.borderBottom = '1px solid rgba(0,0,0,.08)';
    hr.appendChild(th);
  });
  thead.appendChild(hr);

  const tbody = document.createElement('tbody');

  items.forEach(d => {
    const tr = document.createElement('tr');

    const tdId = dTd(String(d.id));
    const tdName = dTd(String(d.display_name || ''));
    const tdDomain = dTd(String(d.domain_name || ''));
    const tdActive = dTd((String(d.is_active) === '1' || d.is_active === 1) ? 'Sí' : 'No');

    const tdActions = document.createElement('td');
    tdActions.style.padding = '10px 8px';
    tdActions.style.borderBottom = '1px solid rgba(0,0,0,.06)';

    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn';
    btnEdit.type = 'button';
    btnEdit.textContent = 'Editar';
    btnEdit.addEventListener('click', () => openEditDomainModal(d));

    tdActions.appendChild(btnEdit);

    tr.appendChild(tdId);
    tr.appendChild(tdName);
    tr.appendChild(tdDomain);
    tr.appendChild(tdActive);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  domainsTable.appendChild(table);

  function dTd(text) {
    const el = document.createElement('td');
    el.textContent = text;
    el.style.padding = '10px 8px';
    el.style.borderBottom = '1px solid rgba(0,0,0,.06)';
    return el;
  }
}

function openCreateDomainModal() {
  const body = document.createElement('div');
  body.innerHTML = `
    <div class="grid two">
      <label class="field"><span>Nombre de empresa</span><input id="d_display_name" placeholder="Astra People" /></label>
      <label class="field"><span>Dominio</span><input id="d_domain_name" placeholder="astrapeople.com.mx" /></label>
    </div>
    <div class="grid two" style="margin-top:10px">
      <label class="field"><span>Activo</span>
        <select id="d_active">
          <option value="1" selected>Sí</option>
          <option value="0">No</option>
        </select>
      </label>
    </div>
  `;

  const btnSave = document.createElement('button');
  btnSave.className = 'btn primary';
  btnSave.type = 'button';
  btnSave.textContent = 'Crear';
  btnSave.addEventListener('click', async () => {
    const payload = {
      display_name: String(qs('#d_display_name', body).value || '').trim(),
      domain_name: String(qs('#d_domain_name', body).value || '').trim().toLowerCase(),
      is_active: Number(qs('#d_active', body).value || 1),
    };

    try {
      await apiPost('/admin/domains/create', payload);
      closeModal();
      toast({ title: 'Empresa creada', variant: 'ok' });
      await loadDomains();
    } catch (e) {
      toast({ title: 'No se pudo crear empresa', body: e.message, variant: 'err' });
    }
  });

  const btnCancel = document.createElement('button');
  btnCancel.className = 'btn';
  btnCancel.type = 'button';
  btnCancel.textContent = 'Cancelar';
  btnCancel.addEventListener('click', () => closeModal());

  openModal({
    title: 'Nueva empresa',
    bodyNode: body,
    footerButtons: [btnCancel, btnSave],
  });
}

function openEditDomainModal(d) {
  const body = document.createElement('div');
  body.innerHTML = `
    <div class="grid two">
      <label class="field"><span>Nombre de empresa</span><input id="d_display_name" /></label>
      <label class="field"><span>Dominio</span><input id="d_domain_name" /></label>
    </div>
    <div class="grid two" style="margin-top:10px">
      <label class="field"><span>Activo</span>
        <select id="d_active">
          <option value="1">Sí</option>
          <option value="0">No</option>
        </select>
      </label>
    </div>
  `;

  qs('#d_display_name', body).value = String(d.display_name || '');
  qs('#d_domain_name', body).value = String(d.domain_name || '');
  qs('#d_active', body).value = (String(d.is_active) === '1' || d.is_active === 1) ? '1' : '0';

  const btnSave = document.createElement('button');
  btnSave.className = 'btn primary';
  btnSave.type = 'button';
  btnSave.textContent = 'Guardar';
  btnSave.addEventListener('click', async () => {
    const payload = {
      id: Number(d.id),
      display_name: String(qs('#d_display_name', body).value || '').trim(),
      domain_name: String(qs('#d_domain_name', body).value || '').trim().toLowerCase(),
      is_active: Number(qs('#d_active', body).value || 1),
    };

    try {
      await apiPost('/admin/domains/update', payload);
      closeModal();
      toast({ title: 'Empresa actualizada', variant: 'ok' });
      await loadDomains();
    } catch (e) {
      toast({ title: 'No se pudo actualizar empresa', body: e.message, variant: 'err' });
    }
  });

  const btnCancel = document.createElement('button');
  btnCancel.className = 'btn';
  btnCancel.type = 'button';
  btnCancel.textContent = 'Cancelar';
  btnCancel.addEventListener('click', () => closeModal());

  openModal({
    title: `Editar empresa #${d.id}`,
    bodyNode: body,
    footerButtons: [btnCancel, btnSave],
  });
}

function openPasswordModal(u) {
  const body = document.createElement('div');
  body.innerHTML = `
    <div class="muted small">Usuario: ${escapeHtml(String(u.email || ''))}</div>
    <div style="margin-top:10px">
      <label class="field"><span>Nuevo password (mín. 8)</span><input id="u_password" type="password" /></label>
    </div>
  `;

  const btnSave = document.createElement('button');
  btnSave.className = 'btn primary';
  btnSave.type = 'button';
  btnSave.textContent = 'Actualizar';
  btnSave.addEventListener('click', async () => {
    const password = String(qs('#u_password', body).value || '');
    try {
      await apiPost('/admin/users/set-password', { id: Number(u.id), password });
      closeModal();
      toast({ title: 'Password actualizado', variant: 'ok' });
    } catch (e) {
      toast({ title: 'No se pudo actualizar', body: e.message, variant: 'err' });
    }
  });

  const btnCancel = document.createElement('button');
  btnCancel.className = 'btn';
  btnCancel.type = 'button';
  btnCancel.textContent = 'Cancelar';
  btnCancel.addEventListener('click', () => closeModal());

  openModal({
    title: 'Cambiar password',
    bodyNode: body,
    footerButtons: [btnCancel, btnSave],
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
