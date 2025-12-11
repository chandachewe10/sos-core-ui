import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toaster } from 'sonner-native';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pusherService } from './services/PusherService';

// Screens
import WelcomeScreen from './screens/WelcomeScreen';
import UserPhoneScreen from './screens/UserPhoneScreen';
import UserOtpScreen from './screens/UserOtpScreen';
import TrackingPreferencesScreen from './screens/TrackingPreferencesScreen';
import UserMapScreen from './screens/UserMapScreen';
import StaffRegisterScreen from './screens/StaffRegisterScreen';
import StaffTermsScreen from './screens/StaffTermsScreen';
import StaffSignatureScreen from './screens/StaffSignatureScreen';
import StaffPendingScreen from './screens/StaffPendingScreen';
import StaffLoginScreen from './screens/StaffLoginScreen';
import StaffDashboardScreen from './screens/StaffDashboardScreen';
import AdminApproveScreen from './screens/AdminApproveScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import StaffProfileScreen from './screens/StaffProfileScreen';
import MyCasesScreen from './screens/MyCasesScreen';
import IncidentReportScreen from './screens/IncidentReportScreen';
import SOSAlertsScreen from './screens/SOSAlertsScreen';
import ResourcesScreen from './screens/ResourcesScreen';
import { AuthProvider } from './hooks/useAuth';
import { api } from './lib/api';

const Stack = createNativeStackNavigator();

// TODO: Replace this with your real backend URL or wire via environment variables.
const API_BASE_URL = 'https://api.yourdomain.com';

export default function App(): JSX.Element {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function prepareApp() {
      try {
        // 1. Configure API
        api.setBaseUrl(API_BASE_URL);
        await api.loadTokenFromStorage();

        // 2. Initialize Pusher for staff if credentials exist (works even without login)
        await initializePusherForStaff();

        // 3. Check for OTA updates 🚀
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync(); // restarts app with new code
        }
      } catch (err) {
        console.warn('Startup error:', err);
      } finally {
        setInitializing(false);
      }
    }

    prepareApp();

    // Cleanup on unmount
    return () => {
      pusherService.disconnect();
    };
  }, []);

  // Function to initialize Pusher if staff data exists
  async function initializePusherForStaff() {
    try {
      // Check if staff token and user data exist
      const staffToken = await AsyncStorage.getItem('staffToken');
      const staffUserData = await AsyncStorage.getItem('staffUser');

      if (staffToken && staffUserData) {
        const staffUser = JSON.parse(staffUserData);
        const staffId = staffUser.id || staffUser.staff_id || staffUser.user_id;

        if (staffId) {
          console.log('🔌 Auto-initializing Pusher for staff user ID:', staffId);
          console.log('📱 Staff is logged in - Siren will work in background');
          // Use user.id (not staff.id) - this is the User model ID that Laravel uses
          await pusherService.initPusher(staffId.toString());
        } else {
          console.warn('⚠️ Staff User ID not found in staff user data');
        }
      } else {
        console.log('ℹ️ No staff credentials found - Pusher not initialized');
      }
    } catch (error: any) {
      console.error('❌ Error auto-initializing Pusher:', error);
    }
  }

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
              <Stack.Screen name="TrackingPreferences" component={TrackingPreferencesScreen} />
              <Stack.Screen name="UserMap" component={UserMapScreen} />

              {/* Staff flow */}
              <Stack.Screen name="StaffRegister" component={StaffRegisterScreen} />
              <Stack.Screen name="StaffTerms" component={StaffTermsScreen} />
              <Stack.Screen name="StaffSignature" component={StaffSignatureScreen} />
              <Stack.Screen name="StaffPending" component={StaffPendingScreen} />
 <Stack.Screen 
    name="StaffLogin" 
    component={StaffLoginScreen}
    options={{ 
      headerShown: true,
      title: 'Home',
      headerBackTitle: 'Back' // For iOS
    }}
  />
              <Stack.Screen name="StaffDashboard" component={StaffDashboardScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="StaffProfile" component={StaffProfileScreen} />
              <Stack.Screen name="MyCases" component={MyCasesScreen} />
              <Stack.Screen name="IncidentReports" component={IncidentReportScreen} />
              <Stack.Screen name="SOSAlerts" component={SOSAlertsScreen} />
              <Stack.Screen name="Resources" component={ResourcesScreen} />
              



              {/* Admin */}
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
