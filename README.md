# Shoptet úpravy – Svět žárovek

Custom CSS + JS pro Shoptet e-shop **Svět žárovek**, hostované na GitHubu a načítané
přes **GitHub Pages**. Díky tomu se nezahlcuje limit znaků v Shoptet `<head>`
(max 8192 znaků) a úpravy se dělají jen tady, ne v adminu.

Sesterský setup k `shoptet-protvoreni`, `shoptet-deisirup` a `shoptet-callusan`.

## Soubory

| Soubor | Obsah |
|--------|-------|
| `shoptet.css` | Custom styly (zatím prázdný scaffold) |
| `shoptet.js` | Custom skripty / moduly (zatím prázdný scaffold) |

## Vložení do Shoptetu

V adminu **Vzhled a obsah → Editor (HTML kódy v hlavičce)**.

### Vývoj (vždy čerstvá verze, bez cache)

Dev-loader – přidává `?t=` s časem, takže prohlížeč nikdy nedrží starou verzi:

```html
<script>
(function () {
  var base = 'https://czdsgnr.github.io/shoptet-svetzarovek/';
  var t = '?t=' + Date.now();
  var l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = base + 'shoptet.css' + t;
  document.head.appendChild(l);
  var s = document.createElement('script');
  s.src = base + 'shoptet.js' + t;
  s.defer = true;
  document.head.appendChild(s);
})();
</script>
```

### Produkce (po dokončení – statická verze)

```html
<link rel="stylesheet" href="https://czdsgnr.github.io/shoptet-svetzarovek/shoptet.css?v=1">
<script src="https://czdsgnr.github.io/shoptet-svetzarovek/shoptet.js?v=1" defer></script>
```

Verzi `?v=1` zvyšuj při každém vydání, aby se obešla cache.

## Aktualizace / deploy

Edit → `git commit` → `git push`. GitHub Pages build ~1–2 min, pak refresh
(`Cmd+Shift+R`). URL je permanentní a servíruje poslední commit na `main`.
