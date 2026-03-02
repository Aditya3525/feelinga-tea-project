# UI/UX & Project Consistency Audit — AI Agent Implementation Plan

**Target Project:** Feelinga Tea E-Commerce (Next.js + Node.js)
**Plan Version:** 1.0
**Created:** March 1, 2026

---

## Table of Contents

1. [Overview & Objectives](#1-overview--objectives)
2. [Execution Phases](#2-execution-phases)
3. [Sequential Prompt Flow](#3-sequential-prompt-flow)
4. [Dependencies Map](#4-dependencies-map)
5. [Validation Layer](#5-validation-layer)
6. [Final Deliverables Structure](#6-final-deliverables-structure)
7. [Optimization Layer](#7-optimization-layer)

---

## 1. Overview & Objectives

### Purpose

This plan defines a reproducible, step-by-step workflow that an AI agent can follow to perform a comprehensive UI/UX and project consistency audit on a web application. Each phase produces discrete artifacts that feed into subsequent phases, culminating in a severity-rated audit report and a prioritized improvement roadmap.

### Success Criteria

- Every page, component, style file, and context provider is reviewed
- Every finding is categorized by type, severity, and impact
- No critical area (accessibility, responsiveness, design tokens, user flows) is skipped
- The final report is actionable, with clear fix descriptions and effort estimates
- The improvement roadmap has a phased timeline with dependencies

### Assumptions

- The AI agent has access to file-reading, search, and terminal tools
- The agent operates within a VS Code workspace containing the full project
- The agent can read but should not modify source files during the audit (read-only)
- The project uses a component-based frontend framework (React/Next.js/Vue/etc.)

---

## 2. Execution Phases

The audit is divided into **8 phases**, executed sequentially. Each phase produces an output artifact that becomes input for later phases.

```
Phase 1: Project Discovery & Inventory
    ↓
Phase 2: Design System & Token Audit
    ↓
Phase 3: Component Consistency Audit
    ↓
Phase 4: Page-by-Page UI Audit
    ↓
Phase 5: User Journey & Flow Audit
    ↓
Phase 6: Accessibility & Responsiveness Audit
    ↓
Phase 7: Content & Brand Consistency Audit
    ↓
Phase 8: Report Compilation & Roadmap Generation
```

| Phase | Name | Est. Effort | Inputs | Output Artifact |
|-------|------|-------------|--------|-----------------|
| 1 | Project Discovery & Inventory | 15% | Workspace files | `ARTIFACT_1_inventory.md` |
| 2 | Design System & Token Audit | 10% | Artifact 1 | `ARTIFACT_2_tokens.md` |
| 3 | Component Consistency Audit | 15% | Artifacts 1, 2 | `ARTIFACT_3_components.md` |
| 4 | Page-by-Page UI Audit | 25% | Artifacts 1, 2, 3 | `ARTIFACT_4_pages.md` |
| 5 | User Journey & Flow Audit | 10% | Artifacts 1, 4 | `ARTIFACT_5_flows.md` |
| 6 | Accessibility & Responsiveness Audit | 10% | Artifacts 2, 3, 4 | `ARTIFACT_6_a11y.md` |
| 7 | Content & Brand Consistency Audit | 5% | Artifacts 4, 5 | `ARTIFACT_7_content.md` |
| 8 | Report Compilation & Roadmap | 10% | All artifacts | `AUDIT_REPORT.md` + `ROADMAP.md` |

---

## 3. Sequential Prompt Flow

### PHASE 1: Project Discovery & Inventory

**Goal:** Build a complete map of every file, page, component, style sheet, utility, and configuration in the project before analyzing anything.

---

#### Step 1.1 — Workspace Structure Scan

**Prompt:**
```
Scan the entire project workspace recursively. List every directory and file.
Categorize them into:
  - Pages (route-level components)
  - Shared Components (reusable UI elements)
  - Style Files (CSS, SCSS, Tailwind config, CSS Modules)
  - Context Providers / State Management
  - Utility Functions
  - Configuration Files (next.config, tsconfig, package.json, etc.)
  - API / Backend Routes
  - Static Assets (images, fonts, icons)
  - Test Files

Output a structured inventory table with columns:
  [Category | File Path | Line Count | Description]
```

**Expected Output:** A categorized file inventory table covering every file in the workspace.

**Agent Instructions:**
1. Use `list_dir` recursively on the workspace root and all subdirectories
2. Use `grep_search` with pattern `export default|export function|module.exports` to identify the primary export of each file
3. Count lines with `read_file` on each file (read first and last line to get line count)
4. Classify each file based on its directory path and content

**Completion Criteria:**
- [ ] Every file in the workspace is listed
- [ ] Each file has a category assignment
- [ ] Line counts are recorded for all source files
- [ ] No directory was skipped

---

#### Step 1.2 — Technology Stack Identification

**Prompt:**
```
Read package.json (frontend and backend). Identify:
  1. Framework and version (Next.js, React, Express, etc.)
  2. CSS approach (CSS Modules, Tailwind, styled-components, plain CSS, etc.)
  3. State management (Redux, Context API, Zustand, etc.)
  4. Authentication method (JWT, OAuth, sessions, etc.)
  5. Database (MongoDB, PostgreSQL, etc.)
  6. UI library dependencies (Material UI, Chakra, Radix, etc.)
  7. Font loading strategy (next/font, Google Fonts CDN, local files)
  8. Image optimization (next/image, manual, CDN)
  9. Testing framework (Jest, Vitest, Playwright, etc.)
  10. Build tools and bundler configuration

Output a "Technology Profile Card" with each item and its version.
```

**Expected Output:** A single reference card documenting the complete tech stack.

**Agent Instructions:**
1. Read `package.json` from both frontend and backend directories
2. Read framework config files (`next.config.mjs`, `tsconfig.json`)
3. Search for import patterns to detect CSS approach: `grep_search` for `import.*\.css`, `import.*\.module`, `styled`, `tw\``, `className=`
4. Search for state management: `grep_search` for `createContext|useContext|createStore|configureStore|create\(`
5. Document each finding with the exact version from `package.json`

**Completion Criteria:**
- [ ] All 10 technology areas identified
- [ ] Versions recorded where applicable
- [ ] Any unusual or custom patterns noted

---

#### Step 1.3 — Route Map Construction

**Prompt:**
```
Map every user-accessible route in the application. For each route, document:
  1. URL path
  2. Page component file
  3. Layout wrapper (if any)
  4. Authentication requirement (public, auth-required, admin-only)
  5. Data fetching method (SSR, SSG, CSR, ISR)
  6. SEO metadata (title, description present?)

Output a route table sorted by URL path.
Also identify: dead routes (defined but unreachable), redirect chains, and 404 handling.
```

**Expected Output:** Complete route table with auth requirements and data fetching methods.

**Agent Instructions:**
1. List all directories under `src/app/` (App Router) or `pages/` (Pages Router)
2. Read each `page.tsx` first 30 lines to identify: metadata exports, auth guards, data fetching
3. Read each `layout.tsx` to identify wrapping behavior
4. Search for `redirect(`, `router.push(`, `router.replace(` patterns to find navigation flows
5. Check for `not-found.tsx`, `error.tsx`, `loading.tsx` at each route level

**Completion Criteria:**
- [ ] Every route listed with all 6 attributes
- [ ] Authentication gates identified
- [ ] 404 and error handling documented

---

### ◆ VALIDATION CHECKPOINT 1

Before proceeding to Phase 2, verify:

```
CHECKLIST — Phase 1 Completeness:
□ Total file count matches workspace file count
□ Every page route is documented
□ Tech stack card is complete (all 10 areas)
□ No directories were skipped in the scan
□ Backend routes are also documented

If any item is incomplete, re-run the specific step that failed.
Record the total count:
  - Pages: [N]
  - Components: [N]
  - Style files: [N]
  - Routes: [N]
These counts will be used in Phase 8 for coverage verification.
```

---

### PHASE 2: Design System & Token Audit

**Goal:** Extract and validate every design token, identifying undefined references, duplicates, inconsistencies, and gaps.

---

#### Step 2.1 — Design Token Extraction

**Prompt:**
```
Read all CSS/SCSS files that define design tokens (CSS custom properties, SCSS variables,
Tailwind config values, or theme objects).

Extract and catalog EVERY token into these categories:
  1. Colors (background, text, accent, border, error, success, warning, etc.)
  2. Typography (font families, sizes, weights, line heights, letter spacing)
  3. Spacing (padding, margin, gap scale)
  4. Border radius scale
  5. Shadows
  6. Transitions / animations
  7. Breakpoints
  8. Z-index scale

For each token, record:
  [Token Name | Value (Light) | Value (Dark) | Category | Used In (count)]

Flag any token that:
  - Is defined but never referenced
  - Is referenced but never defined
  - Has duplicate definitions
  - Has inconsistent naming convention
```

**Expected Output:** Complete token catalog with usage analysis.

**Agent Instructions:**
1. Read the primary stylesheet(s) from start to end — read the entire `:root` block and `[data-theme="dark"]` block
2. Use `grep_search` for `--` (CSS custom properties) to find all definitions and all usages
3. Cross-reference: for each `var(--token-name)` usage, verify a corresponding definition exists
4. For each defined token, search usage count across all `.css`, `.tsx`, `.jsx` files
5. Check naming convention consistency (e.g., `--color-*`, `--space-*`, `--radius-*`)

**Completion Criteria:**
- [ ] Every CSS custom property cataloged
- [ ] Light and dark mode values compared
- [ ] Undefined references flagged
- [ ] Unused definitions flagged
- [ ] Naming convention violations noted

---

#### Step 2.2 — Visual Scale Consistency

**Prompt:**
```
Analyze the spacing and sizing scales for mathematical consistency:
  1. Does the spacing scale follow a consistent progression (e.g., 4px base: 4, 8, 12, 16, 24, 32, 48, 64)?
  2. Does the font size scale follow a type scale ratio (e.g., 1.25 Major Third)?
  3. Are border-radius values on a consistent scale?
  4. Are shadow values progressive (sm → md → lg → xl)?
  5. Are z-index values on a deliberate scale (avoid magic numbers)?

For each scale, output:
  - The detected pattern/ratio
  - Any values that break the pattern
  - Recommendation for alignment
```

**Expected Output:** Scale analysis with pattern detection and outlier flags.

**Agent Instructions:**
1. Extract all spacing values from the token catalog (Step 2.1 output)
2. Calculate ratios between consecutive values
3. Identify the closest standard scale (4px grid, 8px grid, modular scale)
4. Flag any values that deviate from the detected pattern
5. Repeat for font sizes, radii, shadows, z-indices

---

#### Step 2.3 — Inline Style Cross-Reference

**Prompt:**
```
Search all component files (.tsx, .jsx, .vue) for inline styles:
  - style={{ ... }} (React)
  - :style="{ ... }" (Vue)

For each inline style found, record:
  [File | Line | CSS Property | Hardcoded Value | Equivalent Token (if exists)]

Flag instances where:
  - A hardcoded value has an equivalent design token that should have been used
  - A value has NO equivalent token (candidate for a new token)
  - Inline styles override or contradict the design system

Count total inline style instances per file.
Output a table sorted by file, with a summary count.
```

**Expected Output:** Complete inline style inventory with token mapping.

**Agent Instructions:**
1. Use `grep_search` with pattern `style=\{\{` (or framework equivalent) across all component files
2. For each match, read the surrounding context to extract the CSS properties and values
3. Cross-reference each hardcoded value against the token catalog from Step 2.1
4. Count and rank files by inline style density

**Completion Criteria:**
- [ ] Every inline style instance cataloged
- [ ] Each mapped to its token equivalent (or flagged as missing)
- [ ] Files ranked by inline style count

---

### ◆ VALIDATION CHECKPOINT 2

```
CHECKLIST — Phase 2 Completeness:
□ All design tokens cataloged with light/dark values
□ Undefined token references identified (list count: [N])
□ Duplicate token definitions identified (list count: [N])
□ Inline styles inventoried across all components
□ Scale consistency analyzed for spacing, typography, radius, shadow, z-index

Cross-check: The total number of component files scanned for inline styles
must match the component count from Phase 1.
```

---

### PHASE 3: Component Consistency Audit

**Goal:** Evaluate every shared component for API consistency, visual consistency, and reuse coverage.

---

#### Step 3.1 — Component API Inventory

**Prompt:**
```
For every shared/reusable component in the project, document:
  1. Component name
  2. File path
  3. Props interface (all props with types and defaults)
  4. Variants/states supported
  5. CSS classes used (from shared stylesheets)
  6. Inline styles used (from Step 2.3)
  7. Accessibility attributes (aria-*, role, tabIndex, etc.)
  8. Event handlers exposed
  9. Where it's imported and used (list every consuming file)
  10. Where it SHOULD be used but isn't (manual re-implementations)

Focus especially on:
  - Buttons: Are all button variants (primary, secondary, ghost, icon) implemented
    as a single component or as separate CSS classes?
  - Form inputs: Is there a shared input component, or are inputs styled ad-hoc?
  - Cards: How many different card patterns exist, and do they share a base?
  - Empty states: Is there a reusable empty state, or do pages roll their own?
  - Loading states: Is there a shared skeleton/spinner, or is each page different?
```

**Expected Output:** Component catalog with usage map and gap analysis.

**Agent Instructions:**
1. Read each shared component file completely
2. Extract the TypeScript/PropTypes interface
3. Use `grep_search` for import statements referencing each component name
4. Use `grep_search` for HTML patterns that duplicate what the component provides (e.g., search for raw `<div className="section-header">` when a `SectionHeader` component exists)
5. Document where duplication occurs

---

#### Step 3.2 — Pattern Duplication Analysis

**Prompt:**
```
Identify UI patterns that are manually implemented in multiple places instead of
using a shared component. For each duplicated pattern:

  1. What is the pattern? (e.g., "product card", "section header", "star rating display")
  2. How many times is it duplicated?
  3. Which files contain the duplications?
  4. Are there visual differences between the duplications?
  5. What would the ideal shared component API look like?

Also check for:
  - Copy-pasted CSS blocks (same selectors or properties repeated)
  - Copy-pasted JSX/HTML structures
  - Similar but slightly different implementations of the same concept
```

**Expected Output:** Duplication report with consolidation recommendations.

**Agent Instructions:**
1. Use `grep_search` for common UI patterns: star ratings (`★|☆|renderStar`), badges, cards, headers, empty states
2. For each pattern, read all instances and compare them side-by-side
3. Note the differences between implementations
4. Propose a unified component API that covers all existing use cases

---

### ◆ VALIDATION CHECKPOINT 3

```
CHECKLIST — Phase 3 Completeness:
□ Every shared component documented with full props interface
□ Usage map shows every import location
□ Re-implementation instances identified
□ Duplicated CSS blocks found and cataloged
□ Component API consistency reviewed (naming, prop patterns)

Coverage check: Compare component count from Phase 1 inventory
against components documented here. Must match.
```

---

### PHASE 4: Page-by-Page UI Audit

**Goal:** Review every page individually for visual consistency, proper component usage, styling approach, and design system adherence.

---

#### Step 4.1 — Page Audit Template

**Prompt (repeat for EVERY page identified in Phase 1):**
```
Audit the page at [FILE_PATH]. Evaluate against these criteria:

LAYOUT & STRUCTURE:
  □ Uses the shared Layout component properly
  □ Has appropriate page hero / header section
  □ Content sections use consistent spacing tokens
  □ Grid/flex layouts use design system values
  □ Responsive: content reflows properly at 1024px, 768px, 480px breakpoints

DESIGN SYSTEM ADHERENCE:
  □ All colors use CSS custom properties (no hardcoded hex/rgb)
  □ All spacing uses spacing tokens (no hardcoded px/rem)
  □ Typography follows the established hierarchy (serif h1-h3, sans-serif body)
  □ Buttons use shared button classes (btn--primary, btn--secondary, etc.)
  □ Border radius uses radius tokens

COMPONENT USAGE:
  □ Uses shared components where applicable (ProductCard, SectionHeader, EmptyState, etc.)
  □ No manual re-implementations of available shared components
  □ Loading state uses shared skeleton/spinner

STYLING APPROACH:
  □ Uses CSS classes from stylesheets (not inline styles)
  □ CSS classes are actually defined in the stylesheet (no orphan class references)
  □ No conflicting styles (inline overriding CSS class)

DARK MODE:
  □ All visual elements adapt to dark mode
  □ No hardcoded colors that bypass dark mode tokens
  □ Images/icons have appropriate dark mode treatment

DATA HANDLING:
  □ Error states are handled gracefully
  □ Empty states are handled with appropriate UI
  □ Loading states provide visual feedback

For each failing criterion, record:
  [Criterion | Severity (H/M/L) | Description | Line Number | Fix Recommendation]
```

**Expected Output:** Per-page audit results with specific line references.

**Agent Instructions:**
1. Read the complete page file
2. Check each criterion systematically
3. Cross-reference with Phase 2 token catalog (are tokens used properly?)
4. Cross-reference with Phase 3 component catalog (are shared components used?)
5. Search the stylesheet for the CSS classes used by this page — verify they exist
6. Check for `@media` queries that include this page's styles

**Batch Strategy:**
- Process pages in batches of 3-5 (read in parallel)
- For each page, produce a structured table of findings
- Aggregate findings at the end of the phase

---

#### Step 4.2 — Cross-Page Consistency Check

**Prompt:**
```
Compare all page audit results from Step 4.1. Identify:

  1. HERO SECTIONS: Do all pages use the same hero pattern? List variants found.
  2. SECTION SPACING: Is the vertical rhythm between sections consistent across pages?
  3. CTA PLACEMENT: Where do call-to-action buttons appear? Is placement consistent?
  4. BREADCRUMBS: Which pages have breadcrumbs and which don't? Should they all have them?
  5. PAGE TITLES: Do all pages set proper <title> and meta description?
  6. FOOTER VISIBILITY: Is the footer consistently visible on all pages?
  7. LOADING PATTERNS: Compare loading states across all pages.
  8. ERROR PATTERNS: Compare error handling across all pages.
  9. EMPTY STATE PATTERNS: Compare empty states across all pages.
  10. FORM PATTERNS: Compare form styling across all pages with forms.

For each area, output:
  [Area | Pages Consistent | Pages Inconsistent | Recommendation]
```

**Expected Output:** Cross-page consistency matrix.

---

### ◆ VALIDATION CHECKPOINT 4

```
CHECKLIST — Phase 4 Completeness:
□ Every page from Phase 1 route map has been individually audited
□ Cross-page consistency analysis is complete
□ Total pages audited: [N] — must match route count from Phase 1
□ Each finding has a severity level and specific line reference
□ No page was skipped

Count check:
  - Total findings: [N]
  - High severity: [N]
  - Medium severity: [N]
  - Low severity: [N]
```

---

### PHASE 5: User Journey & Flow Audit

**Goal:** Evaluate complete user workflows end-to-end, testing logical flow, state management, and transitions.

---

#### Step 5.1 — Critical Path Analysis

**Prompt:**
```
Trace these critical user journeys through the codebase. For each journey,
document every step, the component/page involved, and any friction points:

JOURNEY 1 — First-Time Visitor to Purchase:
  Homepage → Browse/Shop → Product Detail → Add to Cart → Cart Review →
  Checkout (auth gate) → Sign Up → Shipping → Payment → Order Confirmation

JOURNEY 2 — Returning Customer Quick Purchase:
  Homepage → Search → Product Detail → Add to Cart → Checkout (auto-login) →
  Saved Address → Payment → Confirmation

JOURNEY 3 — Gift Purchase:
  Homepage → Gifting Page → Select Gift Set → Enquire Now / Add to Cart →
  Checkout → Gift Options → Confirmation

JOURNEY 4 — Account Management:
  Login → Profile → Update Info → Change Password → Manage Addresses →
  View Order History → View Order Detail

JOURNEY 5 — Admin Operations:
  Admin Login → Dashboard → Manage Products (CRUD) → Manage Orders →
  Update Order Status → View Activity Logs

For each journey step, evaluate:
  1. Is the transition clear? (CTA visible, labeled correctly)
  2. Is state preserved? (cart items, form data, auth state)
  3. Can the user go back? (browser back button, breadcrumbs, back links)
  4. What happens on error? (network failure, validation error, auth expiry)
  5. Is progress communicated? (step indicators, loading states, success messages)
  6. Are dead ends possible? (no CTA, empty state without guidance)
```

**Expected Output:** Journey maps with step-by-step evaluation and friction point catalog.

**Agent Instructions:**
1. For each journey, read the source code of each page/component in sequence
2. Trace the navigation: what buttons/links does the user click? Where do they go?
3. Check for state handoffs (cart context preserved across pages, auth state maintained, URL params passed)
4. Identify any broken links, missing pages, or dead-end states
5. Check error handling at each step

---

#### Step 5.2 — Edge Case & Error Flow Analysis

**Prompt:**
```
For each critical journey from Step 5.1, analyze these edge cases:

  1. What happens if the user is mid-checkout and their auth token expires?
  2. What happens if a product in the cart goes out of stock during checkout?
  3. What happens if the payment fails? Can the user retry without losing data?
  4. What happens if the user refreshes the page at each step?
  5. What happens with slow/no network connection?
  6. What happens on browser back button at each step?
  7. What if the user opens the same page in two tabs?

For each edge case, record:
  [Journey | Step | Edge Case | Current Behavior | Ideal Behavior | Severity]
```

**Expected Output:** Edge case matrix with current vs. ideal behavior.

---

### ◆ VALIDATION CHECKPOINT 5

```
CHECKLIST — Phase 5 Completeness:
□ All 5 critical journeys traced
□ Each step evaluated for transitions, state, navigation, error handling
□ Edge cases analyzed for all journeys
□ Dead ends and friction points cataloged
□ State management continuity verified across page transitions
```

---

### PHASE 6: Accessibility & Responsiveness Audit

**Goal:** Evaluate WCAG 2.1 AA compliance, keyboard navigation, screen reader support, and responsive behavior.

---

#### Step 6.1 — Semantic HTML & ARIA Audit

**Prompt:**
```
Audit every page and component for accessibility compliance:

SEMANTIC HTML:
  □ Proper heading hierarchy (h1 → h2 → h3, no skipped levels)
  □ Landmark elements used (<header>, <nav>, <main>, <footer>, <aside>)
  □ Lists use <ul>/<ol>/<li> properly
  □ Tables use <thead>, <tbody>, <th> with scope
  □ Forms use <label> associated with inputs (htmlFor/id match)

ARIA ATTRIBUTES:
  □ Interactive elements have appropriate roles
  □ Dynamic content has aria-live regions
  □ Modals/dialogs have role="dialog", aria-modal="true"
  □ Expandable sections have aria-expanded
  □ Tabs have role="tablist", role="tab", role="tabpanel", aria-selected
  □ Custom controls have aria-label or aria-labelledby
  □ Images have meaningful alt text (not "image" or empty for decorative)

KEYBOARD NAVIGATION:
  □ All interactive elements are focusable (not div with onClick without tabIndex)
  □ Focus order follows visual order
  □ Focus is trapped in modals/dialogs
  □ Focus is restored when modals close
  □ Skip-to-content link exists and works
  □ Custom keyboard shortcuts don't conflict with browser/AT shortcuts

FOCUS INDICATORS:
  □ Visible focus ring on all interactive elements
  □ Focus ring uses :focus-visible (not :focus) to avoid mouse click flash
  □ Custom focus styles meet 3:1 contrast ratio

For each violation, record:
  [Rule | Component/Page | Line | Description | WCAG Criterion | Severity]
```

**Expected Output:** WCAG compliance audit with specific violations mapped to success criteria.

**Agent Instructions:**
1. Search for heading tags across all pages: `grep_search` for `<h[1-6]` and verify hierarchy
2. Search for interactive elements: `grep_search` for `onClick=` and verify the element is natively focusable or has `tabIndex`
3. Search for image tags: `grep_search` for `<img|<Image` and verify `alt` attributes
4. Search for form elements: `grep_search` for `<input|<select|<textarea` and verify associated `<label>`
5. Search for ARIA attributes: `grep_search` for `aria-` to catalog what exists
6. Search for modals/overlays: verify focus trap implementation
7. Read the CSS for `:focus`, `:focus-visible`, and `outline` properties

---

#### Step 6.2 — Color Contrast Audit

**Prompt:**
```
Using the design token values from Phase 2, calculate contrast ratios for
every text color / background color combination used in the project.

For each combination, record:
  [Text Color | Background Color | Contrast Ratio | WCAG AA Pass? | WCAG AAA Pass? | Used Where]

Check at minimum:
  - Body text on page background
  - Muted/secondary text on page background
  - Link text on page background
  - Button text on button background (each variant)
  - Placeholder text on input background
  - Error text on page background
  - Caption/meta text on card backgrounds
  - Text on hero/banner backgrounds (including overlays on images)

Repeat for BOTH light mode and dark mode token values.

Use the WCAG 2.1 contrast ratio requirements:
  - Normal text: 4.5:1 (AA), 7:1 (AAA)
  - Large text (18px+ or 14px+ bold): 3:1 (AA), 4.5:1 (AAA)
  - UI components and graphical objects: 3:1 (AA)
```

**Expected Output:** Contrast ratio table for all color combinations with pass/fail status.

**Agent Instructions:**
1. Extract all foreground/background color combinations from the token catalog
2. Convert hex/HSL values to relative luminance
3. Calculate contrast ratios using: `(L1 + 0.05) / (L2 + 0.05)` where L1 is lighter
4. Flag any combination below 4.5:1 for normal text or below 3:1 for large text

---

#### Step 6.3 — Responsive Behavior Audit

**Prompt:**
```
For every page, verify responsive behavior at these breakpoints:
  - 1440px (large desktop)
  - 1024px (tablet landscape / small desktop)
  - 768px (tablet portrait)
  - 480px (mobile)
  - 320px (small mobile)

For each page at each breakpoint, check:
  1. Does the layout reflow correctly? (columns collapse, sidebar stacks)
  2. Is text readable without horizontal scrolling?
  3. Are touch targets at least 44x44px on mobile?
  4. Does the navigation switch to mobile hamburger?
  5. Are images responsive (srcset, sizes, or CSS max-width)?
  6. Are modals/overlays usable on small screens?
  7. Are any elements clipped, overflowing, or overlapping?

Method: Read the CSS media queries and trace which styles apply at each breakpoint.
Flag any page/component that:
  - Has no responsive styles defined
  - Uses inline styles with no responsive equivalent
  - Uses fixed widths/heights that prevent reflow
  - Has CSS class references in JSX that don't exist in any stylesheet (orphan classes)
```

**Expected Output:** Responsive behavior matrix (pages × breakpoints) with issue flags.

**Agent Instructions:**
1. Read all `@media` queries in CSS files — catalog what classes/properties change at each breakpoint
2. For each page, list the CSS classes it uses
3. Cross-reference: does this page have responsive treatment at each breakpoint?
4. Flag pages that use inline styles for layout (Phase 2 Step 2.3 data) — inline styles have no responsive breakpoints
5. Search for fixed `width:` and `height:` values that could break on mobile

---

### ◆ VALIDATION CHECKPOINT 6

```
CHECKLIST — Phase 6 Completeness:
□ Heading hierarchy checked on every page
□ ARIA attributes audited on every interactive component
□ Keyboard navigation tested for all modals, overlays, tabs, accordions
□ Color contrast checked for all foreground/background combinations
□ Responsive behavior verified at all 5 breakpoints for every page
□ Focus indicators verified on all interactive elements

Issue counts:
  - WCAG violations: [N]
  - Contrast failures: [N]
  - Responsive issues: [N]
  - Keyboard traps: [N]
```

---

### PHASE 7: Content & Brand Consistency Audit

**Goal:** Verify that copy, terminology, contact information, policies, and brand voice are consistent across the entire project.

---

#### Step 7.1 — Terminology & Copy Consistency

**Prompt:**
```
Search across ALL pages, components, and content for these consistency checks:

BRAND TERMINOLOGY:
  - Is the brand name always capitalized/spelled the same way?
  - Is the tagline consistent wherever it appears?
  - Are product category names consistent (e.g., "Green Tea" vs "green tea" vs "green-tea")?
  - Are measurement units consistent (g, gm, grams)?
  - Are currency symbols consistent (₹, INR, Rs.)?

CONTACT INFORMATION:
  - Collect every email address referenced → are they consistent?
  - Collect every phone number referenced → are they consistent?
  - Collect every physical address referenced → are they consistent?
  - Collect every social media link → do they all point to valid profiles?

POLICY INFORMATION:
  - Free shipping threshold: search all references → same number everywhere?
  - Return policy days: search all references → same number everywhere?
  - Delivery timeframe: search all references → consistent?
  - Business hours: search all references → consistent?

CTA LANGUAGE:
  - "Add to Cart" vs "Add To Cart" vs "ADD TO CART" — consistent?
  - "Buy Now" vs "Shop Now" vs "Order Now" — is the primary CTA consistent?
  - "Learn More" vs "Read More" vs "View Details" — consistent?

For each inconsistency found:
  [Item | Location 1 (value) | Location 2 (value) | Recommended Standard]
```

**Expected Output:** Content consistency report with specific discrepancies.

**Agent Instructions:**
1. `grep_search` for email patterns: `[a-zA-Z]+@[a-zA-Z]+\.[a-zA-Z]+`
2. `grep_search` for phone patterns: `\+91|\d{10}|\d{3}-\d{3}-\d{4}`
3. `grep_search` for the brand name and check capitalization
4. `grep_search` for currency: `₹|INR|Rs\.`
5. `grep_search` for shipping: `free shipping|shipping.*free|\d+.*shipping`
6. `grep_search` for return/refund policy: `return|refund|\d+.*day`

---

#### Step 7.2 — Metadata & SEO Audit

**Prompt:**
```
For every page, check:
  1. Does it export metadata (Next.js metadata object or <Head> tags)?
  2. Is the page title unique and descriptive?
  3. Is there a meta description?
  4. Is there an Open Graph image?
  5. Are there structured data / JSON-LD scripts?
  6. Is the canonical URL set correctly?
  7. Does the sitemap include this page?
  8. Does robots.txt allow crawling?

Check the global layout for:
  - Default metadata fallbacks
  - Favicon configuration
  - Theme color meta tag
  - Viewport configuration

Output a page-by-page SEO checklist.
```

**Expected Output:** SEO compliance matrix.

---

### ◆ VALIDATION CHECKPOINT 7

```
CHECKLIST — Phase 7 Completeness:
□ All email addresses cross-referenced
□ All phone numbers cross-referenced
□ Policy numbers verified (shipping threshold, return days, delivery times)
□ CTA language cataloged and compared
□ SEO metadata checked on every page
□ Brand terminology validated
```

---

### PHASE 8: Report Compilation & Roadmap Generation

**Goal:** Synthesize all findings into a prioritized audit report and an actionable improvement roadmap.

---

#### Step 8.1 — Finding Consolidation

**Prompt:**
```
Consolidate ALL findings from Phases 2-7. For each finding, ensure it has:

  1. Unique ID (e.g., TOK-001, CMP-001, PG-001, A11Y-001, etc.)
  2. Category (Token, Component, Page, Flow, Accessibility, Responsive, Content, SEO)
  3. Severity (Critical / High / Medium / Low)
  4. Title (concise description)
  5. Description (what's wrong, with specific file and line references)
  6. Impact (who is affected and how)
  7. Current behavior (what happens now)
  8. Expected behavior (what should happen)
  9. Fix complexity (Simple / Moderate / Complex)
  10. Fix description (specific steps to resolve)

Severity definitions:
  - CRITICAL: Broken functionality, crash in production, data loss, security vulnerability
  - HIGH: Significant visual breakage, accessibility blocker, broken user flow
  - MEDIUM: Inconsistency affecting user experience, partial functionality gap
  - LOW: Minor cosmetic issue, best practice violation, code quality concern

De-duplicate findings that appear in multiple phases.
Sort by severity (Critical first), then by category.
```

**Expected Output:** Master finding table with all attributes.

---

#### Step 8.2 — Impact Summary & Statistics

**Prompt:**
```
Generate summary statistics from the consolidated findings:

  1. Total findings by severity: Critical [N], High [N], Medium [N], Low [N]
  2. Total findings by category (bar chart data)
  3. Pages with most issues (top 5)
  4. Components with most issues (top 5)
  5. Most common issue type
  6. WCAG compliance score (% of criteria passing)
  7. Design system adherence score (% of pages using tokens correctly)
  8. Component reuse score (% of UI patterns using shared components)
  9. Dark mode coverage (% of pages fully dark-mode compatible)
  10. Responsive coverage (% of pages with proper responsive styles)

Output also:
  - A text-based severity distribution chart
  - A list of "quick wins" (High impact + Simple fix)
  - A list of "strategic investments" (High impact + Complex fix)
```

**Expected Output:** Audit scorecard with quantitative metrics.

---

#### Step 8.3 — Improvement Roadmap Generation

**Prompt:**
```
Create a phased improvement roadmap based on the consolidated findings.

PHASE 1 — Critical Fixes (Week 1-2):
  List all Critical and High-severity findings that have Simple fix complexity.
  These are the "quick wins" that should be done first.
  Include effort estimate (hours) for each.

PHASE 2 — Foundation Improvements (Week 3-4):
  Design system fixes: undefined tokens, naming standardization, duplicate removal.
  Shared component creation for frequently duplicated patterns.
  Include effort estimate for each.

PHASE 3 — Page-Level Remediation (Week 5-8):
  Page-by-page fixes, ordered by user traffic/importance.
  Inline style migration to CSS classes.
  Responsive fixes for pages missing mobile styles.
  Include effort estimate for each page.

PHASE 4 — Accessibility Compliance (Week 9-10):
  WCAG violations, ordered by criterion importance.
  Screen reader improvements.
  Keyboard navigation fixes.
  Include effort estimate for each.

PHASE 5 — Polish & Optimization (Week 11-12):
  Low-severity issues.
  Performance optimizations.
  Code quality improvements.
  SEO enhancements.
  Include effort estimate for each.

For each roadmap item, include:
  [Finding ID | Title | Effort (hrs) | Dependencies | Assigned Phase | Priority within Phase]

Add dependency arrows: which fixes must be completed before others can start?
(e.g., "Define --color-primary" must happen before "Fix PDP tab active state")
```

**Expected Output:** 5-phase improvement roadmap with effort estimates and dependencies.

---

### ◆ FINAL VALIDATION CHECKPOINT

```
CHECKLIST — Audit Completeness Verification:

Coverage:
  □ Pages audited: [N] out of [N total] — must be 100%
  □ Components audited: [N] out of [N total] — must be 100%
  □ Style files audited: [N] out of [N total] — must be 100%
  □ Routes verified: [N] out of [N total] — must be 100%
  □ User journeys traced: [N] — minimum 5

Finding Quality:
  □ Every finding has a unique ID
  □ Every finding has severity, category, and fix description
  □ Every finding references specific files and line numbers
  □ No duplicate findings remain
  □ Severity distribution is reasonable (not all High, not all Low)

Deliverable Quality:
  □ Audit report follows the defined structure (Section 6)
  □ Roadmap has clear phases, estimates, and dependencies
  □ Executive summary is concise and actionable
  □ All cross-references between findings and roadmap items are valid
```

---

## 4. Dependencies Map

```
Phase 1 (Discovery)
  ├── Step 1.1 (File Inventory) ─────────────────────┐
  ├── Step 1.2 (Tech Stack) ─────────────────────────┤
  └── Step 1.3 (Route Map) ─────────────────────────┤
       ↓                                              │
       Checkpoint 1 ◄────────────────────────────────┘
       ↓
Phase 2 (Design Tokens)
  ├── Step 2.1 (Token Extraction) ←── needs Step 1.1 (file list)
  ├── Step 2.2 (Scale Analysis) ←── needs Step 2.1 (token catalog)
  └── Step 2.3 (Inline Styles) ←── needs Step 1.1 + Step 2.1
       ↓
       Checkpoint 2
       ↓
Phase 3 (Components) ←── needs Steps 1.1, 2.1, 2.3
  ├── Step 3.1 (Component APIs)
  └── Step 3.2 (Duplication Analysis)
       ↓
       Checkpoint 3
       ↓
Phase 4 (Pages) ←── needs Steps 2.1, 3.1, 3.2
  ├── Step 4.1 (Per-Page Audit) ←── parallelizable in batches of 3-5
  └── Step 4.2 (Cross-Page Comparison) ←── needs all of Step 4.1
       ↓
       Checkpoint 4
       ↓
Phase 5 (Flows) ←── needs Steps 1.3, 4.1
  ├── Step 5.1 (Journey Tracing)
  └── Step 5.2 (Edge Cases)
       ↓                              Phase 6 (Accessibility) ←── needs Steps 2.1, 3.1, 4.1
       Checkpoint 5                    ├── Step 6.1 (Semantic/ARIA)  [can run parallel with Phase 5]
       ↓                               ├── Step 6.2 (Color Contrast)
       │                               └── Step 6.3 (Responsive)
       │                                    ↓
       │                                    Checkpoint 6
       ↓                                    ↓
Phase 7 (Content) ←── needs Steps 4.1, 5.1
  ├── Step 7.1 (Copy Consistency)             │
  └── Step 7.2 (SEO Audit)                   │
       ↓                                      │
       Checkpoint 7                            │
       ↓                                      ↓
Phase 8 (Compilation) ←── needs ALL previous phase outputs
  ├── Step 8.1 (Consolidation)
  ├── Step 8.2 (Statistics)
  └── Step 8.3 (Roadmap)
       ↓
       Final Checkpoint
```

### Parallelization Opportunities

| Steps | Can Run In Parallel? | Reason |
|-------|---------------------|--------|
| 1.1, 1.2, 1.3 | ✅ Yes | Independent discovery tasks |
| 2.1, 2.2 | ❌ No | 2.2 needs 2.1 output |
| 2.1, 2.3 | ❌ No | 2.3 needs 2.1 output |
| 3.1, 3.2 | ⚠️ Partial | 3.2 benefits from 3.1 but can start independently |
| 4.1 pages | ✅ Yes | Pages can audit in parallel batches |
| 5.x, 6.x | ✅ Yes | Independent audit dimensions |
| 7.1, 7.2 | ✅ Yes | Independent content checks |
| 8.1, 8.2, 8.3 | ❌ No | Sequential synthesis |

---

## 5. Validation Layer

### Checkpoint Definition

Each checkpoint serves as a **quality gate**. The agent must NOT proceed past a checkpoint until all criteria are met.

#### Checkpoint Protocol

```
For each checkpoint:
  1. Read through all checklist items
  2. For each item, verify against actual outputs produced
  3. If an item fails:
     a. Identify which step produced incomplete output
     b. Re-run that specific step with refined parameters
     c. Merge new findings with existing output
     d. Re-check the failing item
  4. Only proceed when ALL items pass
  5. Record checkpoint pass/fail status and timestamp
```

#### Checkpoint Recovery Prompts

If a checkpoint fails, use these recovery prompts:

**Missing Files Recovery:**
```
The file inventory is incomplete. The following directories were not scanned: [LIST].
Scan these directories and append findings to the existing inventory.
Do not re-scan already-covered directories.
```

**Missing Findings Recovery:**
```
The [Phase N] audit missed [component/page/area].
Audit this specific item using the same criteria template from Step [N.M].
Append findings to the existing artifact without modifying previous results.
```

**Inconsistent Severity Recovery:**
```
Review findings that are marked as [severity] and verify the severity is correct.
A [severity] finding should meet these criteria: [criteria from Step 8.1].
Re-classify any findings that don't match the criteria.
```

---

## 6. Final Deliverables Structure

### Deliverable 1: Audit Report (`AUDIT_REPORT.md`)

```markdown
# [Project Name] — UI/UX Consistency Audit Report

## Executive Summary
- Audit scope and date
- Total findings: [N] (Critical: [N], High: [N], Medium: [N], Low: [N])
- Overall health scores (design system adherence, a11y, responsive, etc.)
- Top 3 most impactful issues
- Recommended immediate actions

## 1. Design System & Tokens
### 1.1 Token Catalog (summary table)
### 1.2 Undefined Token References
### 1.3 Duplicate Definitions
### 1.4 Scale Consistency Analysis
### 1.5 Inline Style Inventory

## 2. Component Consistency
### 2.1 Component Catalog (summary)
### 2.2 Usage Coverage Map
### 2.3 Duplication Report
### 2.4 Component API Inconsistencies

## 3. Page-by-Page Findings
### 3.1 [Page Name] — [Finding Count] findings
   (repeat for each page, sorted by finding count descending)
### 3.N Cross-Page Consistency Matrix

## 4. User Journey Analysis
### 4.1 Journey Maps (per journey)
### 4.2 Friction Points
### 4.3 Edge Case Failures

## 5. Accessibility Compliance
### 5.1 WCAG Violations (by criterion)
### 5.2 Contrast Ratio Report
### 5.3 Keyboard Navigation Issues
### 5.4 Screen Reader Barriers

## 6. Responsiveness
### 6.1 Breakpoint Coverage Matrix
### 6.2 Mobile-Specific Issues
### 6.3 Orphan CSS Classes

## 7. Content & Brand
### 7.1 Terminology Inconsistencies
### 7.2 Contact Info Discrepancies
### 7.3 Policy Conflicts
### 7.4 SEO Coverage

## 8. Finding Index
   (Master table of ALL findings, sortable by ID/severity/category)

## Appendices
- A. Complete Token Reference
- B. Component Props Reference
- C. Route Map
- D. Methodology Notes
```

### Deliverable 2: Improvement Roadmap (`ROADMAP.md`)

```markdown
# [Project Name] — Improvement Roadmap

## Overview
- Total effort estimate: [N] hours
- Timeline: [N] weeks
- Dependencies diagram

## Phase 1: Critical Fixes (Week 1-2)
### Effort: [N] hours
| ID | Finding | Effort | Owner | Dependency | Status |
|----|---------|--------|-------|------------|--------|
| ... |

## Phase 2: Foundation (Week 3-4)
### Effort: [N] hours
| ... |

## Phase 3: Page Remediation (Week 5-8)
### Effort: [N] hours
| ... |

## Phase 4: Accessibility (Week 9-10)
### Effort: [N] hours
| ... |

## Phase 5: Polish (Week 11-12)
### Effort: [N] hours
| ... |

## Dependency Graph
(text-based dependency tree)

## Success Metrics
- Design system adherence: [current]% → [target]%
- WCAG AA compliance: [current]% → 100%
- Component reuse: [current]% → [target]%
- Responsive coverage: [current]% → 100%
```

---

## 7. Optimization Layer

### When Results Are Shallow

If a phase produces only surface-level findings, apply these refinement strategies:

| Symptom | Refinement Strategy |
|---------|---------------------|
| Few findings on a page | Re-read the page with explicit focus on ONE criterion at a time instead of the full checklist |
| All findings are Low severity | Re-examine with the user journey lens — does this issue block a real task? |
| Component audit misses duplications | Search for specific HTML patterns (e.g., `className="product-card"` vs `ProductCard`) not just import statements |
| Inline styles under-reported | Search for `style=` variations including template literals: `` style={`...`} `` |
| Accessibility findings are generic | Use WCAG 2.1 SC numbers as search criteria (e.g., search for `aria-expanded` for SC 4.1.2) |

### When Results Are Inconsistent

| Symptom | Refinement Strategy |
|---------|---------------------|
| Same issue described differently in two phases | Consolidate in Phase 8 — use the most specific description and merge line references |
| Contradictory severity levels for similar issues | Apply the severity rubric from Step 8.1 uniformly; use the higher severity if in doubt |
| Token audit says it's defined but page audit says it's missing | Re-verify: search for the exact token name with `grep_search`; check for typos |

### When Results Are Incomplete

| Symptom | Refinement Strategy |
|---------|---------------------|
| Pages missing from audit | Cross-reference Phase 4 page list against Phase 1 route map; audit missing pages |
| Components not in catalog | Search for `export default function` and `export const` in component directories |
| CSS classes referenced but not found | Search both the class name AND common prefixes/suffixes (e.g., `modal` catches `auth-modal`, `quick-view-modal`) |

### Prompt Refinement Templates

**For deeper design token analysis:**
```
[REFINED] Re-examine the token [TOKEN_NAME]. Search for:
  1. Every file that references var(--[TOKEN_NAME])
  2. Every file that references the raw value [VALUE] directly
  3. Any similar but differently named tokens (e.g., --color-primary vs --primary-color)
  4. Usage in media queries or pseudo-selectors
Report each instance with file path and line number.
```

**For deeper component analysis:**
```
[REFINED] The component [COMPONENT_NAME] was reported as having [N] usages.
Verify this by:
  1. Searching for import statements: import.*[COMPONENT_NAME]
  2. Searching for JSX usage: <[COMPONENT_NAME]
  3. Searching for the HTML pattern it renders (e.g., className="[main-class]")
  4. Identifying places where the same pattern is manually constructed
List ALL instances, including indirect usage through re-exports.
```

**For deeper accessibility analysis:**
```
[REFINED] Re-audit [COMPONENT/PAGE] for accessibility. This time:
  1. Read every JSX element that has an onClick handler — is it a <button>, <a>, or
     does it have role and tabIndex?
  2. Read every <img> and <Image> — does alt text describe content or function?
  3. Read every form <input> — is there an associated <label> with matching htmlFor?
  4. Check color contrast of EVERY text element (not just primary text)
  5. Verify focus management: what happens when this component mounts/unmounts?
```

---

## Appendix: Quick Reference Card

### Agent Capabilities Required

| Capability | Used In | Tool |
|------------|---------|------|
| File listing | Phase 1 | `list_dir` |
| File reading | All phases | `read_file` |
| Text search (exact) | All phases | `grep_search` |
| Semantic search | Phase 3, 5 | `semantic_search` |
| File creation | Phase 8 | `create_file` |
| Terminal commands | Phase 1 (line counts) | `run_in_terminal` |

### Severity Quick Reference

| Level | Criteria | Examples |
|-------|----------|----------|
| Critical | Production crash, security hole, data loss | Missing Suspense causing build failure; exposed admin route |
| High | Visual breakage, a11y blocker, broken flow | Undefined CSS variable breaking interactive feedback; no focus trap on modal |
| Medium | UX friction, inconsistency, partial gap | Different loading patterns; duplicated components; missing ARIA |
| Low | Cosmetic, code quality, minor best practice | Inline style instead of class; redundant CSS; minor copy typo |

### Common Search Patterns Reference

```
Design Tokens:       var\(--      `:root`       `[data-theme`
Inline Styles:       style=\{\{    style={`
Components:          import.*from   <ComponentName
ARIA:                aria-          role=          tabIndex
Forms:               <input        <select        <textarea        htmlFor
Headings:            <h[1-6]
Images:              <img          <Image         alt=
Links:               <a            <Link          href=
Buttons:             <button       btn--          onClick
Media Queries:       @media
Color Values:        #[0-9a-f]    rgb\(          hsl\(
```

---

*This implementation plan is designed to be executed sequentially by an AI coding agent with workspace access. Each phase builds on previous outputs, with validation checkpoints preventing progression on incomplete work. The plan can be adapted to any component-based web application by adjusting the search patterns and component names in the prompts.*
