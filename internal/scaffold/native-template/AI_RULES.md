Use Expo, React Native, NativeWind, and Expo Router. Put routes in src/app and reusable components outside it. Keep expo-router/entry, src/app/_layout.tsx, Metro, and the global.css import connected. Use Font Awesome icons from @expo/vector-icons/FontAwesome6. Import Button, Card, and Text from @/components/ui when they suit the screen.

Design each screen around one task with a primary action visible in a 390×844 phone viewport. Split unrelated content across routes. Use Flexbox, actual safe-area insets, and accessible touch targets on both platforms. Prefer real stack navigation, tabs for stable top-level destinations, and clear task feedback. Keep the React Native Web preview functional. Replace the example Home and Details routes with screens derived from the approved blueprint.

The source of Button, Card, and Text is the NativeWind registry of React Native Reusables (MIT). See LICENSE-react-native-reusables.
