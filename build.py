#!/usr/bin/env python3
"""
Static site builder for Leveling Guide.
Generates every HTML page from shared header/footer partials + per-page content.
Run: python3 build.py
"""
import os, json, re
import posixpath
from html import escape
from urllib.parse import urlsplit, urljoin
from seo_data import DESCRIPTIONS

SITE_URL = os.environ.get("SITE_URL", "https://www.levelingguide.com").rstrip("/")
if urlsplit(SITE_URL).scheme not in ("http", "https") or not urlsplit(SITE_URL).netloc or urlsplit(SITE_URL).path or urlsplit(SITE_URL).query or urlsplit(SITE_URL).fragment:
    raise ValueError("SITE_URL must be an absolute origin, such as https://www.levelingguide.com")
SITE_NAME = "Leveling Guide"
ROOT = os.path.dirname(os.path.abspath(__file__))
LAST_UPDATED = "September 2026"

NAV = [
    ("Home", "/"),
    ("Guides", "/self-leveling-concrete/", [
        ("Complete Guide", "/self-leveling-concrete/"),
        ("How to Use", "/how-to-use-self-leveling-concrete/"),
        ("Thickness Guide", "/self-leveling-concrete-thickness/"),
        ("Existing Concrete", "/self-leveling-concrete/#underlayment-vs-structural"),
        ("Over Plywood", "/self-leveling-concrete-over-plywood/"),
        ("Outdoor Use", "/self-leveling-concrete-outdoors/"),
        ("vs Regular Concrete", "/self-leveling-concrete-vs-concrete/"),
        ("Underlayment Guide", "/self-leveling-concrete-underlayment/"),
        ("Primer Guide", "/primer-for-self-leveling-concrete/"),
        ("Mix Guide", "/self-leveling-concrete-mix/"),
        ("Tools Checklist", "/self-leveling-concrete-tools/"),
    ]),
    ("Problems & Fixes", "/self-leveling-concrete-problems/", [
        ("Common Problems", "/self-leveling-concrete-problems/"),
        ("Not Level", "/self-leveling-concrete-not-level/"),
        ("Cracking", "/self-leveling-concrete-cracking/"),
    ]),
    ("Materials & Tools", "/self-leveling-concrete-underlayment/", [
        ("Underlayment", "/self-leveling-concrete-underlayment/"),
        ("Primer", "/primer-for-self-leveling-concrete/"),
        ("Mix Guide", "/self-leveling-concrete-mix/"),
        ("Tools Checklist", "/self-leveling-concrete-tools/"),
    ]),
    ("Calculators", "/self-leveling-concrete-calculator/", [
        ("Material Calculator", "/self-leveling-concrete-calculator/"),
        ("Bag Coverage Calculator", "/self-leveling-concrete-bag-coverage-calculator/"),
        ("Cost Calculator", "/self-leveling-concrete-cost-calculator/"),
    ]),
    ("About", "/about/"),
]

def relative_url(target_url, current_route="/"):
    if not target_url.startswith("/"):
        return target_url
    current_dir = "." if current_route in ("", "/") else current_route.strip("/")
    target_path = "." if target_url == "/" else target_url.strip("/")
    rel = posixpath.relpath(target_path, start=current_dir)
    if rel == ".":
        rel = "./" if target_url == "/" else "./"
    elif not rel.startswith("."):
        rel = "./" + rel
    if target_url.endswith("/") and not rel.endswith("/"):
        rel = rel.rstrip("/") + "/"
    if target_url == "/" and current_route != "/":
        rel = "../" if current_dir != "." else "/"
    return rel


def normalize_root_relative_urls(html, current_route):
    pattern = re.compile(r'''(?P<attr>href|src)=(?P<quote>["'])(?P<value>/[^"']+)(?P=quote)''', re.IGNORECASE)
    def repl(match):
        value = match.group('value')
        return f'{match.group("attr")}={match.group("quote")}{relative_url(value, current_route)}{match.group("quote")}'
    return pattern.sub(repl, html)


def nav_html(mobile=False, current_route="/"):
    if not mobile:
        items = []
        for entry in NAV:
            if len(entry) == 3:
                label, href, children = entry
                subs = "".join(f'<a href="{relative_url(c[1], current_route)}">{c[0]}</a>' for c in children)
                items.append(
                    f'<li class="has-dropdown"><a href="{relative_url(href, current_route)}">{label}</a>'
                    f'<button class="dropdown-toggle" aria-label="Show {label} links" aria-expanded="false">⌄</button>'
                    f'<div class="dropdown">{subs}</div></li>'
                )
            else:
                label, href = entry
                items.append(f'<li><a href="{relative_url(href, current_route)}">{label}</a></li>')
        return f'<nav class="main-nav" aria-label="Primary"><ul>{"".join(items)}</ul></nav>'
    else:
        items = []
        for entry in NAV:
            if len(entry) == 3:
                label, href, children = entry
                subs = "".join(f'<a href="{relative_url(c[1], current_route)}">{c[0]}</a>' for c in children)
                items.append(
                    f'<details><summary>{label}</summary><div class="sub-links">{subs}</div></details>'
                )
            else:
                label, href = entry
                items.append(f'<a href="{relative_url(href, current_route)}">{label}</a>')
        return "".join(items)

def header_html(current_route="/"):
    return f'''<div class="site-notice">A better floor starts with a little know-how. <a href="{relative_url('/self-leveling-concrete/', current_route)}">Find your starting point <span aria-hidden="true">↗</span></a></div>
  <header class="site-header">
    <div class="container">
      <a href="{relative_url('/', current_route)}" class="brand"><span class="brand-mark" aria-hidden="true"></span>
        <span>leveling<span class="brand-light">guide</span><span class="sub">BUILD ON WHAT YOU KNOW.</span></span>
      </a>
      {nav_html(current_route=current_route)}
      <button class="header-search" aria-label="Search the guides" aria-haspopup="dialog" aria-controls="search-dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></button>
      <button class="nav-toggle" aria-expanded="false" aria-controls="mobile-nav" aria-label="Toggle menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>
    </div>
  </header>
  <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">
    <div class="container">
      <div class="mobile-nav-head"><span>Explore Leveling Guide</span><button type="button" class="mobile-close neo-icon-button" aria-label="Close menu">&times;</button></div>
      {nav_html(mobile=True, current_route=current_route)}
    </div>
  </nav>
  <dialog id="search-dialog" aria-labelledby="search-title">
    <div class="search-dialog-head"><h2 id="search-title">What are you working on?</h2><button class="search-close" aria-label="Close search">×</button></div>
    <div class="search-box" data-search><label for="global-search">Search guides and calculators</label><input type="search" id="global-search" placeholder="Try primer, thickness, or cost…" autocomplete="off" aria-controls="global-search-results"><div id="global-search-results" class="search-results" aria-live="polite"></div></div>
    <p class="search-help">Practical answers, from prep to the final pour.</p>
  </dialog>'''

def footer_html(current_route="/"):
    return f'''<footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <h4>{SITE_NAME}</h4>
          <p style="font-size:.9rem;color:var(--c-inverse-muted);max-width:32ch;">Practical, research-based guides and calculators for self-leveling concrete, floor leveling, and underlayment work.</p>
        </div>
        <div>
          <h4>Guides</h4>
          <ul>
            <li><a href="{relative_url('/self-leveling-concrete/', current_route)}">Complete Guide</a></li>
            <li><a href="{relative_url('/how-to-use-self-leveling-concrete/', current_route)}">How to Use</a></li>
            <li><a href="{relative_url('/self-leveling-concrete-thickness/', current_route)}">Thickness</a></li>
            <li><a href="{relative_url('/self-leveling-concrete-over-plywood/', current_route)}">Over Plywood</a></li>
            <li><a href="{relative_url('/self-leveling-concrete-outdoors/', current_route)}">Outdoor Use</a></li>
            <li><a href="{relative_url('/self-leveling-concrete-vs-concrete/', current_route)}">vs Regular Concrete</a></li>
          </ul>
        </div>
        <div>
          <h4>Materials &amp; Tools</h4>
          <ul>
            <li><a href="{relative_url('/self-leveling-concrete-underlayment/', current_route)}">Underlayment</a></li>
            <li><a href="{relative_url('/primer-for-self-leveling-concrete/', current_route)}">Primer</a></li>
            <li><a href="{relative_url('/self-leveling-concrete-mix/', current_route)}">Mix Guide</a></li>
            <li><a href="{relative_url('/self-leveling-concrete-tools/', current_route)}">Tools Checklist</a></li>
          </ul>
        </div>
        <div>
          <h4>Problems &amp; Fixes</h4>
          <ul>
            <li><a href="{relative_url('/self-leveling-concrete-problems/', current_route)}">Common Problems</a></li>
            <li><a href="{relative_url('/self-leveling-concrete-not-level/', current_route)}">Not Level</a></li>
            <li><a href="{relative_url('/self-leveling-concrete-cracking/', current_route)}">Cracking</a></li>
          </ul>
        </div>
        <div>
          <h4>Calculators</h4>
          <ul>
            <li><a href="{relative_url('/self-leveling-concrete-calculator/', current_route)}">Material Calculator</a></li>
            <li><a href="{relative_url('/self-leveling-concrete-bag-coverage-calculator/', current_route)}">Bag Coverage</a></li>
            <li><a href="{relative_url('/self-leveling-concrete-cost-calculator/', current_route)}">Cost Calculator</a></li>
          </ul>
        </div>
        <div>
          <h4>Company</h4>
          <ul>
            <li><a href="{relative_url('/about/', current_route)}">About</a></li>
            <li><a href="{relative_url('/contact/', current_route)}">Contact</a></li>
            <li><a href="{relative_url('/editorial-policy/', current_route)}">Editorial Policy</a></li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li><a href="{relative_url('/privacy-policy/', current_route)}">Privacy Policy</a></li>
            <li><a href="{relative_url('/terms/', current_route)}">Terms of Use</a></li>
            <li><a href="{relative_url('/disclaimer/', current_route)}">Disclaimer</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; 2026 {SITE_NAME}. All rights reserved.</span>
        <span><a href="mailto:muhammad.akhtar0329@gmail.com">muhammad.akhtar0329@gmail.com</a> | <a href="https://wa.me/923297193542" target="_blank" rel="noopener noreferrer">03297193542</a></span>
      </div>
    </div>
  </footer>'''

def breadcrumbs_html(trail, current_route="/"):
    # trail: list of (label, url) tuples, last one is current page (no link)
    parts = []
    for i, (label, url) in enumerate(trail):
        if i == len(trail) - 1:
            parts.append(f'<span aria-current="page">{label}</span>')
        else:
            parts.append(f'<a href="{relative_url(url, current_route)}">{label}</a><span class="sep">/</span>')
    return f'<nav class="breadcrumbs container" aria-label="Breadcrumb">{"".join(parts)}</nav>'

def breadcrumb_schema(trail):
    items = []
    for i, (label, url) in enumerate(trail):
        items.append({
            "@type": "ListItem",
            "position": i + 1,
            "name": label,
            "item": SITE_URL + url
        })
    return json.dumps({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items
    })

def article_image(slug):
    if any(word in slug for word in ("tools", "primer", "mix", "how-to")):
        return ("/assets/img/leveling-tools-800.webp", "Illustration of mixing equipment, a finishing trowel, primer roller, and a material bag", "Illustrative tool render. Match your equipment and primer to the product’s installation instructions.")
    if any(word in slug for word in ("thickness", "underlayment", "plywood", "vs-concrete")):
        return ("/assets/img/floor-layers.svg", "Exploded illustration of finished flooring, underlayment, primer, and a concrete substrate", "Typical concrete substrate assembly, shown for context. Layers are not to scale; plywood requires a separately approved system.")
    return ("/assets/img/concrete-interior-800.webp", "Architectural concept showing a smooth concrete floor in a sunlit interior", "Architectural concept render. An exposed finish requires a product rated as a wearing surface.")


def page(*, title, description, canonical_path, body, extra_head="", og_type="website", og_image="/assets/img/leveling-guide-social.jpg"):
    canonical = SITE_URL + canonical_path
    description = DESCRIPTIONS.get(canonical_path, description)
    title, description = escape(title, quote=True), escape(description, quote=True)
    robots = "noindex, follow" if canonical_path == "/404.html" else "index, follow, max-image-preview:large"
    page_class = "home-page" if canonical_path == "/" else "inner-page"
    if 'calculator' in canonical_path:
        page_class += " calculator-page"
    current_route = canonical_path if canonical_path.endswith('/') or canonical_path == '/' else canonical_path.rstrip('/') + '/'
    if canonical_path == '/404.html':
        current_route = '/404.html'
    # Visible breadcrumbs also get machine-readable equivalents, including tools and legal pages.
    if 'BreadcrumbList' not in extra_head and canonical_path not in ("/", "/404.html"):
        match = re.search(r'<nav class="breadcrumbs.*?</nav>', body, re.S)
        trail = [("Home", "/")]
        if match:
            for href, label in re.findall(r'<a href="([^"]+)">(.*?)</a>', match.group(0)):
                if href in ("/", canonical_path):
                    continue
                resolved = urljoin(SITE_URL + current_route, href)
                resolved_path = urlsplit(resolved).path
                if resolved_path in ("", "/"):
                    route = "/"
                else:
                    route = resolved_path if resolved_path.startswith("/") else "/" + resolved_path
                if route != "/" and route != canonical_path:
                    trail.append((label, route))
            current = re.search(r'<span aria-current="page">(.*?)</span>', match.group(0))
            trail.append((current.group(1) if current else title, canonical_path))
            extra_head += '<script type="application/ld+json">' + breadcrumb_schema(trail) + '</script>'
    # Crawlable images are explicitly sized; only offscreen illustrations are lazy loaded.
    # Scroll the container, retaining the table's native semantics and caption.
    body = re.sub(r"<table class=['\"]spec table-scroll['\"]>(.*?)</table>",
                  r'<div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable technical table"><table class="spec">\1</table></div>', body, flags=re.S)
    body = re.sub(r'<img\b([^>]+)>', lambda m: '<img' + m.group(1) + (' decoding="async"' if 'decoding=' not in m.group(1) else '') + '>', body)
    body = normalize_root_relative_urls(body, current_route)
    org = {"@context": "https://schema.org", "@type": "Organization", "@id": SITE_URL + "/#organization", "name": SITE_NAME, "url": SITE_URL, "logo": SITE_URL + "/assets/img/favicon.svg"}
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-EEVCE53BZW"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-EEVCE53BZW');
</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<meta name="robots" content="{robots}">
<meta name="theme-color" content="#232724">
<link rel="canonical" href="{canonical}">
<link rel="icon" href="{relative_url('/assets/img/favicon.svg', current_route)}" type="image/svg+xml">
<meta property="og:type" content="{og_type}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE_URL}{og_image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Leveling Guide — self-leveling concrete guides and calculators">
<meta property="og:locale" content="en_US">
<meta property="og:site_name" content="{SITE_NAME}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{description}">
<meta name="twitter:image" content="{SITE_URL}{og_image}">
<link rel="stylesheet" href="{relative_url('/assets/css/style.css', current_route)}">
<link rel="stylesheet" href="{relative_url('/assets/css/experience.css', current_route)}">
<noscript><style>.nav-toggle,.header-search,.viewer-controls,.mobile-nav-head{{display:none}}@media(max-width:960px){{.mobile-nav{{display:block!important;position:static;max-height:none}}}}</style></noscript>
<script type="application/ld+json">{json.dumps(org)}</script>
{extra_head}
</head>
<body class="{page_class}">
<a class="skip-link" href="#main">Skip to content</a>
{header_html(current_route)}
{body}
{footer_html(current_route)}
<script src="{relative_url('/assets/js/search-index.js', current_route)}" defer></script>
<script src="{relative_url('/assets/js/main.js', current_route)}" defer></script>
</body>
</html>'''

def write(path, html):
    full = os.path.join(ROOT, path.lstrip("/"), "index.html") if not path.endswith(".html") and not path.endswith(".xml") and not path.endswith(".txt") else os.path.join(ROOT, path.lstrip("/"))
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(html)
    print("wrote", full)

if __name__ == "__main__":
    print("Partials module loaded directly — run generate_pages.py to build the site.")
