import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './controller.js';
import { createOrderSchema, bulkStatusSchema, updateOrderStatusSchema } from './schema.js';

const router = Router();

// Customer
router.post('/',              authenticate, validate(createOrderSchema), ctrl.create);
router.get('/',               authenticate,                              ctrl.list);
router.get('/:id',            authenticate,                              ctrl.getById);
router.get('/:id/invoice',    authenticate,                              ctrl.invoice);
router.patch('/:id/cancel',   authenticate,                              ctrl.cancel);

// Admin
router.patch('/bulk-status',  authenticate, authorize('admin'), validate(bulkStatusSchema), ctrl.bulkStatus);
router.patch('/:id/status',   authenticate, authorize('admin'), validate(updateOrderStatusSchema), ctrl.updateStatus);

export default router;
