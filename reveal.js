/*
 * GSAP + ScrollTrigger scroll reveals
 * Darren Lin — AI Automation Builder
 *
 * Markup convention: data-reveal and data-reveal-group
 * Reduced motion: freeze at final state (no animation)
 */

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    gsap.set('[data-reveal]', { opacity: 1, y: 0 });
  } else {
    // baseline state: hidden, slightly below
    gsap.set('[data-reveal]', { opacity: 0, y: 40 });

    // hero entrance — sequenced
    const heroItems = document.querySelectorAll('.hero [data-reveal]');
    if (heroItems.length) {
      gsap.to(heroItems, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power2.out',
        delay: 0.1,
      });
    }

    // scroll-driven reveals for everything else
    ScrollTrigger.batch('[data-reveal]', {
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power2.out',
          overwrite: true,
        });
      },
      start: 'top 85%',
      once: true,
    });
  }

  // ==================== CONTACT FORM ====================
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = document.getElementById('form-submit');
  const feedback = document.getElementById('form-feedback');
  const apiKeyInput = document.getElementById('web3forms-key');

  // Try to load API key from localStorage (set via admin or query param)
  const savedKey = localStorage.getItem('web3forms_key');
  if (savedKey) {
    apiKeyInput.value = savedKey;
  }

  // Allow setting key via ?key=XXX query param
  const urlParams = new URLSearchParams(window.location.search);
  const queryKey = urlParams.get('key');
  if (queryKey) {
    apiKeyInput.value = queryKey;
    localStorage.setItem('web3forms_key', queryKey);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      feedback.textContent = 'Form not configured. Add your Web3Forms API key.';
      feedback.className = 'form__feedback form__feedback--error';
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    feedback.textContent = '';
    feedback.className = 'form__feedback';

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          apikey: apiKey,
          subject: form.subject.value,
          from_name: form.from_name.value,
          name: form.name.value,
          email: form.email.value,
          company: form.company.value,
          budget: form.budget.value,
          message: form.message.value,
        }),
      });

      const data = await response.json();

      if (data.success) {
        feedback.textContent = 'Message sent. I\'ll respond within two business days.';
        feedback.className = 'form__feedback form__feedback--success';
        form.reset();
      } else {
        feedback.textContent = data.message || 'Something went wrong. Try again or email me directly.';
        feedback.className = 'form__feedback form__feedback--error';
      }
    } catch (err) {
      feedback.textContent = 'Network error. Check your connection and try again.';
      feedback.className = 'form__feedback form__feedback--error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
