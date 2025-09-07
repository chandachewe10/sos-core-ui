import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toaster } from 'sonner-native';

// Screens
import WelcomeScreen from './screens/WelcomeScreen';
import UserPhoneScreen from './screens/UserPhoneScreen';
import UserOtpScreen from './screens/UserOtpScreen';
import UserMapScreen from './screens/UserMapScreen';
import StaffRegisterScreen from './screens/StaffRegisterScreen';
import StaffTermsScreen from './screens/StaffTermsScreen';
import StaffSignatureScreen from './screens/StaffSignatureScreen';
import StaffPendingScreen from './screens/StaffPendingScreen';
import StaffLoginScreen from './screens/StaffLoginScreen';
import StaffDashboardScreen from './screens/StaffDashboardScreen';
import AdminApproveScreen from './screens/AdminApproveScreen';

import { AuthProvider } from './hooks/useAuth';
import { api } from './lib/api';

const Stack = createNativeStackNavigator();

// TODO: Replace this with your real backend URL or wire via environment variables.
const API_BASE_URL = 'https://api.yourdomain.com';

export default function App(): JSX.Element {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Initialize API client base URL and restore token from storage
    api.setBaseUrl(API_BASE_URL);
    (async () => {
      try {
        await api.loadTokenFromStorage();
      } catch (err) {
        console.warn('Failed to load token', err);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  if (initializing) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider style={styles.container}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0f766e" />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  const MaybeToaster: any = (Toaster as any) ?? null;
  const isComponentType = (c: any) =>
    !!c && (typeof c === 'function' || typeof c === 'object');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider style={styles.container}>
        <StatusBar barStyle="light-content" />
         
       
        <AuthProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Welcome"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="Welcome" component={WelcomeScreen} />

              {/* User flow */}
              <Stack.Screen name="UserPhone" component={UserPhoneScreen} />
              <Stack.Screen name="UserOtp" component={UserOtpScreen} />
              <Stack.Screen name="UserMap" component={UserMapScreen} />

              {/* Staff flow */}
              <Stack.Screen name="StaffRegister" component={StaffRegisterScreen} />
              <Stack.Screen name="StaffTerms" component={StaffTermsScreen} />
              <Stack.Screen name="StaffSignature" component={StaffSignatureScreen} />
              <Stack.Screen name="StaffPending" component={StaffPendingScreen} />
              <Stack.Screen name="StaffLogin" component={StaffLoginScreen} />
              <Stack.Screen name="StaffDashboard" component={StaffDashboardScreen} />

              {/* Admin / dev helper */}
              <Stack.Screen name="AdminApprove" component={AdminApproveScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
          {isComponentType(MaybeToaster) ? <MaybeToaster /> : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
