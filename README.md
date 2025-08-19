# HabitTracker Mobile

A React Native mobile application for habit tracking, built with Expo and TypeScript. This is the mobile companion to the [HabitTracker web application](https://github.com/dkoh12/HabitTracker).

## Features

- 📱 Cross-platform (iOS & Android)
- 🔐 User authentication
- ➕ Create and manage habits
- ✅ Mark habits as complete/incomplete
- 📊 Track progress (coming soon)
- 🎨 Customizable habit colors
- 📱 Native mobile experience

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State Management**: React Query (TanStack Query)
- **Authentication**: Custom auth with secure storage
- **Icons**: Lucide React Native
- **Backend**: Connects to existing HabitTracker web API

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio & Android Emulator (for Android development)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-mobile-repo-url>
   cd HabitTracker-Mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Update `.env.local` with your API URL (should point to your HabitTracker web app API).

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - For iOS: Press `i` in the terminal or scan QR code with Expo Go app
   - For Android: Press `a` in the terminal or scan QR code with Expo Go app
   - For web preview: Press `w` in the terminal

## Project Structure

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks (auth, etc.)
├── navigation/         # Navigation configuration
├── screens/            # Screen components
├── services/           # API services
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## API Integration

The mobile app connects to your existing HabitTracker web application's API. Make sure to:

1. Update the `EXPO_PUBLIC_API_URL` in your `.env.local` file
2. Ensure your web API supports the endpoints used by the mobile app
3. Configure CORS on your web API to allow requests from the mobile app

## Development

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS
- `npm run web` - Start web version

### Key Files

- `App.tsx` - Main app component with providers
- `src/navigation/AppNavigator.tsx` - Navigation structure
- `src/hooks/useAuth.tsx` - Authentication context and logic
- `src/services/` - API service functions

## Features Roadmap

- [x] User authentication
- [x] Basic habit CRUD operations
- [x] Habit completion tracking
- [ ] Detailed analytics and charts
- [ ] Push notifications for reminders
- [ ] Offline support
- [ ] Dark mode
- [ ] Habit streaks and badges
- [ ] Social features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both iOS and Android
5. Submit a pull request

## Related Projects

- [HabitTracker Web App](https://github.com/dkoh12/HabitTracker) - The main web application

## License

This project is licensed under the MIT License.
