import { requireAuth, logout } from '../core/auth.js';
import { apiGet, apiPost } from '../core/api.js';
import { qs, toast } from '../core/ui.js';
import { initNotifications } from '../core/notifications.js';

const userPill = qs('#userPill');
const btnLogout = qs('#btnLogout');
const form = qs('#actionForm');
const ownerEmail = qs('#ownerEmail');
const adminUsersSide = qs('#adminUsersSide');
const adminUsersTop = qs('#adminUsersTop');

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

  await loadOwners(user);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const payload = {
      owner_email: String(fd.get('owner_email') || '').trim(),
      priority: String(fd.get('priority') || 'medium'),
      due_date: String(fd.get('due_date') || ''),
      title: String(fd.get('title') || '').trim(),
      description: String(fd.get('description') || '').trim(),
    };

    if (payload.owner_email === '') {
      toast({ title: 'Selecciona un responsable', body: 'El responsable debe estar registrado.', variant: 'err' });
      return;
    }

    try {
      const res = await apiPost('/actions', payload);
      toast({ title: 'Acción registrada', body: `Id: ${res.action_id}`, variant: 'ok' });
      form.reset();
    } catch (err) {
      toast({ title: 'No se pudo guardar', body: err.message, variant: 'err' });
    }
  });
}

async function loadOwners(user) {
  try {
    const isAdmin = user && String(user.role || '').toLowerCase().trim() === 'admin';
    const data = await apiGet(isAdmin ? '/admin/users' : '/domain/members');
    const items = (data && data.items) ? data.items : [];

    const selected = String(ownerEmail.value || '');
    ownerEmail.innerHTML = '';

    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.disabled = true;
    opt0.selected = true;
    opt0.textContent = 'Selecciona un responsable';
    ownerEmail.appendChild(opt0);

    items
      .filter(u => (String(u.is_active) === '1' || u.is_active === 1))
      .forEach(u => {
        const opt = document.createElement('option');
        opt.value = String(u.email || '');
        opt.textContent = `${String(u.full_name || '').trim()} (${String(u.email || '').trim()})`;
        ownerEmail.appendChild(opt);
      });

    if (selected) {
      ownerEmail.value = selected;
    }
  } catch (err) {
    toast({ title: 'No se pudo cargar responsables', body: err.message, variant: 'err' });
  }
}
