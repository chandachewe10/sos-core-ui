import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapLeafletProps {
    userLocation: { latitude: number; longitude: number };
    staffMarkers: Array<{
        id: string;
        full_name: string;
        phone: string;
        last_known_latitude: number;
        last_known_longitude: number;
        distance: number;
    }>;
    onStaffSelect: (staff: any) => void;
}

const MapLeafletWeb: React.FC<MapLeafletProps> = ({ userLocation, staffMarkers, onStaffSelect }) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<{ [key: string]: L.Marker }>({});

    useEffect(() => {
        if (!mapContainerRef.current || typeof window === 'undefined') return;

        // Initialize map only once
        if (!mapRef.current) {
            try {
                mapRef.current = L.map(mapContainerRef.current).setView(
                    [userLocation.latitude, userLocation.longitude],
                    15
                );

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                    maxZoom: 19,
                }).addTo(mapRef.current);
            } catch (error) {
                console.error('Error initializing map:', error);
                return;
            }
        }

        // Update map view
        if (mapRef.current) {
            try {
                mapRef.current.setView([userLocation.latitude, userLocation.longitude], 15);
            } catch (e) {
                console.error('Error setting map view:', e);
            }
        }

        // Clear and update markers
        Object.values(markersRef.current).forEach(marker => {
            try {
                marker.remove();
            } catch (e) {
                console.error('Error removing marker:', e);
            }
        });
        markersRef.current = {};

        if (mapRef.current) {
            try {
                // User location marker
                const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41],
                    }),
                })
                    .bindPopup('Your Location')
                    .addTo(mapRef.current);

                markersRef.current['user_location'] = userMarker;

                // Staff markers
                staffMarkers.forEach(staff => {
                    const marker = L.marker(
                        [staff.last_known_latitude, staff.last_known_longitude],
                        {
                            icon: L.icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41],
                            }),
                        }
                    )
                        .bindPopup(
                            `<div style="padding: 8px; font-size: 14px; min-width: 200px;"><strong>${staff.full_name}</strong><br/>Distance: ${staff.distance?.toFixed(2) || '?'} km<br/>Phone: <a href="tel:${staff.phone}">${staff.phone}</a></div>`
                        )
                        .on('click', () => onStaffSelect(staff))
                        .addTo(mapRef.current);

                    markersRef.current[staff.id] = marker;
                });
            } catch (error) {
                console.error('Error adding markers:', error);
            }
        }
    }, [userLocation, staffMarkers, onStaffSelect]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mapRef.current) {
                try {
                    mapRef.current.remove();
                    mapRef.current = null;
                } catch (e) {
                    console.error('Error cleaning up map:', e);
                }
            }
        };
    }, []);

    return (
        <div
            ref={mapContainerRef}
            style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 0,
            }}
        />
    );
};

export default MapLeafletWeb;
