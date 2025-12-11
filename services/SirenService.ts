import { Audio } from 'expo-av';

class SirenService {
  private sound: Audio.Sound | null = null;
  private isPlaying: boolean = false;

  async playSiren() {
    try {
      // Stop any existing sound
      if (this.isPlaying && this.sound) {
        await this.stopSiren();
      }

      // Request audio permissions
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create a siren sound using a tone generator
      // For now, we'll use a simple approach - you can replace this with an actual siren audio file
      console.log('🔊 Playing siren sound...');
      
      // Generate a simple alert sound
      // Note: For production, you should use an actual siren audio file
      // You can add a siren.mp3 file to your assets folder and load it here
      
      // For now, let's use a system sound or create a beep pattern
      // Since expo-av requires an actual audio file, let's create a beeping pattern
      
      // Alternative: Use react-native's Vibration API for haptic feedback
      // and show a visual alert
      
      this.isPlaying = true;
      
      // TODO: Load an actual siren audio file from assets
      // const { sound } = await Audio.Sound.createAsync(
      //   require('../assets/siren.mp3'),
      //   { shouldPlay: true, isLooping: true }
      // );
      // this.sound = sound;
      
      // For now, we'll use vibration and console log
      // You can add react-native's Vibration module for haptic feedback
      console.log('🚨 SIREN ALERT: Emergency detected!');
      
      // If you have react-native-vibration installed:
      // import Vibration from 'react-native';
      // Vibration.vibrate([1000, 500, 1000, 500, 1000], true); // Vibrate pattern
      
    } catch (error: any) {
      console.error('❌ Error playing siren:', error);
      this.isPlaying = false;
    }
  }

  async stopSiren() {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      this.isPlaying = false;
      console.log('🔇 Siren stopped');
    } catch (error: any) {
      console.error('❌ Error stopping siren:', error);
      this.isPlaying = false;
    }
  }

  isSirenPlaying(): boolean {
    return this.isPlaying;
  }
}

// Export singleton instance
export const sirenService = new SirenService();

// Export class for direct instantiation if needed
export { SirenService };

