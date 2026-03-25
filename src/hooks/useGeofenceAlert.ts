
import { useState, useEffect } from 'react';

export type AlertLevel = 'NONE' | 'INFO' | 'WARNING' | 'CRITICAL';

interface GeofenceAlert {
    level: AlertLevel;
    message: string;
    distanceToJunction: number; // meters
    ambulanceId?: string;
}

export const useGeofenceAlert = (junctionId: string) => {
    const [alert, setAlert] = useState<GeofenceAlert>({
        level: 'NONE',
        message: 'No active ambulances in range.',
        distanceToJunction: -1
    });

    useEffect(() => {
        // MOCK: Simulate connecting to Azure SignalR
        console.log(`[GeofenceMonitor] Connecting to SignalR for Junction ${junctionId}...`);

        const interval = setInterval(() => {
            // Randomly trigger alerts to demonstrate UI
            const rand = Math.random();
            if (rand > 0.9) {
                setAlert({
                    level: 'CRITICAL',
                    message: 'AMBULANCE APPROACHING - 300m - CLEAR INTERSECTION IMMEDIATELY',
                    distanceToJunction: 300,
                    ambulanceId: 'AMB-001'
                });
            } else if (rand > 0.7) {
                setAlert({
                    level: 'WARNING',
                    message: 'Ambulance En Route - 1.2km via Main St',
                    distanceToJunction: 1200,
                    ambulanceId: 'AMB-001'
                });
            } else {
                // mostly stay quiet
                // Uncomment below to clear alerts automatically, or leave them for effect
                // setAlert({ level: 'NONE', message: 'Monitoring active...', distanceToJunction: -1 }); 
            }
        }, 5000); // Check every 5s

        return () => clearInterval(interval);
    }, [junctionId]);

    // Function to manually acknowledge/mute alert
    const acknowledgeAlert = () => {
        setAlert({
            level: 'NONE',
            message: 'Alert acknowledged. Monitoring active.',
            distanceToJunction: -1
        });
    };

    return { alert, acknowledgeAlert };
};
