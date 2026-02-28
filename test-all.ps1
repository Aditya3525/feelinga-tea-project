## feelinga API Endpoint Test Script
## Run: powershell -File test-all.ps1

$base = "http://localhost:5000/api/v1"
$pass = 0; $fail = 0; $results = @()

function Test-Endpoint {
    param($Name, $Method, $Uri, $Body, $Headers, $ExpectStatus)
    try {
        $params = @{ Uri = "$base$Uri"; Method = $Method; UseBasicParsing = $true; ErrorAction = "Stop" }
        if ($Headers) { $params.Headers = $Headers }
        if ($Body) { $params.Body = $Body; $params.ContentType = "application/json" }
        $r = Invoke-WebRequest @params
        $data = $r.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        $script:pass++
        $detail = if ($data.message) { $data.message } elseif ($data.status) { $data.status } else { "OK" }
        $script:results += [PSCustomObject]@{ Test=$Name; Status="PASS"; Code=$r.StatusCode; Detail=$detail }
        return $data
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $body = ""
        try { $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()); $body = $sr.ReadToEnd(); $sr.Close() } catch {}
        $msg = try { ($body | ConvertFrom-Json).message } catch { $_.Exception.Message }
        if ($ExpectStatus -and $code -eq $ExpectStatus) {
            $script:pass++
            $script:results += [PSCustomObject]@{ Test=$Name; Status="PASS (expected $code)"; Code=$code; Detail=$msg }
        } else {
            $script:fail++
            $script:results += [PSCustomObject]@{ Test=$Name; Status="FAIL"; Code=$code; Detail=$msg }
        }
        return $null
    }
}

Write-Host "`n=== feelinga API Full Test Suite ===" -ForegroundColor Cyan
Write-Host "Base: $base`n"

# ===== HEALTH =====
Test-Endpoint "Health Check" "GET" "/health"

# ===== AUTH =====
Write-Host "--- Auth ---" -ForegroundColor Yellow
$loginData = Test-Endpoint "Admin Login" "POST" "/auth/login" '{"email":"kailasmane777@gmail.com","password":"Admin@123456"}'
$T = $loginData.data.accessToken
$RT = $loginData.data.refreshToken
$H = @{ Authorization = "Bearer $T" }

Test-Endpoint "Auth - Get Me" "GET" "/auth/me" $null $H
Test-Endpoint "Auth - Refresh Token" "POST" "/auth/refresh" "{`"refreshToken`":`"$RT`"}"
Test-Endpoint "Auth - Login Bad Password" "POST" "/auth/login" '{"email":"kailasmane777@gmail.com","password":"wrong"}' $null 401
Test-Endpoint "Auth - Register Missing Fields" "POST" "/auth/register" '{"email":"x@x.com"}' $null 400

# ===== FORGOT / RESET PASSWORD =====
Write-Host "--- Forgot/Reset Password ---" -ForegroundColor Yellow
Test-Endpoint "Forgot Password" "POST" "/auth/forgot-password" '{"email":"kailasmane777@gmail.com"}'
Test-Endpoint "Reset Password - Bad Token" "POST" "/auth/reset-password" '{"token":"badtoken123","password":"newpass123"}' $null 400

# ===== WISHLIST =====
Write-Host "--- Wishlist ---" -ForegroundColor Yellow
Test-Endpoint "Get Wishlist" "GET" "/auth/wishlist" $null $H

# ===== PRODUCTS =====
Write-Host "--- Products ---" -ForegroundColor Yellow
$prods = Test-Endpoint "List Products" "GET" "/products?page=1&limit=5"
$firstSlug = if ($prods.data.Count -gt 0) { $prods.data[0].slug } else { "test" }
$firstId = if ($prods.data.Count -gt 0) { $prods.data[0]._id } else { "" }
Test-Endpoint "Get Product by Slug" "GET" "/products/$firstSlug"
Test-Endpoint "Products - Filter by Type" "GET" "/products?type=Green+Tea"
Test-Endpoint "Products - Search" "GET" "/products?q=tea"
Test-Endpoint "Product Not Found" "GET" "/products/nonexistent-slug-xyz" $null $null 404

# ===== REVIEWS =====
Write-Host "--- Reviews ---" -ForegroundColor Yellow
if ($firstId) {
    Test-Endpoint "List Reviews" "GET" "/reviews?productId=$firstId"
}

# ===== CART =====
Write-Host "--- Cart ---" -ForegroundColor Yellow
Test-Endpoint "Get Cart" "GET" "/cart" $null $H
if ($firstId) {
    Test-Endpoint "Add to Cart" "POST" "/cart/items" "{`"productId`":`"$firstId`",`"size`":`"100g`",`"qty`":1}" $H
    Test-Endpoint "Get Cart After Add" "GET" "/cart" $null $H
}

# ===== ORDERS =====
Write-Host "--- Orders ---" -ForegroundColor Yellow
Test-Endpoint "List Orders" "GET" "/orders?page=1&limit=5" $null $H
if ($firstId) {
    $orderBody = @{
        items = @(@{ productId = $firstId; size = "100g"; qty = 1 })
        shippingAddress = @{
            firstName = "Test"; lastName = "User"; line1 = "123 Test St";
            city = "Mumbai"; state = "Maharashtra"; pincode = "400001"; phone = "9876543210"
        }
        paymentMethod = "cod"
    } | ConvertTo-Json -Depth 3
    $orderData = Test-Endpoint "Create Order" "POST" "/orders" $orderBody $H
    if ($orderData.data._id) {
        $oid = $orderData.data._id
        Test-Endpoint "Get Order by ID" "GET" "/orders/$oid" $null $H
        Test-Endpoint "Update Order Status" "PATCH" "/orders/$oid/status" '{"status":"confirmed"}' $H
    }
}

# ===== ADMIN =====
Write-Host "--- Admin ---" -ForegroundColor Yellow
Test-Endpoint "Admin Dashboard" "GET" "/admin/dashboard" $null $H
Test-Endpoint "Admin Activity" "GET" "/admin/activity" $null $H
Test-Endpoint "Admin Users List" "GET" "/admin/users" $null $H
Test-Endpoint "Admin Users Search" "GET" "/admin/users?q=kailas" $null $H
Test-Endpoint "Admin Low Stock" "GET" "/admin/low-stock?threshold=10" $null $H

# ===== EXPORT =====
Write-Host "--- Export ---" -ForegroundColor Yellow
# CSV endpoints return text/csv not JSON, so test manually
foreach ($exp in @(@{N="Export Orders CSV";P="orders"}, @{N="Export Products CSV";P="products"}, @{N="Export Users CSV";P="users"})) {
    try {
        $er = Invoke-WebRequest -Uri "$base/admin/export/$($exp.P)" -Headers $H -UseBasicParsing -ErrorAction Stop
        if ($er.Headers['Content-Type'] -match 'csv') {
            $pass++; $results += [PSCustomObject]@{ Test=$exp.N; Status="PASS"; Code=$er.StatusCode; Detail="CSV $($er.Content.Length) bytes" }
        } else {
            $fail++; $results += [PSCustomObject]@{ Test=$exp.N; Status="FAIL"; Code=$er.StatusCode; Detail="Not CSV: $($er.Headers['Content-Type'])" }
        }
    } catch {
        $fail++; $results += [PSCustomObject]@{ Test=$exp.N; Status="FAIL"; Code="?"; Detail=$_.Exception.Message }
    }
}

# ===== INVOICE =====
Write-Host "--- Invoice ---" -ForegroundColor Yellow
if ($oid) {
    # Test invoice endpoint separately since it returns PDF binary
    try {
        $ir = Invoke-WebRequest -Uri "$base/admin/invoice/$oid" -Headers $H -UseBasicParsing -ErrorAction Stop
        if ($ir.Headers['Content-Type'] -match 'pdf') {
            $pass++; $results += [PSCustomObject]@{ Test="Invoice PDF"; Status="PASS"; Code=$ir.StatusCode; Detail="PDF $($ir.RawContentLength) bytes" }
        } else {
            $fail++; $results += [PSCustomObject]@{ Test="Invoice PDF"; Status="FAIL"; Code=$ir.StatusCode; Detail="Not PDF: $($ir.Headers['Content-Type'])" }
        }
    } catch {
        $fail++; $results += [PSCustomObject]@{ Test="Invoice PDF"; Status="FAIL"; Code="?"; Detail=$_.Exception.Message }
    }
}
Test-Endpoint "Invoice - Bad ID" "GET" "/admin/invoice/000000000000000000000000" $null $H 404

# ===== CONTACT =====
Write-Host "--- Contact / Newsletter ---" -ForegroundColor Yellow
Test-Endpoint "Contact Form" "POST" "/contact" '{"name":"Test","email":"t@t.com","subject":"Hi","message":"Test message body here."}'
Test-Endpoint "Newsletter Subscribe" "POST" "/newsletter" '{"email":"news@test.com"}'

# ===== UPLOAD (admin only) =====
Write-Host "--- Upload ---" -ForegroundColor Yellow
Test-Endpoint "Upload - No File" "POST" "/upload/images" $null $H 400

# ===== AUTH GUARDS =====
Write-Host "--- Auth Guards ---" -ForegroundColor Yellow
Test-Endpoint "Admin Route - No Token" "GET" "/admin/dashboard" $null $null 401
Test-Endpoint "Orders - No Token" "GET" "/orders" $null $null 401

# ===== RESULTS =====
Write-Host "`n`n=== TEST RESULTS ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize -Property Test, Status, Code, Detail
Write-Host "TOTAL: $($pass + $fail) | PASS: $pass | FAIL: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
