import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './controller.js';
import { createReviewSchema } from './schema.js';

const router = Router();

router.get('/',     ctrl.list);
router.post('/',    authenticate, validate(createReviewSchema), ctrl.create);
router.delete('/:id', authenticate, ctrl.remove);

export default router;
