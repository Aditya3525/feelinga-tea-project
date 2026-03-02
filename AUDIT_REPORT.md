# Feelinga Tea — UI/UX Audit Report

**Project:** Feelinga Tea E-Commerce  
**Audit Scope:** `next-frontend/` (Frontend only — read-only analysis)  
**Stack:** Next.js 16.1.6 / React 19.2.3 / TypeScript 5.9.3 / Express 4.21.0 / MongoDB  
**Methodology:** Static analysis following 8-phase AUDIT_IMPLEMENTATION_PLAN.md  
**Deliverables:** This report + `ROADMAP.md`

---

## Executive Summary

Feelinga Tea is a well-designed premium tea e-commerce project with a strong visual identity — warm typographic scale, a working dark-mode token system, and polished CSS animations. However the audit uncovered **1 CRITICAL**, **9 HIGH**, **12 MEDIUM**, and **7 LOW** severity findings across design-system integrity, component reuse, accessibility, SEO, and content consistency.

The single most impactful defect is the use of `--color-primary` throughout the codebase — it is called in five locations but **never defined** in `:root` or `[data-theme="dark"]`. This silently breaks the active state of the Product Detail Page tab bar and origin card accent border in both light and dark modes.

Accessibility gaps are widespread: the toast notification system has no `aria-live` region, the FAQ accordion buttons lack `aria-expanded`, the cart drawer "Remove" action is an unsemantic `<div>`, and PDP tabs have no ARIA attributes at all. None of these require visual redesign — they are structural HTML fixes.

SEO coverage is incomplete: the highest-value page (Product Detail) sets its `<title>` via `document.title` in a `useEffect`, which search-engine crawlers cannot reliably read. Five routes have no `layout.tsx` `metadata` export at all.

Content inconsistencies — including three different delivery-time promises and four different contact email addresses across the site — erode buyer trust at critical conversion moments.

---

## Section 1 — Project Inventory

### 1.1 Page Inventory

| Route | File | Lines | Client/Server | layout.tsx? |
|---|---|---|---|---|
| `/` | `src/app/page.tsx` | 392 | 'use client' | Root only |
| `/shop` | `src/app/shop/page.tsx` | 220 | 'use client' | ✅ shop/layout.tsx |
| `/product/[slug]` | `src/app/product/[slug]/page.tsx` | 725 | 'use client' | ❌ Missing |
| `/about` | `src/app/about/page.tsx` | 123 | 'use client' | ✅ about/layout.tsx |
| `/checkout` | `src/app/checkout/page.tsx` | 327 | 'use client' | ✅ checkout/layout.tsx |
| `/profile` | `src/app/profile/page.tsx` | 251 | 'use client' | ✅ profile/layout.tsx |
| `/profile/orders/[id]` | `src/app/profile/orders/[id]/page.tsx` | — | 'use client' | None in parent |
| `/admin` | `src/app/admin/page.tsx` | 1,231 | 'use client' | ✅ admin/layout.tsx |
| `/gifting` | `src/app/gifting/page.tsx` | — | 'use client' | ✅ gifting/layout.tsx |
| `/contact` | `src/app/contact/page.tsx` | 122 | 'use client' | ✅ contact/layout.tsx |
| `/learn` | `src/app/learn/page.tsx` | 112 | 'use client' | ✅ learn/layout.tsx |
| `/faq` | `src/app/faq/page.tsx` | 113 | 'use client' | ✅ faq/layout.tsx |
| `/wishlist` | `src/app/wishlist/page.tsx` | 151 | 'use client' | ✅ wishlist/layout.tsx |
| `/order-confirm` | `src/app/order-confirm/page.tsx` | — | 'use client' | ✅ order-confirm/layout.tsx |
| `/privacy` | `src/app/privacy/page.tsx` | — | 'use client' | ❌ Missing |
| `/terms` | `src/app/terms/page.tsx` | — | 'use client' | ❌ Missing |
| `/reset-password` | `src/app/reset-password/page.tsx` | 115 | 'use client' | ❌ Missing |
| `/verify-email` | `src/app/verify-email/page.tsx` | — | 'use client' | ❌ Missing |

> **Observation:** Every page is rendered client-side (`'use client'`). No route uses React Server Components, `generateStaticParams`, or `generateMetadata`.

### 1.2 Component Inventory

| Component | File | Purpose | Issues |
|---|---|---|---|
| `Layout` | `src/components/Layout.tsx` | Shell: header, mobile nav, cart drawer, footer | Admin link uses inline styles; cart Remove is a `<div>` |
| `ProductCard` | `src/components/ProductCard.tsx` | Reusable product tile | Bypassed on 2 pages |
| `EmptyState` | `src/components/EmptyState.tsx` | Empty/unauthenticated placeholders | Bypassed on 3 pages |
| `SectionHeader` | `src/components/SectionHeader.tsx` | Overline + h2 + description pattern | Bypassed on 2 pages |
| `ProductGridSkeleton` | `src/components/ProductGridSkeleton.tsx` | Loading skeleton (grid + PDP variants) | Clean |
| `AuthModal` | `src/components/AuthModal.tsx` | Login / Register / Forgot Password modal | Google OAuth button permanently disabled |
| `Toast` | `src/components/Toast.tsx` | Toast notification system | Missing `aria-live` |
| `Providers` | `src/components/Providers.tsx` | Context wrapper in root layout | Clean |
| `SearchOverlay` | `src/components/SearchOverlay.tsx` | Site-wide search | Not independently audited |
| `CookieConsent` | `src/components/CookieConsent.tsx` | Cookie consent banner | All CSS variable names are wrong |

### 1.3 Context & State Inventory

| Context | File | Persistence | Notes |
|---|---|---|---|
| `AuthContext` | `src/context/AuthContext.tsx` | localStorage (`feelinga_token`, `feelinga_refresh`, `feelinga_user`) | Background validation call on mount |
| `CartContext` | `src/context/CartContext.tsx` | localStorage + server sync on login | Syncs to `/cart/sync` on auth |
| `ThemeContext` | `src/context/ThemeContext.tsx` | localStorage / `data-theme` attribute | Clean dark/light toggle |
| `ToastContext` | (in `Toast.tsx`) | In-memory | Missing `aria-live` |

### 1.4 Design Token Summary

Tokens are defined in `src/styles/styles.css` `:root` block (lines 4–86).

**Defined Token Categories:**

- Colours: 18 (`--color-bg`, `--color-bg-alt`, `--color-surface`, `--color-text`, `--color-text-light`, `--color-text-muted`, `--color-accent`, `--color-accent-hover`, `--color-accent-light`, `--color-secondary`, `--color-border`, `--color-gold`, `--color-success`, `--color-error`)
- Typography: 2 font families, 5 text sizes (`--text-xs` through `--text-xl`)
- Spacing: 9 tokens (`--space-xs` through `--space-5xl`) on a 4px/8px base grid
- Radii: 5 tokens (`--radius-sm` through `--radius-2xl`)
- Shadows: 4 + glow token
- Transitions: 3 tokens
- Gradients: 2 (`--gradient-warm`, `--gradient-soft`)
- Glass: 2 tokens

**Undefined but used:** `--color-primary` (5 call-sites), `--color-error-light` (1 call-site)

---

## Section 2 — Design System Audit

### Finding TOK-001 · CRITICAL

**`--color-primary` is referenced but never defined**

The token `--color-primary` is used in five locations but has no definition in `:root` or `[data-theme="dark"]`. All browsers resolve undefined custom properties to an empty string, rendering those declarations inert.

| File | Line | Usage |
|---|---|---|
| `src/styles/styles.css` | 1013 | `.pdp-tab.active { border-bottom-color: var(--color-primary); }` |
| `src/styles/styles.css` | 1014 | `.pdp-tab.active { color: var(--color-primary); }` |
| `src/styles/styles.css` | 1036 | `.pdp-origin { border-left: 3px solid var(--color-primary); }` |
| `src/app/checkout/page.tsx` | 227 | Border on active payment method card |
| `src/app/profile/page.tsx` | 208 | Background of "Save Profile" button |
| `src/app/profile/page.tsx` | 231 | Order status badge for non-delivered/non-cancelled orders |
| `src/app/admin/page.tsx` | 814 | Background of active mood chip in product form |

**Impact:** The PDP tab active indicator is invisible (no underline, no colour change). The "Save Profile" button has no background. Order status badges default to transparent. The mood selector in Admin has no selected-state feedback. All are interactive-state failures.

**Recommended fix:** Add to `:root` in `styles.css` (line ~78):
```css
--color-primary: var(--color-accent);        /* or a distinct brand colour */
```
And add a dark-mode override in `[data-theme="dark"]` if the colour should change.

---

### Finding TOK-002 · HIGH

**`CookieConsent` uses entirely wrong CSS variable names**

`src/components/CookieConsent.tsx` references four design tokens whose names exist nowhere in the design system.

| Used name | Correct name | Fallback used | Problem |
|---|---|---|---|
| `--card-bg` | `--color-surface` | `#fff` | Will always fall back in dark mode |
| `--text` | `--color-text` | `#222` | Always falls back |
| `--border` | `--color-border` | `#e0d6ca` | Always falls back |
| `--accent` | `--color-accent` | `#6b8f71` | Wrong colour — green, not brand warm brown |

The `--accent` fallback (`#6b8f71`) is a muted green, not Feelinga's warm brown (`#8B6F47`), so the "Accept" button will appear green in any browser where custom properties fail to resolve.

---

### Finding TOK-003 · MEDIUM

**Hardcoded hex colours bypass the design system**

Multiple files use raw hex values instead of design tokens for semantic colours:

| File | Line | Value | Should be |
|---|---|---|---|
| `src/app/wishlist/page.tsx` | 108 | `#e74c3c` | `var(--color-error)` |
| `src/app/shop/page.tsx` | 76 | `#e74c3c` | `var(--color-error)` |
| `src/app/profile/orders/[id]/page.tsx` | 39–43 | `#f39c12`, `#3498db`, `#9b59b6`, `#2ecc71`, `#27ae60`, `#e74c3c` | `var(--color-*)` tokens / new status tokens |
| `src/styles/styles.css` | ~590 | `.pdp-lowstock` uses `#fff8e1`, `#f9a825`, `#e65100` | Custom low-stock tokens |
| `src/styles/styles.css` | ~565 | `.tag-pill--danger { background: #e74c3c }` | `var(--color-error)` |
| `src/styles/styles.css` | ~631 | `.pdp-star { color: #ccc }` / `.pdp-star.active { color: #d4a017 }` | New `--color-star-empty` / `--color-star-filled` tokens |

None of these colours adapt to dark mode.

---

### Finding TOK-004 · LOW

**`--color-error-light` used without definition**

`src/app/reset-password/page.tsx` line 69 uses `var(--color-error-light, #fef2f2)`. The token is not in `:root`. The inline fallback (`#fef2f2`) prevents a visible break but subverts the token system and will not adapt to dark mode.

---

### Finding RESP-001 · MEDIUM

**Inconsistent responsive breakpoint set**

`styles.css` uses five breakpoint values with no documented scale: `1024px`, `900px`, `768px`, `600px`, `480px`. There is no maximum-width breakpoint (e.g. 1440px) and no small-phone breakpoint (320px). `profile.css` only defines `768px`; `admin.css` uses `1024px`, `768px`, `480px`.

This creates inconsistent layout behaviour between components. For example, `.pdp-grid` collapses at `900px` but `.plp-layout` collapses at `1024px`, producing a gap where they render differently.

---

## Section 3 — Component Architecture Audit

### Finding CMP-001 · MEDIUM

**`<ProductCard>` component bypassed in two locations**

The `ProductCard` component exists and is used correctly on the Shop and Wishlist pages. However, two other sections manually duplicate its full HTML structure:

- `src/app/page.tsx` (Homepage) — "Seasonal Gifts" section, starting at line 211, renders inline `<div className="product-card">` markup with all sub-elements, without wrapping `<ProductCard>`.
- `src/app/gifting/page.tsx` — Gift page product listings manually implement the identical `.product-card` div tree.

This means bug-fixes or design changes to `ProductCard` must be applied in three separate places.

---

### Finding CMP-002 · MEDIUM

**`<SectionHeader>` component bypassed**

`SectionHeader` renders the consistent `overline + h2 + description` pattern. It is not used in two files:

- `src/app/about/page.tsx` lines 55, 64, 78 — three separate sections hand-roll `<div className="section-header"><p className="overline">…</p><h2>…</h2></div>`.
- `src/app/page.tsx` (Homepage) — Testimonials section duplicates the same pattern.

---

### Finding CMP-003 · MEDIUM

**`<EmptyState>` component bypassed in three locations**

The `EmptyState` component is available but inline replacements are used:

- `src/app/checkout/page.tsx` line 112 — uses `<div style={{ textAlign: 'center', padding: 'var(--space-4xl) 0' }}>` with a plain text message.
- `src/app/profile/page.tsx` line 112 — uses `<div style={{ padding: 'var(--space-4xl) 0', textAlign: 'center' }}>` with a hardcoded emoji.
- `src/app/wishlist/page.tsx` — unauthenticated state uses a raw div.

---

### Finding CMP-004 · MEDIUM

**FAQ CSS accordion classes are dead code — React component uses different class names**

The CSS in `styles.css` (lines 3404–3445) defines a class-toggle–based accordion:
- `.faq-question` / `.faq-answer` / `.faq-item.active`
- `.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.4s ease; }`

The React component in `src/app/faq/page.tsx` uses:
- `className="faq-item__question"` (not `.faq-question`)
- `className="faq-item__answer"` (not `.faq-answer`)
- Conditional rendering (`{openItems[key] && ...}`) instead of CSS `max-height` transition

The CSS accordion styles are entirely orphaned — never applied. The React component drives show/hide via JS mount/unmount with no open/close animation at all.

---

### Finding CMP-005 · LOW

**`renderStars` utility function duplicated across three files**

A `renderStars(rating)` function (returns filled/empty star Unicode string) is independently implemented in:

- `src/app/page.tsx`
- `src/app/shop/page.tsx`
- `src/app/product/[slug]/page.tsx`

A shared `src/utils/renderStars.ts` would eliminate duplication.

---

## Section 4 — Page-Level Audit

### Finding PG-001 · MEDIUM

**Admin page has no `<Layout>` wrapper — no shared navigation**

`src/app/admin/page.tsx` (1,231 lines) renders its own bespoke header at line 568 (`<Image src="/images/logo.png" …>`), but does not import or render the shared `<Layout>` component. Consequence: no site navigation, no cart drawer, and no footer on the admin page. Should admin sessions need to browse the storefront without leaving the admin view, there is no nav bridge.

---

### Finding PG-002 · MEDIUM

**Homepage commerce tabs have incomplete ARIA tab pattern**

`src/app/page.tsx` lines 194–196 render a tab bar with `role="tablist"` and `aria-selected` on each button. However:

- The associated content panels have no `role="tabpanel"`.
- Buttons have no `aria-controls` attribute linking them to panel IDs.
- Panels have no `id` attribute, making the bidirectional relation impossible.

This violates WAI-ARIA Authoring Practices for the Tabs pattern.

---

### Finding PG-003 · MEDIUM

**`about/page.tsx` overuses inline styles for layout and image styling**

`src/app/about/page.tsx` applies layout directly via style attributes:

- Line 14: `style={{ margin: '0 auto' }}` on the subtitle
- Line 30: `style={{ display: 'flex', justifyContent: 'center' }}` on `.about-visual` div (the `.about-visual` CSS class already handles this)
- Lines 30–31: `<Image>` uses `style={{ width: '100%', maxWidth: '320px', height: 'auto', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}` — a hardcoded shadow that won't adapt to dark mode
- Lines 100, 113: `style={{ margin: 'var(--space-md) auto var(--space-xl)', ... }}` — partial token use mixed with inline

---

### Finding PG-004 · MEDIUM

**Profile page uses native browser `alert()` / `confirm()` dialogs**

`src/app/profile/page.tsx`:

- Line 90: `alert(err.message)` in address submit error handler
- Line 93: `confirm('Remove this address?')` in address deletion

Native `alert`/`confirm` dialogs are visually unstyled, block the JS thread, cannot be themed, and are inaccessible on some assistive technology configurations. The existing Toast system should be used for error messages; a confirmation modal for destructive actions.

---

### Finding PG-005 · LOW

**`about-section--reverse` uses CSS `direction: rtl` for layout mirroring**

`styles.css` implements the alternating-image layout with:
```css
.about-section--reverse { direction: rtl; }
.about-section--reverse > * { direction: ltr; }
```
Using `direction: rtl` for visual mirroring is a misuse of a writing-direction property. It can confuse screen readers that derive reading order from the DOM combined with CSS direction. `display: grid` with `order` or column-reverse is the correct approach.

---

## Section 5 — Accessibility Audit

### Finding A11Y-001 · HIGH

**Toast container has no `aria-live` region**

`src/components/Toast.tsx` renders all toasts inside a `<div className="toast-container">` with no `aria-live` attribute. Screen readers will not announce toast messages at all — users relying on assistive technology receive no feedback for cart additions, form submissions, or errors.

**Fix:** Add `aria-live="polite" aria-atomic="true"` to the toast container `<div>`.

---

### Finding A11Y-002 · HIGH

**FAQ accordion buttons missing required ARIA attributes**

`src/app/faq/page.tsx` lines 71–82: each accordion toggle button (`className="faq-item__question"`) is missing:

- `aria-expanded="true|false"` — required by WCAG SC 4.1.2 (Name, Role, Value)
- `aria-controls="panel-id"` — associates button with controlled panel
- The answer `<div>` has no `id` for the above association

**Fix:**
```tsx
<button
  aria-expanded={!!openItems[key]}
  aria-controls={`faq-answer-${key}`}
  ...
>
```
```tsx
<div id={`faq-answer-${key}`} role="region" ...>
```

---

### Finding A11Y-003 · HIGH

**Cart drawer "Remove" action is a non-semantic `<div>`**

`src/components/Layout.tsx` line ~139 renders a remove button for cart items as:
```tsx
<div className="cart-item__remove" onClick={...}>Remove</div>
```
A `<div>` with an onClick handler is not keyboard-focusable by default, has no `role`, and no `aria-label`. Keyboard-only users and screen reader users cannot remove items from their cart.

**Fix:** Replace with `<button type="button" aria-label={`Remove ${item.name} from cart`}>`.

---

### Finding A11Y-004 · HIGH

**Product Detail Page tab navigation has no ARIA attributes**

`src/app/product/[slug]/page.tsx` lines 433–500 implement a tabbed interface (`Details`, `Brewing Guide`, `Reviews`) using `.pdp-tablist` / `.pdp-tab` / `.pdp-tabpanel` CSS classes. No ARIA roles or attributes are present on any element:

- The tab list container has no `role="tablist"`
- Individual tab buttons have no `role="tab"` or `aria-selected`
- Panel divs have no `role="tabpanel"`, no `aria-labelledby`, no `id`

The complete ARIA tab pattern is absent.

---

### Finding A11Y-005 · MEDIUM

**Homepage commerce tab panels missing `role="tabpanel"` and linkage attributes**

`src/app/page.tsx` line 194 provides the tab button bar with `role="tablist"` and `aria-selected` (partial implementation). The content panels for "Featured", "New Arrivals", and "Seasonal Gifts" have no `role="tabpanel"`, no `id`, and no `aria-labelledby`. The ARIA tab contract is incomplete.

---

### Finding A11Y-006 · LOW

**Skip-link exists in DOM but relies on `#main` target being present**

`src/components/Layout.tsx` renders `<a href="#main" className="skip-link">Skip to main content</a>`. A quick audit could not confirm a `<main id="main">` element in every page wrapper. If the target anchor is absent, the skip-link does nothing — which is worse than no skip-link at all (confuses keyboard users who activate it).

---

## Section 6 — SEO & Performance Audit

### Finding SEO-001 · HIGH

**Product Detail Page metadata set via `document.title` — not SSR-safe**

`src/app/product/[slug]/page.tsx` lines 42–86 use a `useEffect` to set the page title and meta description imperatively:
```ts
document.title = `${product.name} — Feelinga`;
document.querySelector('meta[name="description"]')?.setAttribute('content', ...);
```
Because the page is fully client-rendered, Googlebot and social-media crawlers (which often do not execute JavaScript) will see the default root layout title `"Feelinga — happiness is here"` for every product page. Product pages will not appear in search results with unique, keyword-rich titles.

**Fix:** Create `src/app/product/[slug]/layout.tsx` with a `generateMetadata` export, or convert the page to use React Server Components with `generateMetadata`.

---

### Finding SEO-002 · HIGH

**Five routes lack a `layout.tsx` with metadata**

The following routes have no `layout.tsx` file and therefore inherit only the root layout's generic metadata:

| Route | Missing metadata |
|---|---|
| `/product/[slug]` | Product name, description, OG image |
| `/privacy` | Privacy policy title/description |
| `/terms` | Terms & Conditions title/description |
| `/reset-password` | Noindex directive (should not be indexed) |
| `/verify-email` | Noindex directive (should not be indexed) |

The reset-password and verify-email pages should additionally include `robots: { index: false }` to prevent search indexing of transactional/authentication flows.

---

### Finding SEO-003 · LOW

**Root layout Open Graph image is missing**

`src/app/layout.tsx` exports `openGraph` metadata but does not provide an `images` array. When the homepage or any page without a product image is shared on social media, no OG image card is generated.

---

### Finding SEO-004 · LOW

**No `sitemap.xml` served at runtime**

A `src/app/sitemap.ts` file exists (Next.js Route Handler format), which would generate `/sitemap.xml` at build time. The `public/sitemap.xml` file is a static stub and overrides the dynamic version in many deployment configurations. The two should be consolidated.

---

### Performance Observation (non-finding)

`src/styles/styles.css` is 5,617 lines and is imported globally via `layout.tsx`. No CSS code-splitting is configured. On low-end devices on first paint, the full stylesheet is parsed before First Contentful Paint. While this is a CSS-only bundle (no JS overhead), extracting critical CSS or splitting per-page CSS would improve Lighthouse FCP scores. This is noted for future consideration but is not raised as a formal finding given the absence of performance profiling data.

---

## Section 7 — Content & Copy Audit

### Finding CON-001 · HIGH

**Delivery time promise contradicts itself across three pages**

| Page | File | Statement |
|---|---|---|
| FAQ | `src/app/faq/page.tsx` line 16 | "Standard delivery takes **3–5 business days**" |
| Order Confirm | `src/app/order-confirm/page.tsx` | "Your order will arrive in **3–5 business days**" |
| Terms & Conditions | `src/app/terms/page.tsx` line 29 | "…delivered within **5-7 business days**" |

Customers reading the Terms after placing an order will see a longer window than promised during checkout. This creates post-purchase anxiety and increases support enquiries.

---

### Finding CON-002 · HIGH

**Four different contact email addresses used sitewide**

| Page | File | Email |
|---|---|---|
| Contact form | `src/app/contact/page.tsx` | `kailasmane777@gmail.com` (personal Gmail) |
| FAQ | `src/app/faq/page.tsx` lines 10, 31 | `hello@feelinga.com` |
| Privacy Policy | `src/app/privacy/page.tsx` | `privacy@feelinga.in` |
| Terms & Conditions | `src/app/terms/page.tsx` | `legal@feelinga.in` |

Problems:
1. A personal Gmail on the public contact page is unprofessional and fragile.
2. Two domains are used (`.com` vs `.in`), which is likely unintentional.
3. There is no single canonical contact address, forcing customers to guess which to use.

---

### Finding CON-003 · LOW

**Google Sign-In button is rendered permanently disabled**

`src/components/AuthModal.tsx` line 259 renders the Google OAuth button with `disabled` and `style={{ opacity: 0.5, cursor: 'not-allowed' }}`. The GSI script is loaded (`strategy="lazyOnload"`), but the button is hardcoded as disabled. To users, this appears as a broken/coming-soon feature with no explanatory text.

---

## Section 8 — Code Quality & TypeScript Audit

### Finding CODE-001 · LOW

**TypeScript strict mode is disabled**

`next-frontend/tsconfig.json` has `"strict": false`. This disables `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, and related checks across the entire frontend codebase. Several instances of implicit `any` were observed (e.g., `faq/page.tsx` toggle function parameter).

---

### Finding CODE-002 · LOW

**FAQ state and handler lack TypeScript types**

`src/app/faq/page.tsx`:
- `const [openItems, setOpenItems] = useState({})` — typed as `{}`, should be `Record<string, boolean>`
- `const toggle = (key) => ...` — `key` has implicit `any` type
- `{faqData.map((section, si) => ...}` — `section` and `si` lack explicit types

---

### Finding CODE-003 · LOW

**Admin page has duplicate `loadTestimonials()` call**

`src/app/admin/page.tsx` line 120 has two consecutive `else if (activeSection === 'testimonials') loadTestimonials();` branches in the section-change handler. One branch is unreachable and indicates a copy-paste error during development.

---

### Finding CODE-004 · LOW

**`renderStars` duplicated in three page files**

`src/app/page.tsx`, `src/app/shop/page.tsx`, and `src/app/product/[slug]/page.tsx` each define an identical (or near-identical) `renderStars(rating: number): string` function. Extract to `src/utils/renderStars.ts`.

---

## Finding Index

| ID | Severity | Section | File | Line(s) | Title |
|---|---|---|---|---|---|
| TOK-001 | 🔴 CRITICAL | Design System | `styles.css` / `checkout/page.tsx` / `profile/page.tsx` / `admin/page.tsx` | 1013–1036 / 227 / 208,231 / 814 | `--color-primary` undefined but used in 7 places |
| TOK-002 | 🟠 HIGH | Design System | `CookieConsent.tsx` | All inline styles | All CSS variable names are wrong; wrong fallback colour |
| A11Y-001 | 🟠 HIGH | Accessibility | `Toast.tsx` | ~15 | Toast container missing `aria-live` |
| A11Y-002 | 🟠 HIGH | Accessibility | `faq/page.tsx` | 71–82 | Accordion buttons missing `aria-expanded` / `aria-controls` |
| A11Y-003 | 🟠 HIGH | Accessibility | `Layout.tsx` | ~139 | Cart "Remove" is `<div>` — not keyboard accessible |
| A11Y-004 | 🟠 HIGH | Accessibility | `product/[slug]/page.tsx` | 433–500 | PDP tabs have zero ARIA attributes |
| SEO-001 | 🟠 HIGH | SEO | `product/[slug]/page.tsx` | 42–86 | PDP title/meta set via `document.title` — not crawlable |
| SEO-002 | 🟠 HIGH | SEO | `product/[slug]/`, `privacy/`, `terms/`, `reset-password/`, `verify-email/` | — | 5 routes missing `layout.tsx` metadata export |
| CON-001 | 🟠 HIGH | Content | `faq/page.tsx`, `terms/page.tsx`, `order-confirm/page.tsx` | 16 / 29 / — | Delivery time contradicts across 3 pages |
| CON-002 | 🟠 HIGH | Content | `contact/page.tsx`, `faq/page.tsx`, `privacy/page.tsx`, `terms/page.tsx` | — | 4 different contact email addresses |
| CMP-001 | 🟡 MEDIUM | Components | `page.tsx` / `gifting/page.tsx` | 211 / — | `<ProductCard>` bypassed; markup duplicated |
| CMP-002 | 🟡 MEDIUM | Components | `about/page.tsx` / `page.tsx` | 55,64,78 / — | `<SectionHeader>` bypassed |
| CMP-003 | 🟡 MEDIUM | Components | `checkout/page.tsx` / `profile/page.tsx` / `wishlist/page.tsx` | 112 / 112 / — | `<EmptyState>` bypassed |
| CMP-004 | 🟡 MEDIUM | Components | `faq/page.tsx` + `styles.css` | 71+ / 3404–3445 | FAQ CSS accordion is dead code; class names don't match |
| PG-001 | 🟡 MEDIUM | Pages | `admin/page.tsx` | — | Admin page has no `<Layout>` wrapper |
| PG-002 | 🟡 MEDIUM | Pages | `page.tsx` | 194–196 | Homepage tabs: partial ARIA (no tabpanel/controls/id) |
| PG-003 | 🟡 MEDIUM | Pages | `about/page.tsx` | 14,30,100,113 | Excessive inline styles override CSS classes |
| PG-004 | 🟡 MEDIUM | Pages | `profile/page.tsx` | 90, 93 | `alert()` / `confirm()` used instead of Toast / modal |
| TOK-003 | 🟡 MEDIUM | Design System | `wishlist/page.tsx` / `shop/page.tsx` / `profile/orders/[id]/page.tsx` / `styles.css` | 108 / 76 / 39–43 / 565,590,631 | Hardcoded hex colours bypass design tokens |
| RESP-001 | 🟡 MEDIUM | Responsive | `styles.css` / `profile.css` / `admin.css` | Various | Inconsistent breakpoint scale (5 values, no 320px or 1440px) |
| A11Y-005 | 🟡 MEDIUM | Accessibility | `page.tsx` | 194 | Homepage tab panels missing `role="tabpanel"` etc. |
| PG-005 | 🟢 LOW | Pages | `styles.css` | ~3267 | `direction: rtl` misused for visual layout mirroring |
| TOK-004 | 🟢 LOW | Design System | `reset-password/page.tsx` | 69 | `--color-error-light` undefined (has wrong-domain fallback) |
| SEO-003 | 🟢 LOW | SEO | `layout.tsx` | — | Open Graph image URL missing from root metadata |
| SEO-004 | 🟢 LOW | SEO | `public/sitemap.xml` / `src/app/sitemap.ts` | — | Static sitemap.xml overrides dynamic sitemap.ts |
| CON-003 | 🟢 LOW | Content | `AuthModal.tsx` | 259 | Google Sign-In permanently disabled with no explanation |
| A11Y-006 | 🟢 LOW | Accessibility | `Layout.tsx` | ~5 | Skip-link target `#main` may not be present on all pages |
| CODE-001 | 🟢 LOW | Code Quality | `tsconfig.json` | — | `"strict": false` disables all TypeScript strict checks |
| CODE-002 | 🟢 LOW | Code Quality | `faq/page.tsx` | 43, 47 | `openItems` and `toggle` lack types |
| CODE-003 | 🟢 LOW | Code Quality | `admin/page.tsx` | 120 | Duplicate `loadTestimonials()` branch |
| CODE-004 | 🟢 LOW | Code Quality | `page.tsx`, `shop/page.tsx`, `product/[slug]/page.tsx` | — | `renderStars` duplicated in 3 files |
| CMP-005 | 🟢 LOW | Components | (same as CODE-004) | — | Covered above |

**Totals: 1 CRITICAL · 9 HIGH · 11 MEDIUM · 10 LOW = 31 findings**

---

## Appendix A — Design Token Reference

### Defined tokens (`:root`, lines 4–86 of `styles.css`)
```
--color-bg / --color-bg-alt / --color-surface
--color-text / --color-text-light / --color-text-muted
--color-accent / --color-accent-hover / --color-accent-light
--color-secondary / --color-border / --color-gold
--color-success / --color-error
--font-serif / --font-sans
--text-xs / --text-sm / --text-base / --text-lg / --text-xl
--space-xs(4px) / --space-sm(8px) / --space-md(16px) / --space-lg(24px)
--space-xl(32px) / --space-2xl(48px) / --space-3xl(64px) / --space-4xl(96px) / --space-5xl(128px)
--max-width(1280px) / --header-height(72px)
--radius-sm / --radius-md / --radius-lg / --radius-xl / --radius-2xl
--shadow-sm / --shadow-md / --shadow-lg / --shadow-xl / --shadow-glow
--transition / --transition-slow / --transition-spring
--gradient-warm / --gradient-soft
--glass-bg / --glass-border
```

### Missing (referenced but undefined)
```
--color-primary   ← CRITICAL — used in 7 places
--color-error-light   ← LOW — 1 place with fallback
```

### Recommended additions
```
--color-primary: var(--color-accent);
--color-error-light: rgba(212, 107, 107, 0.12);
--color-star-filled: #d4a017;
--color-star-empty: #ccc;
--breakpoint-sm: 480px
--breakpoint-md: 768px
--breakpoint-lg: 1024px
--breakpoint-xl: 1280px
```

---

## Appendix B — Responsive Breakpoint Inventory

| Value | Files Using It | Usage |
|---|---|---|
| `1024px` | `styles.css`, `admin.css` | PLP sidebar collapse, admin table |
| `900px` | `styles.css` | PDP grid, mood grid |
| `768px` | `styles.css`, `profile.css`, `admin.css` | Footer, story grid, about section |
| `600px` | `styles.css` | Checkout steps |
| `480px` | `styles.css`, `admin.css` | Mood grid, nav, various |

**Gap:** No breakpoint below 480px (320–479px devices unaddressed). No breakpoint above 1024px (ultrawide desktops unaddressed).

---

*End of Audit Report*
