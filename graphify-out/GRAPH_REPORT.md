# Graph Report - C:\Engineering\Tea Project  (2026-04-27)

## Corpus Check
- 125 files · ~520,508 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 443 nodes · 665 edges · 67 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]

## God Nodes (most connected - your core abstractions)
1. `apiRequest()` - 27 edges
2. `getErrorMessage()` - 24 edges
3. `create()` - 20 edges
4. `checkEmailAddress()` - 16 edges
5. `logAdminAction()` - 12 edges
6. `issueSession()` - 9 edges
7. `MemoryCache` - 8 edges
8. `handleProfileUpdate()` - 8 edges
9. `handleRegister()` - 8 edges
10. `hashToken()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `addItem()` --calls--> `create()`  [INFERRED]
  C:\Engineering\Tea Project\backend\src\modules\cart\controller.ts → C:\Engineering\Tea Project\backend\src\modules\reviews\controller.ts
- `submitContact()` --calls--> `create()`  [INFERRED]
  C:\Engineering\Tea Project\backend\src\modules\contact\controller.ts → C:\Engineering\Tea Project\backend\src\modules\reviews\controller.ts
- `handleForgotPassword()` --calls--> `apiRequest()`  [INFERRED]
  C:\Engineering\Tea Project\next-frontend\src\components\AuthModal.tsx → C:\Engineering\Tea Project\next-frontend\src\utils\api.ts
- `listUsers()` --calls--> `escapeRegex()`  [INFERRED]
  C:\Engineering\Tea Project\backend\src\modules\admin\controller.ts → C:\Engineering\Tea Project\backend\src\utils\sanitize.ts
- `changeUserRole()` --calls--> `logAdminAction()`  [INFERRED]
  C:\Engineering\Tea Project\backend\src\modules\admin\controller.ts → C:\Engineering\Tea Project\backend\src\utils\auditLog.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (40): apiRequest(), dashboard(), composeAddressLine2(), extractDistrictFromAddressLine2(), applyAddress(), autofillAddressFromGPS(), checkWishlist(), clampRating() (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (31): createAdminToken(), createCustomer(), createCustomerToken(), createOrder(), createProduct(), logAdminAction(), autocomplete(), bulkDelete() (+23 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (15): handleCouponSubmit(), handleDrop(), handleEscape(), handleProductSubmit(), handleTestimonialSubmit(), loadCoupons(), loadOrders(), loadProducts() (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (6): start(), authenticate(), optionalAuth(), getCookieValue(), connectDB(), AppError

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (19): assertEmailIsValid(), forgotPassword(), googleLogin(), hashToken(), issueSession(), login(), refresh(), register() (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (21): getErrorMessage(), getPasswordRules(), getPasswordStrength(), handleForgotPassword(), handleLogin(), handleRegister(), handleSignupEmailBlur(), switchTab() (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (11): doRefresh(), fetchWithRetry(), getApiBases(), unique(), wait(), MemoryCache, addItem(), clear() (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (10): logout(), baseCookieOptions(), clearAuthCookies(), resolveSameSite(), setAuthCookies(), tokenMaxAge(), getFocusable(), handleKeyDown() (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (9): generateMetadata(), buildProductApiUrl(), buildProductJsonLd(), getAbsoluteImageUrl(), getPrimaryPrice(), getProductCanonicalPath(), getProductDescription(), getProductSeoTitle() (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.35
Nodes (10): cleanAddressText(), getAddressFromCurrentLocation(), getCurrentPosition(), mapAddress(), mergeAddressLine2(), normalizePincode(), pickFirst(), reverseGeocode() (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.22
Nodes (1): submitContact()

### Community 11 - "Community 11"
Cohesion: 0.43
Nodes (5): addRecentSearch(), commitQuerySearch(), handleInputKeyDown(), handleResultSelect(), handleTagClick()

### Community 12 - "Community 12"
Cohesion: 0.73
Nodes (5): buildMap(), normalizeCity(), normalizeDistrict(), normalizeState(), toTitleCase()

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (2): useAuth(), CartProvider()

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (5): getCitiesForState(), getDistrictsForCity(), normalizeLocationKey(), resolveCityKey(), resolveStateKey()

### Community 15 - "Community 15"
Cohesion: 0.83
Nodes (3): downloadFile(), main(), mcpRequest()

### Community 16 - "Community 16"
Cohesion: 0.5
Nodes (2): Providers(), useFadeIn()

### Community 17 - "Community 17"
Cohesion: 0.67
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (2): AppIcon(), resolveIconName()

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 21`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `loading.tsx`, `Loading()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `manifest.ts`, `manifest()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `not-found.tsx`, `NotFound()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `sitemap.ts`, `sitemap()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `layout.tsx`, `AboutLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `layout.tsx`, `AdminLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `TabSections.tsx`, `SectionError()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `layout.tsx`, `CheckoutLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `layout.tsx`, `ContactLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `layout.tsx`, `FaqLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `page.tsx`, `toggle()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `layout.tsx`, `GiftingLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `layout.tsx`, `LearnLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `layout.tsx`, `OrderConfirmLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `page.tsx`, `handleCopyOrderNumber()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `layout.tsx`, `PrivacyLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `page.tsx`, `Privacy()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `page.tsx`, `ProductRedirect()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `layout.tsx`, `ProfileLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `layout.tsx`, `ShopLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `layout.tsx`, `TermsLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `page.tsx`, `Terms()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `layout.tsx`, `VerifyEmailLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (2 nodes): `layout.tsx`, `WishlistLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `updateField()`, `AddressFormFields.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `CookieConsent.tsx`, `CookieConsent()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (2 nodes): `SectionHeader.tsx`, `SectionHeader()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (2 nodes): `useCounter.ts`, `useCounter()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (2 nodes): `renderStars.ts`, `renderStars()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `express.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `next.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `error.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `EmptyState.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `ProductCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `ProductGridSkeleton.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `Toast.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `app.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `constants.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `graphify-refresh.ps1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fetchProducts()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `apiRequest()` connect `Community 0` to `Community 5`, `Community 6`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `apiRequest()` (e.g. with `fetchProducts()` and `fetchTestimonials()`) actually correct?**
  _`apiRequest()` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `create()` (e.g. with `createCoupon()` and `createTestimonial()`) actually correct?**
  _`create()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `checkEmailAddress()` (e.g. with `assertEmailIsValid()` and `checkEmail()`) actually correct?**
  _`checkEmailAddress()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `logAdminAction()` (e.g. with `changeUserRole()` and `exportOrders()`) actually correct?**
  _`logAdminAction()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._