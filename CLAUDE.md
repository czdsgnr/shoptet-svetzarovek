# CLAUDE.md — Svět žárovek (Shoptet customizace)

> **ČTI TENTO SOUBOR JAKO PRVNÍ.** Pak: `git log --oneline -20`, a paměť
> `~/.claude/.../memory/MEMORY.md` + `shoptet-svetzarovek-cdn-setup.md`.
> **Poslední handoff: 2026-06-29 (2. toho dne).** Záloha: git tag
> `zaloha-2026-06-29-handoff2` + soubory `shoptet.{css,js}.zaloha-2026-06-29-handoff2`.

## 1. Co to je
Custom **CSS/JS pro e-shop Svět žárovek** (https://www.svetzarovek.eu) — český
e-shop se žárovkami na platformě **Shoptet**. Téma **paxio-merkur** + tmavý
overlay `dark-merkur.css`. **ŽIVÝ web** → každou změnu napřed odsouhlasit
s uživatelem (Jan Röhrich, agentura czdsgnr), pak teprve push.

## 2. Repo, hosting, deploy
- **Lokálně:** `/Users/janrohrich/Documents/Shoptet_shopy_svetzarovek`
- **GitHub:** https://github.com/czdsgnr/shoptet-svetzarovek (branch `main`)
- **Hosting:** GitHub Pages → `https://czdsgnr.github.io/shoptet-svetzarovek/shoptet.css` (+ `.js`)
- **Soubory:** `shoptet.css` (~45 KB), `shoptet.js` (~20 KB), `README.md`, `CLAUDE.md`
- **Deploy workflow:** edit → `node --check shoptet.js` → commit → push → **Pages build ~1–3 min**.
  Ověření, že je nová verze live (otisk):
  ```bash
  L=$(md5 -q shoptet.css); for i in $(seq 1 12); do R=$(curl -s "https://czdsgnr.github.io/shoptet-svetzarovek/shoptet.css?t=$RANDOM$RANDOM" | md5 -q); [ "$R" = "$L" ] && { echo OK; break; } || sleep 15; done
  ```
- **COMMITY POUZE jako `Jan Röhrich`, BEZ Claude/Anthropic trailerů.** (Repo má git
  user `czdsgnr`; commity dnes prošly bez trailerů — drž to tak.)

## 3. Loader v Shoptet `<head>` (DŮLEŽITÉ – verzování + cache past!)
Náš CSS+JS se načítá **STATICKY** (render-blocking → bez FOUC/blikání):
```html
<link type="text/css" rel="stylesheet" href="https://czdsgnr.github.io/shoptet-svetzarovek/shoptet.css?v=N" />
<script defer src="https://czdsgnr.github.io/shoptet-svetzarovek/shoptet.js?v=N"></script>
```
- **Po KAŽDÉM pushi MUSÍ uživatel ZVÝŠIT `?v=N` u OBOU** (`?v=7` → `?v=8` …).
- **❗ NEJ-GOTCHA dne: NIKDY NEREUSUJ stejné `?v` po dalším pushi.** Když pod stejnou
  URL (`?v=7`) pushneš nový obsah, browser i Fastly drží **starou kopii** → uživatel
  vidí starý/rozbitý kód, i když na serveru je správný. Pokaždé **nové číslo**.
  (Pozn.: GitHub Pages servíruje pro daný *path* stejné bajty bez ohledu na `?v` —
  query mění jen **cache key** browseru/CDN. Proto `curl ?t=$RANDOM` vždy stáhne
  aktuální soubor = dobré pro test; browser uživatele drží cache dle `?v`.)
- **Dev-loader** (JS injektoval CSS s `?t=Date.now()`) cache obchází vždy, ALE
  **blikalo to** (FOUC) a JS běžel pozdě „náhodou až po motivu" → nepoužívat.
- **Stav verze k handoffu: live je `?v=7` = commit `3826560` (CHYBNÝ, jumbled sklad
  text). HEAD `237f57a` je SPRÁVNÝ → uživatel musí nasadit `?v=8` a ověřit.**

## 4. Mapa souborů
### shoptet.js — `initAll()` volá v pořadí:
`buildLoginExtras` → `moveFilterToSidebar` → `initFilters` → `initFilterToggle`
→ `buildFilterChrome` → `initDetailSklad` → `moveAltToBottom` → `moveUspBelowProduct`
→ `addOrigPrice` → `moveBadgeToCard` → `styleContactCard`.
Reinit po Shoptet eventech + setTimeouty (theme překresluje kategorii/karty/detail).
- **`detailReady()` (NOVÉ 2026-06-29) – KLÍČOVÝ STRÁŽCE.** Na `type-product`
  stránce vrací `true` AŽ když motiv dostaví pravý sloupec (signál:
  `.p-info-wrapper .p-detail-inner-header` existuje; pojistka po `window 'load'`).
  Na nedetailových stránkách vrací `true` hned. **Detailové funkce (`initDetailSklad`,
  `moveAltToBottom`, `moveUspBelowProduct`, `moveBadgeToCard`, `addOrigPrice`) mají
  na začátku `if (!detailReady()) return;`** + na konci skriptu je **poller**, který
  je spustí jednou, až je `detailReady()`. Důvod viz GOTCHA #1.
- **buildLoginExtras** – benefity v login popupu
- **initFilters/normalizeFilterState** – sundá nativní `.otevreny`; **přidává
  sekcím třídu z textu nadpisu `h4`** (`initFilters`, ~ř.72: `cls = h4text.toLowerCase()
  .replace(/[^a-z]/g,'')`) → tahle třída zapíná inline CSS `order` (řazení sekcí filtru!)
- **initFilterToggle** – CAPTURE-fáze klik na `h4` → `.sz-open` (beats dklab blocker)
- **buildFilterChrome** – hlavička „Filtrovat produkty" + patička; `box.classList.add('sz-ready')`
- **moveFilterToSidebar** – přesun `.box-filters` do `.sidebar-left` + MutationObserver
  (theme dnes renderuje filtr vlevo SÁM → většinou no-op, fallback)
- **initDetailSklad** – staví tabulku „Litoměřice / expedice / Centrální sklad ČR"
  v `.p-info-wrapper .detail-parameters`, přesouvá `.availability-value`
- **moveAltToBottom / moveUspBelowProduct** – přesun alt. produktů / USP na detailu
- **addOrigPrice / moveBadgeToCard** – přeškrtnutá cena / slevový badge na kartách
- **styleContactCard** – FB odkaz → „Facebook", telefon s mezerami

### shoptet.css — hlavní sekce (čísla řádků se posouvají):
tmavý header · login benefity · **filtr: sidebar + chrome + anti-flash + viditelné
checkboxy (~ř.140–470)** · **`.filter-sections` bez šedého pozadí (~ř.337)** ·
sklad na detailu (~ř.690–810) · **detail: duplicitní NÁZEV `:has` fix (~ř.643–652)** ·
badge · USP pruh · karta podpory `.contact-box` · mobil (`@media max-width:767px`).

## 5. Architektura & konvence
- **Filtry vs dklab:** nativní „dklab" filtr používá **#ID selektory** → přebíjet
  přes **`#filters …` prefix + `!important`** (jinak po AJAX `?pvXX=` prohrajeme).
- **Toggle filtrů:** dklab po AJAX naváže blokující handler → **capture-fáze +
  `stopPropagation`**. Aktivní filtr = čisté CSS `:has(input:checked)`.
- **Checkbox ve filtru:** theme reálný `<input>` skrývá → my zobrazujeme reálný input
  (`appearance:checkbox; accent-color:#174A61`) + `::before` schováváme.
- **Specificita vs theme:** theme často používá selektory s `td` navíc
  (`.sklad td .availability-value …`) → naše override **musí mít stejnou nebo vyšší
  specificitu** (přidat `td`), jinak `!important` neprorazí. (Spálili jsme se 2026-06-29.)
- **Barvy:** teal **#174A61**, akční červená **#e30613**, modrý info pruh #2550b2,
  světle teal pozadí ikon #eaf3f5.

## 6. GOTCHAS (sem koukni, než něco „opravíš"!)
1. **❗ TIMING RACE — motiv staví pravý sloupec detailu AŽ po DOMContentLoaded.**
   `<script defer>` spustí náš JS PRÁVĚ na DOMContentLoaded → běžel **dřív** než motiv
   přesune do `.p-info-wrapper` nadpis/hodnocení/skladovost/štítky → náš DOM zásah
   (hl. `moveUspBelowProduct`) motivu rozhodil přesun → **celá pravá strana se
   nedostavěla** (chybí nadpis, sklad, štítky; header zůstal nahoře `display:none`).
   Žádná JS chyba v konzoli — je to čistě pořadí! Dev-loader to „opravoval" jen
   náhodou (síťové zpoždění → JS běžel po motivu). **ŘEŠENÍ: `detailReady()` strážce**
   (viz sekce 4). Commit `a53af3d`. **NEVRACEJ to.**
2. **Skladová věta „Můžeme doručit do <datum>" dělá SÁM motiv** přes `::before` na
   datumovém spanu (`content: ", Můžeme doručit do "`). Element `.delivery-time-label`
   / `.delivery-in-detail` (TR) je **nativně skrytý zdrojový popisek** — **NESMÍŠ ho
   odkrýt** (`display:inline`)! Když ho odkryješ → „Můžeme doručit do" je tam
   **DUPLICITNĚ** (osamoceně na konci). Naše CSS ho teď drží `display:none` (~ř.773).
   Commit `237f57a`. (Spálili jsme se dlouho 2026-06-29 — flex reorder byl slepá cesta.)
3. **Detail renderuje NÁZEV 2×:** nahoře (`.p-detail-inner > .p-detail-inner-header`,
   skrytý) + v pravém sloupci (`.p-info-wrapper .p-detail-inner-header`, ukazuje se).
   **NIKDY neodkrývej horní natvrdo `display:block`** → duplicitní název. Správně
   `:has()` (~ř.643): skrýt horní JEN když je název i v pravém sloupci.
4. **`pkUpravy.css?v=11` v `<head>` = STARÁ AGENTURA, ORPHAN.** Kandidát na smazání
   (až s testem). Smazaný `script.js?v=33` + `pkUpravy.js?v=11` rozbíjely detail —
   funkce přeneseny k nám. NEvracet.
5. **GitHub Pages build lag 1–3 min + `?v` cache** → po pushi bump `?v` (NIKDY nereusuj
   stejné číslo, viz sekce 3). Pro vlastní test `curl ?t=$RANDOM`.
6. **Browser automace je flaky:** uživatel aktivně přepíná taby/produkty (taby mizí),
   `resize_window` NEMĚNÍ `innerWidth` (mobil reálně netestovatelný). Měř přes JS
   (`getComputedStyle`, `textContent`), **vizuál ověřuj screenshotem** — `textContent`
   NEvidí `::before/::after` obsah (proto duplicitní text nešel poznat z textContent)!
7. **Custom kódy v `<head>` mimo nás** (NEMAZAT bez rozmyslu): `dark-merkur.css`,
   `style.css`, inline `<style>` (`#cat-XXXX` = obrázky kategorií!, kulatý badge,
   **řazení filtrů přes `order`**), **doofinder** (vyhledávač+košík), footer `<script>`.

## 7. Stav k 2026-06-29 (konec 2. session)
**HOTOVO a deployed (HEAD `237f57a`):**
- Statický loader (anti-FOUC) · filtr v levém sidebaru (viditelné checkboxy, teal) ·
  hlavička+patička filtru · anti-flash · kulatý badge slevy · sklad blok na detailu ·
  USP/alt přesuny · karta podpory `.contact-box` · mobil header/menu · detail:
  duplicitní název `:has()`.
- **NOVÉ dnes:** ① `detailReady()` strážce → **opravená rozbitá pravá strana detailu**
  při statickém `<script defer>` (GOTCHA #1). ② `.filter-sections` **bez šedého pozadí**
  (override theme #f6f6f6 → transparent). ③ **opravený duplicitní „Můžeme doručit do"**
  (skrytý orphan label, GOTCHA #2).

**⚠️ NUTNÉ HNED V DALŠÍM CHATU:**
1. **Uživatel nasadí `?v=8`** (oba tagy) a **tvrdý reload** → ověřit naživo:
   (a) pravá strana detailu kompletní (nadpis, hodnocení, sklad, štítky), bez blikání;
   (b) sklad čte **„Skladem 1 ks, Můžeme doručit do 1.7.2026"** BEZ druhého „Můžeme
   doručit do" na konci. (Live `?v=7` je ještě chybný — viz sekce 3.)

**ROZDĚLÁNO / DALŠÍ:**
- **🆕 Pořadí sekcí filtru v kategorii (přání klienta).** Klient: „přehazovalo se to —
  já měl první *produkt*, pak *napětí*, *patice* atd." → chce **stabilní pořadí sekcí**.
  Mechanika: pořadí řídí **inline CSS `order`** v Shoptet `<head>` (řazení filtrů),
  zapínané třídami, které `initFilters` přidává sekcím z textu nadpisu `h4`
  (shoptet.js ~ř.72–77). **Postup:** zjistit reálné názvy sekcí na kategorii →
  doplnit/srovnat `order` hodnoty (buď v inline `<head>` CSS, nebo to přesunout k nám
  do shoptet.css `.filter-section.<nazev>{order:N}`). Ověřit, že drží i po AJAX.
- **Fáze B filtru** (mockupy u klienta): chips vybraných filtrů s × + „Zrušit vše",
  rychlé přepínače (Skladem/Akce/Novinka/Výprodej), in-list hledání, „Zobrazit dalších N".
- **Ověřit mobilní detail** (uživatel zmiňoval úpravy mobilu na detailu — počkat na
  konkrétní zadání/screenshot; viewport reálně netestovatelný, dělat přes `@media`).
- **Úklid `<head>`:** zvážit smazání `pkUpravy.css` (orphan). Až s testem.

## 8. Zálohy (2026-06-29 handoff2)
- git tag **`zaloha-2026-06-29-handoff2`** (pushnutý snapshot HEAD `237f57a`)
- soubory: `shoptet.js.zaloha-2026-06-29-handoff2`, `shoptet.css.zaloha-2026-06-29-handoff2`
- starší zálohy v repu: `*.zaloha-2026-06-29-handoff`, `*-pred-reskinem`,
  `*-pred-detailfix`, `*-pred-filterbg`, `*-pred-delivery-order`, `*.zaloha-2026-06-27`

## 9. První kroky v novém chatu
1. Přečíst **tenhle CLAUDE.md** + paměť (`MEMORY.md`, `shoptet-svetzarovek-cdn-setup.md`).
2. `git log --oneline -20` (poslední práce dnes: `a53af3d` detailReady, `97c5f23`
   filtr bg, `3826560` chybný flex, `237f57a` oprava duplicit. textu).
3. **Vyřídit „NUTNÉ HNED" ze sekce 7** — říct uživateli ať nasadí `?v=8` a ověřit
   naživo v prohlížeči (detail pravá strana + skladový text).
4. Pak pokračovat **pořadím sekcí filtru** (sekce 7, přání klienta) nebo Fází B.
5. Každou změnu na živém webu **napřed odsouhlasit**, pak commit (Jan Röhrich) + push
   + říct uživateli „**bumpni `?v` na NOVÉ číslo**" (nikdy nereusuj staré).
