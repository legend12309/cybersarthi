# CyberSaathi Project Report

## Overview
CyberSaathi is a mobile application developed in React Native (Expo) designed to educate and protect users against social engineering, digital fraud, and phishing attacks. Termed as the "Bharat ka Digital Suraksha Kavach", it brings AI-driven capabilities to the forefront of cyber-safety.

## Core Features
### 1. Voice AI Defense Simulator (`VoiceScreen.tsx`)
A conversational AI assistant powered by Sarvam AI that acts as a real-time defense trainer. It engages users in simulated voice interactions (e.g. simulated scam calls from fake electricity representatives) to help them identify psychological manipulation, fake urgency, and unsafe requests. It utilizes full STT (Speech-to-Text) and TTS (Text-to-Speech) capabilities.

### 2. Deep-Link & Screenshot Scanning (`HomeScreen.tsx`)
Users can submit suspicious URLs or upload screenshots of phishing SMS messages. The app queries the Sarvam AI endpoints and local heuristic engines to classify the fraud risk, extract the underlying scam patterns, and generate a detailed threat report for the user.

### 3. Scam Education & Quizzes (`ScamDetailScreen.tsx`, `QuizScreen.tsx`)
A comprehensive library of known scam methodologies. Users can read detailed breakdowns of how scams operate and test their knowledge in interactive quizzes. 

### 4. Gamified Learning (Badges) (`BadgesScreen.tsx`)
To incentivize learning, the app tracks user interactions (such as passing quizzes, completing AI simulator scenarios, or scanning links) via a Supabase backend and awards distinct visual badges (e.g., "Sim Hero", "Quiz Master", "Link Sentry").

## Technical Architecture
- **Frontend Framework**: React Native (Expo)
- **Styling**: Custom Dark Theme (`colors.ts`), optimized for readability and modern UI aesthetics. Uses `MaterialIcons` consistently across the app.
- **Backend & Database**: Supabase (PostgreSQL) for telemetry, analytics, and user badge progression tracking.
- **AI Integrations**: Sarvam AI API for multimodal capabilities:
  - Text-to-Speech (TTS)
  - Speech-to-Text (STT)
  - Large Language Model Inference for Chat and Classification
- **Localization**: Built-in multi-language support (English, Hindi) via `LanguageContext` using a scalable JSON key-value system.

## Final QA & Polish Highlights
- **UI/UX Transformation**: Entire app migrated to a modern dark theme (`#0B0F19` background, `#38BDF8` primary) with proper contrast adjustments.
- **Data Integrity**: Refactored backend tracking to correctly isolate real user fraud reports from AI Simulator analytics, ensuring badges are earned legitimately.
- **Performance**: Resolved `useEffect` race conditions in `SplashScreen.tsx` and infinite loading loops in `BadgesScreen.tsx`.
- **Accessibility**: Implemented dynamic text sanitization for the TTS engine to ensure numerical values (e.g. "₹3,240") and markdown text are pronounced naturally.

## Deployment
The app is configured for Expo Go and bare workflow builds. It relies on environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SARVAM_API_KEY`) for secure endpoint resolution.

---
**Status**: Production Ready. Code audited, compiled, and deployed to master.
