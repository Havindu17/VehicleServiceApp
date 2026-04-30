import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import LandingScreen  from '../screens/auth/LandingScreen';
import LoginScreen    from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Garage Screens
import GarageDashboardScreen   from '../screens/garage/GarageDashboardScreen';
import GarageBookingScreen     from '../screens/garage/GarageBookingScreen';
import ServiceManagementScreen from '../screens/garage/ServiceManagementScreen';
import FinanceScreen           from '../screens/garage/FinanceScreen';
import GarageProfileScreen     from '../screens/garage/GarageProfileScreen';
import GarageFeedbackScreen    from '../screens/garage/GarageFeedbackScreen';
import CustomerDetailScreen    from '../screens/garage/CustomerDetailScreen';

// Customer Screens
import CustomerDashboardScreen from '../screens/customer/CustomerDashboardScreen';
import VehicleScreen           from '../screens/customer/VehicleScreen';
import CustomerBookingScreen   from '../screens/customer/CustomerBookingScreen';
import GarageDetailScreen      from '../screens/customer/GarageDetailScreen';
import ServiceHistoryScreen    from '../screens/customer/ServiceHistoryScreen';
import CustomerProfileScreen   from '../screens/customer/CustomerProfileScreen';
import CustomerFeedbackScreen  from '../screens/customer/CustomerFeedbackScreen';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a1628' }}>
      <ActivityIndicator size="large" color="#C9A84C" />
    </View>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing"  component={LandingScreen} />
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function GarageStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GarageDashboard"   component={GarageDashboardScreen} />
      <Stack.Screen name="GarageBooking"     component={GarageBookingScreen} />
      <Stack.Screen name="ServiceManagement" component={ServiceManagementScreen} />
      <Stack.Screen name="Finance"           component={FinanceScreen} />
      <Stack.Screen name="GarageProfile"     component={GarageProfileScreen} />
      <Stack.Screen name="GarageFeedback"    component={GarageFeedbackScreen} />
      <Stack.Screen name="CustomerDetail"    component={CustomerDetailScreen} />
    </Stack.Navigator>
  );
}

function CustomerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerDashboard" component={CustomerDashboardScreen} />
      <Stack.Screen name="Vehicle"           component={VehicleScreen} />
      <Stack.Screen name="CustomerBooking"   component={CustomerBookingScreen} />
      <Stack.Screen name="GarageDetail"      component={GarageDetailScreen} />
      <Stack.Screen name="ServiceHistory"    component={ServiceHistoryScreen} />
      <Stack.Screen name="CustomerProfile"   component={CustomerProfileScreen} />
      <Stack.Screen name="CustomerFeedback"  component={CustomerFeedbackScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { token, role, loading } = useAuth();

  // ✅ FIX 1: Wait while auth is loading
  if (loading) return <LoadingScreen />;

  // ✅ FIX 2: If token exists but role hasn't resolved yet, show loader
  // This prevents the navigator children error
  if (token && !role) return <LoadingScreen />;

  return (
    <NavigationContainer>
      {!token ? (
        <AuthStack />
      ) : role === 'garage' ? (
        <GarageStack />
      ) : role === 'customer' ? (
        <CustomerStack />
      ) : (
        // ✅ FIX 3: Unknown role fallback — never render empty/invalid stack
        <AuthStack />
      )}
    </NavigationContainer>
  );
}