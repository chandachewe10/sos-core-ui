import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

class LocationService {
  constructor() {
    this.locationUpdateInterval = null;
    this.isUpdatingLocation = false;
    this.isRunning = false;
    this.backgroundUpdateCount = 0;
    this.maxBackgroundUpdates = 10; // Limit background updates to save battery
    this.appStateSubscription = null;
  }

  // Start periodic location updates with background support
  async startLocationUpdates() {
    console.log('📍 Starting location updates (background supported)');
    
    if (this.isRunning) {
      console.log('📍 Location updates already running');
      return;
    }
    
    // Request background location permissions
    const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus.status !== 'granted') {
      console.log('📍 Background location permission denied');
      // Continue with foreground-only as fallback
    } else {
      console.log('✅ Background location permission granted');
    }

    this.isRunning = true;
    this.backgroundUpdateCount = 0;
    
    // Stop any existing updates
    this.stopLocationUpdates();
    
    // Setup app state listener for background/foreground transitions
    this.setupAppStateListener();
    
    // Update immediately
    await this.updateStaffLocation();
    
    // Start the interval
    this.startUpdateInterval();
    
    console.log('📍 Location updates started successfully');
  }

  // Setup app state listener to handle background/foreground
  setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('📱 App state changed:', nextAppState);
      
      if (nextAppState === 'background') {
        console.log('📱 App went to background - adjusting location updates');
        this.adjustUpdatesForBackground();
      } else if (nextAppState === 'active') {
        console.log('📱 App came to foreground - restoring normal updates');
        this.adjustUpdatesForForeground();
      }
    });
  }

  // Adjust for background - less frequent updates to save battery
  adjustUpdatesForBackground() {
    this.stopLocationUpdates();
    
    // Slower updates in background (every 2 minutes)
    this.locationUpdateInterval = setInterval(async () => {
      if (this.backgroundUpdateCount < this.maxBackgroundUpdates) {
        await this.updateStaffLocation();
        this.backgroundUpdateCount++;
      } else {
        console.log('📍 Reached background update limit, pausing...');
        this.stopLocationUpdates();
      }
    }, 120000); // 2 minutes in background
  }

  // Adjust for foreground - more frequent updates
  adjustUpdatesForForeground() {
    this.stopLocationUpdates();
    this.backgroundUpdateCount = 0; // Reset counter
    
    // Faster updates in foreground (every 30 seconds)
    this.startUpdateInterval();
  }

  // Start the main update interval
  startUpdateInterval() {
    this.locationUpdateInterval = setInterval(async () => {
      await this.updateStaffLocation();
    }, 30000); // 30 seconds in foreground
  }

  // Stop location updates
  stopLocationUpdates() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    this.isRunning = false;
    this.backgroundUpdateCount = 0;
    console.log('📍 Stopped location updates');
  }

  // Enhanced location update method with background support
  async updateStaffLocation() {
    if (this.isUpdatingLocation) {
      console.log('📍 Location update already in progress, skipping...');
      return;
    }

    this.isUpdatingLocation = true;
    
    try {
      // Get staff data from storage
      const token = await AsyncStorage.getItem('staffToken');
      const userData = await AsyncStorage.getItem('staffUser');
      
      if (!token) {
        console.log('📍 No staff token found - user may be logged out');
        return;
      }

      if (!userData) {
        console.log('📍 No staff user data found');
        return;
      }

      const user = JSON.parse(userData);
      const staffId = user.id;
      const email = user.email;

      // Check location permissions (use foreground as fallback)
      let locationStatus = await Location.getBackgroundPermissionsAsync();
      if (locationStatus.status !== 'granted') {
        locationStatus = await Location.getForegroundPermissionsAsync();
      }

      if (locationStatus.status !== 'granted') {
        console.log('📍 Location permission denied');
        return;
      }

      // Get current location with appropriate accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeout: 15000, // Longer timeout for background
      });
      
      const { latitude, longitude } = location.coords;
      
      const appState = AppState.currentState;
      console.log('📍 Updating staff location:', { 
        email,
        latitude, 
        longitude, 
        staffId,
        appState,
        backgroundUpdate: this.backgroundUpdateCount
      });

      // Send to backend
      const formData = new FormData();
      formData.append('email', email);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());

      const response = await fetch('https://sos.macroit.org/api/update-location', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        console.log('✅ Location updated successfully');
      } else {
        const errorData = await response.text();
        console.error('❌ Location update failed:', errorData);
      }
    } catch (error) {
      console.error('📍 Location update error:', error);
    } finally {
      this.isUpdatingLocation = false;
    }
  }

  // Check if location updates are running
  isLocationUpdatesRunning() {
    return this.isRunning;
  }

  // Manual one-time location update
  async updateLocationOnce() {
    console.log('📍 Manual location update requested');
    await this.updateStaffLocation();
  }

  // Get current status
  getStatus() {
    return {
      isRunning: this.isRunning,
      isUpdating: this.isUpdatingLocation,
      hasInterval: !!this.locationUpdateInterval,
      backgroundUpdateCount: this.backgroundUpdateCount,
      appState: AppState.currentState
    };
  }
}

export default new LocationService();