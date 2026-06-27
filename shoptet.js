/* =========================================================
   Shoptet úpravy – Svět žárovek
   Hostováno na GitHub Pages, viz README.
   Moduly: A) Benefity v přihlašovacím popupu
           B) Řazení/úprava filtrů na kategoriích (přeneseno ze
              smazaného script.js – inline CSS řazení zůstává v <head>)
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

  /* === B) Filtry na kategoriích (řazení + úpravy) ===================== */
  function initFilters() {
    // jen na stránkách s filtry
    if (!document.querySelector('#category-filter-hover, #filters, .filters')) return;

    // 1) "Příznaky" filtr → do #filters, třídy + nadpis
    document.querySelectorAll('.param-filter-top').forEach(function (pf) {
      var filters = document.getElementById('filters');
      if (filters && pf.parentElement !== filters) filters.appendChild(pf);
      pf.classList.add('filter-section-priznak', 'filter-section');
      if (!pf.querySelector('h4')) {
        var h4 = document.createElement('h4');
        h4.textContent = 'Příznaky';
        pf.insertBefore(h4, pf.firstChild);
      }
    });

    // 2) box-filters pod hlavičku kategorie
    var box = document.querySelector('.box-filters');
    var catHeader = document.querySelector('main#content #category-header');
    if (box && catHeader && box.previousElementSibling !== catHeader) catHeader.after(box);

    // 3) fieldsetinner wrap + označení neaktivních (idempotentně)
    document.querySelectorAll('.filter-section:not(.filter-section-priznak) fieldset').forEach(function (fs) {
      if (!fs.querySelector(':scope > .fieldsetinner')) {
        var inner = document.createElement('div');
        inner.className = 'fieldsetinner';
        while (fs.firstChild) inner.appendChild(fs.firstChild);
        fs.appendChild(inner);
      }
      fs.querySelectorAll('div label.disabled').forEach(function (lbl) {
        var d = lbl.closest('div');
        if (d) d.classList.add('inactive');
      });
    });

    // 4) třídy pro řazení – podle nadpisu (enable inline CSS .filter-section.<x>{order})
    document.querySelectorAll('.filter-section').forEach(function (s) {
      var h = s.querySelector('h4 span') || s.querySelector('h4');
      if (!h) return;
      var cls = h.textContent.toLowerCase().replace(/[^a-z]/g, '');
      if (cls) s.classList.add(cls);
    });
  }

  /* === Init =========================================================== */
  function initAll() {
    buildLoginExtras();
    initFilters();
  }

  if (document.readyState !== 'loading') initAll();
  document.addEventListener('DOMContentLoaded', initAll);
  document.addEventListener('ShoptetDOMContentLoaded', initAll);
  // Shoptet překresluje filtry/výpis – chyť i tyhle eventy
  document.addEventListener('ShoptetDOMPageContentLoaded', initFilters);
  document.addEventListener('ShoptetDOMPageMoreProductsLoaded', initFilters);
  document.addEventListener('ShoptetDOMPageProductsLoaded', initFilters);
  setTimeout(initFilters, 600);
  setTimeout(initFilters, 1500);
  // popup se může donačíst – chytni i klik na "Přihlášení"
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-target="login"]')) {
      setTimeout(buildLoginExtras, 50);
      setTimeout(buildLoginExtras, 300);
    }
  });
})();
