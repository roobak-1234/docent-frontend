import { useState, useEffect, useCallback } from 'react';

interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface UseGeolocationStreamOptions {
  onLocationUpdate?: (location: GeolocationData) => void;
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  updateInterval?: number;
}

export const useGeolocationStream = (options: UseGeolocationStreamOptions = {}) => {
  const {
    onLocationUpdate,
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000
  } = options;

  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const updateLocation = useCallback((position: GeolocationPosition) => {
    const locationData: GeolocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };

    setLocation(locationData);
    setError(null);

    // Critical: This reduces the "blind spot" between ambulance and ER
    // Real-time location streaming enables hospitals to prepare for incoming patients
    if (onLocationUpdate) {
      onLocationUpdate(locationData);
    }
  }, [onLocationUpdate]);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Location access denied';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
    }
    setError(errorMessage);
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsTracking(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(updateLocation, handleError, options);

    // Set up continuous tracking
    const watchId = navigator.geolocation.watchPosition(updateLocation, handleError, options);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  }, [enableHighAccuracy, timeout, maximumAge, updateLocation, handleError]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  useEffect(() => {
    if (isTracking) {
      const cleanup = startTracking();
      return cleanup;
    }
  }, [isTracking, startTracking]);

  return {
    location,
    error,
    isTracking,
    startTracking: () => setIsTracking(true),
    stopTracking
  };
};