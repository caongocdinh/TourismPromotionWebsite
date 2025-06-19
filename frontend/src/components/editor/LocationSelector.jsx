import React, { createContext, useContext, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Tạo Context
const LocationContext = createContext({
  places: [],
  setPlaces: () => {},
});

// LocationProvider
const LocationProvider = ({ children, initialPlaces, setPlaces }) => {
  const [places, setPlacesState] = React.useState(initialPlaces || []);

  useEffect(() => {
    if (JSON.stringify(places) !== JSON.stringify(initialPlaces)) {
      setPlacesState(initialPlaces || []);
    }
  }, [initialPlaces]);

  // Đảm bảo mỗi child có key duy nhất
  return (
    <LocationContext.Provider value={{ places, setPlaces: setPlacesState }}>
      {React.Children.toArray(children).map((child, index) =>
        React.cloneElement(child, { key: `provider-child-${index}` })
      )}
    </LocationContext.Provider>
  );
};

// LocationSelector
const LocationSelector = ({
  touristPlaces,
  setTouristPlaces,
  tempPosition,
  setTempPosition,
  searchQuery,
  setSearchQuery,
}) => {
  const { places, setPlaces } = useContext(LocationContext);

  // Debug để kiểm tra dữ liệu
  useEffect(() => {
    console.log('Places:', places);
    console.log('TouristPlaces:', touristPlaces);
  }, [places, touristPlaces]);

  // Tìm kiếm địa điểm
  const handleSearchLocation = async () => {
    if (!searchQuery) return;
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const results = response.data;
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const locationName = extractLocationName(display_name); // Trích xuất location_name
        const cleanedName = cleanLocationName(display_name); // Làm sạch mã bưu điện
        setTempPosition({
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          name: cleanedName, // Sử dụng chuỗi đã làm sạch
          location_name: locationName,
        });
      } else {
        toast.error('Không tìm thấy địa điểm!');
      }
    } catch (err) {
      console.error('Lỗi tìm kiếm:', err);
      toast.error('Lỗi khi tìm kiếm địa điểm!');
    }
  };

  // Thêm vị trí với ID duy nhất hơn
  const handleAddPlace = () => {
    if (!tempPosition) return;
    const newId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`; // ID duy nhất hơn
    const newPlace = {
      id: newId,
      name: tempPosition.name || `Vị trí ${places.length + 1}`,
      lat: tempPosition.lat,
      lng: tempPosition.lng,
      location_name: tempPosition.location_name,
    };
    const updatedPlaces = [...places, newPlace];
    if (JSON.stringify(places) !== JSON.stringify(updatedPlaces)) {
      setPlaces(updatedPlaces);
      setTouristPlaces(updatedPlaces);
    }
    setTempPosition(null);
    setSearchQuery('');
  };

  // Xóa vị trí
  const handleRemovePlace = (id) => {
    const updatedPlaces = places.filter((place) => place.id !== id);
    if (JSON.stringify(places) !== JSON.stringify(updatedPlaces)) {
      setPlaces(updatedPlaces);
      setTouristPlaces(updatedPlaces);
    }
  };

  // Xử lý sự kiện bản đồ
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setTempPosition({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          name: '',
          location_name: '',
        });
      },
    });
    return null;
  };

  // Điều khiển bản đồ
  const MapController = ({ places: contextPlaces, temp }) => {
    const map = useMap();
    const bounds = [
      ...contextPlaces.map((p, index) => [p.lat, p.lng]),
      ...(temp ? [[temp.lat, temp.lng]] : []),
    ];
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([21.0285, 105.8542], 13);
    }
    return null;
  };

  // Hàm trích xuất location_name từ display_name (giữ nguyên logic cũ)
  const extractLocationName = (displayName) => {
    if (!displayName) return "Unknown Location";
    const parts = displayName.split(", ").map(part => part.trim());
    const provinceIndex = parts.indexOf("Vietnam") - 1;
    return provinceIndex >= 0 ? parts[provinceIndex].replace(" Province", "") : parts[parts.length - 2] || "Unknown Location";
  };

  // Hàm làm sạch mã bưu điện
  const cleanLocationName = (displayName) => {
    if (!displayName) return displayName;
    return displayName
      .split(',')
      .map(part => part.trim())
      .filter(part => {
        // Loại bỏ số nguyên (như 94908) và mã bưu điện 5 chữ số
        if (part.match(/^\d+$/) || part.match(/\d{5}/)) return false;
        // Loại bỏ "Vietnam" kèm số (như "Vietnam (94908)")
        if (part.match(/Vietnam.*\d+/i)) return false;
        return true;
      })
      .join(', ')
      .replace(/\s*\(\d+\)\s*$/, '') // Loại bỏ số trong ngoặc ở cuối
      .replace(/,\s*$/, '') // Loại bỏ dấu phẩy thừa ở cuối
      .trim();
  };

  return (
    <div className="lg:w-1/4">
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-md">
        <h3 className="text-lg font-semibold mb-2 text-primary">Chọn vị trí</h3>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm địa điểm (ví dụ: Hà Nội)"
            className="w-full p-3 border border-gray-300 rounded-md text-primary focus:outline-none focus:border-primary-light"
          />
          <button
            onClick={handleSearchLocation}
            className="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-md transition-colors"
          >
            Tìm
          </button>
        </div>
        {tempPosition && (
          <div className="mb-2">
            <p className="text-sm text-primary">
              Vị trí tạm: {tempPosition.name || `${typeof tempPosition.lat === 'number' ? tempPosition.lat.toFixed(4) : 'N/A'}, ${typeof tempPosition.lng === 'number' ? tempPosition.lng.toFixed(4) : 'N/A'}`}
              {tempPosition.location_name && ` (${tempPosition.location_name})`}
            </p>
            <button
              onClick={handleAddPlace}
              className="mt-1 px-3 py-1 bg-accent text-white hover:bg-yellow-500 rounded-md transition-colors text-sm"
            >
              Thêm vị trí
            </button>
          </div>
        )}
        <MapContainer center={[21.0285, 105.8542]} zoom={13} className="h-64 w-full rounded mb-2">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {places.map((place) => (
            <Marker key={place.id} position={[place.lat, place.lng]} />
          ))}
          {tempPosition && <Marker key={`temp-${tempPosition.lat}-${tempPosition.lng}`} position={[tempPosition.lat, tempPosition.lng]} />}
          <MapEvents />
          <MapController places={places} temp={tempPosition} />
        </MapContainer>
        <h4 className="text-sm font-semibold text-primary mb-1">Danh sách vị trí</h4>
        {places.length > 0 ? (
          <ul className="max-h-32 overflow-y-auto">
            {places.map((place) => (
              <li
                key={place.id} // Đảm bảo key duy nhất
                className="flex justify-between items-center text-sm text-primary border-b py-1"
              >
                <span>
                  {place.name} (
                  {typeof place.lat === 'number' && !isNaN(place.lat) ? place.lat.toFixed(4) : 'N/A'},
                  {typeof place.lng === 'number' && !isNaN(place.lng) ? place.lng.toFixed(4) : 'N/A'}
                  )
                  {place.location_name && ` (${place.location_name})`}
                </span>
                <button
                  onClick={() => handleRemovePlace(place.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Chưa có vị trí nào.</p>
        )}
      </div>
    </div>
  );
};

export { LocationProvider, LocationSelector };