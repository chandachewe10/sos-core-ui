import Pusher from 'pusher-js';
import { Alert, Linking, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

class PusherService {
  constructor() {
    this.pusher = null;
    this.channel = null;
    this.soundInterval = null;
    this.staffId = null;
    this.isInitialized = false;
    this.appStateSubscription = null;
    this.emergencySound = null;
  }

  async initPusher(staffId) {
    try {
      // Prevent duplicate initialization
      if (this.isInitialized && this.pusher?.connection?.state === 'connected') {
        console.log('⚠️ Pusher already initialized and connected');
        return;
      }

      this.staffId = staffId;

      // Enable detailed logging
      Pusher.logToConsole = true;

      // Get staff token for authentication
      const staffToken = await AsyncStorage.getItem('staffToken');
      
      console.log('🔄 Initializing Pusher for staff:', staffId);
      console.log('📱 Staff token available:', !!staffToken);

      // Disconnect old connection if exists
      if (this.pusher) {
        console.log('🔄 Cleaning up old connection...');
        this.pusher.disconnect();
      }

      this.pusher = new Pusher('2369b5ec2e1cc7dd5040', {
        cluster: 'mt1',
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        disabledTransports: [],
        activityTimeout: 120000, // 2 minutes
        pongTimeout: 30000, // 30 seconds
      });

      // Use PUBLIC channel for testing (no auth needed)
      const channelName = `public-emergency-${staffId}`;
      console.log('📡 Subscribing to channel:', channelName);

      this.channel = this.pusher.subscribe(channelName);

      this.channel.bind('pusher:subscription_succeeded', () => {
        console.log('✅ SUCCESS: Subscribed to public channel:', channelName);
        this.isInitialized = true;
      });

      this.channel.bind('pusher:subscription_error', (error) => {
        console.error('❌ Subscription error:', error);
      });

      // Listen to emergency-alert event (without dot based on Pusher logs)
      this.channel.bind('emergency-alert', (data) => {
        console.log('🚨 EMERGENCY ALERT RECEIVED:', data);
        this.handleEmergencyAlert(data);
      });

      // Also try with dot prefix (Laravel sometimes adds it)
      this.channel.bind('.emergency-alert', (data) => {
        console.log('🚨 EMERGENCY ALERT RECEIVED (with dot):', data);
        this.handleEmergencyAlert(data);
      });

      // DEBUG: Listen to ALL events on this channel
      this.channel.bind_global((eventName, data) => {
        console.log('🔔 ANY EVENT RECEIVED:', {
          eventName,
          data,
          channelName: this.channel.name,
          timestamp: new Date().toISOString()
        });
      });

      this.pusher.connection.bind('connected', () => {
        console.log('✅ PUSHER CONNECTED! Socket ID:', this.pusher.connection.socket_id);
        console.log('⏰ Connected at:', new Date().toLocaleTimeString());
        this.isInitialized = true;
      });

      this.pusher.connection.bind('disconnected', () => {
        console.log('🔌 Pusher disconnected at:', new Date().toLocaleTimeString());
        this.isInitialized = false;
        
        // Auto-reconnect after 3 seconds
        console.log('🔄 Will attempt reconnect in 3 seconds...');
        setTimeout(() => {
          if (this.staffId && !this.isInitialized) {
            console.log('🔄 Auto-reconnecting...');
            this.initPusher(this.staffId);
          }
        }, 3000);
      });

      this.pusher.connection.bind('error', (error) => {
        console.error('❌ Pusher connection error:', error);
      });

      this.pusher.connection.bind('state_change', (states) => {
        console.log('🔄 Connection state change:', states.previous, '→', states.current);
        
        if (states.current === 'unavailable') {
          console.log('⚠️ Connection unavailable, will retry...');
        }
      });

      // Handle app state changes (background/foreground)
      this.setupAppStateListener();

    } catch (error) {
      console.error('❌ Pusher init error:', error);
    }
  }

  setupAppStateListener() {
    // Clean up old listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('📱 App state changed to:', nextAppState);
      
      if (nextAppState === 'active' && this.staffId) {
        // App came to foreground - ensure connected
        if (!this.isInitialized || this.pusher?.connection?.state !== 'connected') {
          console.log('🔄 App foregrounded, reconnecting Pusher...');
          this.initPusher(this.staffId);
        }
      }
    });
  }

  async handleEmergencyAlert(emergencyData) {
    console.log('🚨 EMERGENCY ALERT TRIGGERED:', emergencyData);
    console.log('⏰ Alert received at:', new Date().toLocaleTimeString());
    
    try {
      // Start continuous emergency alarm sound only
      this.startEmergencyAlarm();

      Alert.alert(
        '🚨 EMERGENCY ALERT 🚨',
        `A person needs immediate assistance!\n\n` +
        `📱 Victim Phone: ${emergencyData.victim_phone}\n` +
        `📍 Distance: ${emergencyData.distance_km} km`,
        [
          {
            text: 'Navigate to Location',
            onPress: () => {
              this.stopAllAlerts();
              const url = `https://maps.google.com/?q=${emergencyData.latitude},${emergencyData.longitude}`;
              Linking.openURL(url);
            }
          },
          {
            text: 'Call Victim',
            onPress: () => {
              this.stopAllAlerts();
              Linking.openURL(`tel:${emergencyData.victim_phone}`);
            }
          },
          {
            text: 'Stop Alarm',
            onPress: () => this.stopAllAlerts(),
            style: 'cancel'
          }
        ],
        { 
          cancelable: false,
          onDismiss: () => this.stopAllAlerts()
        }
      );

      // Auto-stop after 2 minutes
      setTimeout(() => this.stopAllAlerts(), 120000);

    } catch (error) {
      console.error('❌ Error handling emergency alert:', error);
    }
  }

  async startEmergencyAlarm() {
    console.log('🔊 Starting emergency alarm sound only...');
    
    // Clear any existing alerts
    this.stopAllAlerts();

    // Configure audio mode for alerts
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // Play alarm immediately
    this.playEmergencyAlarm();

    // Repeat alarm every 3 seconds
    this.soundInterval = setInterval(() => {
      this.playEmergencyAlarm();
    }, 3000);
  }

  async playEmergencyAlarm() {
    try {
      // Unload previous sound if exists
      if (this.emergencySound) {
        await this.emergencySound.unloadAsync();
      }

      // Play emergency alarm sound
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/emergency-alarm.mp3'),
        { 
          shouldPlay: true, 
          volume: 1.0,
          isLooping: false 
        }
      );
      
      this.emergencySound = sound;
      
      console.log('🔊 Emergency alarm playing');
      
    } catch (error) {
      console.log('❌ Emergency alarm sound error:', error);
    }
  }

  stopAllAlerts() {
    console.log('🛑 Stopping emergency alarm...');
    
    // Stop sound interval
    if (this.soundInterval) {
      clearInterval(this.soundInterval);
      this.soundInterval = null;
    }
    
    // Unload sound
    this.unloadSound();
  }

  async unloadSound() {
    try {
      if (this.emergencySound) {
        await this.emergencySound.stopAsync();
        await this.emergencySound.unloadAsync();
        this.emergencySound = null;
        console.log('🔇 Emergency alarm stopped');
      }
    } catch (error) {
      console.log('❌ Sound unload error:', error);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isInitialized && this.pusher?.connection?.state === 'connected',
      state: this.pusher?.connection?.state || 'not initialized',
      socketId: this.pusher?.connection?.socket_id || null
    };
  }

  disconnect() {
    console.log('🛑 Disconnect requested - cleaning up...');
    
    this.stopAllAlerts();
    this.isInitialized = false;
    this.staffId = null;
    
    // Remove app state listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    if (this.pusher) {
      this.pusher.disconnect();
      console.log('🔌 Pusher disconnected');
    }
  }
}

export default new PusherService();