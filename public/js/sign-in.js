import { apiFetch } from './api.js';

const form = document.getElementById('sign-in-form');
const message = document.getElementById('auth-message');

function setMessage(text) {
  if (!text) {
    message.textContent = '';
    message.className = 'inline-message is-hidden';
    return;
  }

  message.textContent = text;
  message.className = 'inline-message';
}

// Password toggle functionality
document.querySelectorAll('.password-toggle').forEach((toggle) => {
  toggle.addEventListener('click', (event) => {
    event.preventDefault();
    const inputName = toggle.getAttribute('data-input-name');
    const input = form.querySelector(`input[name="${inputName}"]`);
    const icon = toggle.querySelector('.material-symbols-outlined');

    if (input.type === 'password') {
      input.type = 'text';
      icon.textContent = 'visibility_off';
      toggle.setAttribute('aria-label', 'Hide password');
    } else {
      input.type = 'password';
      icon.textContent = 'visibility';
      toggle.setAttribute('aria-label', 'Show password');
    }
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('');

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Signing in...';

  try {
    const formData = new FormData(form);

    await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password')
      })
    });

    window.location.href = '/';
  } catch (error) {
    setMessage(error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Continue';
  }
});
