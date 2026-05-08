import { apiFetch } from './api.js';

const form = document.getElementById('forgot-password-form');
const message = document.getElementById('auth-message');

function setMessage(text, isError = true) {
  if (!text) {
    message.textContent = '';
    message.className = 'inline-message is-hidden';
    return;
  }

  message.textContent = text;
  message.className = isError ? 'inline-message' : 'inline-message is-success';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('');

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Sending...';

  try {
    const formData = new FormData(form);
    const email = formData.get('email');

    await apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    setMessage('Check your email for a password reset link. It will expire in 1 hour.', false);
    form.reset();
    
    // Redirect after 3 seconds
    setTimeout(() => {
      window.location.href = '/sign-in';
    }, 3000);
  } catch (error) {
    setMessage(error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Send Reset Link';
  }
});
