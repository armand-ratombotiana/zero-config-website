# ZeroConfig - Complete Implementation Guide

This guide explains the fully functional authentication system with OAuth (Google & GitHub) integration.

## 🏗️ Architecture Overview

### Backend API (`/api`)
- **Framework**: Node.js + Express
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: Passport.js with OAuth 2.0
- **Authorization**: JWT tokens
- **Security**: Helmet, CORS, bcrypt

### Frontend (`/website`)
- **Framework**: React + TypeScript + Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to API directory
cd api

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start MongoDB (using Docker)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Start API server
npm run dev
```

The API will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to website directory
cd website

# Dependencies are already installed
# Start development server
npm run dev
```

The website will run on `http://localhost:5173`

---

## 🔐 OAuth Setup Guide

### Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create/Select Project**
   - Click "Select a project" → "New Project"
   - Name it "ZeroConfig" and create

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "ZeroConfig Web Client"

5. **Configure Authorized Redirect URIs**
   ```
   http://localhost:5000/api/auth/google/callback
   ```

6. **Copy Credentials to .env**
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```

### GitHub OAuth Setup

1. **Go to GitHub Developer Settings**
   - Visit: https://github.com/settings/developers

2. **Create New OAuth App**
   - Click "New OAuth App"
   - Application name: "ZeroConfig"
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:5000/api/auth/github/callback`

3. **Generate Client Secret**
   - Click "Generate a new client secret"
   - Copy both Client ID and Client Secret

4. **Update .env**
   ```env
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

---

## 📡 API Endpoints

### Authentication Endpoints

#### Local Authentication
```bash
# Register
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}

# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepass123"
}

# Get Current User
GET /api/auth/me
Authorization: Bearer <token>

# Logout
POST /api/auth/logout
```

#### OAuth Authentication
```bash
# Google Login - Redirect user to:
GET /api/auth/google

# GitHub Login - Redirect user to:
GET /api/auth/github

# After OAuth, user is redirected back with token
```

### Environment Management

```bash
# Get all environments
GET /api/environments
Authorization: Bearer <token>

# Create environment
POST /api/environments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Dev Env",
  "stack": "node-postgres"
}

# Update environment
PUT /api/environments/:id
Authorization: Bearer <token>

# Delete environment
DELETE /api/environments/:id
Authorization: Bearer <token>
```

---

## 🗄️ Database Models

### User Model
```javascript
{
  email: String (unique, required),
  name: String (required),
  password: String (hashed, optional for OAuth),
  avatar: String,
  provider: String (local/google/github),
  providerId: String,
  plan: String (free/pro/enterprise),
  environments: [ObjectId],
  isEmailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Environment Model
```javascript
{
  name: String (required),
  stack: String (node-postgres/python-redis/etc),
  status: String (running/stopped/error/provisioning),
  owner: ObjectId (ref: User),
  services: [{
    name: String,
    type: String,
    port: Number,
    url: String,
    status: String
  }],
  configuration: Object,
  snapshot: Object,
  isPublic: Boolean,
  shareUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔒 Security Implementation

### Password Security
- Passwords hashed with bcrypt (12 rounds)
- Never stored in plain text
- Password field excluded from queries by default

### JWT Tokens
- 7-day expiration
- Stored in HTTP-only cookies
- Verified on every protected route

### OAuth Security
- State parameter for CSRF protection
- Secure callback URLs
- User data validation

### Additional Security
- Helmet.js for HTTP headers
- CORS with credentials support
- Input validation
- Rate limiting (recommended for production)

---

## 🎯 User Plans & Limits

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Environments | 3 max | Unlimited | Unlimited |
| Team Workspaces | ❌ | ✅ | ✅ |
| Encrypted Snapshots | ❌ | ✅ | ✅ |
| Cloud Storage | 0 GB | 50 GB | Custom |
| Support | Community | Email | 24/7 + SLA |
| SSO/SCIM | ❌ | ❌ | ✅ |
| On-Prem | ❌ | ❌ | ✅ |

---

## 🧪 Testing the Implementation

### Test Local Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123456"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

### Test OAuth (Browser)
1. Open browser to `http://localhost:5000/api/auth/google`
2. Complete Google authentication
3. You'll be redirected back with a JWT token

### Test Protected Route
```bash
# Use token from login response
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## 🔧 Environment Variables Reference

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/zeroconfig

# Security
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret

# Google OAuth
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=<from-github>
GITHUB_CLIENT_SECRET=<from-github>
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

---

## 📦 Next Steps for Production

### Backend
1. **Set up production database** (MongoDB Atlas recommended)
2. **Update OAuth callback URLs** to production domain
3. **Enable rate limiting** (express-rate-limit)
4. **Add email verification** for local accounts
5. **Implement password reset** functionality
6. **Add API documentation** (Swagger/OpenAPI)
7. **Set up logging** (Winston/Bunyan)
8. **Configure monitoring** (PM2, New Relic, etc.)

### Frontend
1. **Build and deploy** (`npm run build`)
2. **Set up environment variables** for production API URL
3. **Configure CDN** for static assets
4. **Implement error tracking** (Sentry)
5. **Add analytics** (Google Analytics, Plausible)
6. **Set up CI/CD pipeline**

### Security
1. **Enable HTTPS** (Let's Encrypt)
2. **Set up WAF** (Web Application Firewall)
3. **Implement rate limiting**
4. **Regular security audits**
5. **Dependency scanning** (npm audit, Snyk)

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running: `docker ps`
- Check connection string in `.env`
- Try: `docker restart mongodb`

### "OAuth callback error"
- Verify callback URLs match exactly in OAuth app settings
- Check client IDs and secrets in `.env`
- Ensure APIs are enabled (Google+ API for Google)

### "JWT token invalid"
- Check JWT_SECRET is set in `.env`
- Verify token is being sent in Authorization header
- Try logging in again to get fresh token

### "CORS error"
- Update CLIENT_URL in backend `.env`
- Check CORS configuration in `api/src/index.js`
- Ensure credentials: true is set

---

## 📚 Additional Resources

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 📝 License

MIT License - See LICENSE file for details

---

**Need Help?** Open an issue on GitHub or contact support@zeroconfig.dev
