import 'dotenv/config';

export default {
  expo: {
    name: "Moyo SOS",
    slug: "moyo-sos",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "We use your location to show your position on the map and help responders find you.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "We use your location to show your position on the map and help responders find you.",
      },
      config: {
        usesNonExemptEncryption: false,
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || "",
      },
    },
    android: {
      package: "com.x2020100.umoyosos",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || "",
        },
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "FOREGROUND_SERVICE",
        "ACCESS_BACKGROUND_LOCATION",
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow Moyo SOS to use your location to help emergency responders find you.",
          locationAlwaysPermission: "Allow Moyo SOS to use your location to help emergency responders find you.",
          locationWhenInUsePermission: "Allow Moyo SOS to use your location to help emergency responders find you.",
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "30d99b7d-3659-4024-934c-a536b5357da6"
      }
    }
  },
};