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
   - Create a `.env.local` file in the root directory
   - Add your API keys and configuration:
   
```env
# Suno AI Configuration
SUNO_API_KEY=your_suno_api_key_here
SUNO_API_BASE_URL=https://api.sunoapi.org/api/v1

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
AUTH_SECRET=your_auth_secret_here
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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
