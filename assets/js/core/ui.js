export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

export function toast({ title, body = '', variant = 'ok', timeoutMs = 3200 }) {
  const host = qs('#toastHost');
  if (!host) return;

  const el = document.createElement('div');
  el.className = `toast ${variant}`;

  const t = document.createElement('div');
  t.className = 'toast-title';
  t.textContent = title;

  const b = document.createElement('div');
  b.className = 'toast-body';
  b.textContent = body;

  el.appendChild(t);
  el.appendChild(b);
  host.appendChild(el);

  window.setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    el.style.transition = 'all .18s ease';
    window.setTimeout(() => el.remove(), 220);
  }, timeoutMs);
}

export function openModal({ title, bodyNode, footerButtons = [] }) {
  const host = qs('#modalHost');
  if (!host) return;

  host.classList.remove('hidden');
  host.innerHTML = '';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal-header';

  const titleEl = document.createElement('div');
  titleEl.className = 'modal-title';
  titleEl.textContent = title;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'icon-btn';
  closeBtn.type = 'button';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => closeModal());

  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'modal-body';
  body.appendChild(bodyNode);

  const footer = document.createElement('div');
  footer.className = 'modal-footer';

  footerButtons.forEach(btn => footer.appendChild(btn));

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);

  host.appendChild(modal);

  host.addEventListener('click', (e) => {
    if (e.target === host) closeModal();
  }, { once: true });
}

export function closeModal() {
  const host = qs('#modalHost');
  if (!host) return;
  host.classList.add('hidden');
  host.innerHTML = '';
}

export function formatDateISO(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function pill(text, color) {
  const el = document.createElement('span');
  el.className = `pill ${color}`;
  el.textContent = text;
  return el;
}
