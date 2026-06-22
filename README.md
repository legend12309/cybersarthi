# CyberSaathi

CyberSaathi is a voice-first mobile app built with Expo (React Native) that teaches Indian users to identify and avoid cyber scams in their regional language. It uses the Sarvam AI voice pipeline (STT → Chat → TTS) to provide an accessible, conversational interface for low-literacy users.

## Features
- Voice Chat (Sarvam AI)
- AI Link Scanner
- Fraud Reporting
- Scam Simulator (Interactive Scenarios)
- Quiz and Badges (Gamification)

## Tech Stack
- **Frontend**: Expo (React Native), TypeScript
- **Backend/Database**: Supabase (PostgreSQL)
- **AI/Voice**: Sarvam AI API
- **Storage**: AsyncStorage for local caching

## Setup and Run Locally
1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in your Supabase and Sarvam API keys.
4. Set up Supabase by running the SQL migrations in `supabase_schema.sql` and `supabase_migrations.md` in your Supabase SQL editor.
5. Run `npx expo start` to launch the app on your device or emulator.

## Known Limitations
- RLS policies on Supabase tables might be unrestricted (`USING (true)`) as a hackathon-scope limitation to speed up development without complex Auth.
- Sarvam AI endpoints may occasionally timeout on slow networks.
