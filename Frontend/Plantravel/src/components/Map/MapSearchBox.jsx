import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search } from 'lucide-react';
import L from 'leaflet';

// Fix for default Leaflet marker icons not showing in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ChangeView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2) {
      map.flyTo(center, 12, { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

const MapSearchBox = ({ destination, onSelect }) => {
  const [query, setQuery] = useState(destination || '');
  const [suggestions, setSuggestions] = useState([]);
  const [position, setPosition] = useState([28.3949, 84.1240]); // Default to Nepal
  const [markerName, setMarkerName] = useState('Nepal');
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length > 2) {
      // Nominatim search
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${debouncedQuery}&limit=5`)
        .then(res => res.json())
        .then(data => {
          setSuggestions(data);
        }).catch(err => console.error("Geocoding failed", err));
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  const handleSelect = (s) => {
    setQuery(s.display_name);
    setSuggestions([]);
    setMarkerName(s.display_name);
    const newPos = [parseFloat(s.lat), parseFloat(s.lon)];
    setPosition(newPos);
    
    // Call parent handler
    if (onSelect) {
      onSelect({
        name: s.display_name,
        lat: s.lat,
        lon: s.lon,
      });
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-[var(--primary)]/10 h-[500px]">
      <div className="absolute top-4 left-16 right-4 z-[400] bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center px-4">
        <Search className="text-gray-400 w-5 h-5 mr-3" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search destination (e.g., Kathmandu)"
          className="w-full py-4 text-gray-800 text-lg outline-none font-medium bg-transparent"
        />
      </div>

      {suggestions.length > 0 && (
        <ul className="absolute top-20 left-4 right-4 z-[400] bg-white rounded-xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <li 
              key={idx} 
              onClick={() => handleSelect(s)}
              className="px-6 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer text-gray-700 flex items-center transition-colors"
            >
              <MapPin className="text-[var(--primary)] w-4 h-4 mr-3 opacity-70" />
              <span className="truncate">{s.display_name}</span>
            </li>
          ))}
        </ul>
      )}

      <MapContainer center={position} zoom={6} scrollWheelZoom={true} className="w-full h-full z-10">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
        </Marker>
        <ChangeView center={position} />
      </MapContainer>
    </div>
  );
};

export default MapSearchBox;
