import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './controller.js';
import { contactSchema, newsletterSubscribeSchema } from './schema.js';

const router = Router();

// Contact
router.post('/contact',     validate(contactSchema),              ctrl.submitContact);
router.get('/contact',       authenticate, authorize('admin'),     ctrl.listMessages);

// Newsletter
router.post('/newsletter',   validate(newsletterSubscribeSchema),  ctrl.subscribe);
router.delete('/newsletter',                                       ctrl.unsubscribe);
router.get('/newsletter',    authenticate, authorize('admin'),     ctrl.listSubscribers);

export default router;
