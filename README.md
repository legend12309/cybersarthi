<div align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</div>

<h1 align="center">🛡️ CyberSaathi</h1>

<p align="center">
  <strong>A Voice-First AI Defense Platform Against Cyber Fraud in India</strong>
</p>

<p align="center">
  CyberSaathi is an advanced, accessible mobile application designed to protect, educate, and empower vulnerable populations against the rising tide of digital scams. Built with Expo (React Native) and powered by <b>Sarvam AI</b> and <b>Supabase</b>.
</p>

---

## ✨ Features

- **🎙️ AI Voice Companion (Sarvam AI)**  
  A completely voice-driven interface utilizing advanced STT (Speech-to-Text) and TTS (Text-to-Speech) pipelines. It enables low-literacy users to report scams, ask questions, and interact naturally in regional Indian languages.
- **🕵️ AI Roleplay Simulator**  
  A "Red Team" training simulator where users practice identifying and defending against real-time social engineering attacks (e.g., Electricity Disconnection threats, Digital Arrests).
- **🔗 Intelligent Link Scanner**  
  Instantly verifies suspicious URLs and SMS links against known phishing databases and advanced AI heuristics to protect users from malicious attacks.
- **🏆 Gamified Learning (Badges & Quizzes)**  
  Engaging cybersecurity quizzes and a real-time gamified badge system to incentivize continued education.
- **🚨 Unified Fraud Reporting**  
  A streamlined mechanism for users to seamlessly log financial fraud and cybercrime incidents directly to a secure Supabase backend.

## 🏗️ Technical Architecture

CyberSaathi leverages a modern, highly scalable mobile tech stack:

- **Frontend Environment**: Expo Managed Workflow, React Native
- **Language**: TypeScript for end-to-end type safety
- **State Management & Caching**: AsyncStorage for rapid local data retrieval
- **Backend & Database**: Supabase (PostgreSQL) for real-time data syncing, user tracking, and secure fraud reporting
- **AI Integration**: Custom implementation of Sarvam AI’s Audio APIs for seamless, low-latency conversational intelligence
- **Routing**: Expo Router (File-based routing)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Supabase account (for database setup)
- Sarvam AI API Key (for Voice capabilities)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/legend12309/cybersarthi.git
   cd cybersarthi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy the `.env.example` file to `.env` and populate it with your specific API credentials:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_SARVAM_API_KEY=your_sarvam_api_key
   ```

4. **Database Migration**
   Execute the SQL setup scripts (`supabase_setup.sql` or `supabase_migrations.md`) in your Supabase SQL Editor to generate the necessary tables (e.g., `scam_reports`, `link_scans`, `users`).

5. **Run the Application**
   ```bash
   npx expo start
   ```
   *Use the Expo Go app on iOS/Android to scan the generated QR code and test on a physical device.*

## 🔒 Security & Scope Constraints
- **Authentication**: For frictionless hackathon testing, the app utilizes unique Device IDs for session management rather than enforced Email/OTP Auth. Row Level Security (RLS) is currently configured for broad accessibility to streamline QA testing.
- **AI Latency**: The Sarvam AI voice pipeline requires a stable internet connection; extreme network latency may cause occasional audio timeouts.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/legend12309/cybersarthi/issues).

---
<p align="center">Made with ❤️ for a safer Digital India</p>
