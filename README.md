# MoodTrackerApp

Mobile mood tracking application built with Expo and React Native. The app helps users record morning and evening moods, log daily activities, review mood history, and inspect weekly mood trends through custom charts.

## Highlights

- Daily mood check-in flow for morning and evening entries
- Positive and negative activity logging
- Local history storage with AsyncStorage
- Weekly summary and custom SVG-based chart visualizations
- Daily local notification reminder at 17:00
- Android-ready Expo/EAS configuration

## Tech Stack

- Expo SDK 53
- React Native 0.79
- React 19
- TypeScript
- React Navigation
- Expo Notifications
- React Native SVG
- AsyncStorage

## Project Structure

```text
MoodTrackerApp/
├── App.tsx
├── app.json
├── eas.json
├── components/
├── context/
├── screens/
├── services/
├── src/
├── types/
└── utils/
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npm start
```

Run on Android:

```bash
npm run android
```

Run TypeScript validation:

```bash
npm run typecheck
```

## Build Notes

The project includes EAS build profiles in `eas.json`.

```bash
eas build --platform android --profile preview
eas build --platform android --profile production
```

Production submit uses `service-account.json`, which must be kept outside Git and supplied locally or through a secure CI secret.

## Portfolio Notes

This project demonstrates:

- React Native screen and navigation architecture
- Typed data models for user mood entries
- Local persistence with AsyncStorage
- Native notification permission and scheduling flow
- Data visualization with custom SVG components
- Expo Android release configuration
