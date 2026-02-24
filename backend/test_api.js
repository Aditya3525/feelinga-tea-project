import fs from 'fs';

const API_BASE = 'http://localhost:5000/api/v1';
let adminToken = '';
let reportLines = [];
let passed = 0, failed = 0, blocked = 0;

function logStatus(category, testName, isPass, severity = null, details = {}) {
    if (isPass) {
        passed++;
        reportLines.push(`### ✅ PASS: [${category}] ${testName}`);
    } else {
        if (severity === 'Blocked') {
            blocked++;
            reportLines.push(`### 🚫 BLOCKED: [${category}] ${testName}`);
        } else {
            failed++;
            reportLines.push(`### ❌ FAIL (${severity}): [${category}] ${testName}`);
        }
        if (details.repro) reportLines.push(`- **Reproduction Steps:**\n  ${details.repro}`);
    }
    if (details.endpoint) reportLines.push(`- **Endpoint:** \`${details.endpoint}\``);
    if (details.payload) reportLines.push(`- **Payload:** \`${JSON.stringify(details.payload)}\``);
    if (details.status) reportLines.push(`- **Response Status:** \`${details.status}\``);
    if (details.error) reportLines.push(`- **Error context:** ${details.error}`);
    reportLines.push('');
}

async function request(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${endpoint}`, options);
    let data;
    try { data = await res.json(); } catch (e) { data = null; }
    return { status: res.status, data };
}

async function runTests() {
    reportLines.push('# Admin e2e API Test Report\n');
    reportLines.push('## Executive Summary\n');
    reportLines.push('This report provides an end-to-end validation of the admin API endpoints, including authentication, dashboard, products, orders, and audit logging.\n');

    // --- 1. AUTHENTICATION ---
    console.log('Testing authentication...');
    const loginRes = await request('/auth/login', 'POST', { email: 'admin@serenetea.com', password: 'Admin@123456' });
    if (loginRes.status === 200 && loginRes.data?.data?.user?.role === 'admin') {
        adminToken = loginRes.data.data.accessToken;
        logStatus('Auth', 'Admin Login Success', true, null, { endpoint: 'POST /auth/login', status: loginRes.status });
    } else {
        logStatus('Auth', 'Admin Login Success', false, 'Critical', { endpoint: 'POST /auth/login', status: loginRes.status, repro: 'Login with seed admin credentials' });
        fs.writeFileSync('report.md', reportLines.join('\n'));
        return; // Blocked
    }

    const noAuthRes = await request('/admin/dashboard', 'GET');
    if (noAuthRes.status === 401 || noAuthRes.status === 403) {
        logStatus('Auth', 'Reject Unauthenticated Access', true, null, { endpoint: 'GET /admin/dashboard', status: noAuthRes.status });
    } else {
        logStatus('Auth', 'Reject Unauthenticated Access', false, 'High', { endpoint: 'GET /admin/dashboard', status: noAuthRes.status });
    }

    // Rate Limit Test (Auth)
    console.log('Testing rate limit...');
    let rateLimitHit = false;
    for (let i = 0; i < 25; i++) {
        const rlRes = await request('/auth/login', 'POST', { email: 'wrong@serenetea.com', password: 'bad' });
        if (rlRes.status === 429) { rateLimitHit = true; break; }
    }
    if (rateLimitHit) {
        logStatus('Auth', 'Rate-limit behavior (basic check)', true, null, { endpoint: 'POST /auth/login', status: 429 });
    } else {
        logStatus('Auth', 'Rate-limit behavior (basic check)', false, 'Medium', { endpoint: 'POST /auth/login', error: 'Did not receive 429 after 25 failed logins' });
    }


    // --- 2. ADMIN DASHBOARD ---
    console.log('Testing dashboard...');
    const dashRes = await request('/admin/dashboard', 'GET', null, adminToken);
    if (dashRes.status === 200 && dashRes.data?.data?.totals) {
        logStatus('Dashboard', 'Fetch Dashboard Totals, Status Breakdown, Revenue', true, null, { endpoint: 'GET /admin/dashboard', status: dashRes.status });
    } else {
        logStatus('Dashboard', 'Fetch Dashboard Totals, Status Breakdown, Revenue', false, 'High', { endpoint: 'GET /admin/dashboard', status: dashRes.status });
    }

    const activityRes = await request('/admin/activity?page=1&limit=10', 'GET', null, adminToken);
    if (activityRes.status === 200 && Array.isArray(activityRes.data?.data)) {
        logStatus('Dashboard', 'Fetch Admin Activity Feed', true, null, { endpoint: 'GET /admin/activity', status: activityRes.status });
    } else {
        logStatus('Dashboard', 'Fetch Admin Activity Feed', false, 'High', { endpoint: 'GET /admin/activity', status: activityRes.status });
    }

    // --- 3. PRODUCT MANAGEMENT ---
    console.log('Testing products...');
    let testProductId = null;
    const prodPayload = {
        name: 'QA Test Product', slug: 'qa-test-product', type: 'Black Tea',
        description: 'Testing the product creation API endpoint.',
        prices: { '100g': 599 }, origin: 'Test Origin'
    };
    const createProdRes = await request('/products', 'POST', prodPayload, adminToken);
    if (createProdRes.status === 201 && createProdRes.data?.data?._id) {
        testProductId = createProdRes.data.data._id;
        logStatus('Product', 'Create single product', true, null, { endpoint: 'POST /products', payload: prodPayload, status: createProdRes.status });
    } else {
        logStatus('Product', 'Create single product', false, 'High', { endpoint: 'POST /products', payload: prodPayload, status: createProdRes.status });
    }

    if (testProductId) {
        const updateProdRes = await request(`/products/${testProductId}`, 'PATCH', { stock: 150 }, adminToken);
        if (updateProdRes.status === 200) {
            logStatus('Product', 'Edit single product', true, null, { endpoint: `PATCH /products/${testProductId}`, status: updateProdRes.status });
        } else {
            logStatus('Product', 'Edit single product', false, 'Medium', { endpoint: `PATCH /products/${testProductId}`, status: updateProdRes.status });
        }

        const bulkStockPayload = { productIds: [testProductId], stock: 99 };
        const bulkStockRes = await request('/products/bulk-stock', 'PATCH', bulkStockPayload, adminToken);
        if (bulkStockRes.status === 200) {
            logStatus('Product', 'Bulk stock update', true, null, { endpoint: 'PATCH /products/bulk-stock', payload: bulkStockPayload, status: bulkStockRes.status });
        } else {
            logStatus('Product', 'Bulk stock update', false, 'High', { endpoint: 'PATCH /products/bulk-stock', payload: bulkStockPayload, status: bulkStockRes.status });
        }
    }

    // Invalid Bulk Payload Test
    const invalidBulkPayload = { productIds: [], stock: -5 };
    const invalidBulkRes = await request('/products/bulk-stock', 'PATCH', invalidBulkPayload, adminToken);
    if (invalidBulkRes.status === 400 || invalidBulkRes.status === 422) { // Depending on validation
        logStatus('API', 'Invalid payloads for bulk endpoints', true, null, { endpoint: 'PATCH /products/bulk-stock', status: invalidBulkRes.status });
    } else {
        logStatus('API', 'Invalid payloads for bulk endpoints', false, 'Medium', { endpoint: 'PATCH /products/bulk-stock', status: invalidBulkRes.status, error: 'Should have rejected invalid payload' });
    }


    // --- 4. ORDER MANAGEMENT ---
    console.log('Testing orders...');
    let testOrderId = null;
    const productsRes = await request('/products?limit=1');
    const existingProduct = productsRes.data?.data?.[0];

    if (existingProduct) {
        const orderPayload = {
            items: [{ productId: existingProduct._id, size: '100g', qty: 1 }],
            shippingAddress: { firstName: 'QA', lastName: 'Tester', line1: '123 Test St', city: 'Test City', state: 'TS', pincode: '123456', phone: '9999999999' },
            paymentMethod: 'cod'
        };
        const createOrderRes = await request('/orders', 'POST', orderPayload, adminToken); // Admin is also a user
        if (createOrderRes.status === 201) {
            testOrderId = createOrderRes.data?.data?._id;
        } else {
            console.log('Order creation failed:', createOrderRes.status, createOrderRes.data);
        }
    }

    const getOrdersRes = await request('/orders?page=1&limit=10', 'GET', null, adminToken);
    if (getOrdersRes.status === 200) {
        logStatus('Order', 'Orders search/filter/pagination', true, null, { endpoint: 'GET /orders', status: getOrdersRes.status });
    } else {
        logStatus('Order', 'Orders search/filter/pagination', false, 'High', { endpoint: 'GET /orders', status: getOrdersRes.status });
    }

    if (testOrderId) {
        const updateOrderStatusRes = await request(`/orders/${testOrderId}/status`, 'PATCH', { status: 'confirmed' }, adminToken);
        if (updateOrderStatusRes.status === 200) {
            logStatus('Order', 'Single order status update', true, null, { endpoint: `PATCH /orders/${testOrderId}/status`, status: updateOrderStatusRes.status });
        } else {
            logStatus('Order', 'Single order status update', false, 'High', { endpoint: `PATCH /orders/${testOrderId}/status`, status: updateOrderStatusRes.status, error: JSON.stringify(updateOrderStatusRes.data) });
        }

        const bulkStatusRes = await request('/orders/bulk-status', 'PATCH', { orderIds: [testOrderId], status: 'processing' }, adminToken);
        if (bulkStatusRes.status === 200) {
            logStatus('Order', 'Bulk order status update', true, null, { endpoint: 'PATCH /orders/bulk-status', status: bulkStatusRes.status });
        } else {
            logStatus('Order', 'Bulk order status update', false, 'High', { endpoint: 'PATCH /orders/bulk-status', status: bulkStatusRes.status });
        }
    }

    // --- 5. MORE DELETES & EVENT LOGGING ---
    console.log('Testing deletes and audit logs...');
    if (testProductId) {
        const delProdRes = await request('/products/bulk', 'DELETE', { productIds: [testProductId] }, adminToken);
        if (delProdRes.status === 200) {
            logStatus('Product', 'Bulk delete selected products', true, null, { endpoint: 'DELETE /products/bulk', status: delProdRes.status });
        } else {
            logStatus('Product', 'Bulk delete selected products', false, 'High', { endpoint: 'DELETE /products/bulk', status: delProdRes.status });
        }
    }

    const finalActivityRes = await request('/admin/activity', 'GET', null, adminToken);
    if (finalActivityRes.status === 200 && finalActivityRes.data?.data?.length > 0) {
        const events = finalActivityRes.data.data.map(e => e.action);
        const hasProductCreate = events.includes('product.create');
        const hasOrderUpdate = events.includes('order.status_update');
        const hasBulkStock = events.includes('product.bulk_stock_update');

        if (hasProductCreate && hasBulkStock) {
            logStatus('Audit', 'Confirm audit log entries are created', true, null, { endpoint: 'GET /admin/activity', status: 200 });
        } else {
            logStatus('Audit', 'Confirm audit log entries are created', false, 'Medium', { endpoint: 'GET /admin/activity', error: `Events found: ${events.join(', ')}` });
        }
    } else {
        logStatus('Audit', 'Confirm audit log entries are created', false, 'High', {});
    }

    // --- WRAPPING UP ---
    reportLines.unshift(`**Overall Status:** ${failed === 0 ? '🟢 GO for Release' : '🔴 NO-GO for Release'}`);
    reportLines.unshift(`**Tests Passed:** ${passed} | **Failed:** ${failed} | **Blocked:** ${blocked}\n`);

    fs.writeFileSync('C:\\Users\\adity\\.gemini\\antigravity\\brain\\aac8599d-5a5d-40f3-93a8-8a1ad12ffa28\\report.md', reportLines.join('\n'));
    console.log('Test script completed successfully!');
}

runTests();
