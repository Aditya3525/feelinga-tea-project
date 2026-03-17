import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './controller.js';
import { couponSchema, couponUpdateSchema, testimonialSchema, testimonialUpdateSchema, trackingSchema } from './schema.js';

const router = Router();

// Dashboard & Activity
router.get('/dashboard',                ctrl.dashboard);
router.get('/activity',                 ctrl.activity);

// User Management
router.get('/users',                    ctrl.listUsers);
router.get('/users/:id',               ctrl.getUser);
router.patch('/users/:id/role',         ctrl.changeUserRole);

// Inventory
router.get('/low-stock',                ctrl.lowStock);

// CSV Exports
router.get('/export/orders',            ctrl.exportOrders);
router.get('/export/products',          ctrl.exportProducts);
router.get('/export/users',             ctrl.exportUsers);

// Coupons
router.get('/coupons',                  ctrl.listCoupons);
router.post('/coupons',    validate(couponSchema),       ctrl.createCoupon);
router.patch('/coupons/:id', validate(couponUpdateSchema), ctrl.updateCoupon);
router.delete('/coupons/:id',           ctrl.deleteCoupon);

// Order Tracking
router.patch('/orders/:id/tracking', validate(trackingSchema), ctrl.updateTracking);

// Invoice
router.get('/invoice/:orderId',         ctrl.invoice);

// Testimonials
router.get('/testimonials',             ctrl.listTestimonials);
router.post('/testimonials', validate(testimonialSchema),       ctrl.createTestimonial);
router.patch('/testimonials/:id', validate(testimonialUpdateSchema), ctrl.updateTestimonial);
router.delete('/testimonials/:id',      ctrl.deleteTestimonial);

export default router;
