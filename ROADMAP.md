# Feelinga Tea — Improvement Roadmap

**Source:** Findings from `AUDIT_REPORT.md` (31 findings: 1 CRITICAL · 9 HIGH · 11 MEDIUM · 10 LOW)  
**Principle:** Fix-before-feature — stabilise the foundation before adding new capability.  
**Effort scale:** S = < 1 hour · M = 1–4 hours · L = 4–8 hours · XL = 8+ hours

---

## Vision

Transform Feelinga Tea's frontend from a feature-complete prototype into a production-grade storefront by:
1. **Eliminating silent defects** (broken design tokens, dead CSS)
2. **Making the site usable for everyone** (WCAG 2.1 AA accessibility)
3. **Unlocking organic search traffic** (SSR-friendly metadata for product pages)
4. **Restoring customer trust** (consistent policies and contact information)
5. **Hardening the codebase** (TypeScript strictness, component reuse)

---

## Phase 1 — Critical & High Priority Fixes

**Goal:** Eliminate the CRITICAL token defect and all HIGH-severity accessibility, SEO, and content issues.  
**Total estimated effort:** ~14–22 hours  
**Prerequisite for:** All subsequent phases (sets the stable foundation)

---

### 1.1 Define `--color-primary` token  
**Finding:** TOK-001 · CRITICAL  
**Effort:** S (30 min)

Add to `src/styles/styles.css` `:root` block (after line 22, alongside existing colour tokens):

```css
/* :root */
--color-primary: var(--color-accent);   /* warm brown — matches brand */
```

No override needed in `[data-theme="dark"]` if `--color-accent` is already overridden there (it is, at line 87).

**Affected locations that will auto-fix:**
- `styles.css` lines 1013–1014 (`.pdp-tab.active`)
- `styles.css` line 1036 (`.pdp-origin` accent border)
- `checkout/page.tsx` line 227 (payment method border)
- `profile/page.tsx` lines 208, 231 (save button, order badge)
- `admin/page.tsx` line 814 (mood chip selected state)

---

### 1.2 Fix `CookieConsent` CSS variable names  
**Finding:** TOK-002 · HIGH  
**Effort:** S (30 min)

In `src/components/CookieConsent.tsx`, replace all four token references:

| Replace | With |
|---|---|
| `var(--card-bg, #fff)` | `var(--color-surface)` |
| `var(--text, #222)` | `var(--color-text)` |
| `var(--border, #e0d6ca)` | `var(--color-border)` |
| `var(--accent, #6b8f71)` | `var(--color-accent)` |

---

### 1.3 Add `aria-live` to Toast container  
**Finding:** A11Y-001 · HIGH  
**Effort:** S (15 min)

In `src/components/Toast.tsx`, add `aria-live="polite"` and `aria-atomic="true"` to the container:

```tsx
<div className="toast-container" aria-live="polite" aria-atomic="true">
```

---

### 1.4 Fix FAQ accordion ARIA  
**Finding:** A11Y-002 · HIGH  
**Effort:** M (2 hours — also fix CMP-004 dead CSS simultaneously)

Two tasks in one:

**a) ARIA:** In `src/app/faq/page.tsx`, update the toggle button and answer panel:
```tsx
<button
  className="faq-question"   // also fix class name → see (b)
  aria-expanded={!!openItems[key]}
  aria-controls={`faq-answer-${key}`}
  onClick={() => toggle(key)}
  ...
>
```
```tsx
<div
  id={`faq-answer-${key}`}
  role="region"
  className="faq-answer"
  ...
>
```

**b) Fix CSS class name mismatch (CMP-004):** Change `className="faq-item__question"` → `"faq-question"` and `className="faq-item__answer"` → `"faq-answer"`. This re-activates the `max-height` CSS transition instead of instant mount/unmount.

Also remove the inline `style` attributes on the FAQ answer div and button — the CSS already handles them.

Also fix TypeScript issue (CODE-002):
```tsx
const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
const toggle = (key: string) => { ... };
```

---

### 1.5 Fix cart drawer "Remove" button  
**Finding:** A11Y-003 · HIGH  
**Effort:** S (30 min)

In `src/components/Layout.tsx` line ~139, replace:
```tsx
<div className="cart-item__remove" onClick={...}>Remove</div>
```
With:
```tsx
<button
  type="button"
  className="cart-item__remove"
  onClick={...}
  aria-label={`Remove ${item.name} from cart`}
>
  Remove
</button>
```

---

### 1.6 Add ARIA to PDP tab navigation  
**Finding:** A11Y-004 · HIGH  
**Effort:** M (1.5 hours)

In `src/app/product/[slug]/page.tsx` lines 433–500, implement the full WAI-ARIA Tabs pattern:

```tsx
<div className="pdp-tablist" role="tablist" aria-label="Product information">
  {tabs.map(tab => (
    <button
      key={tab.id}
      role="tab"
      id={`tab-${tab.id}`}
      aria-selected={activeTab === tab.id}
      aria-controls={`panel-${tab.id}`}
      className={`pdp-tab ${activeTab === tab.id ? 'active' : ''}`}
      onClick={() => setActiveTab(tab.id)}
    >
      {tab.label}
    </button>
  ))}
</div>
{tabs.map(tab => (
  <div
    key={tab.id}
    role="tabpanel"
    id={`panel-${tab.id}`}
    aria-labelledby={`tab-${tab.id}`}
    className="pdp-tabpanel"
    hidden={activeTab !== tab.id}
  >
    ...
  </div>
))}
```

---

### 1.7 Add SEO metadata to product detail pages (and other missing routes)  
**Finding:** SEO-001, SEO-002 · HIGH  
**Effort:** L (5 hours)

**a) Product Detail Page:** Create `src/app/product/[slug]/layout.tsx` — but because metadata depends on slug (dynamic), the proper solution is to refactor the top section of `page.tsx` to export `generateMetadata`:

```ts
// In product/[slug]/page.tsx (Server Component wrapper)
export async function generateMetadata({ params }) {
  const product = await fetchProduct(params.slug);
  return {
    title: `${product.name} — Feelinga`,
    description: product.description?.slice(0, 155),
    openGraph: {
      title: product.name,
      images: [product.images?.[0]],
    },
  };
}
```

Remove the `useEffect` at lines 42–86 that imperatively sets `document.title`.

**b) Missing layout files:** Create minimal `layout.tsx` files for:
- `src/app/privacy/layout.tsx` — title: "Privacy Policy — Feelinga"
- `src/app/terms/layout.tsx` — title: "Terms & Conditions — Feelinga"
- `src/app/reset-password/layout.tsx` — title: "Reset Password — Feelinga"; `robots: { index: false }`
- `src/app/verify-email/layout.tsx` — title: "Verify Email — Feelinga"; `robots: { index: false }`

---

### 1.8 Resolve contact information inconsistencies  
**Finding:** CON-001, CON-002 · HIGH  
**Effort:** S (1 hour — editorial)

**Delivery time:** Decide on one figure and apply it everywhere:
- `src/app/faq/page.tsx` line 16
- `src/app/terms/page.tsx` line 29
- `src/app/order-confirm/page.tsx` (delivery estimate)

Recommendation: Use "3–5 business days" (the customer-friendly figure) in all three locations, and document the worst-case "up to 7 days" as a maximum in Terms for legal coverage.

**Email address:** Replace all contact email occurrences with a single canonical address:
- Replace `kailasmane777@gmail.com` in `contact/page.tsx` with `hello@feelinga.com`
- Standardise domain to `.com` or `.in` across privacy, terms, and FAQ pages
- If separate legal/privacy inboxes are required, set up `privacy@feelinga.com` and `legal@feelinga.com` as aliases

---

## Phase 2 — Component Architecture & Code Reuse

**Goal:** Enforce consistent use of shared components; eliminate duplicated markup.  
**Total estimated effort:** ~6–10 hours  
**Prerequisite:** Phase 1 complete (tokens stable before updating components)

---

### 2.1 Replace manual product card markup with `<ProductCard>`  
**Finding:** CMP-001 · MEDIUM  
**Effort:** M (2 hours)

- `src/app/page.tsx` lines 211+: Replace the "Seasonal Gifts" manual `.product-card` div tree with `<ProductCard product={...} />`.
- `src/app/gifting/page.tsx`: Same replacement.

Verify `ProductCard` props accept all necessary fields (name, price, image, slug, badge, rating). If any field is missing, add to the component's interface — do not customise the inline markup.

---

### 2.2 Replace manual section headers with `<SectionHeader>`  
**Finding:** CMP-002 · MEDIUM  
**Effort:** S (1 hour)

- `src/app/about/page.tsx` lines 55, 64, 78: Replace three manual `<div className="section-header">` blocks with `<SectionHeader overline="..." title="..." description="..." />`.
- `src/app/page.tsx` Testimonials section: Same.

---

### 2.3 Replace inline empty states with `<EmptyState>`  
**Finding:** CMP-003 · MEDIUM  
**Effort:** S (1 hour)

- `src/app/checkout/page.tsx` line 112
- `src/app/profile/page.tsx` line 112
- `src/app/wishlist/page.tsx` unauthenticated state

Verify `EmptyState` accepts an optional `icon`, `title`, `description`, and `action` link prop. Add missing props if needed.

---

### 2.4 Extract `renderStars` to shared utility  
**Finding:** CODE-004 · LOW  
**Effort:** S (30 min)

Create `src/utils/renderStars.ts`:
```ts
export function renderStars(rating: number): string {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}
```
Remove the local definition from `page.tsx`, `shop/page.tsx`, and `product/[slug]/page.tsx`. Import from shared utility.

---

### 2.5 Replace `alert()`/`confirm()` in profile page  
**Finding:** PG-004 · MEDIUM  
**Effort:** M (2 hours)

In `src/app/profile/page.tsx`:
- Line 90: Replace `alert(err.message)` with a `toast.error(err.message)` call via the existing Toast context.
- Line 93: Replace `confirm('Remove this address?')` with a small inline confirmation — a controlled state boolean that shows a "Remove?" / "Cancel" two-button row inline beneath the address card.

---

### 2.6 Add `<Layout>` wrapper to Admin page  
**Finding:** PG-001 · MEDIUM  
**Effort:** M (2 hours)

Determine whether admin should share the storefront header/footer:
- **Option A (recommended):** Create a separate `AdminLayout` wrapper component with its own minimal nav (logo + "Back to Store" link + user info + logout), no public cart/search. Import in `admin/page.tsx`.
- **Option B:** Use the shared `<Layout>` as-is (simpler, but exposes cart drawer to admins).

---

## Phase 3 — Accessibility Completion

**Goal:** Achieve WCAG 2.1 AA compliance for keyboard navigation and screen-reader usage.  
**Total estimated effort:** ~4–6 hours  
**Prerequisite:** Phase 1 (basic ARIA fixes already done in 1.4–1.6)

---

### 3.1 Complete homepage tab ARIA  
**Finding:** A11Y-005, PG-002 · MEDIUM  
**Effort:** S (1 hour)

In `src/app/page.tsx` lines 194+, apply the same ARIA Tabs pattern as Phase 1.6 above:
- Add `id` to each tab button
- Add `aria-controls` pointing to the corresponding panel
- Add `role="tabpanel"`, `id`, and `aria-labelledby` to each content panel

---

### 3.2 Verify and fix skip-link target  
**Finding:** A11Y-006 · LOW  
**Effort:** S (30 min)

In `src/components/Layout.tsx`, ensure the `<main>` element has `id="main"`:
```tsx
<main id="main">
  {children}
</main>
```
Verify that all page layouts render their content inside this `<main>` element.

---

### 3.3 Fix `direction: rtl` layout trick  
**Finding:** PG-005 · LOW  
**Effort:** S (30 min)

In `src/styles/styles.css`, replace the `direction: rtl` approach for `.about-section--reverse`:
```css
/* Remove: */
.about-section--reverse { direction: rtl; }
.about-section--reverse > * { direction: ltr; }

/* Replace with: */
.about-section--reverse { }  /* no direction change needed */
.about-section--reverse .about-visual { order: -1; }
```
This achieves the same visual swap without touching text directionality.

---

### 3.4 Accessibility regression test checklist

After Phase 3, verify with keyboard-only and screen-reader testing:
- [ ] Tab through cart drawer — all interactive elements reachable
- [ ] FAQ accordion: `aria-expanded` announced correctly on open/close
- [ ] Toast messages announced by VoiceOver / NVDA
- [ ] PDP tabs: keyboard arrow-key navigation within tablist
- [ ] Homepage tabs: same as above
- [ ] Skip link correctly jumps to `#main`

---

## Phase 4 — SEO & Performance Hardening

**Goal:** Ensure every page URL has unique, crawlable metadata and that the core Web Vitals are not regressed.  
**Total estimated effort:** ~3–5 hours  
**Prerequisite:** Phase 1 (Phase 1.7 already creates metadata for product pages)

---

### 4.1 Add Open Graph image to root metadata  
**Finding:** SEO-003 · LOW  
**Effort:** S (30 min)

In `src/app/layout.tsx`, add an `images` array to `openGraph`:
```ts
openGraph: {
  ...
  images: [{ url: '/images/og-default.jpg', width: 1200, height: 630 }],
},
```
Create a 1200×630 static OG image at `public/images/og-default.jpg` with the Feelinga brand.

---

### 4.2 Consolidate `sitemap.xml`  
**Finding:** SEO-004 · LOW  
**Effort:** S (30 min)

Remove `public/sitemap.xml` (static stub). The dynamic `src/app/sitemap.ts` generates the canonical sitemap at `/sitemap.xml` via Next.js metadata routing. Ensure `src/app/robots.ts` (or `public/robots.txt`) references `/sitemap.xml`.

---

### 4.3 Establish consistent breakpoint scale  
**Finding:** RESP-001 · MEDIUM  
**Effort:** L (4–6 hours)

Define a canonical 5-point breakpoint scale and apply it consistently:

```css
/* Proposed canonical scale */
/* --breakpoint-xs: 320px  — small phones */
/* --breakpoint-sm: 480px  — portrait phones */
/* --breakpoint-md: 768px  — tablets */
/* --breakpoint-lg: 1024px — laptops */
/* --breakpoint-xl: 1280px — desktops (= --max-width) */
```

Note: CSS custom properties cannot be used inside `@media` queries directly. Document the scale as a comment block in `styles.css` at the top of the responsive section, and normalise all `@media` breakpoints across `styles.css`, `profile.css`, and `admin.css` to use only these five values. Eliminate the outlier `900px` breakpoint (migrate to `768px` or `1024px` depending on context).

---

## Phase 5 — TypeScript & Design System Hardening

**Goal:** Enable full type safety and eliminate remaining design-system escape hatches.  
**Total estimated effort:** ~6–10 hours  
**Prerequisite:** Phases 1–4 (late-stage quality hardening, not blocking)

---

### 5.1 Enable TypeScript strict mode  
**Finding:** CODE-001 · LOW  
**Effort:** L (4–8 hours — resolving resulting type errors)

In `next-frontend/tsconfig.json`, change:
```json
"strict": false
```
to:
```json
"strict": true
```

Then resolve all new type errors (`tsc --noEmit`). Common fixes needed:
- Nullable API responses: add `| null` types and null guards
- Implicit `any` on event handlers, map callbacks, useState initialisers
- Function parameter types (e.g. `toggle(key: string)` in FAQ page)

---

### 5.2 Replace all hardcoded hex colours with design tokens  
**Finding:** TOK-003 · MEDIUM  
**Effort:** M (2–3 hours)

File by file:

| File | Line | Change |
|---|---|---|
| `src/app/wishlist/page.tsx` | 108 | `#e74c3c` → `var(--color-error)` |
| `src/app/shop/page.tsx` | 76 | `#e74c3c` → `var(--color-error)` |
| `src/app/profile/orders/[id]/page.tsx` | 39–43 | Define status colour map using `--color-success`, `--color-error`, `--color-accent`. Add `--color-status-pending`, `--color-status-shipped` etc. tokens if needed |
| `src/styles/styles.css` | 565, 590, 631 | Replace `.tag-pill--danger`, `.pdp-lowstock`, `.pdp-star` hardcoded colours with new tokens |

---

### 5.3 Add `--color-error-light` token  
**Finding:** TOK-004 · LOW  
**Effort:** S (15 min)

Add to `:root`:
```css
--color-error-light: rgba(212, 107, 107, 0.12);
```
Add dark-mode override in `[data-theme="dark"]`:
```css
--color-error-light: rgba(212, 107, 107, 0.15);
```
Remove the inline fallback in `reset-password/page.tsx` line 69.

---

### 5.4 Fix remaining code-quality issues  
**Findings:** CODE-002, CODE-003 · LOW  
**Effort:** S (30 min)

- `admin/page.tsx` line 120: Remove the duplicate `else if (activeSection === 'testimonials')` branch.
- `faq/page.tsx`: Already fixed as part of Phase 1.4.

---

### 5.5 Address Google Sign-In disabled state  
**Finding:** CON-003 · LOW  
**Effort:** M (2 hours) — decision required

Two options:
- **Option A (complete the feature):** Wire up the Google OAuth flow using `google-auth-library` (already in the backend `package.json`). Remove the `disabled` attribute and test the full sign-in flow.
- **Option B (defer cleanly):** Remove the Google button from `AuthModal.tsx` entirely until the feature is ready. Do not ship a permanently-disabled UI element.

---

## Phase Dependency Graph

```
Phase 1 (Critical & High)
    │
    ├─── Defines --color-primary (unblocks PDP rendering)
    ├─── Fixes CookieConsent tokens (unblocks dark-mode consent)
    ├─── Adds aria-live (unblocks screen-reader toast)
    ├─── Fixes FAQ ARIA (Phase 3.1 dependency)
    ├─── Fixes cart Remove button (Phase 3 complete dependency)
    ├─── Adds PDP tab ARIA (Phase 3 complete dependency)
    ├─── Adds metadata (Phase 4 dependency)
    └─── Fixes content inconsistencies (no dependencies)
         │
Phase 2 (Component Architecture)
    │    └─── Stable tokens required before updating components
    │
Phase 3 (Accessibility Completion)
    │    └─── Phase 1 ARIA foundations required
    │
Phase 4 (SEO & Performance)
    │    └─── Phase 1 metadata foundations required
    │
Phase 5 (TypeScript & Design System Hardening)
         └─── Phases 1–4 stable foundation required
```

---

## Effort Summary

| Phase | Focus | Estimated Effort | Blocker? |
|---|---|---|---|
| Phase 1 | Critical + High fixes | 14–22 h | Yes — blocks Phase 2–5 |
| Phase 2 | Component architecture | 6–10 h | No — can run in parallel |
| Phase 3 | Accessibility completion | 4–6 h | Phase 1 ARIA fixes |
| Phase 4 | SEO & performance | 3–5 h | Phase 1 metadata |
| Phase 5 | TypeScript hardening | 6–10 h | Phases 1–4 stable |
| **Total** | | **33–53 h** | |

---

## Success Metrics

After completing all phases, the following should be true:

| Metric | Target |
|---|---|
| Zero `--color-primary` references to undefined token | ✅ After Phase 1.1 |
| Lighthouse Accessibility score | ≥ 90 |
| All interactive elements keyboard-reachable | ✅ After Phase 1.5–1.6 + 3.2 |
| Toast messages announced by screen reader | ✅ After Phase 1.3 |
| Product pages have unique crawlable titles | ✅ After Phase 1.7 |
| Single unified contact email address | ✅ After Phase 1.8 |
| Zero native `alert()`/`confirm()` calls | ✅ After Phase 2.5 |
| TypeScript strict mode enabled with zero errors | ✅ After Phase 5.1 |
| All `@media` queries use canonical breakpoint values | ✅ After Phase 4.3 |

---

*End of Roadmap*
