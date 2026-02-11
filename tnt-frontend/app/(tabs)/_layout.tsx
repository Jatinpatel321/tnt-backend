import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform, StyleSheet } from 'react-native';
import OfflineBanner from '../../components/ui/OfflineBanner';
import { useAuthStore } from '../../store/authStore';
import { router } from 'expo-router';

// Premium tab bar design with rounded corners, soft shadow, and haptic feedback
// Design decisions:
// - Icon-only tabs: Reduces clutter, focuses on visual hierarchy
// - Rounded top corners: Modern iOS/Android friendly design
// - Soft shadow: Premium feel without being harsh
// - Active state background: Clear visual feedback for current tab
// - Platform-specific height: Respects iOS home indicator and Android navigation
export default function TabsLayout() {
  const { isAuthenticated, isBootstrapping, role } = useAuthStore();

  useEffect(() => {
    // Auth guard: Redirect to auth if not authenticated
    // This prevents unauthorized access to protected tabs
    if (!isBootstrapping && !isAuthenticated) {
      router.replace('/(auth)');
    }
  }, [isAuthenticated, isBootstrapping]);

  // Show nothing during bootstrap to prevent flicker
  if (isBootstrapping) {
    return null;
  }

  // If not authenticated, don't render tabs (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        // Hide labels for icon-only tabs (cleaner design)
        tabBarShowLabel: false,
        headerShown: false,
        // Premium styling
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          // Rounded top corners
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          // Soft elevation/shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
          // Height for premium feel
          height: Platform.OS === 'ios' ? 85 : 70,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
        },
        // Active tab indicator styling
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#666',
        // Smooth transitions
        tabBarActiveBackgroundColor: 'rgba(0, 123, 255, 0.1)',
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTabContainer : styles.tabContainer}>
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={focused ? size + 2 : size}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: 'Food',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTabContainer : styles.tabContainer}>
              <Ionicons
                name={focused ? "restaurant" : "restaurant-outline"}
                size={focused ? size + 2 : size}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="stationery"
        options={{
          title: 'Stationery',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTabContainer : styles.tabContainer}>
              <Ionicons
                name={focused ? "document-text" : "document-text-outline"}
                size={focused ? size + 2 : size}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTabContainer : styles.tabContainer}>
              <Ionicons
                name={focused ? "receipt" : "receipt-outline"}
                size={focused ? size + 2 : size}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTabContainer : styles.tabContainer}>
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={focused ? size + 2 : size}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeTabContainer : styles.tabContainer}>
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={focused ? size + 2 : size}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  activeTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
});
