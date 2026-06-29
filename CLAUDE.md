# CLAUDE.md — Svět žárovek (Shoptet customizace)

> **ČTI TENTO SOUBOR JAKO PRVNÍ.** Pak: `git log --oneline -15`, a paměť
> `~/.claude/.../memory/MEMORY.md` + `shoptet-svetzarovek-cdn-setup.md`.
> Poslední handoff: **2026-06-29**. Záloha: git tag `zaloha-2026-06-29-handoff`
> + soubory `shoptet.{css,js}.zaloha-2026-06-29-handoff`.

## 1. Co to je
Custom **CSS/JS pro e-shop Svět žárovek** (https://www.svetzarovek.eu) — český
e-shop se žárovkami na platformě **Shoptet**. Téma **paxio-merkur** + tmavý
overlay `dark-merkur.css`. **ŽIVÝ web** → každou změnu napřed odsouhlasit
s uživatelem (Jan Röhrich, agentura czdsgnr), pak teprve push.

## 2. Repo, hosting, deploy
- **Lokálně:** `/Users/janrohrich/Documents/Shoptet_shopy_svetzarovek`
- **GitHub:** https://github.com/czdsgnr/shoptet-svetzarovek (branch `main`)
- **Hosting:** GitHub Pages → `https://czdsgnr.github.io/shoptet-svetzarovek/shoptet.css` (+ `.js`)
- **Soubory:** `shoptet.css` (~45 KB), `shoptet.js` (~18 KB), `README.md`, `CLAUDE.md`
- **Deploy workflow:** edit → commit → push → **Pages build ~1–2 min** →
  ověřit `curl -s "https://czdsgnr.github.io/shoptet-svetzarovek/shoptet.css?x=$(date +%s)" | grep ...`
  (`?x=timestamp` obchází cache; poll dokud se nezmění).
- **COMMITY POUZE jako `Jan Röhrich <czdsgnr@gmail.com>`, BEZ Claude/Anthropic trailerů.**
  Příkaz: `git -c user.name="Jan Röhrich" -c user.email="czdsgnr@gmail.com" commit -m "..."`

## 3. Loader v Shoptet `<head>` (DŮLEŽITÉ – verzování!)
Náš CSS+JS se načítá **STATICKY** (render-blocking → bez FOUC/blikání):
```html
<link type="text/css" rel="stylesheet" href="https://czdsgnr.github.io/shoptet-svetzarovek/shoptet.css?v=N" />
<script defer src="https://czdsgnr.github.io/shoptet-svetzarovek/shoptet.js?v=N"></script>
```
- **Po KAŽDÉM deployi musí uživatel zvýšit `?v=N`** (`?v=3` → `?v=4` …) u OBOU,
  jinak browser servíruje cachovanou starou verzi. Bez bumpnutí změny NEUVIDÍ.
- Dřív tu byl „dev-loader" (JS injektoval CSS s `?t=Date.now()`) → **blikalo to**
  (FOUC), protože CSS se aplikoval až po vykreslení. Přešli jsme na statický link.
- **K 2026-06-29 je uživatel kolem `?v=3`–`?v=4`.** Detail-name fix je ve `?v=4`.

## 4. Mapa souborů
### shoptet.js — `initAll()` volá v pořadí:
`buildLoginExtras` → `moveFilterToSidebar` → `initFilters` → `initFilterToggle`
→ `buildFilterChrome` → `initDetailSklad` → `moveAltToBottom` → `moveUspBelowProduct`
→ `addOrigPrice` → `moveBadgeToCard` → `styleContactCard`.
Reinit po Shoptet eventech + setTimeouty (theme překresluje kategorii/karty/detail).
- **buildLoginExtras** – benefity v login popupu
- **initFilters/normalizeFilterState** – sundá nativní `.otevreny`, řadí sekce
- **initFilterToggle** – CAPTURE-fáze klik na `h4` → `.sz-open` (beats dklab blocker)
- **buildFilterChrome** – hlavička „Filtrovat produkty" + patička (Zrušit/Zobrazit),
  skryje nativní „Zrušit filtry", na konci `box.classList.add('sz-ready')` (anti-flash)
- **moveFilterToSidebar** – přesun `.box-filters` do `.sidebar-left` + MutationObserver.
  **POZN.: theme dnes renderuje filtr vlevo SÁM** (`data-filters-default-position="left"`
  nastaveno v Návrháři šablon) → tahle funkce je většinou no-op (necháno jako fallback)
- **initDetailSklad** – staví tabulku „Litoměřice / expedice / Centrální sklad ČR"
  v `.p-info-wrapper .detail-parameters`, přesouvá `.availability-value`
- **moveAltToBottom / moveUspBelowProduct** – přesun alt. produktů / USP na detailu
- **addOrigPrice** – přeškrtnutá původní cena na kartách
- **moveBadgeToCard** – slevový badge `.flags-extra` jako přímé dítě karty
- **styleContactCard** – FB odkaz → „Facebook", telefon s mezerami

### shoptet.css — hlavní sekce (čísla řádků se posouvají):
0) body-scroll fix · 1) tmavý header · 2) login benefity ·
**filtr v sidebaru + chrome + anti-flash (~ř.140–320)** · **volby filtru / checkbox
(~ř.270–320)** · filtry jednotný vzhled (`#filters` prefix!) · sklad na detailu ·
**detail: duplicitní název `:has` fix (~ř.643–652)** · badge · USP pruh ·
**karta podpory `.contact-box` (~ř.861+)** · site-msg · mobil (`@media max-width:767px`).

## 5. Architektura & konvence
- **Filtry vs dklab:** nativní „dklab" filtr používá **#ID selektory**
  (`#category-filter-hover`) → musíme přebít přes **`#filters …` prefix + `!important`**,
  jinak po AJAX (`?pvXX=`) prohrajeme a styl „spadne do nativního".
- **Toggle filtrů:** dklab po AJAX naváže blokující handler → řešíme **capture-fáze
  + `stopPropagation`** (proběhneme první). Aktivní filtr = čisté CSS `:has(input:checked)`.
- **Checkbox ve filtru:** theme reálný `<input>` **skrývá** (`display:none; appearance:none`)
  a kreslí vlastní přes `label::before`. My zobrazujeme **reálný input**
  (`appearance:checkbox !important; display:inline-block; accent-color:#174A61`)
  + `::before` schováváme. (Bez toho nebylo vidět výběr!)
- **Anti-flash filtru:** `.sidebar-left .box-filters:not(.sz-ready){opacity:0}` +
  failsafe `@keyframes` po 1,2 s; JS přidá `.sz-ready` až má chrome → jemný fade.
- **Barvy:** primární teal **#174A61**, akční červená **#e30613**/#e30613, modrý
  info pruh #2550b2. Světle teal pozadí ikon #eaf3f5.

## 6. GOTCHAS (sem koukni, než něco „opravíš"!)
1. **`pkUpravy.css?v=11` v `<head>` = STARÁ AGENTURA, ORPHAN, DĚLÁ BUGY.**
   Měla `.p-detail-inner-header{display:none}` (skrývala název) a patřila ke
   smazanému `pkUpravy.js`, co název přesouval. **Kandidát na smazání** (až s testem).
2. **Detail renderuje NÁZEV 2×:** nahoře full-width (`.p-detail-inner > .p-detail-inner-header`,
   theme skrývá) + v pravém sloupci (`.p-info-wrapper .p-detail-inner-header`, ukazuje se).
   **NIKDY neodkrývej horní natvrdo `display:block`** → duplicitní název! (To byla
   chyba 2026-06-29.) Správně: `:has()` — skrýt horní JEN když je název i v pravém
   sloupci. Viz shoptet.css ~ř.643.
3. **Smazaný `script.js?v=33` + `pkUpravy.js?v=11`** (external `<script>` v Shoptetu) –
   rozbíjely detail. Užitečné funkce přeneseny do našeho shoptet.js. NEvracet.
4. **GitHub Pages build lag 1–2 min** + **`?v` cache** → po pushi uživatel musí
   bumpnout `?v`. Pro vlastní test `curl ?x=$(date +%s)`.
5. **Statický loader = bez blikání, ALE nutný bump `?v` po každém deployi.**
6. **Theme překresluje kategorii** po načtení (JS) → reinit přes eventy + observer.
7. **Browser automace je flaky:** `resize_window` NEMĚNÍ `innerWidth` (mobil nejde
   reálně testovat), uživatel aktivně přepíná taby/produkty. Měř přes JS, ne naslepo.
8. **Custom kódy v `<head>` mimo nás** (NEMAZAT bez rozmyslu): `dark-merkur.css`,
   `style.css?v=20`, inline `<style>` (**`#cat-XXXX` = obrázky kategorií!**, kulatý
   badge `.flag-discount{border-radius:50%}`, řazení filtrů, `.fieldsetinner`),
   **doofinder** skripty (vyhledávač + košík), footer `<script>` (kn_benefits → my
   `.kn_benefits{display:none}`, p-code cleanup, fix-header scroll).

## 7. Stav k 2026-06-29
**HOTOVO:** statický loader (anti-FOUC) · filtr v levém sidebaru (svislý, čisté
řádky voleb, **viditelné checkboxy** + teal zaškrtnutí) · hlavička+patička filtru ·
anti-flash filtru · badge slevy (kulatý, vpravo nahoře, jen −%) · sklad blok na
detailu · USP/alt přesuny · **karta podpory `.contact-box`** (teal nadpis, kulatá
fotka, ikony v kolečkách, FB→Facebook, formát tel.) · mobil header/menu/ikony ·
**detail: duplicitní název opraven `:has()`**.

**ROZDĚLÁNO / DALŠÍ:**
- **Fáze B filtru** (přání klienta, mockupy): chips vybraných filtrů s ×
  (E27 ×, LED žárovka ×) + „Zrušit vše", rychlé přepínače (Skladem/Akce/Novinka/
  Výprodej), in-list hledání („Najít patici"), „Zobrazit dalších N" (show-more).
- **Ověřit mobilní kartu podpory** (nešla otestovat – browser neumí mobil viewport).
- **Úklid `<head>`:** zvážit smazání `pkUpravy.css` (orphan) + redundantních inline
  pravidel (sklad/p-code, co přebíjíme). Až s testem, ne uprostřed práce.

## 8. Aktuální problém k vyřešení (2026-06-29, konec session)
- Uživatel **smazal náš JS** z `<head>` (myslel, že rozbíjí detail). Detail ale
  rozbíjelo **moje CSS** (duplicitní název), ne JS. **Náš JS je bezpečný** – jen
  přesouvá skladovost do tabulky. → **vrátit JS loader.**
- **Duplicitní název je opravený ve `?v=4`** (deployed). Uživatel na cachované
  `?v=3` (s mým starým overridem) ho ještě vidí → **musí bumpnout CSS na `?v=4`**.

## 9. První kroky v novém chatu
1. Přečíst **tenhle CLAUDE.md** + paměť (`MEMORY.md`, `shoptet-svetzarovek-cdn-setup.md`).
2. `git log --oneline -15` (poslední práce).
3. Ověřit s uživatelem, že má v `<head>` loader na `?v` ≥ 4 a **vrácený JS**.
4. Pokud pokračujeme **Fází B filtru** → mockupy má uživatel; instant-apply, ne batch.
5. Každou změnu na živém webu **napřed odsouhlasit**, pak commit (Jan Röhrich) + push
   + říct uživateli „bumpni `?v`".
