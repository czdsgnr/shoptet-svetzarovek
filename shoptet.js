/* =========================================================
   Shoptet úpravy – Svět žárovek
   Hostováno na GitHub Pages, viz README.
   Moduly: A) Benefity v přihlašovacím popupu
           B) Řazení/úprava filtrů na kategoriích (přeneseno ze
              smazaného script.js – inline CSS řazení zůstává v <head>)
   ========================================================= */
(function () {
  'use strict';

  /* === Detail "ready" strážce =========================================
     Merkur motiv staví pravý sloupec detailu (nadpis .p-detail-inner-header,
     skladovost .detail-parameters, štítky Akce/Výprodej) až PO DOMContentLoaded
     vlastním JS. Když do toho náš JS sáhne dřív (a <script defer> běží právě na
     DOMContentLoaded), motivu to rozhodí přesun a pravý sloupec se nedostaví.
     Proto naše detailové funkce nic nedělají, dokud motiv pravý sloupec
     nedostaví. Signál hotova: nadpis je už v .p-info-wrapper. Pojistka: po
     window 'load' je motiv hotový tak jako tak. (Na nedetailových stránkách
     vrací rovnou true → výpis/kategorie běží bez čekání.) */
  var __szLoaded = false;
  window.addEventListener('load', function () { __szLoaded = true; });
  function detailReady() {
    if (!document.body || !document.body.classList.contains('type-product')) return true;
    if (document.querySelector('.p-info-wrapper .p-detail-inner-header')) return true;
    return __szLoaded;
  }

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
    if (!detailReady()) return; // počkat, až motiv dostaví pravý sloupec
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

    // přesunout skladovost do buňky (scope na buy-box – jinak by to sebralo
    // .availability-value i z variant / podobných produktů na stránce)
    var td = sklad.querySelector('.expedice td');
    document.querySelectorAll('.p-info-wrapper .availability-value').forEach(function (av) {
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
    if (!detailReady()) return;
    var alt = document.getElementById('productsAlternative');
    var pd = document.querySelector('.p-detail');
    if (alt && pd && pd.lastElementChild !== alt) pd.appendChild(alt);
  }

  /* === D2) USP pruh (.benefitBanner) na detailu – pod .row.product-top,
     NAD "Podobné produkty" (dle přání klienta). */
  function moveUspBelowProduct() {
    if (!detailReady()) return;
    if (!document.body.classList.contains('type-product')) return;
    var usp = document.querySelector('.benefitBanner');
    var anchor = document.querySelector('.row.product-top');
    if (usp && anchor && anchor.nextElementSibling !== usp) anchor.after(usp);
  }

  /* Detail na MOBILU: „Kód produktu" (.p-code) sedí v horním bloku .p-detail-info,
     který je nad obrázkem → klient ho chce POD obrázek. Vkládáme ho hned ZA
     hlavní obrázek (.p-image) – ne na konec .p-image-wrapper, tam by u produktů
     s galerií skončil až pod náhledy. Vycentrování řeší CSS. Jen mobil – na
     desktopu je layout dvousloupcový (obrázek vlevo, info vpravo) a kód nahoře
     nevadí. Idempotentní + detailReady (motiv detail dostavuje později,
     dřívější DOM zásah ho rozhodí). */
  function moveCodeUnderImage() {
    if (!detailReady()) return;
    if (!document.body.classList.contains('type-product')) return;
    if (!window.matchMedia || !window.matchMedia('(max-width: 991px)').matches) return;
    var code = document.querySelector('.p-code');
    var imgWrap = document.querySelector('.p-image-wrapper');
    if (!code || !imgWrap) return;
    var target = imgWrap.querySelector('.p-image') || imgWrap.firstElementChild;
    if (!target || target === code) return;
    if (target.nextElementSibling === code) return; // už je na místě
    target.after(code);
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
    if (!detailReady()) return; // na výpisu vrací true hned; na detailu počká
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
    if (!detailReady()) return; // na výpisu vrací true hned; na detailu počká
    /* jen výpis/carousel karty – NE hlavní produkt na detailu (ten má badge
       v .p-image s vlastní pozicí top:0). */
    document.querySelectorAll(
      '.products-block .p, .products-related .p, .product .p, .slick-slider .p'
    ).forEach(function (card) {
      var fe = card.querySelector('.flags-extra');
      if (fe && fe.parentElement !== card) card.appendChild(fe);
    });
  }

  /* === Přesun filtru do levého sidebaru (nad podporu) =================
     Layout: .content-wrapper-in > aside.sidebar-left (TOP10+podpora) + main#content.
     Přesuneme .box-filters na začátek sidebaru. Idempotentní. Filtr (data
     i AJAX) zůstává #filters – jen jiná pozice v DOM. */
  function moveFilterToSidebar() {
    var box = document.querySelector('.box-filters');
    var sidebar = document.querySelector('aside.sidebar-left, .sidebar.sidebar-left, .sidebar-left');
    if (box && sidebar && !sidebar.contains(box)) {
      sidebar.insertBefore(box, sidebar.firstChild);
    }
    /* Motiv po načtení kategorii překresluje obsah a přesun vrací zpět do
       mainu → MutationObserver to hlídá a box vždy vrátí do sidebaru.
       Guard (box už v sidebaru → nic) brání smyčce. */
    if (window.__szFilterMoveObs) return;
    var host = document.querySelector('.content-wrapper-in') || document.body;
    /* Přesun zpět do sidebaru HNED (synchronně), BEZ debounce. Dřív tu byl
       clearTimeout+setTimeout(50): při vlně mutací (lazy-load obrázků, carousely)
       se ten 50ms časovač pořád resetoval a nespustil klidně ~1 s → box byl celou
       tu dobu mimo sidebar a nahoru vyskočil banner podpory = viditelné blikání /
       poskakování. MutationObserver callback běží jako microtask PŘED vykreslením,
       takže sync insertBefore vrátí box do rámce ještě než se stihne překreslit
       (žádný záblesk). Guard `!sb.contains(bb)` brání smyčce (po vložení už je
       uvnitř → další callback nic nedělá). */
    var obs = new MutationObserver(function () {
      var sb = document.querySelector('.sidebar-left');
      var bb = document.querySelector('.box-filters');
      if (sb && bb && !sb.contains(bb)) sb.insertBefore(bb, sb.firstChild);
    });
    obs.observe(host, { childList: true, subtree: true });
    window.__szFilterMoveObs = obs;
  }

  /* === Reskin filtru: hlavička + patička (přídavně) ===================
     Nativní filtr (data + filtrování) necháme být, jen kolem něj postavíme
     hezký „card" chrome dle návrhu: hlavička s ikonou/titulkem + „Vymazat vše",
     patička s počtem + „Zrušit filtry" / „Zobrazit produkty". Idempotentní. */
  function buildFilterChrome() {
    var box = document.querySelector('.box-filters');
    if (!box) return;
    // VŽDY (i po AJAX) schovat nativní „× Zrušit filtry" – máme vlastní v patičce.
    [].forEach.call(box.querySelectorAll('a, button, span'), function (el) {
      if (el.closest('.sz-filter-head') || el.closest('.sz-filter-foot')) return;
      var t = (el.textContent || '').trim();
      if (/^.{0,2}\s*Zrušit filtr/i.test(t) && t.length < 20) el.style.display = 'none';
    });
    if (!box.querySelector('.sz-filter-head')) { // chrome stavíme jen jednou
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
        '<div><div class="sz-fh-title">Filtry:</div></div>' +
      '</div>';

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
    foot.querySelector('.sz-ff-cancel').addEventListener('click', clearAll);
    foot.querySelector('.sz-ff-show').addEventListener('click', function () {
      // zavři otevřené sekce + sjeď na výpis
      document.querySelectorAll('#filters .sz-open').forEach(function (s) { s.classList.remove('sz-open'); });
      var list = document.querySelector('.products-block, #products, .product-list');
      if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    } // konec budování chrome (jen jednou)

    // Anti-flash: filtr byl skrytý (opacity:0), teď má chrome → odkrýt (fade).
    box.classList.add('sz-ready');
    // STICKY odhalení: třída na STABILNÍM rodiči → po prvním zobrazení už se
    // filtr neschová ani když motiv .box-filters překreslí (jinak blikání).
    var cw = document.querySelector('.content-wrapper-in');
    if (cw) cw.classList.add('sz-filters-shown');
  }

  /* === Štítky aktivních filtrů NAD produkty (přání klienta) ============
     Když jsou zaškrtnuté filtry, ukážeme je nad výpisem jako odstranitelné
     „chips". Klik na × jde na data-url zaškrtnutého políčka = URL BEZ té
     jedné hodnoty (ostatní filtry zůstanou – ověřeno: pv165=7671,7674 →
     data-url bílé = ?pv165=7674). „Zrušit vše" → čistá cesta bez params.
     Vše je plná navigace, takže se lišta staví znovu při každém načtení.
     Idempotentní (starou lištu přepíše/odebere). */
  function buildFilterChips() {
    var box = document.querySelector('.box-filters');
    var anchor = document.querySelector('.products.products-page, .products-block');
    var old = document.querySelector('.sz-active-chips');
    var checked = box ? [].slice.call(box.querySelectorAll('input[type="checkbox"]:checked')) : [];
    if (!box || !anchor || !checked.length) { if (old) old.remove(); return; }
    var bar = old || document.createElement('div');
    bar.className = 'sz-active-chips';
    bar.innerHTML = '';
    var xIco = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    var head = document.createElement('span');
    head.className = 'sz-chips-label';
    head.textContent = 'Vybráno:';
    bar.appendChild(head);
    checked.forEach(function (inp) {
      var lbl = box.querySelector('label[for="' + inp.id + '"]');
      var txt = '';
      if (lbl) { var c = lbl.cloneNode(true); var fc = c.querySelector('.filter-count'); if (fc) fc.parentNode.removeChild(fc); txt = c.textContent; }
      txt = (txt || inp.value || '').replace(/\s+/g, ' ').trim();
      var url = inp.getAttribute('data-url');
      var chip = document.createElement('a');
      chip.className = 'sz-chip';
      chip.href = url || '#';
      chip.setAttribute('aria-label', 'Odebrat filtr ' + txt);
      chip.innerHTML = '<span class="sz-chip-txt"></span>' + xIco;
      chip.querySelector('.sz-chip-txt').textContent = txt;
      if (!url) chip.addEventListener('click', function (e) { e.preventDefault(); inp.click(); });
      bar.appendChild(chip);
    });
    var clr = document.createElement('a');
    clr.className = 'sz-chip sz-chip-clear';
    clr.href = window.location.pathname;
    clr.textContent = 'Zrušit vše';
    bar.appendChild(clr);
    if (!bar.parentNode) anchor.parentNode.insertBefore(bar, anchor);
  }

  /* === Filtr jako BOTTOM SHEET na mobilu (přání klienta) ==============
     Mobilní filtr = #filters s tlačítkem .filtrovat (jen mobilní render).
     Přidáme podklad (backdrop), × do hlavičky a patičku „Zobrazit produkty";
     otevřený stav (#filters.otevreno, přepíná ho tlačítko) zrcadlíme do
     body.sz-sheet-open (podklad + zámek scrollu). Pořadí sekcí NEMĚNÍME
     (žádný obal → order na přímých potomcích #filters by se rozbil).
     Auto-open pojistka: theme nechá .otevreno i po reloadu (aktivní filtr) →
     sheet by naskočil sám; otevřeme až po skutečném ťuknutí na tlačítko
     (__szUserTapped). Aktivní filtry zákazník vidí přes štítky nad výpisem. */
  function szSyncSheet() {
    var f = document.getElementById('filters');
    if (!f) return;
    var open = f.classList.contains('otevreno') && window.matchMedia && window.matchMedia('(max-width: 991px)').matches;
    document.body.classList.toggle('sz-sheet-open', !!open);
  }
  /* Multi-výběr: složí cílovou URL ze VŠECH změněných checkboxů (checked !=
     původní stav). Formát parametru neznáme (pv/stock/…), tak diffujeme
     `data-url` (Shoptet ji počítá vůči PŮVODNÍMU stavu) proti aktuální URL a
     merge-ujeme hodnoty po klíčích. Vrací null = beze změn. */
  function szSheetTargetUrl() {
    var f = document.getElementById('filters');
    if (!f) return null;
    var original = new URLSearchParams(location.search);
    var working = new URLSearchParams(location.search);
    var changed = 0;
    [].forEach.call(f.querySelectorAll('input[type="checkbox"]'), function (b) {
      if (b.__szOrig === undefined || b.checked === b.__szOrig) return;
      var du = b.getAttribute('data-url') || '';
      if (du.indexOf('?') < 0) return; // bez URL neumíme spočítat
      changed++;
      var cp = new URLSearchParams(du.split('?')[1] || '');
      var keys = {}; original.forEach(function (v, k) { keys[k] = 1; }); cp.forEach(function (v, k) { keys[k] = 1; });
      Object.keys(keys).forEach(function (key) {
        var o = (original.get(key) || '').split(',').filter(Boolean);
        var n = (cp.get(key) || '').split(',').filter(Boolean);
        var added = n.filter(function (v) { return o.indexOf(v) < 0; });
        var removed = o.filter(function (v) { return n.indexOf(v) < 0; });
        if (!added.length && !removed.length) return;
        var w = (working.get(key) || '').split(',').filter(Boolean);
        added.forEach(function (v) { if (w.indexOf(v) < 0) w.push(v); });
        removed.forEach(function (v) { var i = w.indexOf(v); if (i >= 0) w.splice(i, 1); });
        if (w.length) working.set(key, w.join(',')); else working.delete(key);
      });
    });
    if (!changed) return null;
    var qs = working.toString();
    return location.pathname + (qs ? '?' + qs : '');
  }
  function szSheetGroup(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function szSheetPlural(n) { return n === 1 ? 'produkt' : (n >= 2 && n <= 4 ? 'produkty' : 'produktů'); }
  function szSheetSetFoot(n) {
    var b = document.querySelector('.sz-sheet-show'); if (!b) return;
    b.textContent = (n == null || isNaN(n)) ? 'Zobrazit produkty' : ('Zobrazit ' + szSheetGroup(n) + ' ' + szSheetPlural(n));
  }
  function szSheetCountFromHtml(html) {
    // číslo a „položek" odděluje v HTML tag (<span>3678</span> položek) → tagy
    // nahradíme mezerou, ať jsou vedle sebe a regex je chytne.
    var text = html.replace(/<[^>]+>/g, ' ');
    var m = text.match(/(\d[\d\s ]*)\s*polo[žz]ek\s+celkem/i);
    return m ? parseInt(m[1].replace(/[^0-9]/g, ''), 10) : null;
  }
  /* Živý počet: po změně (debounce) načteme na pozadí cílovou URL a přečteme
     „X položek celkem" → tlačítko „Zobrazit N produktů". Bez placené služby. */
  function szSheetRefreshCount() {
    clearTimeout(window.__szCountT);
    window.__szCountT = setTimeout(function () {
      var url = szSheetTargetUrl() || (location.pathname + location.search);
      var b = document.querySelector('.sz-sheet-show');
      if (b) b.classList.add('sz-loading');
      fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
        .then(function (r) { return r.text(); })
        .then(function (html) { szSheetSetFoot(szSheetCountFromHtml(html)); if (b) b.classList.remove('sz-loading'); })
        .catch(function () { if (b) b.classList.remove('sz-loading'); });
    }, 350);
  }
  function szSheetCurrentCount() {
    var els = document.querySelectorAll('main span, main p, main div, .content span, .content p');
    for (var i = 0; i < els.length; i++) {
      if (els[i].children.length === 0) {
        var m = (els[i].textContent || '').match(/(\d[\d\s ]*)\s*polo[žz]ek\s+celkem/i);
        if (m) return parseInt(m[1].replace(/[^0-9]/g, ''), 10);
      }
    }
    return null;
  }
  // počet vybraných (zaškrtnutých) filtrů → badge „N vybráno" v hlavičce.
  function szSheetUpdateSelected() {
    var f = document.getElementById('filters'); if (!f) return;
    var badge = f.querySelector('.sz-sheet-count'); if (!badge) return;
    var n = 0;
    [].forEach.call(f.querySelectorAll('input[type="checkbox"]'), function (b) {
      if (b.getAttribute('data-filter-code') && b.checked) n++;
    });
    badge.textContent = n ? (n + ' vybráno') : '';
    badge.classList.toggle('sz-empty', n === 0);
  }
  function initFilterSheet() {
    var filters = document.getElementById('filters');
    if (!filters) return;
    var btn = filters.querySelector('.filtrovat');
    if (!btn) return; // .filtrovat je jen v mobilním renderu
    // snapshot původního (aplikovaného) stavu checkboxů – jen jednou za načtení
    [].forEach.call(filters.querySelectorAll('input[type="checkbox"]'), function (b) {
      if (b.__szOrig === undefined) b.__szOrig = b.checked;
    });
    // Multi-výběr: na mobilu zachytit klik na value-checkbox → NEnavigovat hned,
    // jen přepnout stav a přepočítat počet. Aplikuje se až „Zobrazit produkty".
    if (!filters.__szPickBound) {
      filters.__szPickBound = true;
      filters.addEventListener('click', function (e) {
        if (!window.matchMedia || !window.matchMedia('(max-width: 991px)').matches) return;
        var t = e.target;
        var cb = (t.matches && t.matches('input[type="checkbox"]')) ? t : null;
        if (!cb) { var lbl = t.closest && t.closest('label'); if (lbl) cb = document.getElementById(lbl.getAttribute('for')) || lbl.querySelector('input[type="checkbox"]'); }
        if (!cb || !cb.getAttribute('data-filter-code')) return; // jen value-checkboxy filtru
        e.preventDefault(); e.stopPropagation();
        cb.checked = !cb.checked;
        szSheetRefreshCount();
        szSheetUpdateSelected();
      }, true);
    }
    // Zavírat VŽDY přes klik na tlačítko = theme toggle. Theme drží otevřeno/
    // zavřeno v interní proměnné; kdybychom .otevreno jen smazali z DOM, stav se
    // rozejde a další ťuknutí sheet neotevře. Proto btn.click() (synchronní).
    function closeSheet() { if (filters.classList.contains('otevreno')) btn.click(); }
    // Theme nechá .otevreno i po reloadu s aktivním filtrem → sheet by naskočil
    // sám přes produkty. Jednou za načtení zavřeme (přes theme toggle, ať zůstane
    // synchron). Aktivní filtry zákazník vidí přes štítky nad výpisem.
    if (!window.__szSheetClosed) {
      if (filters.classList.contains('otevreno')) {
        btn.click(); // úspěch jen když theme reálně zavřel (jinak zkusí příští reinit)
        window.__szSheetClosed = !filters.classList.contains('otevreno');
      } else {
        window.__szSheetClosed = true;
      }
    }
    if (!document.querySelector('.sz-sheet-backdrop')) {
      var bd = document.createElement('div');
      bd.className = 'sz-sheet-backdrop';
      document.body.appendChild(bd);
      bd.addEventListener('click', closeSheet);
    }
    if (!btn.querySelector('.sz-sheet-x')) {
      var x = document.createElement('span');
      x.className = 'sz-sheet-x';
      x.setAttribute('aria-hidden', 'true');
      x.textContent = '×';
      btn.appendChild(x); // klik na × probublá na .filtrovat → theme zavře
    }
    // badge počtu vybraných filtrů v hlavičce (živě)
    if (!btn.querySelector('.sz-sheet-count')) {
      var cnt = document.createElement('span');
      cnt.className = 'sz-sheet-count sz-empty';
      var xEl = btn.querySelector('.sz-sheet-x');
      if (xEl) btn.insertBefore(cnt, xEl); else btn.appendChild(cnt);
    }
    szSheetUpdateSelected();
    if (!filters.querySelector('.sz-sheet-foot')) {
      var foot = document.createElement('div');
      foot.className = 'sz-sheet-foot';
      foot.innerHTML = '<button type="button" class="sz-sheet-show">Zobrazit produkty</button>';
      filters.appendChild(foot);
      // „Zobrazit produkty" = aplikovat vybrané filtry naráz (nebo jen zavřít).
      foot.querySelector('.sz-sheet-show').addEventListener('click', function () {
        var url = szSheetTargetUrl();
        if (url) location.href = url; else closeSheet();
      });
      szSheetSetFoot(szSheetCurrentCount()); // počáteční počet z aktuální stránky
    }
    if (!window.__szSheetObs) {
      window.__szSheetObs = new MutationObserver(szSyncSheet);
      window.__szSheetObs.observe(filters, { attributes: true, attributeFilter: ['class'] });
    }
    szSyncSheet();
  }

  /* === Karta podpory „Potřebujete pomoc?" (.contact-box) ===============
     FB odkaz → „Facebook" (místo dlouhé URL), telefon s mezerami.
     Idempotentní – regexy nematchnou už upravený text. */
  function styleContactCard() {
    [].forEach.call(document.querySelectorAll('.contact-box'), function (cb) {
      var fb = cb.querySelector('.facebook a');
      if (fb && /facebook\.com/i.test(fb.textContent)) fb.textContent = 'Facebook';
      [].forEach.call(cb.querySelectorAll('.tel a, .cellphone a'), function (a) {
        var t = (a.textContent || '').trim();
        if (/^\+\d{12}$/.test(t)) {
          a.textContent = t.replace(/(\+\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
        }
      });
    });
  }

  /* === Karta podpory v KOŠÍKU → bohatší „help" karta (návrh klienta) ====
     Přestaví nativní .contact-box v košíku na kartu: hlavička s ikonou, intro
     s fotkou poradce, lišta otevírací doby (živý stav Po–Pá 8:00–16:30), řádky
     s ikonou+popiskem, patička. Data (tel/mobil/mail/FB/foto/nadpis) bere
     z původního DOMu. CSS = `.contact-box.sz-help …`. Idempotentní (guard
     `.sz-help`); po AJAX překreslení košíku se původní vrátí → přestaví znovu.
     POZOR: mobil má v nativním DOMu rozbitý vnořený odkaz (escapované <a> v href)
     → bereme JEN čistý `tel:+…` odkaz a href sanitizujeme (jinak rozbije markup). */
  function buildHelpCard() {
    var ico = {
      help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
      phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>',
      mobile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2.5"/><line x1="11" y1="18" x2="13" y2="18"/></svg>',
      mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m2 7 10 6 10-6"/></svg>',
      fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/></svg>',
      clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>',
      go: '<svg class="go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
    };
    function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
    function safeHref(h) { return (h || '').replace(/[<>"\s]/g, '').trim(); }
    function pickTel(cb, scope) {
      var a = cb.querySelector(scope + ' a[href^="tel:+"]') || cb.querySelector(scope + ' a[href^="tel:"]');
      if (!a) return null;
      var text = clean(a.textContent);
      var href = safeHref(a.getAttribute('href'));
      if (!/^tel:\+?\d{6,}$/.test(href)) href = 'tel:' + text.replace(/[^\d+]/g, '');
      return { href: href, text: text };
    }
    function pickA(cb, scope) {
      var a = cb.querySelector(scope + ' a');
      if (!a) return null;
      return { href: safeHref(a.getAttribute('href')), text: clean(a.textContent) };
    }
    function row(cls, d, svg, k, v) {
      if (!d || !d.href) return '';
      var target = /^https?:/.test(d.href) ? ' target="_blank" rel="noopener"' : '';
      return '<a class="row ' + cls + '" href="' + d.href + '"' + target + '>' +
        '<span class="ico">' + svg + '</span>' +
        '<span class="rbody"><span class="k">' + k + '</span><span class="v">' + (v || d.text) + '</span></span>' +
        ico.go + '</a>';
    }
    [].forEach.call(document.querySelectorAll('.cart-content .contact-box, .sidebar-in-cart .contact-box'), function (cb) {
      if (cb.classList.contains('sz-help')) return;
      var tel = pickTel(cb, '.tel'), cell = pickTel(cb, '.cellphone'),
          mail = pickA(cb, '.mail'), fb = pickA(cb, '.facebook');
      var imgEl = cb.querySelector('img');
      // POZOR: theme lazy-load dává do `src` 1×1 placeholder (data:image/svg…),
      // skutečná URL je v `data-src` → preferovat data-src a přeskočit data: URI.
      var imgSrc = '';
      if (imgEl) {
        var cands = [imgEl.getAttribute('data-src'), imgEl.getAttribute('src'), imgEl.currentSrc];
        for (var ci = 0; ci < cands.length; ci++) {
          if (cands[ci] && cands[ci].indexOf('data:') !== 0) { imgSrc = safeHref(cands[ci]); break; }
        }
      }
      var heading = clean((cb.querySelector('h2, .h4') || {}).textContent) || 'Potřebujete pomoc?';
      cb.classList.add('sz-help');
      cb.innerHTML =
        '<div class="help__top">' + ico.help + '<h3>' + heading + '</h3></div>' +
        '<div class="help__intro">' +
          (imgSrc ? '<span class="avatar"><img src="' + imgSrc + '" alt="Operátor" loading="lazy"></span>' : '') +
          '<span class="who"><span class="lead">Nejste si jistí? Zavolejte!</span><span class="sub">Operátor Petr</span></span>' +
        '</div>' +
        '<div class="hours"><span class="hico">' + ico.clock + '</span><span class="time">Po–Pá 8:00–16:30</span><span class="szp-online">online</span></div>' +
        '<div class="help__list">' +
          row('primary', tel, ico.phone, 'Zavolejte nám') +
          row('', cell, ico.mobile, 'Mobil') +
        '</div>' +
        (mail ? '<div class="help__mail">' + row('', mail, ico.mail, 'Napište nám') + '</div>' : '') +
        '<div class="help__foot">Obvykle odpovídáme do 1 hodiny</div>';
      szSyncOnline(); // nastav online stav i v kartě
    });
  }

  /* === Telefon + otevírací doba VEDLE VYHLEDÁVÁNÍ (přání klienta) =======
     Do .navigation-buttons (řádek s Přihlášením/košíkem) vloží blok:
     ikona + číslo (nahoře, tučně) + otevírací doba (pod, menší). Číslo bere
     z horní lišty (.project-phone) a naformátuje. Duplicitní telefon+doba
     v horní černé liště se skryje CSS (.top-navigation-contacts). Idempotentní. */
  function buildHeaderPhone() {
    var nav = document.querySelector('.navigation-buttons');
    if (!nav || nav.querySelector('.sz-header-phone')) return;
    var srcA = document.querySelector('.top-navigation-contacts .project-phone, .project-phone');
    var href = srcA ? srcA.getAttribute('href') : 'tel:+420416731365';
    if (!href || href.indexOf('tel:') !== 0) href = 'tel:+420416731365';
    var num = '+420 416 731 365';
    if (srcA) {
      var raw = (srcA.textContent || '').replace(/\s/g, '');
      if (/^\+420\d{9}$/.test(raw)) num = raw.replace(/(\+\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    }
    var photo = 'https://cdn.myshoptet.com/usr/www.svetzarovek.eu/user/merchant/callcentrum.jpg';
    var a = document.createElement('a');
    a.className = 'sz-header-phone';
    a.href = href;
    a.setAttribute('aria-label', 'Zavolat ' + num);
    a.innerHTML =
      '<span class="szp-photo"><img src="' + photo + '" alt="Poradce" loading="lazy"></span>' +
      '<span class="szp-body">' +
        '<span class="szp-num">' + num + '</span>' +
        '<span class="szp-meta"><span class="szp-hrs">Po–Pá: 8:00–16:30</span>' +
          '<span class="szp-online">Jsme online</span>' +
        '</span>' +
      '</span>';
    nav.insertBefore(a, nav.firstChild);
    szSyncOnline(); // nastav aktuální stav (zeleně v otevírací době, jinak skryté)
  }

  /* „Jsme online" ukázat jen v otevírací době (Po–Pá 8:00–16:30), jinak skrýt.
     Přepočítává se ŽIVĚ (interval) – aby po přejetí přes 16:30 nezůstalo zaseklé.
     Hledá element čerstvě, takže funguje i po překreslení hlavičky motivem. */
  function szSyncOnline() {
    var n = new Date(), d = n.getDay(), m = n.getHours() * 60 + n.getMinutes();
    var open = d >= 1 && d <= 5 && m >= 480 && m < 990; // Po–Pá 8:00–16:30 (990 = 16:30)
    [].forEach.call(document.querySelectorAll('.szp-online'), function (el) {
      // CSS má na .szp-online `display:…!important` (hlavička i karta) → inline
      // `display:none` BEZ important by prohrálo a indikátor by po 16:30 nezmizel.
      // Zavřeno → inline `none !important` (přebije CSS); otevřeno → inline styl
      // sundáme a necháme rozhodnout CSS (zobrazí zeleně).
      if (open) el.style.removeProperty('display');
      else el.style.setProperty('display', 'none', 'important');
    });
  }

  /* === Sticky „Do košíku" lišta na MOBILU (přání klienta) ==============
     Když hlavní tlačítko „Vložit do košíku" sjede z obrazovky, naskočí dole
     fixní lišta s cenou + tlačítkem. Klik na ni klikne hlavní tlačítko (zachová
     množství/variantu). Viditelnost řídí IntersectionObserver + třída na body;
     zobrazení jen na mobilu řeší CSS (@media). Idempotentní. */
  function buildStickyBuy() {
    if (!document.body.classList.contains('type-product')) return;
    if (window.__szStickyBuy) return;
    var mainBtn = document.querySelector('form.pr-action .add-to-cart-button.btn-conversion, .p-detail form .add-to-cart-button.btn-conversion, .p-info-wrapper .add-to-cart-button');
    if (!mainBtn) return;
    window.__szStickyBuy = true;
    function priceHtml() {
      var f = document.querySelector('.p-final-price-wrapper .price-final, .p-info-wrapper .price-final, .price-final');
      var s = document.querySelector('.p-final-price-wrapper .price-standard, .p-info-wrapper .price-standard, .price-standard');
      var ftxt = f ? f.textContent.replace(/\s+/g, ' ').trim() : '';
      var stxt = s ? s.textContent.replace(/\s+/g, ' ').trim() : '';
      // původní přeškrtnutá cena jen když existuje (sleva) a liší se od akční
      var orig = (stxt && stxt !== ftxt) ? '<span class="ssb-orig">' + stxt + '</span>' : '';
      return orig + '<span class="ssb-final">' + ftxt + '</span>';
    }
    var cartIco = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
    var bar = document.createElement('div');
    bar.className = 'sz-sticky-buy';
    bar.innerHTML = '<span class="ssb-price">' + priceHtml() + '</span>' +
      '<button type="button" class="ssb-btn">' + cartIco + ' Do košíku</button>';
    document.body.appendChild(bar);
    // najít tlačítko ŽIVĚ při kliknutí – po změně varianty Shoptet buy-box
    // překreslí a původní mainBtn může být odpojený (klik by nic neudělal).
    bar.querySelector('.ssb-btn').addEventListener('click', function () {
      var live = document.querySelector('form.pr-action .add-to-cart-button.btn-conversion, .p-info-wrapper .add-to-cart-button');
      (live || mainBtn).click();
    });
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { document.body.classList.toggle('sz-sticky-on', !e.isIntersecting); });
        var pe = bar.querySelector('.ssb-price'); if (pe) pe.innerHTML = priceHtml();
      }, { threshold: 0 });
      io.observe(mainBtn);
    }
  }

  /* === Sticky „Pokračovat" lišta na MOBILU v košíku (přání klienta) ====
     Když tlačítko Pokračovat (na konci souhrnu) sjede z obrazovky, naskočí
     dole fixní lišta s celkovou cenou + tlačítkem na krok objednávky. Klik
     spustí ŽIVĚ nalezené #continue-order-button (zachová chování motivu).
     Zobrazení jen na mobilu řeší CSS (@media). Idempotentní. */
  function szCartStickyTotal() {
    var p = document.querySelector('.summary-wrapper .price.price-primary, .price-wrapper .price.price-primary');
    return p ? p.textContent.replace(/\s+/g, ' ').trim() : '';
  }
  function buildCartSticky() {
    // JEN na stránce košíku. `#continue-order-button` je i v cart-dropdownu na
    // KAŽDÉ stránce (skrytý) → IntersectionObserver ho bral jako „mimo obraz"
    // a lišta naskakovala všude (homepage, kategorie…). Brána přes body.in-kosik
    // + jistota, že tlačítko je reálně vidět (ne skrytý dropdown).
    if (!document.body || !document.body.classList.contains('in-kosik')) return;
    var mainBtn = document.getElementById('continue-order-button');
    if (!mainBtn || mainBtn.offsetParent === null) return;
    // Idempotentní: po AJAX košíku (ShoptetDOMCartContentLoaded) Shoptet VYMĚNÍ
    // celý .summary-wrapper i #continue-order-button za nové prvky → lištu
    // znovupoužijeme (visí na body, přežije), ale cenu přečteme čerstvě a
    // observer PŘEVĚSÍME na nové tlačítko (starý byl mrtvý → cena mrzla).
    var bar = document.querySelector('.sz-cart-sticky');
    if (!bar) {
      var chevron = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
      bar = document.createElement('div');
      bar.className = 'sz-cart-sticky';
      bar.innerHTML =
        '<span class="scs-price"><span class="scs-lbl">Celkem</span>' +
        '<span class="scs-val"></span></span>' +
        '<button type="button" class="scs-btn">Pokračovat' + chevron + '</button>';
      document.body.appendChild(bar);
      bar.querySelector('.scs-btn').addEventListener('click', function () {
        var live = document.getElementById('continue-order-button');
        if (live) live.click();
      });
    }
    var v = bar.querySelector('.scs-val'); if (v) v.textContent = szCartStickyTotal();
    if (window.__szCartIO) { try { window.__szCartIO.disconnect(); } catch (e) {} }
    if (window.IntersectionObserver) {
      window.__szCartIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { document.body.classList.toggle('sz-cart-sticky-on', !e.isIntersecting); });
        var vv = bar.querySelector('.scs-val'); if (vv) vv.textContent = szCartStickyTotal();
      }, { threshold: 0 });
      window.__szCartIO.observe(mainBtn);
    }
  }

  /* === Init =========================================================== */
  /* CHECKOUT: ARES hláška „Údaje byly automaticky doplněny z 🇨🇿 Aresu" má
     vlajku 🇨🇿, která se na Windows láme na „||" (paskvil). Po doplnění z ARESu
     z hlášky vlajkové emoji (regionální indikátory) odstraníme. */
  function szFixAresFlag() {
    [].forEach.call(document.querySelectorAll('#content span, #order-form span'), function (el) {
      if (el.children.length || !/automaticky dopln/i.test(el.textContent || '')) return;
      var c = el.textContent.replace(/[\uD83C][\uDDE6-\uDDFF]/g, '').replace(/\s{2,}/g, ' ').trim();
      if (c !== el.textContent) el.textContent = c;
    });
  }
  function initAresFix() {
    if (!document.getElementById('order-form')) return; // jen checkout
    szFixAresFlag();
    if (window.__szAresObs) return;
    var host = document.getElementById('content') || document.body;
    window.__szAresObs = new MutationObserver(szFixAresFlag);
    window.__szAresObs.observe(host, { childList: true, subtree: true });
  }
  /* Košík/checkout (ordering-process) nemá patičku → stránka končila „utnutá".
     Doplníme tenkou čistou patičku (kontakt + copyright). Do .overall-wrapper
     (blok, plná šířka) – NE do flex řádku obsahu (tam by se stala 3. sloupcem).
     Zámek jako inline SVG (emoji 🔒 by se na Windows mohlo lámat jako ta vlajka). */
  function buildCheckoutFooter() {
    if (!document.body || !document.body.classList.contains('ordering-process')) return;
    if (document.querySelector('.sz-checkout-footer')) return;
    var host = document.querySelector('.overall-wrapper') || document.body;
    var yr = new Date().getFullYear();
    var lock = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
    var f = document.createElement('div');
    f.className = 'sz-checkout-footer';
    f.innerHTML =
      '<div class="szcf-in">' +
        '<span class="szcf-brand">© ' + yr + ' Svět žárovek</span>' +
        '<span class="szcf-sec">' + lock + ' Bezpečný nákup</span>' +
        '<a href="tel:+420416731365">+420 416 731 365</a>' +
        '<a href="mailto:info@svetzarovek.eu">info@svetzarovek.eu</a>' +
        '<span>Po–Pá 8:00–16:30</span>' +
      '</div>';
    host.appendChild(f);
  }
  /* Homepage „Oblíbené kategorie" (.fav-cat): theme vykreslí obrázek jen
     u kategorií 2. úrovně; u 3. úrovně ho NEvykreslí, i když v adminu nastavený
     JE (ověřeno – Poziční/Trubicové/Kompaktní obrázek kategorie mají). Doplníme
     ho tedy sami podle ID položky menu (menu-item-ID = ID kategorie) a zároveň
     odstraníme osamocené čárky (blok je původně čárkami oddělený seznam odkazů
     z menu, který se zalomil do dlaždic).
     POZOR: názvy souborů jsou NATVRDO – když se v adminu obrázek kategorie
     změní, je potřeba je upravit i tady. */
  var SZ_FAV_CAT_IMG = {
    '2229': 'images_(39).jpg',      // Poziční a směrová světla
    '2325': '1-15.jpg',             // Trubicové zářivky T8 a T5
    '2456': 'main-a60000921220.jpg' // Kompaktní zářivky (Ostatní zářivky)
  };
  function buildFavCatImages() {
    var fav = document.querySelector('.fav-cat');
    if (!fav) return;
    var base = 'https://cdn.myshoptet.com/usr/www.svetzarovek.eu/user/categories/thumb/';
    [].forEach.call(fav.querySelectorAll('li'), function (li) {
      [].forEach.call(li.querySelectorAll('div'), function (d) {
        [].forEach.call(d.childNodes, function (n) {
          if (n.nodeType === 3 && /^[\s,]+$/.test(n.nodeValue)) n.nodeValue = '';
        });
      });
      // označit odkaz s názvem – CSS mu dá pevnou výšku, aby jednořádkové názvy
      // („Kompaktní zářivky") měly stejně vysoký blok jako dvouřádkové.
      var links = [].slice.call(li.querySelectorAll('a'));
      var nameA = links.filter(function (x) { return (x.textContent || '').trim().length > 0; })[0];
      if (nameA) nameA.classList.add('sz-fav-name');
      if (li.querySelector('img')) return;
      var m = String(li.className).match(/menu-item-(\d+)/);
      if (!m || !SZ_FAV_CAT_IMG[m[1]]) return;
      var a = li.querySelector('a');
      if (!a) return;
      var img = document.createElement('img');
      img.className = 'sz-fav-img'; // odlišit MOJE obrázky od theme (kvůli zarovnání textů)
      img.src = base + SZ_FAV_CAT_IMG[m[1]];
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.width = 140; img.height = 100;
      img.loading = 'lazy';
      a.parentNode.insertBefore(img, a);
    });
  }
  /* Informační pruh „Zboží označené skladem… expedujeme do 12:00" (.site-msg)
     je nativně úplně nahoře nad hlavičkou → klient ho chce HNED POD MENU.
     Přesuneme ho za #header (v něm je i menu). Idempotentní. */
  function moveSiteMsg() {
    var msg = document.querySelector('.site-msg');
    if (!msg) return;
    var header = document.getElementById('header');
    if (header && header.nextElementSibling !== msg) header.after(msg);
    // odkrýt AŽ po přesunu (CSS ho do té doby drží display:none, jinak se pruh
    // nejdřív vykreslí nativně nahoře a po přesunu problikne / bílá mezera).
    if (header) msg.classList.add('sz-msg-moved');
  }
  function initAll() {
    buildLoginExtras();
    moveSiteMsg();        // informační pruh pod menu
    moveFilterToSidebar(); // filtr do levého sidebaru (nad podporu)
    initFilters();        // úpravy filtrů
    initFilterToggle();   // + vlastní rozbalování (klik na hlavičku)
    buildFilterChrome();  // hlavička + patička filtru (reskin)
    buildFilterChips();   // štítky aktivních filtrů nad produkty
    initFilterSheet();    // filtr jako bottom sheet na mobilu
    initDetailSklad();
    moveAltToBottom();
    moveUspBelowProduct();
    moveCodeUnderImage(); // detail/mobil: kód produktu pod obrázek
    addOrigPrice();
    moveBadgeToCard();
    styleContactCard();
    buildHelpCard();
    buildHeaderPhone();   // telefon+doba vedle vyhledávání
    buildStickyBuy();     // sticky "Do košíku" lišta na mobilu (detail)
    buildCartSticky();    // sticky "Pokračovat" lišta na mobilu (košík)
    initAresFix();        // checkout: odstranit vlajku z ARES hlášky
    buildCheckoutFooter();// checkout: doplnit tenkou patičku (ordering-process ji nemá)
    buildFavCatImages();  // homepage: fotky u „Oblíbených kategorií" 3. úrovně
  }
  // informační pruh pod menu – pruh i hlavička jsou brzy, pro jistotu i po load
  window.addEventListener('load', moveSiteMsg);
  document.addEventListener('ShoptetDOMPageContentLoaded', moveSiteMsg);
  setTimeout(moveSiteMsg, 400);
  // failsafe: kdyby #header chyběl, pruh po 2 s stejně odkrýt (ať nezůstane skrytý)
  setTimeout(function () { var m = document.querySelector('.site-msg'); if (m) m.classList.add('sz-msg-moved'); }, 2000);
  // sticky buy – buy box se na detailu renderuje později
  window.addEventListener('load', buildStickyBuy);
  document.addEventListener('ShoptetDOMPageContentLoaded', buildStickyBuy);
  setTimeout(buildStickyBuy, 800);
  setTimeout(buildStickyBuy, 1800);
  // sticky "Pokračovat" – souhrn košíku se může renderovat později; po změně
  // množství Shoptet přerenderuje košík (ShoptetDOMCartContentLoaded) → tam
  // převěsit observer a přečíst novou cenu (jinak lišta drží starou částku).
  window.addEventListener('load', buildCartSticky);
  document.addEventListener('ShoptetDOMPageContentLoaded', buildCartSticky);
  document.addEventListener('ShoptetDOMCartContentLoaded', buildCartSticky);
  setTimeout(buildCartSticky, 800);
  setTimeout(buildCartSticky, 1800);

  if (document.readyState !== 'loading') initAll();
  document.addEventListener('DOMContentLoaded', initAll);
  document.addEventListener('ShoptetDOMContentLoaded', initAll);
  // telefon vedle vyhledávání – hlavička je brzy, ale pro jistotu i po load
  window.addEventListener('load', buildHeaderPhone);
  setTimeout(buildHeaderPhone, 800);
  setInterval(szSyncOnline, 60000); // „Jsme online" přepočítávat živě (přejezd přes 16:30)
  // Shoptet překresluje filtry/výpis – chyť i tyhle eventy.
  function reinitFilters() { moveFilterToSidebar(); initFilters(); initFilterToggle(); buildFilterChrome(); buildFilterChips(); initFilterSheet(); }
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
  // karta podpory (košík/kontakt) – po načtení i případném překreslení
  window.addEventListener('load', styleContactCard);
  document.addEventListener('ShoptetDOMCartContentLoaded', styleContactCard);
  setTimeout(styleContactCard, 1000);
  // karta podpory v košíku – po načtení i po AJAX překreslení košíku
  function reinitHelp() { styleContactCard(); buildHelpCard(); }
  window.addEventListener('load', reinitHelp);
  document.addEventListener('ShoptetDOMCartContentLoaded', reinitHelp);
  setTimeout(reinitHelp, 800);
  setTimeout(reinitHelp, 2000);
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

  /* === Detail: spustit naše úpravy AŽ motiv dostaví pravý sloupec ======
     Strážce detailReady() drží detailové funkce v klidu, dokud motiv pravý
     sloupec nedostaví (jinak mu rozhodíme přesun nadpisu/skladovosti/štítků).
     Tenhle poller je hlídá a jakmile je hotovo, spustí je jednou. */
  if (document.body && document.body.classList.contains('type-product')) {
    var __szTries = 0;
    var __szIv = setInterval(function () {
      if (detailReady()) {
        clearInterval(__szIv);
        initDetailSklad(); moveAltToBottom(); moveUspBelowProduct();
        moveCodeUnderImage(); moveBadgeToCard(); addOrigPrice();
      } else if (++__szTries > 100) { clearInterval(__szIv); } // ~10s pojistka
    }, 100);
  }
})();
