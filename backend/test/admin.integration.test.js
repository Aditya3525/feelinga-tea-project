import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';

let mongoServer;
let app;
let User;
let Product;
let Order;
let AuditLog;

async function createAdminToken() {
    await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'Admin@12345',
        role: 'admin',
    });

    const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'Admin@12345' });

    return loginRes.body.data.accessToken;
}

async function createCustomer() {
    return User.create({
        name: 'Customer User',
        email: 'customer@test.com',
        password: 'Customer@12345',
        role: 'customer',
    });
}

async function createProduct(data = {}) {
    return Product.create({
        slug: data.slug || `test-product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: data.name || 'Test Product',
        type: data.type || 'Green Tea',
        description: data.description || 'This is a valid product description for tests.',
        origin: data.origin || 'Test Origin',
        prices: data.prices || { '100g': 499 },
        stock: data.stock ?? 10,
        inStock: data.inStock ?? true,
    });
}

async function createOrder({ user, product, status = 'pending' }) {
    return Order.create({
        user: user._id,
        items: [{
            product: product._id,
            name: product.name,
            size: '100g',
            price: product.prices['100g'],
            qty: 1,
            image: '',
        }],
        shippingAddress: {
            firstName: 'Test',
            lastName: 'User',
            line1: '123 Street',
            city: 'City',
            state: 'State',
            pincode: '400001',
            phone: '9876543210',
        },
        subtotal: product.prices['100g'],
        shipping: 0,
        tax: 25,
        total: product.prices['100g'] + 25,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        status,
    });
}

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();

    ({ default: app } = await import('../src/app.ts'));
    ({ default: User } = await import('../src/models/User.ts'));
    ({ default: Product } = await import('../src/models/Product.ts'));
    ({ default: Order } = await import('../src/models/Order.ts'));
    ({ default: AuditLog } = await import('../src/models/AuditLog.ts'));

    await mongoose.connect(process.env.MONGODB_URI);
}, 600000);

beforeEach(async () => {
    await Promise.all([
        User.deleteMany({}),
        Product.deleteMany({}),
        Order.deleteMany({}),
        AuditLog.deleteMany({}),
    ]);
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

describe('Admin Dashboard Integration', () => {
    it('rejects unauthenticated admin dashboard access', async () => {
        const res = await request(app).get('/api/v1/admin/dashboard');
        expect(res.status).toBe(401);
    });

    it('returns dashboard totals and recent activity for admin', async () => {
        const token = await createAdminToken();
        const customer = await createCustomer();
        const product = await createProduct();
        await createOrder({ user: customer, product, status: 'pending' });

        const stockRes = await request(app)
            .patch('/api/v1/products/bulk-stock')
            .set('Authorization', `Bearer ${token}`)
            .send({ productIds: [product._id.toString()], stock: 5 });
        expect(stockRes.status).toBe(200);

        const res = await request(app)
            .get('/api/v1/admin/dashboard')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.totals.users).toBe(2);
        expect(res.body.data.totals.products).toBe(1);
        expect(res.body.data.totals.orders).toBe(1);
        expect(Array.isArray(res.body.data.recentActivity)).toBe(true);
        expect(res.body.data.recentActivity.length).toBeGreaterThan(0);
    });
});

describe('Admin Bulk Operations + Audit Logs', () => {
    it('updates order statuses in bulk and writes audit log', async () => {
        const token = await createAdminToken();
        const customer = await createCustomer();
        const product = await createProduct();
        const order1 = await createOrder({ user: customer, product, status: 'pending' });
        const order2 = await createOrder({ user: customer, product, status: 'pending' });

        const res = await request(app)
            .patch('/api/v1/orders/bulk-status')
            .set('Authorization', `Bearer ${token}`)
            .send({
                orderIds: [order1._id.toString(), order2._id.toString()],
                status: 'shipped',
            });

        expect(res.status).toBe(200);
        expect(res.body.data.modified).toBe(2);

        const updatedOrders = await Order.find({ _id: { $in: [order1._id, order2._id] } });
        expect(updatedOrders.every(o => o.status === 'shipped')).toBe(true);

        const audit = await AuditLog.findOne({ action: 'order.bulk_status_update' });
        expect(audit).toBeTruthy();
        expect(audit.meta.modified).toBe(2);
    });

    it('bulk updates stock and bulk deletes products with audit logs', async () => {
        const token = await createAdminToken();
        const p1 = await createProduct({ name: 'Bulk Product 1', slug: 'bulk-product-1' });
        const p2 = await createProduct({ name: 'Bulk Product 2', slug: 'bulk-product-2' });

        const stockRes = await request(app)
            .patch('/api/v1/products/bulk-stock')
            .set('Authorization', `Bearer ${token}`)
            .send({ productIds: [p1._id.toString(), p2._id.toString()], stock: 0 });

        expect(stockRes.status).toBe(200);
        expect(stockRes.body.data.modified).toBe(2);

        const stocked = await Product.find({ _id: { $in: [p1._id, p2._id] } });
        expect(stocked.every(p => p.stock === 0 && p.inStock === false)).toBe(true);

        const deleteRes = await request(app)
            .delete('/api/v1/products/bulk')
            .set('Authorization', `Bearer ${token}`)
            .send({ productIds: [p1._id.toString(), p2._id.toString()] });

        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.data.deleted).toBe(2);

        const count = await Product.countDocuments({ _id: { $in: [p1._id, p2._id] } });
        expect(count).toBe(0);

        const stockAudit = await AuditLog.findOne({ action: 'product.bulk_stock_update' });
        const deleteAudit = await AuditLog.findOne({ action: 'product.bulk_delete' });
        expect(stockAudit).toBeTruthy();
        expect(deleteAudit).toBeTruthy();
    });
});
