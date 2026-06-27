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

  /* === C) Skladová tabulka na detailu (přeneseno ze script.js) ======== */
  function initDetailSklad() {
    if (!document.querySelector('.type-detail, body.type-product')) return;
    var params = document.querySelector('.p-info-wrapper .detail-parameters');
    if (!params || params.querySelector('.sklad')) return; // idempotentně

    // skrýt záložku "Diskuse"
    document.querySelectorAll('#p-detail-tabs li').forEach(function (li) {
      if (/Diskuse/i.test(li.textContent)) li.style.display = 'none';
    });

    // postavit tabulku "Litoměřice / expedice"
    var sklad = document.createElement('div');
    sklad.className = 'sklad';
    sklad.innerHTML =
      '<table><tbody><tr class="expedice"><th>Litoměřice / expedice</th><td></td></tr></tbody></table>';
    params.appendChild(sklad);

    // přesunout skladovost do buňky
    var td = sklad.querySelector('.expedice td');
    document.querySelectorAll('.availability-value').forEach(function (av) {
      if (td) td.appendChild(av);
    });

    // přesunout řádky "Centrální sklad" z rozšířeného popisu
    var tbody = sklad.querySelector('tbody');
    document.querySelectorAll('.extended-description table.detail-parameters tr').forEach(function (tr) {
      if (/Centrální sklad/i.test(tr.textContent)) {
        tr.classList.add('centralniskald');
        // relabel "Centrální sklad:" → "Centrální sklad ČR"
        var csTh = tr.querySelector('th');
        if (csTh) csTh.textContent = 'Centrální sklad ČR';
        tbody.appendChild(tr);
      }
    });

    // "Možnosti doručení" přesunout pod celý zelený box
    var ship = sklad.querySelector('.shipping-options');
    if (ship) sklad.after(ship);
  }

  /* === D) Alternativní produkty (#productsAlternative) na konec detailu ==
     Je to .tab-pane jako přímý potomek .p-detail – ve zdroji je brzo, takže
     bez CSS order lezl nahoru nad produkt. CSS order:10 to řeší vizuálně,
     tady navíc přesuneme element na konec DOM (žádný záblesk při načítání). */
  function moveAltToBottom() {
    var alt = document.getElementById('productsAlternative');
    var pd = document.querySelector('.p-detail');
    if (alt && pd && pd.lastElementChild !== alt) pd.appendChild(alt);
  }

  /* === D2) USP pruh (.benefitBanner) na detailu – pod .row.product-top,
     NAD "Podobné produkty" (dle přání klienta). */
  function moveUspBelowProduct() {
    if (!document.body.classList.contains('type-product')) return;
    var usp = document.querySelector('.benefitBanner');
    var anchor = document.querySelector('.row.product-top');
    if (usp && anchor && anchor.nextElementSibling !== usp) anchor.after(usp);
  }

  /* === F) Vlastní rozbalování filtrů ==================================
     Nativní toggle filtrů na tomhle webu nefunguje. <form> v sekci má
     display:none (zavřeno); klik na hlavičku (h4) přepne třídu .sz-open,
     která form (a tím checkboxy) ukáže – viz CSS. */
  function initFilterToggle() {
    /* Dle ceny (slider) a Dle štítku (priznak) převzít pod náš systém:
       sundat nativní .otevreny → startují ZAVŘENÉ jako parametrické
       (čistá jednotná mřížka; jejich obsah jinak přetéká). */
    document.querySelectorAll('.filters .slider-wrapper, .filters .param-filter-top.filter-section')
      .forEach(function (box) { box.classList.remove('otevreny'); });

    if (window.__szFilterToggle) return;
    window.__szFilterToggle = true;
    document.addEventListener('click', function (e) {
      var h4 = e.target.closest(
        '#category-filter-hover .filter-section > h4,' +
        '.filters .slider-wrapper > h4,' +
        '.filters .param-filter-top.filter-section > h4'
      );
      if (!h4) return;
      e.preventDefault();
      h4.parentElement.classList.toggle('sz-open');
    });
  }

  /* === E) Karty ve výpisu: přeškrtnutá původní cena k akční ===========
     Původní cena (.price-standard) je uvnitř slevového badge. Naklonujeme
     ji k akční ceně do .prices (struck-through, viz CSS). Idempotentně. */
  function addOrigPrice() {
    document.querySelectorAll('.products-block .p').forEach(function (card) {
      if (card.querySelector('.p-orig-price')) return;
      var flag = card.querySelector('.flag-discount');
      var std = flag ? flag.querySelector('.price-standard') : null;
      var prices = card.querySelector('.prices');
      var final = card.querySelector('.price-final');
      if (std && prices && final) {
        var orig = document.createElement('span');
        orig.className = 'p-orig-price';
        orig.textContent = std.textContent.replace(/\s+/g, ' ').trim();
        prices.insertBefore(orig, final);
      }
    });
  }

  /* === Init =========================================================== */
  function initAll() {
    buildLoginExtras();
    initFilters();        // vodorovné filtry NAD obsahem (ne sidebar)
    initFilterToggle();   // + vlastní rozbalování (klik na hlavičku)
    initDetailSklad();
    moveAltToBottom();
    moveUspBelowProduct();
    addOrigPrice();
  }

  if (document.readyState !== 'loading') initAll();
  document.addEventListener('DOMContentLoaded', initAll);
  document.addEventListener('ShoptetDOMContentLoaded', initAll);
  // Shoptet překresluje filtry/výpis – chyť i tyhle eventy
  function reinitFilters() { initFilters(); initFilterToggle(); }
  document.addEventListener('ShoptetDOMPageContentLoaded', reinitFilters);
  document.addEventListener('ShoptetDOMPageMoreProductsLoaded', reinitFilters);
  document.addEventListener('ShoptetDOMPageProductsLoaded', reinitFilters);
  setTimeout(reinitFilters, 600);
  setTimeout(reinitFilters, 1500);
  // karty se donačítají (carousely, lazy) – doplnit i pak
  document.addEventListener('ShoptetDOMPageContentLoaded', addOrigPrice);
  document.addEventListener('ShoptetDOMPageMoreProductsLoaded', addOrigPrice);
  window.addEventListener('load', addOrigPrice);
  setTimeout(addOrigPrice, 800);
  setTimeout(addOrigPrice, 2000);
  // detail – varianty/skladovost/slider se renderují později
  document.addEventListener('ShoptetDOMPageContentLoaded', moveAltToBottom);
  setTimeout(moveAltToBottom, 600);
  setTimeout(moveAltToBottom, 1800);
  window.addEventListener('load', moveAltToBottom);
  // USP pod produkt (detail)
  document.addEventListener('ShoptetDOMPageContentLoaded', moveUspBelowProduct);
  setTimeout(moveUspBelowProduct, 600);
  setTimeout(moveUspBelowProduct, 1800);
  window.addEventListener('load', moveUspBelowProduct);
  document.addEventListener('ShoptetDOMPageContentLoaded', initDetailSklad);
  setTimeout(initDetailSklad, 600);
  setTimeout(initDetailSklad, 1500);
  // popup se může donačíst – chytni i klik na "Přihlášení"
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-target="login"]')) {
      setTimeout(buildLoginExtras, 50);
      setTimeout(buildLoginExtras, 300);
    }
  });
})();
