import Pusher from 'pusher-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { sirenService } from './SirenService';

class PusherService {
  private pusher: Pusher | null = null;
  private channel: any = null;
  private currentStaffId: string | null = null;

  async initPusher(staffUserId: string) {
    try {
      // Enable detailed logging
      Pusher.logToConsole = true;

      console.log('🔄 Initializing Pusher for staff user ID:', staffUserId);

      // Disconnect existing connection if any
      if (this.pusher) {
        this.disconnect();
      }

      // Use PUBLIC channel - no authentication needed
      this.pusher = new Pusher('2369b5ec2e1cc7dd5040', {
        cluster: 'mt1',
        forceTLS: true,
        // No authEndpoint needed for public channels
      });

      // Use PUBLIC channel to match Laravel Event (public-emergency-{staffUserId})
      const channelName = `public-emergency-${staffUserId}`;
      console.log('📡 Subscribing to PUBLIC channel:', channelName);

      this.channel = this.pusher.subscribe(channelName);
      this.currentStaffId = staffUserId;

      this.channel.bind('pusher:subscription_succeeded', () => {
        console.log('✅ SUCCESS: Subscribed to PUBLIC channel:', channelName);
        console.log('🎯 Now listening for emergency-alert events...');
      });

      this.channel.bind('pusher:subscription_error', (error: any) => {
        console.error('❌ Subscription error:', error);
      });

      // Listen for emergency-alert event (matches Laravel broadcastAs)
      this.channel.bind('emergency-alert', (data: any) => {
        console.log('🚨 EMERGENCY ALERT RECEIVED VIA PUSHER:', data);
        this.handleEmergencyAlert(data);
      });

      this.pusher.connection.bind('connected', () => {
        console.log('✅ PUSHER CONNECTED! Connection established - Ready for emergencies');
      });

      this.pusher.connection.bind('disconnected', () => {
        console.log('🔌 Pusher disconnected');
      });

      this.pusher.connection.bind('error', (error: any) => {
        console.error('❌ Pusher connection error:', error);
      });

    } catch (error: any) {
      console.error('❌ Pusher init error:', error);
      throw error;
    }
  }

  private handleEmergencyAlert(data: any) {
    console.log('🚨 Handling emergency alert:', data);
    
    // Play siren sound
    sirenService.playSiren();
    
    // Show alert to staff member (data matches Laravel broadcastWith format)
    const phone = data.victim_phone || data.phone || 'Unknown';
    const latitude = data.latitude || 0;
    const longitude = data.longitude || 0;
    const distance = data.distance_km ? `${data.distance_km} km away` : '';
    const message = data.message || 'Emergency help requested!';
    
    Alert.alert(
      '🚨 EMERGENCY ALERT',
      `${message}\n\nPhone: ${phone}\nLocation: ${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}\n${distance ? `Distance: ${distance}` : ''}`,
      [
        {
          text: 'View Details',
          onPress: () => {
            // Navigate to emergency details screen if needed
            console.log('View emergency details for:', data);
          },
        },
        {
          text: 'OK',
          style: 'cancel',
          onPress: () => {
            sirenService.stopSiren();
          },
        },
      ],
      { cancelable: false }
    );
  }

  disconnect() {
    try {
      if (this.channel) {
        this.channel.unbind_all();
        this.channel.unsubscribe();
        this.channel = null;
      }

      if (this.pusher) {
        this.pusher.disconnect();
        this.pusher = null;
      }

      this.currentStaffId = null;
      console.log('🔌 Pusher disconnected and cleaned up');
    } catch (error: any) {
      console.error('❌ Error disconnecting Pusher:', error);
    }
  }

  isConnected(): boolean {
    return this.pusher !== null && this.pusher.connection.state === 'connected';
  }

  getCurrentStaffId(): string | null {
    return this.currentStaffId;
  }
}

// Export singleton instance
export const pusherService = new PusherService();

