import React, { useEffect, useRef, useState } from 'react';
import * as azureMaps from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';

interface Coordinate {
    latitude: number;
    longitude: number;
}

interface AzureMapProps {
    subscriptionKey: string;
    center?: Coordinate;
    zoom?: number;
    markers?: Array<{
        coordinate: Coordinate;
        color?: string;
        popupContent?: string;
        type?: 'hospital' | 'clinic' | 'accident' | 'generic';
    }>;
    ambulances?: Array<{
        id: string;
        coordinate: Coordinate;
        status: 'idle' | 'dispatched';
    }>;
    route?: {
        start: Coordinate;
        end: Coordinate;
    };
}

export const AzureMap: React.FC<AzureMapProps> = ({
    subscriptionKey,
    center = { latitude: 47.6062, longitude: -122.3321 },
    zoom = 10,
    markers = [],
    ambulances = [],
    route
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<azureMaps.Map | null>(null);
    const [dataSource, setDataSource] = useState<azureMaps.source.DataSource | null>(null);

    // Initialize Map once
    useEffect(() => {
        if (!mapRef.current || !subscriptionKey) return;

        const map = new azureMaps.Map(mapRef.current, {
            center: [center.longitude, center.latitude],
            zoom: zoom,
            language: 'en-US',
            style: 'satellite_road_labels',
            authOptions: {
                authType: azureMaps.AuthenticationType.subscriptionKey,
                subscriptionKey: subscriptionKey
            }
        });

        const source = new azureMaps.source.DataSource();

        map.events.add('ready', () => {
            map.sources.add(source);
            setDataSource(source);

            // Add line layer for route
            map.layers.add(new azureMaps.layer.LineLayer(source, undefined, {
                strokeColor: '#ef4444', // Emergency Red
                strokeWidth: 7,
                lineJoin: 'round',
                lineCap: 'round',
                strokeOpacity: 0.9
            }));

            // Add a "pulsing" arrow layer or dash effect for direction
            map.layers.add(new azureMaps.layer.LineLayer(source, undefined, {
                strokeColor: '#ffffff',
                strokeWidth: 2,
                strokeDashArray: [2, 2],
                lineJoin: 'round',
                lineCap: 'round'
            }));

            // Add symbol layer for generic markers
            map.layers.add(new azureMaps.layer.SymbolLayer(source, undefined, {
                iconOptions: {
                    image: ['get', 'icon'],
                    anchor: 'center',
                    allowOverlap: true,
                    size: 1.2
                },
                textOptions: {
                    textField: ['get', 'title'],
                    offset: [0, 1.5],
                    color: '#ffffff',
                    font: ['SegoeUi-Bold'],
                    size: 14,
                    allowOverlap: true, // Show all names
                    ignorePlacement: true
                }
            }));

            // Add controls
            map.controls.add([
                new azureMaps.control.ZoomControl(),
                new azureMaps.control.CompassControl(),
                new azureMaps.control.PitchControl(),
                new azureMaps.control.StyleControl({
                    mapStyles: ['road', 'satellite', 'satellite_road_labels', 'grayscale_dark']
                }),
                new azureMaps.control.TrafficControl()
            ], { position: azureMaps.ControlPosition.TopRight });

            setMapInstance(map);
        });

        const handleResize = () => {
            if (map) map.resize();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            if (map) map.dispose();
            window.removeEventListener('resize', handleResize);
        };
        // Only re-initialize if subscriptionKey changes or something critical
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subscriptionKey]);

    // Update center and zoom without re-initializing
    useEffect(() => {
        if (!mapInstance) return;
        
        mapInstance.setCamera({
            center: [center.longitude, center.latitude],
            zoom: zoom,
            type: 'fly',
            duration: 1000 // Smooth transition
        });
    }, [mapInstance, center.latitude, center.longitude, zoom]);

    // Update Markers
    useEffect(() => {
        if (!dataSource || !mapInstance) return;

        dataSource.clear();

        const points: azureMaps.data.Feature<azureMaps.data.Geometry, any>[] = [];

        // Hospital, Clinics & Static Markers
        markers.forEach(m => {
            const point = new azureMaps.data.Point([m.coordinate.longitude, m.coordinate.latitude]);
            const icon = m.type === 'hospital' ? 'pin-round-blue' : (m.type === 'clinic' ? 'pin-round-green' : 'pin-round-darkblue');
            const feature = new azureMaps.data.Feature(point, {
                color: m.color || 'red',
                icon: icon,
                name: m.popupContent,
                popup: m.popupContent
            });
            points.push(feature);
        });

        // Ambulance Markers
        ambulances.forEach(a => {
            const point = new azureMaps.data.Point([a.coordinate.longitude, a.coordinate.latitude]);
            const feature = new azureMaps.data.Feature(point, {
                color: a.status === 'dispatched' ? 'orange' : 'green',
                icon: 'pin-red',
                type: 'ambulance'
            });
            points.push(feature);
        });

        // Enhanced Real-Road Route
        if (route) {
            const fetchRoute = async () => {
                try {
                    const url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&query=${route.start.latitude},${route.start.longitude}:${route.end.latitude},${route.end.longitude}&subscription-key=${subscriptionKey}&report=effectiveSettings&routeType=fastest&traffic=true`;
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        const routePoints = data.routes[0].legs[0].points.map((p: any) => [p.longitude, p.latitude]);
                        const line = new azureMaps.data.LineString(routePoints);
                        dataSource.add(new azureMaps.data.Feature(line));
                    } else {
                        // Fallback to straight line if service fails
                        const line = new azureMaps.data.LineString([
                            [route.start.longitude, route.start.latitude],
                            [route.end.longitude, route.end.latitude]
                        ]);
                        dataSource.add(new azureMaps.data.Feature(line));
                    }
                } catch (err) {
                    console.error("Route fetch failed:", err);
                }
            };
            fetchRoute();
        }

        dataSource.add(points);

    }, [markers, ambulances, route, dataSource, mapInstance, subscriptionKey]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}>
            <div 
                ref={mapRef} 
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backgroundColor: '#020617' 
                }} 
            />
            
            {/* Locate Me Button */}
            <button
                onClick={() => {
                    if (mapInstance && center) {
                        mapInstance.setCamera({
                            center: [center.longitude, center.latitude],
                            zoom: 17,
                            type: 'fly',
                            duration: 1000
                        });
                    }
                }}
                className="absolute bottom-6 right-6 z-10 p-3 bg-white/95 backdrop-blur-sm rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group"
                title="Center on Driver"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-docent-primary">
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="22" x2="12" y2="20"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="22" y1="12" x2="20" y2="12"/>
                </svg>
            </button>

            {/* View Style Indicator */}
            <div className="absolute top-4 right-20 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20">
                <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em]">Satellite View</span>
            </div>
        </div>
    );
};
