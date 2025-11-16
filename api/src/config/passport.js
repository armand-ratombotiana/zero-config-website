import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

export const configurePassport = () => {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await User.findOne({
              $or: [{ providerId: profile.id }, { email: profile.emails[0].value }],
            });

            if (user) {
              // Update user if needed
              if (!user.avatar && profile.photos[0]) {
                user.avatar = profile.photos[0].value;
                await user.save();
              }
              return done(null, user);
            }

            // Create new user
            user = await User.create({
              email: profile.emails[0].value,
              name: profile.displayName,
              avatar: profile.photos[0]?.value,
              provider: 'google',
              providerId: profile.id,
              isEmailVerified: true,
            });

            done(null, user);
          } catch (error) {
            done(error, null);
          }
        }
      )
    );
  }

  // GitHub OAuth Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: process.env.GITHUB_CALLBACK_URL,
          scope: ['user:email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails[0].value;

            // Check if user already exists
            let user = await User.findOne({
              $or: [{ providerId: profile.id }, { email }],
            });

            if (user) {
              // Update user if needed
              if (!user.avatar && profile.photos[0]) {
                user.avatar = profile.photos[0].value;
                await user.save();
              }
              return done(null, user);
            }

            // Create new user
            user = await User.create({
              email,
              name: profile.displayName || profile.username,
              avatar: profile.photos[0]?.value,
              provider: 'github',
              providerId: profile.id,
              isEmailVerified: true,
            });

            done(null, user);
          } catch (error) {
            done(error, null);
          }
        }
      )
    );
  }
};

export default passport;
