This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# 🎉 WishTune

Create personalized celebration songs for any special occasion using AI-powered music generation with Suno AI.

## Features

- 🎵 Generate custom songs with AI (Suno AI integration)
- 🎂 Multiple celebration types (birthdays, anniversaries, weddings, etc.)
- 🎸 Various music styles (pop, classical, jazz, rock, lullaby, disco)
- ▶️ Built-in audio player
- 📥 Download songs
- 🔗 Share songs with friends

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Suno AI API key (see [SUNO_AI_SETUP.md](./SUNO_AI_SETUP.md))

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up your environment variables:
   - Create a `.env.local` file in the root directory (for local development)
   - Add your API keys and configuration:
   
```env
# NextAuth Configuration
AUTH_SECRET=your_auth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Firebase Admin SDK
# Option 1: Use firebase-service-account.json file (Recommended)
# Place firebase-service-account.json in project root

# Option 2: Use environment variables
# FIREBASE_ADMIN_PROJECT_ID=your-project-id
# FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
# FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**Google OAuth Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
7. Copy the Client ID and Client Secret to your `.env.local` file

**Generate AUTH_SECRET:**
You can generate a secure random string for `AUTH_SECRET` using:
```bash
openssl rand -base64 32
```

For detailed Suno AI setup instructions, see [SUNO_AI_SETUP.md](./SUNO_AI_SETUP.md).

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
wishtune/
├── app/
│   ├── api/
│   │   └── create-song/    # Suno AI API integration
│   ├── components/
│   │   └── CelebrationGrid.tsx
│   ├── songs/              # Songs display page
│   ├── page.tsx            # Main form page
│   └── layout.tsx
├── public/
│   └── grid/               # Celebration photos
├── .env.local              # Environment variables (create this)
└── SUNO_AI_SETUP.md        # Detailed setup guide
```

## How It Works

1. **User Input**: Enter a name, select a celebration type, and choose a music style
2. **Song Generation**: The app sends a request to Suno AI to generate unique song variations
3. **Automatic Polling**: The app automatically checks every 5 seconds until songs are ready (30-60 seconds)
4. **Playback**: Listen to, download, and share your personalized celebration songs

**Works perfectly on localhost** - no ngrok or public URL required!

## API Integration

The app uses the Suno AI API to generate songs. The integration is handled server-side through Next.js API routes for security.

**Key files:**
- `/app/api/create-song/route.ts` - Server-side API handler for song creation
- `/app/api/check-song-status/route.ts` - Polling endpoint to check song status
- `/app/page.tsx` - Main form and song creation logic
- `/app/songs/page.tsx` - Song playback, polling, and management

For detailed API documentation, see [SUNO_AI_SETUP.md](./SUNO_AI_SETUP.md).
For polling implementation details, see [POLLING_IMPLEMENTATION.md](./POLLING_IMPLEMENTATION.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Docker Deployment

Deploy WishTune using Docker and Docker Compose for easy production deployment.

### Prerequisites

- Docker installed ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (usually included with Docker Desktop)
- Firebase project with Firestore enabled
- Google OAuth credentials configured

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# NextAuth Configuration
AUTH_SECRET=your-generated-auth-secret-here
NEXTAUTH_URL=https://wishtune.ai

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Firebase Admin SDK - Option 1: Use firebase-service-account.json file (Recommended)
# Leave these commented out if using the file
# FIREBASE_ADMIN_PROJECT_ID=
# FIREBASE_ADMIN_CLIENT_EMAIL=
# FIREBASE_ADMIN_PRIVATE_KEY=

# Firebase Admin SDK - Option 2: Use environment variables
# Uncomment and fill these if you prefer env vars over the file
# FIREBASE_ADMIN_PROJECT_ID=your-project-id
# FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
# FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Firebase Service Account Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → Project Settings → Service Accounts
3. Click "Generate new private key"
4. Save the downloaded JSON file as `firebase-service-account.json` in the project root

### Build and Run

**Development:**
```bash
# Build the Docker image
docker-compose build

# Start the container
docker-compose up

# Or run in detached mode
docker-compose up -d
```

**Production:**
```bash
# Build without cache (recommended for production)
docker-compose build --no-cache

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f
```

### Common Commands

```bash
# Stop the application
docker-compose down

# Restart the application
docker-compose restart

# Rebuild and restart
docker-compose up -d --build

# View logs
docker-compose logs -f wishtune

# Check container status
docker-compose ps

# Execute commands in container
docker-compose exec wishtune sh
```

### Production Deployment Checklist

- [ ] Firebase project created and Firestore enabled
- [ ] Firebase service account JSON file added to project root
- [ ] Google OAuth credentials created with correct redirect URIs
- [ ] `.env` file created with all required variables
- [ ] `NEXTAUTH_URL` set to production domain (e.g., `https://wishtune.ai`)
- [ ] OAuth redirect URI includes production domain: `https://wishtune.ai/api/auth/callback/google`
- [ ] Docker and Docker Compose installed
- [ ] Container builds successfully: `docker-compose build --no-cache`
- [ ] Application starts without errors: `docker-compose up -d`
- [ ] Application accessible at configured port (default: 3000)

### Troubleshooting

**Container won't start:**
```bash
# Check logs for errors
docker-compose logs wishtune

# Verify environment variables
docker-compose exec wishtune env | grep -E "FIREBASE|GOOGLE|AUTH"
```

**Firebase connection issues:**
- Verify `firebase-service-account.json` exists and has correct permissions
- Check Firebase service account has Firestore permissions
- Ensure environment variables match Firebase project

**Google OAuth not working:**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check OAuth redirect URI matches exactly: `https://yourdomain.com/api/auth/callback/google`
- Ensure `NEXTAUTH_URL` matches your production domain

**Seeing old content after deployment:**
```bash
# Force rebuild without cache
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
```

### Reverse Proxy Setup (Nginx)

If using Nginx as a reverse proxy, configure it to proxy requests to `http://localhost:3000`:

```nginx
server {
    listen 80;
    server_name wishtune.ai;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then set up SSL with Let's Encrypt:
```bash
sudo certbot --nginx -d wishtune.ai
```

## Deploy on Vercel

Alternatively, you can deploy your Next.js app using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
