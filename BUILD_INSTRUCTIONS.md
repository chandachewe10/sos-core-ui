# Expo Build Instructions - iOS & Android

## ⚠️ Important Notes

### iOS Build Requirements
- **iOS builds require a paid Apple Developer account** ($99/year)
- If you don't have one, you can only build for Android
- To get an Apple Developer account: https://developer.apple.com/programs/

### PowerShell Execution Policy (Windows)
If you get "running scripts is disabled" error, run this command first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Quick Development Preview Link
```bash
# Start Expo with tunnel (for sharing)
npx expo start --tunnel

# Press 's' in the terminal to share the link
# This creates a shareable URL that works with Expo Go app
```

## EAS Build - Preview Builds (Recommended for Testing)

### 1. Fix PowerShell Execution Policy (Windows only)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### 3. Login to Expo
```bash
eas login
```

### 4. Build for Android (Preview) - ✅ No Paid Account Needed
```bash
eas build --platform android --profile preview
```

### 5. Build for iOS (Preview) - ⚠️ Requires Paid Apple Developer Account
```bash
eas build --platform ios --profile preview
```
**Note:** This will fail if you don't have a paid Apple Developer account.

### 6. Build for Both Platforms
```bash
eas build --platform all --profile preview
```
**Note:** Will fail for iOS if you don't have a paid Apple Developer account.

After the build completes, EAS will provide:
- **Download links** you can share
- **QR codes** for easy installation
- Build artifacts stored in your Expo dashboard

## Production Builds

### Android APK/AAB
```bash
eas build --platform android --profile production
```

### iOS IPA
```bash
eas build --platform ios --profile production
```

### Both Platforms
```bash
eas build --platform all --profile production
```

## Shareable Links After Build

1. Go to https://expo.dev
2. Navigate to your project: **Moyo SOS**
3. Go to **Builds** section
4. Click on any completed build
5. You'll see:
   - **Install URL** - Share this link with users
   - **QR Code** - Users can scan to install
   - **Download buttons** for direct download

## Alternative: Using Expo Updates (OTA)

If you just need to share app updates (not initial install):

```bash
# Publish an update
npx expo publish

# Or with EAS Update
eas update --branch main --message "Update description"
```

Users with the app installed will get the update automatically.

## Alternative: Android-Only Build

If you don't have an Apple Developer account, you can still create shareable links for Android:

```bash
# Build only Android
eas build --platform android --profile preview
```

This will create a shareable APK download link that works on any Android device.

## iOS Testing Without Paid Account

For iOS testing without a paid account, you can:
1. Use **Expo Go** app with development link (`npx expo start --tunnel`)
2. Use **Simulator** on a Mac (free, but requires Mac computer)
3. Get a paid Apple Developer account for real device testing

## Quick Command Reference

| Command | Purpose | Requirements |
|---------|---------|--------------|
| `npx expo start` | Start dev server locally | None |
| `npx expo start --tunnel` | Start dev server with shareable link | None (works with Expo Go) |
| `eas build --platform android --profile preview` | Build Android preview | Free Expo account |
| `eas build --platform ios --profile preview` | Build iOS preview | Paid Apple Developer ($99/year) |
| `eas build --platform all --profile preview` | Build both platforms | Paid Apple Developer for iOS |
| `eas build --platform all --profile production` | Production builds | Paid accounts for both stores |

## Notes

- **Preview builds** are for testing and can be installed via link
- **Production builds** are for App Store/Play Store submission
- Builds take ~10-20 minutes depending on platform
- First build may take longer due to dependencies
- Check build status at: https://expo.dev/accounts/[your-account]/projects/moyo-sos/builds

