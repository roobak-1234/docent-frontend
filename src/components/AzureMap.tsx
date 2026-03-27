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
    }>;
    ambulances?: Array<{
        id: string;
        coordinate: Coordinate;
        status: 'idle' | 'dispatched';
    }>;
}

export const AzureMap: React.FC<AzureMapProps> = ({
    subscriptionKey,
    center = { latitude: 47.6062, longitude: -122.3321 },
    zoom = 10,
    markers = [],
    ambulances = []
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<azureMaps.Map | null>(null);
    const [dataSource, setDataSource] = useState<azureMaps.source.DataSource | null>(null);

    // Initialize Map
    useEffect(() => {
        if (!mapRef.current) return;

        const map = new azureMaps.Map(mapRef.current, {
            center: [center.longitude, center.latitude],
            zoom: zoom,
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
                iconOptions: {
                    image: 'pin-round-darkblue',
                    anchor: 'center',
                    allowOverlap: true
                }
            }));

            setMapInstance(map);
        });

        // Add controls
        map.controls.add([
            new azureMaps.control.ZoomControl(),
            new azureMaps.control.CompassControl(),
            new azureMaps.control.PitchControl()
        ], { position: azureMaps.ControlPosition.TopRight });

        return () => {
            map.dispose();
        };
    }, [subscriptionKey, center.latitude, center.longitude, zoom]);

    // Update Markers
    useEffect(() => {
        if (!dataSource || !mapInstance) return;

        dataSource.clear();

        const points: azureMaps.data.Feature<azureMaps.data.Geometry, any>[] = [];

        // Accident/Static Markers
        markers.forEach(m => {
            const point = new azureMaps.data.Point([m.coordinate.longitude, m.coordinate.latitude]);
            const feature = new azureMaps.data.Feature(point, {
                color: m.color || 'red',
                popup: m.popupContent
            });
            points.push(feature);
        });

        // Ambulance Markers
        ambulances.forEach(a => {
            const point = new azureMaps.data.Point([a.coordinate.longitude, a.coordinate.latitude]);
            const feature = new azureMaps.data.Feature(point, {
                color: a.status === 'dispatched' ? 'orange' : 'green',
                type: 'ambulance'
            });
            points.push(feature);
        });

        dataSource.add(points);

    }, [markers, ambulances, dataSource, mapInstance]);

    return (
        <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '8px' }} />
    );
};
