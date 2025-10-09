import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toaster } from 'sonner-native';
import * as Updates from 'expo-updates';  // 👈 Added this

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

        // 2. Check for OTA updates 🚀
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
