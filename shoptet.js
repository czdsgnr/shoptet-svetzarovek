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
  /* Normalizace stavu filtrů (běží po každém AJAX překreslení):
     sundá nativní .otevreny ze VŠECH boxů → po filtru čistý jednotný
     ZAVŘENÝ stav (theme jinak po výběru samovolně rozbalí víc sekcí
     = nepřehledné). Otevírání řídí jen náš toggle (.sz-open). */
  /* Normalizace: sundá nativní .otevreny → filtry startují/zůstávají zavřené
     (čistá mřížka). Aktivní filtr (něco vybráno) se zvýrazní čistě přes CSS
     `:has(input:checked)` – okamžitě, bez JS, nebojuje s dklab. */
  function normalizeFilterState() {
    document.querySelectorAll(
      '.filters .filter-section-parametric,' +
      '.filters .slider-wrapper,' +
      '.filters .param-filter-top'
    ).forEach(function (s) { s.classList.remove('otevreny'); });
  }

  function initFilterToggle() {
    normalizeFilterState();

    if (window.__szFilterToggle) return;
    window.__szFilterToggle = true;

    /* CAPTURE fáze + stopPropagation: po AJAX dklab naváže na hlavičku vlastní
       (rozbitý) handler, který přes stopPropagation zablokuje toggle v bubble
       fázi → "na aktivní filtr nejde znovu kliknout". V capture proběhneme
       PRVNÍ a dklab handler umlčíme → otevírání funguje vždy. */
    document.addEventListener('click', function (e) {
      var h4 = e.target.closest(
        '.filters .filter-section-parametric > h4,' +
        '.filters .slider-wrapper > h4,' +
        '.filters .param-filter-top > h4'
      );
      if (!h4) return;
      e.preventDefault();
      e.stopPropagation();
      h4.parentElement.classList.toggle('sz-open');
    }, true);
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

  /* === Slevový badge (-X %) do rohu KARTY ============================
     Nativně je .flags-extra uvnitř .image, který je posunutý dolů (štítky
     Akce/Výprodej nad ním) → badge "v půlce". Přesuneme ho jako přímého
     potomka .p (karta je position:relative) → sedí v pravém horním rohu
     karty, zarovnaný s Akce. CSS dá pozici. Idempotentní. */
  function moveBadgeToCard() {
    /* jen výpis/carousel karty – NE hlavní produkt na detailu (ten má badge
       v .p-image s vlastní pozicí top:0). */
    document.querySelectorAll(
      '.products-block .p, .products-related .p, .product .p, .slick-slider .p'
    ).forEach(function (card) {
      var fe = card.querySelector('.flags-extra');
      if (fe && fe.parentElement !== card) card.appendChild(fe);
    });
  }

  /* === Reskin filtru: hlavička + patička (přídavně) ===================
     Nativní filtr (data + filtrování) necháme být, jen kolem něj postavíme
     hezký „card" chrome dle návrhu: hlavička s ikonou/titulkem + „Vymazat vše",
     patička s počtem + „Zrušit filtry" / „Zobrazit produkty". Idempotentní. */
  function buildFilterChrome() {
    var box = document.querySelector('.box-filters');
    if (!box || box.querySelector('.sz-filter-head')) return;
    box.classList.add('sz-filter-card');

    // počet produktů (z "X položek celkem")
    var cntText = '';
    var nodes = document.querySelectorAll('main span, main p, main div, .content span, .content p');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].children.length === 0 && /\d[\d\s]*\s*položek\s+celkem/i.test(nodes[i].textContent)) {
        cntText = nodes[i].textContent.trim().replace(/položek\s+celkem/i, 'produktů odpovídá výběru');
        break;
      }
    }

    var head = document.createElement('div');
    head.className = 'sz-filter-head';
    head.innerHTML =
      '<div class="sz-fh-left">' +
        '<span class="sz-fh-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>' +
        '<div><div class="sz-fh-title">Filtrovat produkty</div><div class="sz-fh-sub">Vyberte parametry a rychle zúžte nabídku.</div></div>' +
      '</div>' +
      '<button type="button" class="sz-fh-clear">Vymazat vše</button>';

    var foot = document.createElement('div');
    foot.className = 'sz-filter-foot';
    foot.innerHTML =
      '<div class="sz-ff-count">' + (cntText || '') + '</div>' +
      '<div class="sz-ff-actions">' +
        '<button type="button" class="sz-ff-cancel">Zrušit filtry</button>' +
        '<button type="button" class="sz-ff-show">Zobrazit produkty</button>' +
      '</div>';

    box.insertBefore(head, box.firstChild);
    box.appendChild(foot);

    function clearAll() { window.location.href = window.location.pathname; } // odebere ?pvXX=…
    head.querySelector('.sz-fh-clear').addEventListener('click', clearAll);
    foot.querySelector('.sz-ff-cancel').addEventListener('click', clearAll);
    foot.querySelector('.sz-ff-show').addEventListener('click', function () {
      // zavři otevřené sekce + sjeď na výpis
      document.querySelectorAll('#filters .sz-open').forEach(function (s) { s.classList.remove('sz-open'); });
      var list = document.querySelector('.products-block, #products, .product-list');
      if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* === Init =========================================================== */
  function initAll() {
    buildLoginExtras();
    initFilters();        // vodorovné filtry NAD obsahem (ne sidebar)
    initFilterToggle();   // + vlastní rozbalování (klik na hlavičku)
    buildFilterChrome();  // hlavička + patička filtru (reskin)
    initDetailSklad();
    moveAltToBottom();
    moveUspBelowProduct();
    addOrigPrice();
    moveBadgeToCard();
  }

  if (document.readyState !== 'loading') initAll();
  document.addEventListener('DOMContentLoaded', initAll);
  document.addEventListener('ShoptetDOMContentLoaded', initAll);
  // Shoptet překresluje filtry/výpis – chyť i tyhle eventy.
  function reinitFilters() { initFilters(); initFilterToggle(); buildFilterChrome(); }
  document.addEventListener('ShoptetDOMPageContentLoaded', reinitFilters);
  document.addEventListener('ShoptetDOMPageMoreProductsLoaded', reinitFilters);
  document.addEventListener('ShoptetDOMPageProductsLoaded', reinitFilters);
  setTimeout(reinitFilters, 600);
  setTimeout(reinitFilters, 1500);
  // karty se donačítají (carousely, lazy) – doplnit i pak
  function reinitCards() { addOrigPrice(); moveBadgeToCard(); }
  document.addEventListener('ShoptetDOMPageContentLoaded', reinitCards);
  document.addEventListener('ShoptetDOMPageMoreProductsLoaded', reinitCards);
  window.addEventListener('load', reinitCards);
  setTimeout(reinitCards, 800);
  setTimeout(reinitCards, 2000);
  setTimeout(reinitCards, 3500);
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
