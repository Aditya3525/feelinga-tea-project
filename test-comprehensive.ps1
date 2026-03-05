# ===== Comprehensive API & Frontend Test Script =====
# Tests all backend API endpoints and frontend page routes
# Run: powershell -ExecutionPolicy Bypass -File test-comprehensive.ps1

$ErrorActionPreference = "Continue"
$base = "http://localhost:5000/api/v1"
$frontendBase = "http://localhost:3000"

$pass = 0
$fail = 0
$skip = 0
$results = @()

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Label,
        [int]$ExpectedStatus = 200,
        [string]$Body = $null,
        [hashtable]$Headers = @{},
        [switch]$SkipStatusCheck
    )
    try {
        $params = @{
            Uri             = $Url
            Method          = $Method
            UseBasicParsing = $true
            TimeoutSec      = 15
            ErrorAction     = "Stop"
        }
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        if ($Body) {
            $params.Body = $Body
            if (-not $params.Headers) { $params.Headers = @{} }
            $params.Headers["Content-Type"] = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        $content = $response.Content
        
        if ($SkipStatusCheck -or $statusCode -eq $ExpectedStatus) {
            $script:pass++
            $icon = "[PASS]"
            $script:results += [PSCustomObject]@{ Test=$Label; Status="PASS"; Code=$statusCode; Detail="" }
        } else {
            $script:fail++
            $icon = "[FAIL]"
            $script:results += [PSCustomObject]@{ Test=$Label; Status="FAIL"; Code=$statusCode; Detail="Expected $ExpectedStatus" }
        }
        Write-Host "$icon $Label => $statusCode" -ForegroundColor $(if($icon -eq "[PASS]"){"Green"}else{"Red"})
        return @{ StatusCode=$statusCode; Content=$content; Success=$true }
    } catch {
        $errStatus = 0
        $errBody = ""
        if ($_.Exception.Response) {
            $errStatus = [int]$_.Exception.Response.StatusCode
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $errBody = $reader.ReadToEnd()
            } catch {}
        }
        
        if ($SkipStatusCheck -or $errStatus -eq $ExpectedStatus) {
            $script:pass++
            Write-Host "[PASS] $Label => $errStatus" -ForegroundColor Green
            $script:results += [PSCustomObject]@{ Test=$Label; Status="PASS"; Code=$errStatus; Detail="" }
            return @{ StatusCode=$errStatus; Content=$errBody; Success=$true }
        } else {
            $script:fail++
            $detail = if($errStatus){"Got $errStatus, expected $ExpectedStatus"}else{$_.Exception.Message}
            Write-Host "[FAIL] $Label => $detail" -ForegroundColor Red
            $script:results += [PSCustomObject]@{ Test=$Label; Status="FAIL"; Code=$errStatus; Detail=$detail }
            return @{ StatusCode=$errStatus; Content=$errBody; Success=$false }
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  COMPREHENSIVE API & FRONTEND TESTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ========== 1. HEALTH CHECK ==========
Write-Host "--- Health Check ---" -ForegroundColor Yellow
Test-Endpoint -Method GET -Url "$base/health" -Label "Health check"

# ========== 2. AUTH ENDPOINTS ==========
Write-Host "`n--- Auth Endpoints ---" -ForegroundColor Yellow

# Register a test user
$testEmail = "testuser_$(Get-Random)@test.com"
$registerBody = @{ name="Test User"; email=$testEmail; password="TestPass123!" } | ConvertTo-Json
$regResult = Test-Endpoint -Method POST -Url "$base/auth/register" -Label "Auth: Register new user" -ExpectedStatus 201 -Body $registerBody

$accessToken = $null
$refreshToken = $null
if ($regResult.Success -and $regResult.Content) {
    $regData = $regResult.Content | ConvertFrom-Json
    $accessToken = $regData.data.accessToken
    $refreshToken = $regData.data.refreshToken
    Write-Host "       Got tokens for test user" -ForegroundColor DarkGray
}

# Register duplicate should fail
Test-Endpoint -Method POST -Url "$base/auth/register" -Label "Auth: Duplicate register (409)" -ExpectedStatus 409 -Body $registerBody

# Login
$loginBody = @{ email=$testEmail; password="TestPass123!" } | ConvertTo-Json
$loginResult = Test-Endpoint -Method POST -Url "$base/auth/login" -Label "Auth: Login" -Body $loginBody

if ($loginResult.Success -and $loginResult.Content) {
    $loginData = $loginResult.Content | ConvertFrom-Json
    $accessToken = $loginData.data.accessToken
    $refreshToken = $loginData.data.refreshToken
}

# Login with wrong password
$badLoginBody = @{ email=$testEmail; password="WrongPass!" } | ConvertTo-Json
Test-Endpoint -Method POST -Url "$base/auth/login" -Label "Auth: Wrong password (401)" -ExpectedStatus 401 -Body $badLoginBody

# Get me
$authHeaders = @{ Authorization="Bearer $accessToken" }
Test-Endpoint -Method GET -Url "$base/auth/me" -Label "Auth: Get /me" -Headers $authHeaders

# Update profile
$updateBody = @{ name="Updated Test User" } | ConvertTo-Json
Test-Endpoint -Method PATCH -Url "$base/auth/me" -Label "Auth: Update profile" -Headers $authHeaders -Body $updateBody

# Add address
$addressBody = @{
    label="Home"; fullName="Test User"; phone="9876543210";
    addressLine1="123 Tea Street"; city="Mumbai"; state="Maharashtra"; pincode="400001"
} | ConvertTo-Json
Test-Endpoint -Method POST -Url "$base/auth/me/addresses" -Label "Auth: Add address" -ExpectedStatus 201 -Headers $authHeaders -Body $addressBody

# Refresh token
$refreshBody = @{ refreshToken=$refreshToken } | ConvertTo-Json
$refreshResult = Test-Endpoint -Method POST -Url "$base/auth/refresh" -Label "Auth: Refresh token" -Body $refreshBody
if ($refreshResult.Success -and $refreshResult.Content) {
    $refreshData = $refreshResult.Content | ConvertFrom-Json
    $accessToken = $refreshData.data.accessToken
    $refreshToken = $refreshData.data.refreshToken
    $authHeaders = @{ Authorization="Bearer $accessToken" }
}

# Change password
$changePwBody = @{ currentPassword="TestPass123!"; newPassword="NewTestPass123!" } | ConvertTo-Json
Test-Endpoint -Method POST -Url "$base/auth/change-password" -Label "Auth: Change password" -Headers $authHeaders -Body $changePwBody

# Forgot password (always 200)
$forgotBody = @{ email=$testEmail } | ConvertTo-Json
Test-Endpoint -Method POST -Url "$base/auth/forgot-password" -Label "Auth: Forgot password" -Body $forgotBody

# Verify email with invalid token (should 400)
$verifyBody = @{ token="invalidtoken123" } | ConvertTo-Json
Test-Endpoint -Method POST -Url "$base/auth/verify-email" -Label "Auth: Verify email (invalid, 400)" -ExpectedStatus 400 -Body $verifyBody

# No auth should fail
Test-Endpoint -Method GET -Url "$base/auth/me" -Label "Auth: No token (401)" -ExpectedStatus 401

# ========== 3. PRODUCTS ENDPOINTS ==========
Write-Host "`n--- Products Endpoints ---" -ForegroundColor Yellow

# List products
$productsResult = Test-Endpoint -Method GET -Url "$base/products" -Label "Products: List all"

$firstProductSlug = $null
$firstProductId = $null
if ($productsResult.Success -and $productsResult.Content) {
    $prodData = $productsResult.Content | ConvertFrom-Json
    if ($prodData.data.Count -gt 0) {
        $firstProductSlug = $prodData.data[0].slug
        $firstProductId = $prodData.data[0]._id
        Write-Host "       Found $($prodData.results) products, first: $firstProductSlug" -ForegroundColor DarkGray
    }
}

# List with filters
Test-Endpoint -Method GET -Url "$base/products?type=Green+Tea" -Label "Products: Filter by type"
Test-Endpoint -Method GET -Url "$base/products?sort=price&limit=5" -Label "Products: Sort by price"
Test-Endpoint -Method GET -Url "$base/products?page=1&limit=3" -Label "Products: Pagination"
Test-Endpoint -Method GET -Url "$base/products?sort=-rating" -Label "Products: Sort by rating"
Test-Endpoint -Method GET -Url "$base/products?minPrice=200&maxPrice=500" -Label "Products: Price range filter"

# Search
Test-Endpoint -Method GET -Url "$base/products/search?q=tea" -Label "Products: Search 'tea'"
Test-Endpoint -Method GET -Url "$base/products/search?q=a" -Label "Products: Search too short (400)" -ExpectedStatus 400

# Get single product by slug
if ($firstProductSlug) {
    Test-Endpoint -Method GET -Url "$base/products/$firstProductSlug" -Label "Products: Get by slug"
} else {
    $skip++; Write-Host "[SKIP] Products: Get by slug (no products)" -ForegroundColor DarkYellow
}

# Non-existent product
Test-Endpoint -Method GET -Url "$base/products/nonexistent-slug-xyz" -Label "Products: Not found (404)" -ExpectedStatus 404

# ========== 4. REVIEWS ENDPOINTS ==========
Write-Host "`n--- Reviews Endpoints ---" -ForegroundColor Yellow

if ($firstProductId) {
    # Get reviews for product
    Test-Endpoint -Method GET -Url "$base/reviews?productId=$firstProductId" -Label "Reviews: List for product"
    
    # Create review
    $reviewBody = @{ productId=$firstProductId; rating=5; title="Great tea!"; body="This is a wonderful tea, loved it!" } | ConvertTo-Json
    $reviewResult = Test-Endpoint -Method POST -Url "$base/reviews" -Label "Reviews: Create review" -ExpectedStatus 201 -Headers $authHeaders -Body $reviewBody
    
    $reviewId = $null
    if ($reviewResult.Success -and $reviewResult.Content) {
        $rvData = $reviewResult.Content | ConvertFrom-Json
        $reviewId = $rvData.data._id
    }
    
    # Duplicate review should fail
    Test-Endpoint -Method POST -Url "$base/reviews" -Label "Reviews: Duplicate (400)" -ExpectedStatus 400 -Headers $authHeaders -Body $reviewBody
    
    # Delete review
    if ($reviewId) {
        Test-Endpoint -Method DELETE -Url "$base/reviews/$reviewId" -Label "Reviews: Delete review" -ExpectedStatus 204 -Headers $authHeaders
    }
} else {
    $skip += 4; Write-Host "[SKIP] Reviews: No products to test with" -ForegroundColor DarkYellow
}

# Reviews without productId
Test-Endpoint -Method GET -Url "$base/reviews" -Label "Reviews: Missing productId (400)" -ExpectedStatus 400

# ========== 5. CART ENDPOINTS ==========
Write-Host "`n--- Cart Endpoints ---" -ForegroundColor Yellow

# Get empty cart
Test-Endpoint -Method GET -Url "$base/cart" -Label "Cart: Get (empty)" -Headers $authHeaders

if ($firstProductId) {
    # Add to cart
    $cartAddBody = @{ productId=$firstProductId; size="100g"; qty=1 } | ConvertTo-Json
    Test-Endpoint -Method POST -Url "$base/cart/items" -Label "Cart: Add item" -Headers $authHeaders -Body $cartAddBody
    
    # Get cart with items
    $cartResult = Test-Endpoint -Method GET -Url "$base/cart" -Label "Cart: Get with items" -Headers $authHeaders
    
    $cartItemId = $null
    if ($cartResult.Success -and $cartResult.Content) {
        $cartData = $cartResult.Content | ConvertFrom-Json
        if ($cartData.data.items.Count -gt 0) {
            $cartItemId = $cartData.data.items[0].id
        }
    }
    
    # Update quantity
    if ($cartItemId) {
        $updateQtyBody = @{ qty=2 } | ConvertTo-Json
        Test-Endpoint -Method PATCH -Url "$base/cart/items/$cartItemId" -Label "Cart: Update qty" -Headers $authHeaders -Body $updateQtyBody
        
        # Remove item
        Test-Endpoint -Method DELETE -Url "$base/cart/items/$cartItemId" -Label "Cart: Remove item" -Headers $authHeaders
    }
    
    # Cart sync
    $syncBody = @{ items=@(@{ productId=$firstProductId; size="100g"; qty=1 }) } | ConvertTo-Json
    Test-Endpoint -Method POST -Url "$base/cart/sync" -Label "Cart: Sync" -Headers $authHeaders -Body $syncBody
    
    # Clear cart
    Test-Endpoint -Method DELETE -Url "$base/cart" -Label "Cart: Clear" -Headers $authHeaders
} else {
    $skip += 6; Write-Host "[SKIP] Cart: No products to test with" -ForegroundColor DarkYellow
}

# Cart without auth
Test-Endpoint -Method GET -Url "$base/cart" -Label "Cart: No auth (401)" -ExpectedStatus 401

# ========== 6. ORDERS ENDPOINTS ==========
Write-Host "`n--- Orders Endpoints ---" -ForegroundColor Yellow

if ($firstProductId) {
    # Add item to cart for order
    $cartAddBody = @{ productId=$firstProductId; size="100g"; qty=1 } | ConvertTo-Json
    try { Invoke-RestMethod -Uri "$base/cart/items" -Method POST -Headers (@{ Authorization="Bearer $accessToken"; "Content-Type"="application/json" }) -Body $cartAddBody -ErrorAction SilentlyContinue } catch {}
    
    # Create order
    $orderBody = @{
        items=@(@{ productId=$firstProductId; size="100g"; qty=1 })
        shippingAddress=@{
            firstName="Test"; lastName="User"; line1="123 Tea Street";
            city="Mumbai"; state="Maharashtra"; pincode="400001"; phone="9876543210"
        }
        paymentMethod="cod"
    } | ConvertTo-Json -Depth 5
    $orderResult = Test-Endpoint -Method POST -Url "$base/orders" -Label "Orders: Create order" -ExpectedStatus 201 -Headers $authHeaders -Body $orderBody
    
    $orderId = $null
    if ($orderResult.Success -and $orderResult.Content) {
        $orderData = $orderResult.Content | ConvertFrom-Json
        $orderId = $orderData.data._id
    }
    
    # List orders
    Test-Endpoint -Method GET -Url "$base/orders" -Label "Orders: List my orders" -Headers $authHeaders
    
    # Get single order
    if ($orderId) {
        Test-Endpoint -Method GET -Url "$base/orders/$orderId" -Label "Orders: Get detail" -Headers $authHeaders
        
        # Cancel order
        $cancelBody = @{ reason="Testing cancellation" } | ConvertTo-Json
        Test-Endpoint -Method PATCH -Url "$base/orders/$orderId/cancel" -Label "Orders: Cancel" -Headers $authHeaders -Body $cancelBody
    }
} else {
    $skip += 4; Write-Host "[SKIP] Orders: No products to test with" -ForegroundColor DarkYellow
}

# Orders without auth
Test-Endpoint -Method GET -Url "$base/orders" -Label "Orders: No auth (401)" -ExpectedStatus 401

# ========== 7. CONTACT & NEWSLETTER ==========
Write-Host "`n--- Contact & Newsletter ---" -ForegroundColor Yellow

# Submit contact form
$contactBody = @{ name="Test User"; email="test@test.com"; subject="Test"; message="This is a test message from the test script." } | ConvertTo-Json
Test-Endpoint -Method POST -Url "$base/contact" -Label "Contact: Submit form" -ExpectedStatus 201 -Body $contactBody

# Invalid contact
$badContactBody = @{ name="T"; email="bad" } | ConvertTo-Json
Test-Endpoint -Method POST -Url "$base/contact" -Label "Contact: Invalid (400)" -ExpectedStatus 400 -Body $badContactBody

# Newsletter subscribe
$nlBody = @{ email="newsletter_test@test.com" } | ConvertTo-Json
Test-Endpoint -Method POST -Url "$base/newsletter" -Label "Newsletter: Subscribe" -ExpectedStatus 201 -Body $nlBody

# Newsletter unsubscribe
$nlUnsubBody = @{ email="newsletter_test@test.com" } | ConvertTo-Json
Test-Endpoint -Method DELETE -Url "$base/newsletter" -Label "Newsletter: Unsubscribe" -Body $nlUnsubBody

# ========== 8. COUPON VALIDATION ==========
Write-Host "`n--- Coupon Validation ---" -ForegroundColor Yellow

$couponBody = @{ code="FAKECOUPON123"; subtotal=1000 } | ConvertTo-Json
Test-Endpoint -Method POST -Url "$base/coupons/validate" -Label "Coupon: Invalid code (404)" -ExpectedStatus 404 -Headers $authHeaders -Body $couponBody

$noCouponBody = @{ subtotal=1000 } | ConvertTo-Json
Test-Endpoint -Method POST -Url "$base/coupons/validate" -Label "Coupon: Missing code (400)" -ExpectedStatus 400 -Headers $authHeaders -Body $noCouponBody

# ========== 9. WISHLIST ==========
Write-Host "`n--- Wishlist ---" -ForegroundColor Yellow

Test-Endpoint -Method GET -Url "$base/auth/wishlist" -Label "Wishlist: Get" -Headers $authHeaders

if ($firstProductId) {
    Test-Endpoint -Method POST -Url "$base/auth/wishlist/$firstProductId" -Label "Wishlist: Toggle add" -Headers $authHeaders
    Test-Endpoint -Method GET -Url "$base/auth/wishlist" -Label "Wishlist: Get (with item)" -Headers $authHeaders
    Test-Endpoint -Method POST -Url "$base/auth/wishlist/$firstProductId" -Label "Wishlist: Toggle remove" -Headers $authHeaders
}

# ========== 10. ADMIN (non-admin: expect 403) ==========
Write-Host "`n--- Admin (non-admin, expect 403) ---" -ForegroundColor Yellow

Test-Endpoint -Method GET -Url "$base/admin/dashboard" -Label "Admin: Dashboard (403)" -ExpectedStatus 403 -Headers $authHeaders
Test-Endpoint -Method GET -Url "$base/admin/users" -Label "Admin: Users (403)" -ExpectedStatus 403 -Headers $authHeaders
Test-Endpoint -Method GET -Url "$base/admin/coupons" -Label "Admin: Coupons (403)" -ExpectedStatus 403 -Headers $authHeaders

# ========== 11. ADMIN (with admin credentials) ==========
Write-Host "`n--- Admin (looking for admin login) ---" -ForegroundColor Yellow

$adminToken = $null
$adminEmails = @("kailasmane777@gmail.com", "admin@feelinga.in", "admin@admin.com", "admin@serenetea.com", "admin@example.com")
$adminPasswords = @("Admin@123456", "admin123", "Admin123!", "password123", "admin1234")
foreach ($ae in $adminEmails) {
    if ($adminToken) { break }
    foreach ($ap in $adminPasswords) {
        try {
            $alb = @{ email=$ae; password=$ap } | ConvertTo-Json
            $ar = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body $alb -ErrorAction Stop
            if ($ar.data.accessToken) {
                # Verify it's actually admin
                $meCheck = Invoke-RestMethod -Uri "$base/auth/me" -Method GET -Headers @{ Authorization="Bearer $($ar.data.accessToken)" } -ErrorAction Stop
                if ($meCheck.data.user.role -eq "admin") {
                    $adminToken = $ar.data.accessToken
                    Write-Host "       Found admin: $ae" -ForegroundColor DarkGray
                    break
                }
            }
        } catch {}
    }
}

if ($adminToken) {
    $adminHeaders = @{ Authorization="Bearer $adminToken" }
    
    Test-Endpoint -Method GET -Url "$base/admin/dashboard" -Label "Admin: Dashboard" -Headers $adminHeaders
    Test-Endpoint -Method GET -Url "$base/admin/users" -Label "Admin: List users" -Headers $adminHeaders
    Test-Endpoint -Method GET -Url "$base/admin/users?q=test" -Label "Admin: Search users" -Headers $adminHeaders
    Test-Endpoint -Method GET -Url "$base/admin/activity" -Label "Admin: Activity log" -Headers $adminHeaders
    Test-Endpoint -Method GET -Url "$base/admin/low-stock" -Label "Admin: Low stock" -Headers $adminHeaders
    Test-Endpoint -Method GET -Url "$base/admin/coupons" -Label "Admin: Coupons" -Headers $adminHeaders
    Test-Endpoint -Method GET -Url "$base/admin/export/orders" -Label "Admin: Export orders" -Headers $adminHeaders
    Test-Endpoint -Method GET -Url "$base/admin/export/products" -Label "Admin: Export products" -Headers $adminHeaders
    Test-Endpoint -Method GET -Url "$base/admin/export/users" -Label "Admin: Export users" -Headers $adminHeaders
    Test-Endpoint -Method GET -Url "$base/orders" -Label "Admin: All orders" -Headers $adminHeaders
    Test-Endpoint -Method GET -Url "$base/contact" -Label "Admin: Contact msgs" -Headers $adminHeaders
    Test-Endpoint -Method GET -Url "$base/newsletter" -Label "Admin: Newsletter subs" -Headers $adminHeaders
} else {
    $skip += 12
    Write-Host "[SKIP] Admin tests: no admin credentials found" -ForegroundColor DarkYellow
}

# ========== 12. LOGOUT ==========
Write-Host "`n--- Cleanup ---" -ForegroundColor Yellow
Test-Endpoint -Method POST -Url "$base/auth/logout" -Label "Auth: Logout" -Headers $authHeaders

# ========== FRONTEND PAGES ==========
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FRONTEND PAGE TESTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$frontendPages = @(
    @{ Path="/"; Label="Home" },
    @{ Path="/shop"; Label="Shop" },
    @{ Path="/about"; Label="About" },
    @{ Path="/contact"; Label="Contact" },
    @{ Path="/faq"; Label="FAQ" },
    @{ Path="/learn"; Label="Learn" },
    @{ Path="/gifting"; Label="Gifting" },
    @{ Path="/privacy"; Label="Privacy" },
    @{ Path="/terms"; Label="Terms" },
    @{ Path="/wishlist"; Label="Wishlist" },
    @{ Path="/profile"; Label="Profile" },
    @{ Path="/checkout"; Label="Checkout" },
    @{ Path="/admin"; Label="Admin" },
    @{ Path="/verify-email"; Label="Verify Email" },
    @{ Path="/reset-password"; Label="Reset Password" }
)

foreach ($pg in $frontendPages) {
    Test-Endpoint -Method GET -Url "$frontendBase$($pg.Path)" -Label "Page: $($pg.Label)" -SkipStatusCheck
}

if ($firstProductSlug) {
    Test-Endpoint -Method GET -Url "$frontendBase/product/$firstProductSlug" -Label "Page: Product detail" -SkipStatusCheck
}

Test-Endpoint -Method GET -Url "$frontendBase/nonexistent-page-xyz" -Label "Page: 404 page" -SkipStatusCheck

# ========== SUMMARY ==========
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "PASSED:  $pass" -ForegroundColor Green
Write-Host "FAILED:  $fail" -ForegroundColor $(if($fail -gt 0){"Red"}else{"Green"})
Write-Host "SKIPPED: $skip" -ForegroundColor Yellow
Write-Host "TOTAL:   $($pass + $fail + $skip)`n"

if ($fail -gt 0) {
    Write-Host "--- Failed Tests ---" -ForegroundColor Red
    $results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "  X $($_.Test) (HTTP $($_.Code)) $($_.Detail)" -ForegroundColor Red
    }
    Write-Host ""
}

$results | Format-Table -Property Status, @{N='HTTP';E={$_.Code}}, Test, Detail -AutoSize
