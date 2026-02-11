import { Slot } from 'expo-router';
import { View, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../store/AuthContext';

const RootWrapper = Platform.OS === 'web'
  ? View
  : GestureHandlerRootView;

export default function RootLayout() {
  return (
    <RootWrapper style={{ flex: 1 }}>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </RootWrapper>
  );
}
