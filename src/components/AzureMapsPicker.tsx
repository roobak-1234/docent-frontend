import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import * as azureMaps from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface AzureMapsPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
}

const AzureMapsPicker: React.FC<AzureMapsPickerProps> = ({ onLocationSelect, initialLocation }) => {
  const subscriptionKey = process.env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY || '';
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<azureMaps.Map | null>(null);
  const markerRef = useRef<azureMaps.HtmlMarker | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<LocationData | null>(initialLocation || null);
  const [mapReady, setMapReady] = useState(false);

  // Init map
  useEffect(() => {
    if (!mapRef.current || !subscriptionKey) return;

    const map = new azureMaps.Map(mapRef.current, {
      center: initialLocation ? [initialLocation.lng, initialLocation.lat] : [78.9629, 20.5937],
      zoom: initialLocation ? 14 : 4,
      style: 'road',
      language: 'en-US',
      authOptions: { authType: azureMaps.AuthenticationType.subscriptionKey, subscriptionKey }
    });

    map.events.add('ready', () => {
      map.controls.add([new azureMaps.control.ZoomControl()], { position: azureMaps.ControlPosition.TopRight });

      // Click to drop pin
      map.events.add('click', (e: any) => {
        const pos = e.position as [number, number];
        if (!pos) return;
        const loc: LocationData = { lat: pos[1], lng: pos[0], address: `${pos[1].toFixed(5)}, ${pos[0].toFixed(5)}` };
        placeMarker(map, pos[0], pos[1]);
        setSelected(loc);
        onLocationSelect(loc);

        // Reverse geocode
        if (subscriptionKey) {
          fetch(`https://atlas.microsoft.com/search/address/reverse/json?api-version=1.0&subscription-key=${subscriptionKey}&query=${pos[1]},${pos[0]}`)
            .then(r => r.json())
            .then(data => {
              const addr = data?.addresses?.[0]?.address?.freeformAddress;
              if (addr) {
                const updated = { lat: pos[1], lng: pos[0], address: addr };
                setSelected(updated);
                onLocationSelect(updated);
              }
            }).catch(() => {});
        }
      });

      setMapReady(true);
    });

    mapInstanceRef.current = map;

    return () => {
      markerRef.current = null;
      map.dispose();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionKey]);

  const placeMarker = (map: azureMaps.Map, lng: number, lat: number) => {
    if (markerRef.current) map.markers.remove(markerRef.current);
    const marker = new azureMaps.HtmlMarker({
      position: [lng, lat],
      htmlContent: `<div style="width:24px;height:24px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
      anchor: 'bottom-left'
    });
    map.markers.add(marker);
    markerRef.current = marker;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !subscriptionKey) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const url = `https://atlas.microsoft.com/search/address/json?api-version=1.0&subscription-key=${subscriptionKey}&query=${encodeURIComponent(searchQuery)}&limit=5`;
      const res = await fetch(url);
      const data = await res.json();
      const results: LocationData[] = (data.results || []).map((r: any) => ({
        lat: r.position.lat,
        lng: r.position.lon,
        address: r.address.freeformAddress
      }));
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (loc: LocationData) => {
    setSelected(loc);
    setSearchResults([]);
    setSearchQuery('');
    onLocationSelect(loc);
    const map = mapInstanceRef.current;
    if (map && mapReady) {
      map.setCamera({ center: [loc.lng, loc.lat], zoom: 15, type: 'ease', duration: 500 });
      placeMarker(map, loc.lng, loc.lat);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search hospital address..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-lifelink-primary text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm font-medium flex items-center gap-1"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
            {searchResults.map((r, i) => (
              <button key={i} type="button" onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start gap-2">
                <MapPin className="h-4 w-4 text-lifelink-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{r.address}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      {subscriptionKey ? (
        <div ref={mapRef} className="w-full h-64 rounded-lg border border-gray-200 overflow-hidden" />
      ) : (
        <div className="w-full h-64 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-400">Map unavailable — configure REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY</p>
        </div>
      )}

      <p className="text-xs text-gray-500 flex items-center gap-1">
        <MapPin className="h-3 w-3" /> Search for an address or click on the map to drop a pin
      </p>

      {selected && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-start gap-2">
          <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">{selected.address}</p>
            <p className="text-xs text-green-600 mt-0.5">{selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AzureMapsPicker;
