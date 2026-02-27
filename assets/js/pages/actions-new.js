import { requireAuth, logout } from '../core/auth.js';
import { apiPost } from '../core/api.js';
import { qs, toast } from '../core/ui.js';
import { initNotifications } from '../core/notifications.js';

const userPill = qs('#userPill');
const btnLogout = qs('#btnLogout');
const form = qs('#actionForm');
const adminUsersSide = qs('#adminUsersSide');
const adminUsersTop = qs('#adminUsersTop');

await boot();

async function boot() {
  const user = await requireAuth();
  if (!user) return;

  userPill.textContent = user.full_name;
  if (String(user.role) === 'admin') {
    if (adminUsersSide) adminUsersSide.classList.remove('hidden');
    if (adminUsersTop) adminUsersTop.classList.remove('hidden');
  }
  initNotifications({ intervalMs: 5000 });

  btnLogout.addEventListener('click', async () => {
    await logout();
    window.location.href = './login.html';
  });

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

    try {
      const res = await apiPost('/actions', payload);
      toast({ title: 'Acción registrada', body: `Id: ${res.action_id}`, variant: 'ok' });
      form.reset();
    } catch (err) {
      toast({ title: 'No se pudo guardar', body: err.message, variant: 'err' });
    }
  });
}
