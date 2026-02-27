import { login, forgot, resetPassword } from '../core/auth.js';
import { qs, toast } from '../core/ui.js';

const tabLogin = qs('#tabLogin');
const tabRecovery = qs('#tabRecovery');
const loginForm = qs('#loginForm');
const recoveryForm = qs('#recoveryForm');
const btnReset = qs('#btnReset');

function setTab(which) {
  if (which === 'login') {
    tabLogin.classList.add('active');
    tabRecovery.classList.remove('active');
    loginForm.classList.remove('hidden');
    recoveryForm.classList.add('hidden');
  } else {
    tabRecovery.classList.add('active');
    tabLogin.classList.remove('active');
    recoveryForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

tabLogin.addEventListener('click', () => setTab('login'));
tabRecovery.addEventListener('click', () => setTab('recovery'));

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(loginForm);
  const email = String(fd.get('email') || '').trim();
  const password = String(fd.get('password') || '');

  try {
    await login(email, password);
    toast({ title: 'Bienvenido', body: 'Acceso autorizado', variant: 'ok' });
    window.setTimeout(() => window.location.href = './dashboard.html', 3500);
  } catch (err) {
    toast({ title: 'Login fallido', body: err.message, variant: 'err' });
  }
});

recoveryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(recoveryForm);
  const email = String(fd.get('email') || '').trim();

  try {
    await forgot(email);
    toast({ title: 'Solicitud enviada', body: 'Si el usuario existe, se envió el token por correo.', variant: 'ok' });
  } catch (err) {
    toast({ title: 'No se pudo enviar', body: err.message, variant: 'err' });
  }
});

btnReset.addEventListener('click', async () => {
  const fd = new FormData(recoveryForm);
  const email = String(fd.get('email') || '').trim();
  const token = String(fd.get('token') || '').trim();
  const new_password = String(fd.get('new_password') || '');

  try {
    await resetPassword(email, token, new_password);
    toast({ title: 'Contraseña actualizada', body: 'Ya puedes iniciar sesión.', variant: 'ok' });
    setTab('login');
  } catch (err) {
    toast({ title: 'No se pudo restablecer', body: err.message, variant: 'err' });
  }
});
