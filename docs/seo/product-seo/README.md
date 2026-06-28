# Product-page SEO fixes (2026-06-28)

Audit of the live site. **Most of it is already good** — only `/browse` needs work.

## What's already fine (do NOT touch)
- **Homepage** (`/`) — has `Organization` (with `sameAs`), `WebSite`, and `SearchAction` JSON-LD. Good.
- **Skill pages** (`/skill/@author/name`) — server-rendered, with `SoftwareApplication` + `Offer` + `Person` JSON-LD and real titles. Good. They're independently indexable via the sitemap.

## The one real gap: `/browse`
Two issues, in priority order:

### 1. (Important) The skill listings are JavaScript-rendered — not in the page HTML
`curl https://polyskill.ai/browse` returns **zero `/skill/` links** in the HTML; the grid is populated client-side. Google *can* render JS, but it's slower and less reliable, so `/browse` works far weaker as a discovery/hub page than it should — and the internal links from it (which would pass authority to skill pages) may not be seen.
- **Best fix (needs a dev):** server-render or pre-render the skill grid so the initial HTML contains the skill cards + links. Even rendering the first ~30 cards server-side (with the rest lazy-loaded) gets the links and text into the HTML.
- **Cheap interim fix:** add a server-rendered `<noscript>` or static "All skills" section / link list, and make sure every skill URL is in `sitemap.xml` (skill pages are already indexable, so confirm they're all listed).

### 2. (Easy) `/browse` has zero structured data
Add these two JSON-LD blocks to `/browse` `<head>`. The `CollectionPage` describes the page; `BreadcrumbList` matches the pattern your blog posts already use. If/when the grid is server-rendered, also emit the `ItemList` (template below) populated with the visible skills.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Browse Claude Code Skills & Plugins",
  "description": "Browse and install Claude Code skills, plugins, and extensions. Filter by category, type, and author.",
  "url": "https://polyskill.ai/browse",
  "isPartOf": { "@type": "WebSite", "name": "PolySkill", "url": "https://polyskill.ai" },
  "about": { "@type": "Thing", "name": "Claude Code skills and plugins" }
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://polyskill.ai/" },
    { "@type": "ListItem", "position": 2, "name": "Browse Skills" }
  ]
}
</script>
```

`ItemList` template (emit server-side, one `ListItem` per visible skill — gives Google the catalog + is citable by AI engines):
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1,
      "item": { "@type": "SoftwareApplication", "name": "@author/skill-name",
                "applicationCategory": "DeveloperApplication",
                "url": "https://polyskill.ai/skill/@author/skill-name" } }
    /* …repeat per skill… */
  ]
}
</script>
```

## Bottom line
The product pages aren't broken — homepage and individual skill pages are well-optimized. The leverage is making **`/browse` server-render its skill grid** (so Google sees the catalog and the internal links), plus the two cheap JSON-LD blocks above. The render fix needs a developer; the JSON-LD is copy-paste.
