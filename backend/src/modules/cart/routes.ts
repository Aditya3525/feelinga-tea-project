import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './controller.js';
import { addItemSchema } from './schema.js';

const router = Router();

router.get('/',           authenticate, ctrl.get);
router.post('/items',     authenticate, validate(addItemSchema), ctrl.addItem);
router.patch('/items/:id', authenticate, ctrl.updateItem);
router.delete('/items/:id', authenticate, ctrl.removeItem);
router.post('/sync',      authenticate, ctrl.sync);
router.delete('/',        authenticate, ctrl.clear);

export default router;
