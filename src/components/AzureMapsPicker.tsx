import React, { useState, useEffect, useRef } from 'react';
import * as azureMaps from 'azure-maps-control';
import { MapPin, Search, Navigation } from 'lucide-react';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface AzureMapsPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
}

const AzureMapsPicker: React.FC<AzureMapsPickerProps> = ({ 
  onLocationSelect, 
  initialLocation 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<azureMaps.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialLocation || null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const markerRef = useRef<azureMaps.HtmlMarker | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const subscriptionKey = process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY || "";
  const onLocationSelectRef = useRef(onLocationSelect);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  const updateSelectedLocation = React.useCallback(async (lat: number, lng: number) => {
    try {
      const url = `https://atlas.microsoft.com/search/address/reverse/json?api-version=1.0&query=${lat},${lng}&subscription-key=${subscriptionKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const address = data.addresses[0]?.address?.freeformAddress || `${lat}, ${lng}`;
        const newLocation = { lat, lng, address };
        setSelectedLocation(newLocation);
        onLocationSelectRef.current(newLocation);
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  }, [subscriptionKey]);

  useEffect(() => {
    if (!mapRef.current) return;

    const azureMap = new azureMaps.Map(mapRef.current, {
      authOptions: {
        authType: azureMaps.AuthenticationType.subscriptionKey,
        subscriptionKey: subscriptionKey
      },
      center: initialLocation ? [initialLocation.lng, initialLocation.lat] : [77.2090, 28.6139], // Default to Delhi
      zoom: 15, // Closer zoom for better address visibility
      style: 'satellite_road_labels', // High visibility labels
      view: 'Auto'
    });

    azureMap.events.add('ready', () => {
      setMap(azureMap);
      
      azureMap.controls.add([
          new azureMaps.control.ScaleControl(),
          new azureMaps.control.StyleControl({
              mapStyles: ['road', 'satellite', 'satellite_road_labels', 'grayscale_dark']
          })
      ], {
        position: azureMaps.ControlPosition.BottomRight
      });

      azureMap.events.add('click', async (e) => {
        if (e.position) {
          const [lng, lat] = e.position;
          await updateSelectedLocation(lat, lng);
        }
      });
    });

    return () => {
      azureMap.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionKey]);

  useEffect(() => {
    if (map && selectedLocation) {
        if (markerRef.current) {
            markerRef.current.setOptions({ position: [selectedLocation.lng, selectedLocation.lat] });
        } else {
            const marker = new azureMaps.HtmlMarker({
                position: [selectedLocation.lng, selectedLocation.lat],
                color: '#ef4444'
            });
            map.markers.add(marker);
            markerRef.current = marker;
        }
        map.setCamera({ center: [selectedLocation.lng, selectedLocation.lat] });
    }
  }, [map, selectedLocation]);



  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const url = `https://atlas.microsoft.com/search/address/json?api-version=1.0&query=${encodeURIComponent(searchQuery)}&subscription-key=${subscriptionKey}&limit=5`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const results = data.results.map((r: any) => ({
          lat: r.position.lat,
          lng: r.position.lon,
          address: r.address.freeformAddress
        }));
        setSearchResults(results);
        if (results.length > 0 && map) {
          map.setCamera({ 
            center: [results[0].lng, results[0].lat],
            zoom: 15,
            type: 'fly'
          });
        }
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        await updateSelectedLocation(latitude, longitude);
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative" ref={searchContainerRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter hospital address or city..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-docent-primary focus:border-transparent bg-slate-50 text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 font-bold transition-all text-sm"
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto overflow-x-hidden p-2">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedLocation(result);
                  onLocationSelect(result);
                  setSearchResults([]);
                  setSearchQuery('');
                }}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 rounded-xl transition-colors"
              >
                <MapPin className="h-4 w-4 text-docent-primary flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 truncate">{result.address}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Content */}
      <div className="relative bg-white rounded-3xl border border-slate-200 p-2 shadow-inner">
        <div 
          ref={mapRef} 
          className="w-full h-80 rounded-[22px] overflow-hidden"
        />
        
        {/* Floating Controls */}
        <div className="absolute top-5 right-5 flex flex-col gap-2">
          <button 
            onClick={handleLocateMe}
            className="p-3 bg-white text-slate-700 rounded-2xl shadow-xl hover:bg-slate-50 transition-all border border-slate-100 group"
            title="Locate Me"
          >
            <Navigation className="h-5 w-5 group-hover:text-docent-primary" />
          </button>
        </div>

        {/* Selected Info */}
        {selectedLocation && (
          <div className="absolute bottom-5 left-5 right-5 bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-2">
             <div className="h-10 w-10 bg-docent-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-docent-primary" />
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Verified Coordinates</p>
                <p className="text-xs font-bold text-slate-800 truncate">{selectedLocation.address}</p>
             </div>
          </div>
        )}
      </div>
      
      <p className="text-[10px] text-slate-500 font-medium text-center px-4">
        Click anywhere on the map to pin your exact hospital entrance location.
      </p>
    </div>
  );
};

export default AzureMapsPicker;