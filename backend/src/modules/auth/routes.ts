import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './controller.js';
import {
	registerSchema,
	loginSchema,
	updateProfileSchema,
	changePasswordSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	verifyEmailSchema,
	checkEmailSchema,
	addressSchema,
	deleteAccountSchema,
} from './schema.js';

const router = Router();

// Public
router.post('/register',       validate(registerSchema), ctrl.register);
router.post('/login',          validate(loginSchema),    ctrl.login);
router.post('/refresh',                                  ctrl.refresh);
router.post('/google',                                   ctrl.googleLogin);
router.post('/check-email',    validate(checkEmailSchema), ctrl.checkEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password',  validate(resetPasswordSchema),  ctrl.resetPassword);
router.post('/verify-email',    validate(verifyEmailSchema),    ctrl.verifyEmail);

// Authenticated
router.get('/me',              authenticate,             ctrl.getMe);
router.patch('/me',            authenticate, validate(updateProfileSchema),  ctrl.updateProfile);
router.patch('/password',      authenticate, validate(changePasswordSchema), ctrl.changePassword);
router.post('/logout',         authenticate,             ctrl.logout);

// Addresses
router.post('/addresses',      authenticate, validate(addressSchema), ctrl.addAddress);
router.patch('/addresses/:id', authenticate, validate(addressSchema), ctrl.updateAddress);
router.delete('/addresses/:id', authenticate,            ctrl.removeAddress);

// Wishlist
router.get('/wishlist',        authenticate,             ctrl.getWishlist);
router.post('/wishlist/:productId', authenticate,        ctrl.toggleWishlist);

// DSAR
router.get('/data-export',     authenticate,             ctrl.dataExport);
router.delete('/account',      authenticate, validate(deleteAccountSchema), ctrl.deleteAccount);

export default router;
