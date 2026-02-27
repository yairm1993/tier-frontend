import { apiGet, apiPost } from './api.js';
import { qs, openModal, toast } from './ui.js';

let timer = null;

export function initNotifications({ intervalMs = 5000 } = {}) {
  const btn = qs('#btnNotifications');
  if (btn) {
    btn.addEventListener('click', async () => {
      try {
        const data = await apiGet('/notifications');
        showNotificationsModal(data.items || []);
      } catch (e) {
        toast({ title: 'No se pudieron cargar notificaciones', body: e.message, variant: 'err' });
      }
    });
  }

  stopNotifications();
  timer = window.setInterval(async () => {
    try {
      const data = await apiGet('/notifications');
      updateBadge(data.unread || 0);
    } catch {
      updateBadge(0);
    }
  }, intervalMs);
}

export function stopNotifications() {
  if (timer) {
    window.clearInterval(timer);
    timer = null;
  }
}

export function updateBadge(count) {
  const badge = qs('#notifBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = String(count);
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function showNotificationsModal(items) {
  const node = document.createElement('div');
  node.className = 'list';

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.textContent = 'Sin notificaciones.';
    node.appendChild(empty);
  }

  items.forEach(n => {
    const it = document.createElement('div');
    it.className = 'list-item';

    const head = document.createElement('div');
    head.style.display = 'flex';
    head.style.justifyContent = 'space-between';
    head.style.gap = '10px';

    const title = document.createElement('div');
    title.style.fontWeight = '800';
    title.textContent = n.title;

    const date = document.createElement('div');
    date.className = 'muted small';
    date.textContent = String(n.created_at || '');

    const body = document.createElement('div');
    body.className = 'muted';
    body.style.whiteSpace = 'pre-line';
    body.style.marginTop = '6px';
    body.textContent = n.body;

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.style.alignItems = 'center';
    footer.style.marginTop = '8px';

    const state = document.createElement('span');
    state.className = 'muted small';
    state.textContent = n.is_read ? 'Leída' : 'No leída';

    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.type = 'button';
    btn.textContent = 'Marcar como leída';
    btn.disabled = !!n.is_read;
    btn.addEventListener('click', async () => {
      try {
        await apiPost('/notifications/read', { id: n.id });
        btn.disabled = true;
        state.textContent = 'Leída';
      } catch (e) {
        toast({ title: 'No se pudo actualizar', body: e.message, variant: 'err' });
      }
    });

    head.appendChild(title);
    head.appendChild(date);
    footer.appendChild(state);
    footer.appendChild(btn);

    it.appendChild(head);
    it.appendChild(body);
    it.appendChild(footer);

    node.appendChild(it);
  });

  openModal({ title: 'Notificaciones', bodyNode: node, footerButtons: [] });
}
