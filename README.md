# 🛡️ CyberSaathi

> **Empowering India's Next Billion Users to Defend Against Cyber Fraud**

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**CyberSaathi** is a voice-first, multilingual mobile application built to tackle the rising epidemic of digital fraud in India. Traditional cybersecurity apps rely on heavy text and technical jargon, rendering them useless for users with lower digital literacy. CyberSaathi bridges this gap by leveraging advanced **Voice AI** to provide an accessible, conversational, and gamified defense mechanism against modern scams.

---

## ✨ Key Features

### 🎙️ Multilingual AI Voice Assistant
Powered by the **Sarvam AI** voice pipeline, users can simply tap a microphone and describe a suspicious situation in their native language (Hindi, Marathi, Bengali, Tamil, Telugu, or English). The AI converts speech to text, analyzes the fraud risk in real-time, and replies with a localized synthesized voice warning.

### 🔍 Advanced Link & Content Scanner
Before clicking on unfamiliar SMS or WhatsApp links, users can scan them through CyberSaathi. The app cross-references the URL with the **Google Safe Browsing API** and uses heuristic AI analysis to catch zero-day phishing structures, fake domains, and traditional SMS spoofing.

### 🎭 Live AI Scam Simulator (Roleplay)
A cutting-edge feature that lets users practice defending themselves. The app acts as an aggressive scammer (e.g., threatening electricity disconnection). Users negotiate via text or voice, and if they identify the scam, the simulator ends and provides a detailed **Cybersecurity Analysis Report** on their performance and missed red flags.

### 🏆 Gamified Learning & Badges
Education through gamification. Users take daily quizzes on modern scam vectors (Digital Arrests, OTP fraud, Task Scams) and earn badges (e.g., *Quiz Master*, *Vigilant Citizen*) which are securely tracked and stored in the cloud.

### 📊 Community Fraud Reporting
Users can report scam phone numbers, amounts lost, and fraud types directly to a centralized **Supabase PostgreSQL** database, helping map emerging threat patterns across regions.

---

## 🏗️ Architecture & Tech Stack

* **Framework:** React Native / Expo (Managed Workflow)
* **Language:** TypeScript
* **State Management & Caching:** React Hooks, AsyncStorage
* **Backend as a Service:** Supabase (PostgreSQL, Real-time DB)
* **AI Engine:** Sarvam AI (Custom STT → LLM Classifiers → TTS pipeline)
* **Threat Intelligence:** Google Safe Browsing API
* **UI/UX:** Custom Dark Theme, Reanimated for fluid micro-animations, Vector Icons

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/en/) (v18 or higher)
* [Expo CLI](https://docs.expo.dev/get-started/installation/)
* An Expo Go app installed on your physical device (Android/iOS)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/legend12309/cybersarthi.git
   cd cybersarthi
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the root directory and add the following keys:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_SARVAM_API_KEY=your_sarvam_api_key
   EXPO_PUBLIC_SAFE_BROWSING_API_KEY=your_google_safe_browsing_key
   ```

4. **Database Setup:**
   Copy the contents of `supabase_setup.sql` into your Supabase SQL Editor and run it to instantly provision the required tables, columns, and Row Level Security (RLS) policies.

5. **Run the Development Server:**
   ```bash
   npx expo start -c
   ```
   Scan the generated QR code using the Expo Go app on your mobile device to launch CyberSaathi.

---

## 🔒 Security & Privacy

* **No User Login Required:** The app utilizes hardware/device-level UUIDs to track user progress anonymously, ensuring maximum privacy for victims of fraud who wish to remain anonymous.
* **Granular RLS Policies:** Backend Supabase tables are secured using Row Level Security to prevent unauthorized access to community fraud reports.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/legend12309/cybersarthi/issues). 

## 📜 License
This project is licensed under the MIT License.
