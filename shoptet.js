/* =========================================================
   Shoptet úpravy – Svět žárovek
   Hostováno na GitHub Pages, viz README.
   Moduly: A) Benefity v přihlašovacím popupu
   ========================================================= */
(function () {
  'use strict';

  /* === A) Login popup s benefity (registrace vpravo) ================== */
  function buildLoginExtras() {
    var popup = document.getElementById('login');
    if (!popup || popup.classList.contains('has-benefits')) return;
    var inner = popup.querySelector('.popup-widget-inner');
    if (!inner) return;

    var benefits = document.createElement('aside');
    benefits.className = 'login-benefits';
    benefits.innerHTML =
      '<h3 class="lb-title">Ještě účet nemáte?</h3>' +
      '<p class="lb-sub">Zaregistrujte se zdarma a získejte:</p>' +
      '<ul class="lb-list">' +
        '<li>Historie objednávek na jednom místě</li>' +
        '<li>Rychlejší nákup bez vyplňování údajů</li>' +
        '<li>Snadné sledování stavu zásilek</li>' +
        '<li>Speciální nabídky pro registrované</li>' +
      '</ul>' +
      '<a href="/registrace/" class="lb-cta">Vytvořit účet zdarma</a>';

    inner.appendChild(benefits);
    popup.classList.add('has-benefits');
  }

  /* === Init =========================================================== */
  function initAll() {
    buildLoginExtras();
  }

  if (document.readyState !== 'loading') initAll();
  document.addEventListener('DOMContentLoaded', initAll);
  document.addEventListener('ShoptetDOMContentLoaded', initAll);
  // popup se může donačíst – chytni i klik na "Přihlášení"
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-target="login"]')) {
      setTimeout(buildLoginExtras, 50);
      setTimeout(buildLoginExtras, 300);
    }
  });
})();
