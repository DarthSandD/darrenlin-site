// Reviews - save to Cloudflare Worker API + KV (shared across all visitors)
(function () {
  var API = 'https://darrenlin-reviews.darthsandd.workers.dev';

  function starStr(n) {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  function render(list, listEl, emptyEl) {
    if (!list.length) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';
    listEl.innerHTML = list.map(function (r) {
      return (
        '<div class="review-card">' +
          '<div class="review-card__head">' +
            '<div>' +
              '<p class="review-card__name">' + (r.name || 'Client') + '</p>' +
              (r.role ? '<p class="review-card__role">' + r.role + '</p>' : '') +
            '</div>' +
            '<p class="review-card__stars">' + starStr(r.rating || 5) + '</p>' +
          '</div>' +
          '<p class="review-card__text">' + (r.review || '') + '</p>' +
        '</div>'
      );
    }).join('');
  }

  function init() {
    var listEl = document.getElementById('reviews-list');
    var emptyEl = document.getElementById('reviews-empty');
    var form = document.getElementById('review-form-el');
    var feedback = document.getElementById('review-feedback');
    if (!listEl) return;

    // Load reviews from shared API (with timeout)
    var loadCtrl = new AbortController();
    var loadT = setTimeout(function () { loadCtrl.abort(); }, 8000);
    fetch(API, { signal: loadCtrl.signal })
      .then(function (r) { clearTimeout(loadT); return r.json(); })
      .then(function (data) {
        if (data.success) render(data.data, listEl, emptyEl);
      })
      .catch(function () {
        emptyEl.textContent = 'Could not load reviews.';
      });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        feedback.textContent = '';
        var body = {
          name: form.name.value.trim(),
          role: form.role.value.trim(),
          rating: parseInt(form.rating.value, 10),
          review: form.review.value.trim()
        };
        if (!body.name || !body.review || !body.rating) {
          feedback.textContent = 'Name, rating, and review are required.';
          return;
        }

        feedback.textContent = 'Saving...';

        var ctrl = new AbortController();
        var t = setTimeout(function () { ctrl.abort(); }, 8000);
        fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: ctrl.signal
        })
          .then(function (r) { clearTimeout(t); return r.json(); })
          .then(function (data) {
            if (data.success) {
              form.reset();
              feedback.textContent = 'Thank you — review saved.';
              return fetch(API).then(function (r) { return r.json(); });
            } else {
              feedback.textContent = data.error || 'Something went wrong.';
              throw new Error('api error');
            }
          })
          .then(function (data) {
            if (data.success) render(data.data, listEl, emptyEl);
          })
          .catch(function () {
            feedback.textContent = 'Failed to save. Please try again.';
          });
      });
    }

    // More projects toggle
    var toggleBtn = document.getElementById('more-projects-btn');
    var moreProjects = document.getElementById('more-projects');
    if (toggleBtn && moreProjects) {
      toggleBtn.addEventListener('click', function () {
        var expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', !expanded);
        moreProjects.hidden = expanded;
        toggleBtn.textContent = expanded ? 'See +1 more project' : 'Hide projects';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
