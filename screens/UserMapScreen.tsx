import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../hooks/useAuth';
import * as DB from '../lib/db';
import { toast } from 'sonner-native';
import Mapbox, {
  Camera,
  Images,
  LineLayer,
  LocationPuck,
  MapView,
  ShapeSource,
  SymbolLayer,
} from "@rnmapbox/maps";
import * as Speech from "expo-speech";

Mapbox.setAccessToken(`${process.env.EXPO_PUBLIC_MAPBOX_KEY}`);

// ---------- Constants ----------
const nearbyLocations = [
  { id: "A", name: "Point A", coords: [28.61012, -12.9403] as [number, number] },
  { id: "B", name: "Point B", coords: [28.60498, -12.9351] as [number, number] },
  { id: "C", name: "Point C", coords: [28.61256, -12.93342] as [number, number] },
];

// Haversine distance in KM
function haversineKM([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

type Target = { id: string; name: string; coords: [number, number] };

export default function UserMapScreen() {
  const auth = useAuth();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selected, setSelected] = useState<Target | null>(null);
  const [route, setRoute] = useState<GeoJSON.LineString | null>(null);
  const [eta, setEta] = useState<{ duration: number; distance: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<"driving" | "walking" | null>(null);
  const [nextInstruction, setNextInstruction] = useState<string | null>(null);

  const cameraRef = useRef<Camera>(null);
  const lastSpokenRef = useRef<string>("");
  const lastFetchAtRef = useRef<number>(0);
  const lastOriginRef = useRef<[number, number] | null>(null);

  // Nearby markers (<= 50km)
  const nearbyWithin50 = React.useMemo(() => {
    if (!userLocation) return [];
    return nearbyLocations.filter((p) => haversineKM(userLocation, p.coords) <= 50);
  }, [userLocation]);

  // Build marker collection
  const markerCollection: GeoJSON.FeatureCollection = React.useMemo(() => {
    const list: Target[] = selected ? [selected] : (nearbyWithin50 as Target[]);
    return {
      type: "FeatureCollection",
      features: list.map((loc) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: loc.coords },
        properties: { id: loc.id, name: loc.name ?? loc.id },
      })),
    };
  }, [selected, nearbyWithin50]);

  // Directions fetcher
  const fetchRoute = async (
    origin: [number, number],
    dest: [number, number],
    profile: "driving" | "walking"
  ) => {
    try {
      setLoading(true);
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin[0]},${origin[1]};${dest[0]},${dest[1]}?geometries=geojson&overview=full&steps=true&voice_instructions=false&access_token=${process.env.EXPO_PUBLIC_MAPBOX_KEY}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.routes?.length) {
        const r = json.routes[0];
        setRoute(r.geometry as GeoJSON.LineString);
        setEta({ duration: r.duration, distance: r.distance });

        const step = r.legs?.[0]?.steps?.[0];
        const instr: string | undefined = step?.maneuver?.instruction;
        if (instr && instr !== lastSpokenRef.current) {
          setNextInstruction(instr);
          lastSpokenRef.current = instr;
          try {
            Speech.stop();
          } catch {}
          Speech.speak(instr, { rate: 1.0, pitch: 1.0 });
        } else if (!instr) {
          setNextInstruction(null);
        }
      } else {
        setRoute(null);
        setEta(null);
        setNextInstruction(null);
      }
    } catch (e) {
      console.error("Route fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Initial location and permissions
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is required to send your location to responders.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const start: [number, number] = [loc.coords.longitude, loc.coords.latitude];
      setUserLocation(start);
      cameraRef.current?.setCamera({
        centerCoordinate: start,
        zoomLevel: 15,
        animationDuration: 800,
      });
    })();

    return () => {
      try {
        Speech.stop();
      } catch {}
    };
  }, []);

  // Watch movement
  useEffect(() => {
    if (!userLocation) return;

    let sub: Location.LocationSubscription | null = null;
    (async () => {
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (loc) => {
          const next: [number, number] = [loc.coords.longitude, loc.coords.latitude];
          setUserLocation(next);

          cameraRef.current?.setCamera({
            centerCoordinate: next,
            zoomLevel: 16,
            animationDuration: 800,
          });

          if (selected && mode) {
            const now = Date.now();
            const movedEnough =
              lastOriginRef.current
                ? haversineKM(lastOriginRef.current, next) * 1000 >= 20
                : true;
            const timeEnough = now - lastFetchAtRef.current >= 5000;

            if (movedEnough || timeEnough) {
              lastFetchAtRef.current = now;
              lastOriginRef.current = next;
              fetchRoute(next, selected.coords, mode);
            }
          }
        }
      );
    })();

    return () => {
      sub?.remove();
    };
  }, [selected, mode]);

  // Marker press
  const onMarkerPress = (e: any) => {
    const g = e.features?.[0]?.geometry;
    const p = e.features?.[0]?.properties;
    if (!g || g.type !== "Point") return;
    const coords = g.coordinates as [number, number];

    const locked: Target = {
      id: (p?.id as string) ?? "target",
      name: (p?.name as string) ?? "Target",
      coords,
    };
    setSelected(locked);
    setMode("driving");

    if (userLocation) {
      lastOriginRef.current = userLocation;
      lastFetchAtRef.current = 0;
      fetchRoute(userLocation, coords, "driving");
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelected(null);
    setRoute(null);
    setEta(null);
    setNextInstruction(null);
    setMode(null);
    lastSpokenRef.current = "";
    try {
      Speech.stop();
    } catch {}
  };

  // SOS Help function
  async function handleCallHelp() {
    if (!auth.user || auth.user.role !== 'user') return toast.error('Not authenticated');
    if (!userLocation) return toast.error('Location not available');
    
    setSending(true);
    try {
      await DB.createSOS({
        phone: auth.user.phone,
        location: {
          latitude: userLocation[1], // lat is at index 1
          longitude: userLocation[0] // lng is at index 0
        },
        createdAt: Date.now()
      });
      toast.success('Help requested. Emergency responders will see your location.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send help request');
    } finally {
      setSending(false);
    }
  }

  const formatDistance = (distance: number) =>
    distance < 1000 ? `${Math.round(distance)} m` : `${Math.round(distance / 1000)} km`;

  // Web fallback
  if (Platform.OS === 'web') {
    const lat = userLocation ? userLocation[1] : null;
    const lng = userLocation ? userLocation[0] : null;
    const mapsUrl = lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : undefined;

    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontWeight: '700', fontSize: 18 }}>Your Location</Text>
          <Text style={{ marginTop: 8 }}>{lat ? `${lat.toFixed(6)}, ${lng?.toFixed(6)}` : 'Unavailable'}</Text>
          {mapsUrl && (
            <Pressable
              onPress={() => Linking.openURL(mapsUrl)}
              style={styles.openMapsButton}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Open in Google Maps</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.callButton, sending && { opacity: 0.7 }]}
          onPress={handleCallHelp}
          disabled={sending}
        >
          <Text style={styles.callText}>{sending ? 'Sending…' : 'Call for Help'}</Text>
        </Pressable>
      </View>
    );
  }

  // Native Mapbox map
  return (
    <View style={styles.container}>
      <MapView style={styles.map} styleURL="mapbox://styles/mapbox/streets-v12">
        <Camera ref={cameraRef} followUserLocation={false} />
        
        <LocationPuck pulsing={{ isEnabled: true }} />

        {/* Markers */}
        <ShapeSource id="targets" shape={markerCollection} onPress={onMarkerPress}>
          <SymbolLayer
            id="targetSymbols"
            style={{
              iconImage: "marker-15",
              iconSize: 1.5,
              iconAllowOverlap: true,
            }}
          />
        </ShapeSource>

        {/* Route */}
        {route && (
          <ShapeSource id="route" shape={{ type: "Feature", geometry: route, properties: {} }}>
            <LineLayer
              id="routeLine"
              style={{
                lineColor: "blue",
                lineWidth: 4,
                lineJoin: "round",
                lineCap: "round",
              }}
            />
          </ShapeSource>
        )}
      </MapView>

      {/* Loader */}
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="blue" />
          <Text style={{ marginTop: 8 }}>Calculating route...</Text>
        </View>
      )}

      {/* ETA + instruction */}
      {(eta || nextInstruction) && !loading && (
        <View style={styles.banner}>
          {eta && (
            <Text style={styles.bannerText}>
              ETA: {Math.round(eta.duration / 60)} mins • {formatDistance(eta.distance)}
            </Text>
          )}
          {nextInstruction && <Text style={styles.bannerSub}>{nextInstruction}</Text>}
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {selected && (
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeBtn, mode === "driving" && styles.modeBtnActive]}
              onPress={() => {
                setMode("driving");
                if (userLocation && selected) fetchRoute(userLocation, selected.coords, "driving");
              }}
              disabled={mode === "driving"}
            >
              <Text style={[styles.modeText, mode === "driving" && styles.modeTextActive]}>Driving</Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, mode === "walking" && styles.modeBtnActive]}
              onPress={() => {
                setMode("walking");
                if (userLocation && selected) fetchRoute(userLocation, selected.coords, "walking");
              }}
              disabled={mode === "walking"}
            >
              <Text style={[styles.modeText, mode === "walking" && styles.modeTextActive]}>Walking</Text>
            </Pressable>
          </View>
        )}

        {selected && (
          <Pressable style={styles.clearBtn} onPress={clearSelection}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      {/* SOS Help Button */}
      <Pressable
        style={[styles.callButton, sending && { opacity: 0.7 }]}
        onPress={handleCallHelp}
        disabled={sending}
      >
        <Text style={styles.callText}>{sending ? 'Sending…' : 'Call for Help'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  openMapsButton: { marginTop: 12, padding: 12, backgroundColor: '#2563EB', borderRadius: 10, alignItems: 'center' },
  callButton: {
    position: 'absolute',
    bottom: 36,
    left: 24,
    right: 24,
    backgroundColor: '#EF4444',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  callText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  loader: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  banner: {
    position: "absolute",
    bottom: 120,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  bannerText: { color: "white", fontSize: 16, fontWeight: "bold" },
  bannerSub: { color: "white", fontSize: 14, marginTop: 6 },
  controls: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modeRow: { flexDirection: "row", gap: 10 },
  modeBtn: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modeBtnActive: { backgroundColor: "#2563eb" },
  modeText: { color: "white", fontWeight: "600" },
  modeTextActive: { color: "white", fontWeight: "700" },
  clearBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearText: { color: "white", fontWeight: "700" },
});