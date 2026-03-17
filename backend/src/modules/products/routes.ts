import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './controller.js';
import { createProductSchema, updateProductSchema, bulkStockSchema, bulkDeleteSchema } from './schema.js';

const router = Router();

router.get('/',              ctrl.list);
router.get('/search',        ctrl.search);
router.get('/autocomplete',  ctrl.autocomplete);
router.get('/:slug',         ctrl.getBySlug);

router.post('/',             authenticate, authorize('admin'), validate(createProductSchema), ctrl.create);
router.patch('/bulk-stock',  authenticate, authorize('admin'), validate(bulkStockSchema),     ctrl.bulkStockUpdate);
router.delete('/bulk',       authenticate, authorize('admin'), validate(bulkDeleteSchema),    ctrl.bulkDelete);
router.patch('/:id',         authenticate, authorize('admin'), validate(updateProductSchema), ctrl.update);
router.delete('/:id',        authenticate, authorize('admin'),                                ctrl.remove);

export default router;
