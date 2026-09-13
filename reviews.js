// Reviews - save to web3forms + localStorage, render on load
(function () {
  var STORAGE_KEY = 'darren-reviews';

  function read() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function write(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

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
    if (!listEl || !form) return;

    render(read(), listEl, emptyEl);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      feedback.textContent = '';
      var data = {
        name: form.name.value.trim(),
        role: form.role.value.trim(),
        rating: parseInt(form.rating.value, 10),
        review: form.review.value.trim(),
        ts: Date.now()
      };
      if (!data.name || !data.review || !data.rating) {
        feedback.textContent = 'Name, rating, and review are required.';
        return;
      }

      feedback.textContent = 'Saving...';

      // Save locally immediately (always works)
      var list = read();
      list.unshift(data);
      write(list);
      render(list, listEl, emptyEl);

      // Also POST to web3forms if key set
      var key = (document.getElementById('review-web3forms-key') || {}).value;
      var payload = new FormData(form);
      if (key) {
        payload.set('apikey', key);
      }
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: payload
      }).catch(function () {});

      form.reset();
      feedback.textContent = 'Thank you — review saved.';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
