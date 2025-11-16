# ZeroConfig API

Backend API for ZeroConfig with OAuth authentication (Google, GitHub) and environment management.

## 🚀 Features

- ✅ User authentication (Local + OAuth)
- 🔐 Google OAuth integration
- 🔐 GitHub OAuth integration
- 🔒 JWT-based authorization
- 📦 Environment management (CRUD)
- 🎯 Role-based access control (Free/Pro/Enterprise)
- 🗄️ MongoDB database
- 🛡️ Security best practices

## 📦 Installation

```bash
cd api
npm install
```

## ⚙️ Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the following environment variables:

### Required
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `SESSION_SECRET` - Secret key for sessions

### OAuth (Google)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Set authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Update `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### OAuth (GitHub)
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
4. Update `.env`:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`

## 🗄️ Database Setup

### Local MongoDB
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

## 🚀 Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The API will be available at `http://localhost:5000`

## 📡 API Endpoints

### Authentication

#### Local Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

#### OAuth
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google callback
- `GET /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/github/callback` - GitHub callback

### Environments (Protected)
- `GET /api/environments` - Get all user environments
- `POST /api/environments` - Create new environment
- `GET /api/environments/:id` - Get single environment
- `PUT /api/environments/:id` - Update environment
- `DELETE /api/environments/:id` - Delete environment

### Health Check
- `GET /health` - API health status

## 📝 Request Examples

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Create Environment
```bash
curl -X POST http://localhost:5000/api/environments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "My Dev Environment",
    "stack": "node-postgres"
  }'
```

## 🔒 Authentication Flow

### Local Authentication
1. User registers/logs in with email & password
2. Server generates JWT token
3. Token is sent in response and stored in httpOnly cookie
4. Client includes token in Authorization header for protected routes

### OAuth Authentication
1. User clicks "Sign in with Google/GitHub"
2. Client redirects to `/api/auth/google` or `/api/auth/github`
3. User authenticates with provider
4. Provider redirects back to callback URL
5. Server creates/updates user and generates JWT
6. User is redirected to client with token

## 🎯 User Roles & Limits

### Free Plan
- 3 active environments max
- Basic features

### Pro Plan
- Unlimited environments
- Team workspaces
- Encrypted snapshots
- Priority support

### Enterprise Plan
- Everything in Pro
- On-prem hosting
- SSO/SCIM
- SLA support

## 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- HTTP-only cookies
- CORS protection
- Helmet.js security headers
- Input validation
- Rate limiting (recommended for production)

## 📚 Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Passport.js (OAuth)
- JWT (jsonwebtoken)
- bcryptjs (password hashing)

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify network access in MongoDB Atlas

### OAuth Not Working
- Verify callback URLs match exactly
- Check client IDs and secrets
- Ensure OAuth apps are enabled

### CORS Errors
- Update `CLIENT_URL` in `.env`
- Check CORS configuration in `src/index.js`

## 📄 License

MIT
