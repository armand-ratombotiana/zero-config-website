import express from 'express';
import passport from 'passport';
import { register, login, logout, getMe, oauthSuccess, oauthFailure } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Local authentication
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/auth/oauth/failure' }),
  oauthSuccess
);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/api/auth/oauth/failure' }),
  oauthSuccess
);

// OAuth routes
router.get('/oauth/success', oauthSuccess);
router.get('/oauth/failure', oauthFailure);

export default router;
