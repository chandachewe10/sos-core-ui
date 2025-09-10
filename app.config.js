import 'dotenv/config';

export default {
  expo: {
    name: "Moyo SOS",
    slug: "moyo-sos",
    version: "1.0.0",
    sdkVersion: "53.0.0",
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
        NSLocationWhenInUseUsageDescription: "We use your location to show your position on the map and help responders find you.",
      },
      config: {
        usesNonExemptEncryption: false,
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
      ],
    },
    plugins: [
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsDownloadToken: process.env.EXPO_SECRET_MAPBOX_KEY,
        },
      ],
    ],
    web: {
      favicon: "./assets/favicon.png",
    },
  },
};
