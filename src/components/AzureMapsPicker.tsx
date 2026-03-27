import React, { useState } from 'react';
import { MapPin, Search } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialLocation || null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);

  // Mock Azure Maps Search Service - Replace with actual Azure Maps API
  const searchLocations = async (query: string): Promise<LocationData[]> => {
    setIsSearching(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock search results - In production, use Azure Maps Search API
    const mockResults: LocationData[] = [
      {
        lat: 40.7589,
        lng: -73.9851,
        address: `${query} Medical Center, New York, NY 10019`
      },
      {
        lat: 40.7505,
        lng: -73.9934,
        address: `${query} Hospital, New York, NY 10018`
      },
      {
        lat: 40.7614,
        lng: -73.9776,
        address: `${query} Emergency Center, New York, NY 10022`
      }
    ];
    
    setIsSearching(false);
    return mockResults;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    const results = await searchLocations(searchQuery);
    setSearchResults(results);
  };

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    setSearchResults([]);
    onLocationSelect(location);
  };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Mock map click coordinates - In production, use Azure Maps click event
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel coordinates to lat/lng (mock calculation)
    const lat = 40.7589 + (y - 200) * 0.0001;
    const lng = -73.9851 + (x - 300) * 0.0001;
    
    const location: LocationData = {
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    };
    
    handleLocationSelect(location);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for hospital address..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lifelink-primary focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-lifelink-primary text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleLocationSelect(result)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-lifelink-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{result.address}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative">
        <div
          onClick={handleMapClick}
          className="w-full h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair relative overflow-hidden"
        >
          {/* Mock Map Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
            <div className="absolute inset-0 opacity-20">
              {/* Grid pattern to simulate map */}
              <div className="grid grid-cols-8 grid-rows-6 h-full">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border border-gray-200"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Location Pin */}
          {selectedLocation && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full">
              <MapPin className="h-8 w-8 text-red-500 drop-shadow-lg" />
            </div>
          )}

          {/* Instructions */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Click to drop a pin or search above</p>
              <p className="text-xs text-gray-400 mt-1">Azure Maps Integration</p>
            </div>
          </div>
        </div>

        {/* Selected Location Info */}
        {selectedLocation && (
          <div className="mt-3 p-3 bg-lifelink-card rounded-lg border border-lifelink-primary/20">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-lifelink-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-lifelink-text">Selected Location</p>
                <p className="text-xs text-gray-600">{selectedLocation.address}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Coordinates: {selectedLocation.lat}, {selectedLocation.lng}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AzureMapsPicker;