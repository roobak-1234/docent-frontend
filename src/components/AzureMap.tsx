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
    onMove?: () => void;
    trigger?: number;
    routePoints?: Coordinate[];
}

export const AzureMap: React.FC<AzureMapProps> = ({
    subscriptionKey,
    center = { latitude: 47.6062, longitude: -122.3321 },
    zoom = 10,
    mapStyle = 'satellite_road_labels',
    markers = [],
    ambulances = [],
    onMove,
    trigger = 0,
    routePoints = []
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const skipNextMoveStartRef = useRef(false);
    const [mapInstance, setMapInstance] = useState<azureMaps.Map | null>(null);
    const [dataSource, setDataSource] = useState<azureMaps.source.DataSource | null>(null);
    const lastStyleRef = useRef(mapStyle);

    // Initialize Map
    useEffect(() => {
        if (!mapRef.current) return;

        const map = new azureMaps.Map(mapRef.current, {
            center: [center.longitude, center.latitude],
            zoom: zoom,
            style: mapStyle,
            language: 'en-US',
            authOptions: {
                authType: azureMaps.AuthenticationType.subscriptionKey,
                subscriptionKey: subscriptionKey
            }
        });

        const source = new azureMaps.source.DataSource();

        map.events.add('ready', () => {
            map.sources.add(source);
            setDataSource(source);

            // Add symbol layer for generic markers
            map.layers.add(new azureMaps.layer.SymbolLayer(source, undefined, {
                filter: ['==', '$type', 'Point'],
                iconOptions: {
                    image: ['get', 'icon'],
                    anchor: 'center',
                    allowOverlap: true,
                    size: 1
                },
                textOptions: {
                    textField: ['get', 'title'],
                    offset: [0, 1.2],
                    color: '#ffffff',
                    haloColor: '#000000',
                    haloWidth: 2
                }
            }));

            // Add line layer for routing (Behind layer for shadow/glow)
            map.layers.add(new azureMaps.layer.LineLayer(source, undefined, {
                filter: ['==', '$type', 'LineString'],
                strokeColor: '#0078d4',
                strokeWidth: 8,
                strokeOpacity: 0.4,
                lineJoin: 'round',
                lineCap: 'round'
            }));

            // Main routing line (Front layer)
            map.layers.add(new azureMaps.layer.LineLayer(source, undefined, {
                filter: ['==', '$type', 'LineString'],
                strokeColor: '#60a5fa',
                strokeWidth: 4,
                lineJoin: 'round',
                lineCap: 'round'
            }));

            setMapInstance(map);
        });

        // Detect user initiated movement
           map.events.add('movestart', () => {
               if (skipNextMoveStartRef.current) {
                  skipNextMoveStartRef.current = false;
                  return;
               }
               if (onMove) onMove();
        });

        // Add controls
        map.controls.add([
            new azureMaps.control.ZoomControl(),
            new azureMaps.control.CompassControl(),
            new azureMaps.control.PitchControl(),
            new azureMaps.control.StyleControl({
                mapStyles: ['road', 'satellite', 'satellite_road_labels', 'grayscale_dark']
            } as any)
        ], { position: azureMaps.ControlPosition.TopRight });

        return () => {
            setMapInstance(null);
            setDataSource(null);
            map.dispose();
        };
        // We only want to initialize the map once or when subscriptionKey changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subscriptionKey]);

    // Update Camera when center or zoom changes
    useEffect(() => {
        if (!mapInstance) return;
        try {
            // Ignore the next move start event because this camera movement is app-driven.
            skipNextMoveStartRef.current = true;
            mapInstance.setCamera({
                center: [center.longitude, center.latitude],
                zoom: zoom,
                type: 'jump'
            });
        } catch (e) {
            console.warn("Map camera update failed:", e);
        }
    }, [center.latitude, center.longitude, zoom, mapInstance, trigger]);

    // Update Style
    useEffect(() => {
        if (!mapInstance || lastStyleRef.current === mapStyle) return;
        try {
            lastStyleRef.current = mapStyle;
            mapInstance.setStyle({ style: mapStyle });
        } catch (e) {
            console.warn("Map style update failed - map might not be ready or disposed:", e);
        }
    }, [mapStyle, mapInstance]);

    // Update Markers
    useEffect(() => {
        if (!dataSource || !mapInstance) return;

        try {
            dataSource.clear();

            const points: azureMaps.data.Feature<azureMaps.data.Geometry, any>[] = [];

            // Accident/Static Markers (Hospitals/Clinics)
            markers.forEach(m => {
                const point = new azureMaps.data.Point([m.coordinate.longitude, m.coordinate.latitude]);
                let icon = 'pin-round-darkblue';
                if (m.type === 'hospital') icon = 'pin-round-red';
                if (m.type === 'clinic') icon = 'pin-round-blue';
                if (m.type === 'user') icon = 'pin-round-darkblue';

                const feature = new azureMaps.data.Feature(point, {
                    color: m.type === 'user' ? '#0078d4' : (m.color || 'red'),
                    popup: m.popupContent,
                    icon: icon,
                    title: m.popupContent
                });
                points.push(feature);
            });

            // Ambulance Markers
            ambulances.forEach(a => {
                const point = new azureMaps.data.Point([a.coordinate.longitude, a.coordinate.latitude]);
                const feature = new azureMaps.data.Feature(point, {
                    color: a.status === 'dispatched' ? 'orange' : 'green',
                    type: 'ambulance',
                    icon: 'pin-round-blue',
                    title: `My Ambulance (${a.id})`
                });
                points.push(feature);
            });

            // Add Route Line and Route Markers
            if (routePoints && routePoints.length > 1) {
                const coords = routePoints.map(p => [p.longitude, p.latitude]);
                if (coords.every(c => c[0] !== undefined && c[1] !== undefined)) {
                    // The actual route line
                    const lines = new azureMaps.data.LineString(coords);
                    const routeFeature = new azureMaps.data.Feature(lines, {
                        type: 'route'
                    });
                    points.push(routeFeature);

                    // Start Marker (Origin)
                    const startPoint = new azureMaps.data.Point(coords[0] as [number, number]);
                    points.push(new azureMaps.data.Feature(startPoint, {
                        icon: 'pin-round-blue',
                        title: 'Current Position'
                    }));

                    // End Marker (Destination)
                    const endPoint = new azureMaps.data.Point(coords[coords.length - 1] as [number, number]);
                    points.push(new azureMaps.data.Feature(endPoint, {
                        icon: 'pin-round-red',
                        title: 'Hospital Destination'
                    }));
                }
            }

            dataSource.add(points);
        } catch (e) {
            console.error("Error updating map data source:", e);
        }

    }, [markers, ambulances, routePoints, dataSource, mapInstance]);

    return (
        <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '8px' }} />
    );
};
