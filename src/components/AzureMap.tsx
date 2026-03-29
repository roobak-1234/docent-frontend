import React, { useEffect, useRef, useState } from 'react';
import * as azureMaps from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';
import { azureMapsKeyHelpText } from '../config/maps';

interface Coordinate {
    latitude: number;
    longitude: number;
}

interface AzureMapProps {
    subscriptionKey: string;
    center?: Coordinate;
    zoom?: number;
    mapStyle?: 'road' | 'satellite' | 'satellite_road_labels' | 'grayscale_dark';
    markers?: Array<{
        coordinate: Coordinate;
        color?: string;
        popupContent?: string;
        type?: 'hospital' | 'clinic' | 'user' | 'default';
    }>;
    ambulances?: Array<{
        id: string;
        coordinate: Coordinate;
        status: 'idle' | 'dispatched';
    }>;
    userLocation?: Coordinate | null;
    onMove?: () => void;
    trigger?: number;
    routePoints?: Coordinate[];
}

export const AzureMap: React.FC<AzureMapProps> = ({
    subscriptionKey,
    center = { latitude: 20.5937, longitude: 78.9629 },
    zoom = 10,
    mapStyle = 'road',
    markers = [],
    ambulances = [],
    userLocation = null,
    onMove,
    trigger = 0,
    routePoints = []
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const skipNextMoveStartRef = useRef(false);
    const userMarkerRef = useRef<azureMaps.HtmlMarker | null>(null);
    const [mapInstance, setMapInstance] = useState<azureMaps.Map | null>(null);
    const [dataSource, setDataSource] = useState<azureMaps.source.DataSource | null>(null);
    const lastStyleRef = useRef(mapStyle);

    // Initialize Map
    useEffect(() => {
        if (!mapRef.current || !subscriptionKey) return;

        const map = new azureMaps.Map(mapRef.current, {
            center: [center.longitude, center.latitude],
            zoom,
            style: mapStyle,
            language: 'en-US',
            authOptions: {
                authType: azureMaps.AuthenticationType.subscriptionKey,
                subscriptionKey
            }
        });

        const source = new azureMaps.source.DataSource();

        map.events.add('ready', () => {
            map.sources.add(source);
            setDataSource(source);

            map.layers.add(new azureMaps.layer.SymbolLayer(source, undefined, {
                filter: ['==', '$type', 'Point'],
                iconOptions: { image: ['get', 'icon'], anchor: 'center', allowOverlap: true, size: 1 },
                textOptions: { textField: ['get', 'title'], offset: [0, 1.2], color: '#ffffff', haloColor: '#000000', haloWidth: 2 }
            }));

            // Route shadow
            map.layers.add(new azureMaps.layer.LineLayer(source, undefined, {
                filter: ['==', '$type', 'LineString'],
                strokeColor: '#0078d4', strokeWidth: 8, strokeOpacity: 0.3,
                lineJoin: 'round', lineCap: 'round'
            }));

            // Route line
            map.layers.add(new azureMaps.layer.LineLayer(source, undefined, {
                filter: ['==', '$type', 'LineString'],
                strokeColor: '#60a5fa', strokeWidth: 4,
                lineJoin: 'round', lineCap: 'round'
            }));

            setMapInstance(map);
        });

        map.events.add('movestart', () => {
            if (skipNextMoveStartRef.current) { skipNextMoveStartRef.current = false; return; }
            if (onMove) onMove();
        });

        map.controls.add([
            new azureMaps.control.ZoomControl(),
            new azureMaps.control.CompassControl(),
            new azureMaps.control.StyleControl({ mapStyles: ['road', 'satellite', 'satellite_road_labels', 'grayscale_dark'] } as any)
        ], { position: azureMaps.ControlPosition.TopRight });

        return () => {
            userMarkerRef.current = null;
            setMapInstance(null);
            setDataSource(null);
            map.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subscriptionKey]);

    // Update camera
    useEffect(() => {
        if (!mapInstance) return;
        try {
            skipNextMoveStartRef.current = true;
            mapInstance.setCamera({ center: [center.longitude, center.latitude], zoom, type: 'jump' });
        } catch (e) { console.warn('Map camera update failed:', e); }
    }, [center.latitude, center.longitude, zoom, mapInstance, trigger]);

    // Update style
    useEffect(() => {
        if (!mapInstance || lastStyleRef.current === mapStyle) return;
        try { lastStyleRef.current = mapStyle; mapInstance.setStyle({ style: mapStyle }); }
        catch (e) { console.warn('Map style update failed:', e); }
    }, [mapStyle, mapInstance]);

    // Update user location marker (pulsing blue dot HTML marker)
    useEffect(() => {
        if (!mapInstance) return;

        // Remove old marker
        if (userMarkerRef.current) {
            mapInstance.markers.remove(userMarkerRef.current);
            userMarkerRef.current = null;
        }

        if (!userLocation) return;

        const el = document.createElement('div');
        el.style.cssText = `
            width: 20px; height: 20px; position: relative;
        `;
        el.innerHTML = `
            <div style="
                position:absolute; inset:0; border-radius:50%;
                background:rgba(59,130,246,0.3);
                animation: pulse-ring 1.5s ease-out infinite;
            "></div>
            <div style="
                position:absolute; top:50%; left:50%;
                transform:translate(-50%,-50%);
                width:12px; height:12px; border-radius:50%;
                background:#3b82f6; border:2px solid white;
                box-shadow:0 0 6px rgba(59,130,246,0.8);
            "></div>
        `;

        // Inject keyframes once
        if (!document.getElementById('azure-map-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'azure-map-pulse-style';
            style.textContent = `
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        const marker = new azureMaps.HtmlMarker({
            htmlContent: el,
            position: [userLocation.longitude, userLocation.latitude],
            anchor: 'center'
        });

        mapInstance.markers.add(marker);
        userMarkerRef.current = marker;
    }, [userLocation, mapInstance]);

    // Update data source markers
    useEffect(() => {
        if (!dataSource || !mapInstance) return;
        try {
            dataSource.clear();
            const points: azureMaps.data.Feature<azureMaps.data.Geometry, any>[] = [];

            markers.forEach(m => {
                if (m.type === 'user') return; // user location handled by HtmlMarker above
                const point = new azureMaps.data.Point([m.coordinate.longitude, m.coordinate.latitude]);
                const icon = m.type === 'hospital' ? 'pin-round-red' : m.type === 'clinic' ? 'pin-round-blue' : 'pin-round-darkblue';
                points.push(new azureMaps.data.Feature(point, { icon, title: m.popupContent || '' }));
            });

            ambulances.forEach(a => {
                const point = new azureMaps.data.Point([a.coordinate.longitude, a.coordinate.latitude]);
                points.push(new azureMaps.data.Feature(point, {
                    icon: 'pin-round-blue',
                    title: `Ambulance ${a.id}`
                }));
            });

            if (routePoints.length > 1) {
                const coords = routePoints.map(p => [p.longitude, p.latitude]);
                if (coords.every(c => c[0] != null && c[1] != null)) {
                    points.push(new azureMaps.data.Feature(new azureMaps.data.LineString(coords), { type: 'route' }));
                    points.push(new azureMaps.data.Feature(new azureMaps.data.Point(coords[0] as [number, number]), { icon: 'pin-round-blue', title: 'Start' }));
                    points.push(new azureMaps.data.Feature(new azureMaps.data.Point(coords[coords.length - 1] as [number, number]), { icon: 'pin-round-red', title: 'Destination' }));
                }
            }

            dataSource.add(points);
        } catch (e) { console.error('Error updating map data source:', e); }
    }, [markers, ambulances, routePoints, dataSource, mapInstance]);

    if (!subscriptionKey) {
        return (
            <div style={{ width: '100%', height: '100%', minHeight: '400px' }} className="flex items-center justify-center bg-slate-100 rounded-lg">
                <p className="text-slate-400 text-sm font-medium">{azureMapsKeyHelpText}</p>
            </div>
        );
    }

    return <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '8px' }} />;
};
