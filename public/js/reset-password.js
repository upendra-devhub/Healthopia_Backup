import { apiFetch } from './api.js';

const form = document.getElementById('reset-password-form');
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

// Get reset token from URL
function getResetToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
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

// Check if token exists
window.addEventListener('load', () => {
  const token = getResetToken();
  if (!token) {
    setMessage('Invalid or missing reset token. Please request a new password reset link.');
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('');

  const password = form.querySelector('input[name="password"]').value;
  const confirmPassword = form.querySelector('input[name="confirmPassword"]').value;

  if (password !== confirmPassword) {
    setMessage('Passwords do not match.');
    return;
  }

  if (password.length < 6) {
    setMessage('Password must be at least 6 characters long.');
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Resetting...';

  try {
    const token = getResetToken();

    await apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token,
        password
      })
    });

    setMessage('Password reset successful! Redirecting to sign in...', false);
    form.reset();
    
    // Redirect after 2 seconds
    setTimeout(() => {
      window.location.href = '/sign-in';
    }, 2000);
  } catch (error) {
    setMessage(error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Reset Password';
  }
});
