
// // src/components/editor/LocationSelector.jsx
// import React from 'react';
// import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
// import axios from 'axios';
// import toast from 'react-hot-toast';
// import { Trash2 } from 'lucide-react';
// import 'leaflet/dist/leaflet.css';

// const LocationSelector = ({
//   touristPlaces,
//   setTouristPlaces,
//   tempPosition,
//   setTempPosition,
//   searchQuery,
//   setSearchQuery,
// }) => {
//   // Tìm kiếm địa điểm
//   const handleSearchLocation = async () => {
//     if (!searchQuery) return;
//     try {
//       const response = await axios.get(
//         `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
//       );
//       const results = response.data;
//       if (results.length > 0) {
//         const { lat, lon, display_name } = results[0];
//         setTempPosition({ lat: parseFloat(lat), lng: parseFloat(lon), name: display_name });
//       } else {
//         toast.error('Không tìm thấy địa điểm!');
//       }
//     } catch (err) {
//       console.error('Lỗi tìm kiếm:', err);
//       toast.error('Lỗi khi tìm kiếm địa điểm!');
//     }
//   };

//   // Thêm vị trí
//   const handleAddPlace = () => {
//     if (!tempPosition) return;
//     setTouristPlaces([
//       ...touristPlaces,
//       {
//         id: Date.now().toString(),
//         name: tempPosition.name || `Vị trí ${touristPlaces.length + 1}`,
//         lat: tempPosition.lat,
//         lng: tempPosition.lng,
//       },
//     ]);
//     setTempPosition(null);
//     setSearchQuery('');
//   };

//   // Xóa vị trí
//   const handleRemovePlace = (id) => {
//     setTouristPlaces(touristPlaces.filter((place) => place.id !== id));
//   };

//   // Xử lý sự kiện bản đồ
//   const MapEvents = () => {
//     useMapEvents({
//       click(e) {
//         setTempPosition({
//           lat: e.latlng.lat,
//           lng: e.latlng.lng,
//           name: '',
//         });
//       },
//     });
//     return null;
//   };

//   // Điều khiển bản đồ
//   const MapController = ({ places, temp }) => {
//     const map = useMap();
//     const bounds = [
//       ...places.map((p) => ([p.lat, p.lng])),
//       ...temp ? [[temp.lat, temp.lng]] : [],
//     ];
//     if (bounds.length > 0) {
//       map.fitBounds(bounds, { padding: [50, 50] });
//     } else {
//       map.setView([21.0285, 105.8542], 13);
//     }
//     return null;
//   };

//   return (
//     <div className="lg:w-1/4">
//       <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-md">
//         <h3 className="text-lg font-semibold mb-2 text-primary">Chọn vị trí</h3>
//         <div className="flex items-center gap-2 mb-2">
//           <input
//             type="text"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             placeholder="Tìm địa điểm (ví dụ: Hà Nội)"
//             className="w-full p-3 border border-gray-300 rounded-md text-primary focus:outline-none focus:border-primary-light"
//           />
//           <button
//             onClick={handleSearchLocation}
//             className="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-md transition-colors"
//           >
//             Tìm
//           </button>
//         </div>
//         {tempPosition && (
//           <div className="mb-2">
//             <p className="text-sm text-primary">
//               Vị trí tạm: {tempPosition.name || `${tempPosition.lat.toFixed(4)}, ${tempPosition.lng.toFixed(4)}`}
//             </p>
//             <button
//               onClick={handleAddPlace}
//               className="mt-1 px-3 py-1 bg-accent text-white hover:bg-yellow-500 rounded-md transition-colors text-sm"
//             >
//               Thêm vị trí
//             </button>
//           </div>
//         )}
//         <MapContainer center={[21.0285, 105.8542]} zoom={13} className="h-64 w-full rounded mb-2">
//           <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//           {touristPlaces.map((place) => (
//             <Marker key={place.id} position={[place.lat, place.lng]} />
//           ))}
//           {tempPosition && <Marker position={[tempPosition.lat, tempPosition.lng]} />}
//           <MapEvents />
//           <MapController places={touristPlaces} temp={tempPosition} />
//         </MapContainer>
//         <h4 className="text-sm font-semibold text-primary mb-1">Danh sách vị trí</h4>
//         {touristPlaces.length > 0 ? (
//           <ul className="max-h-32 overflow-y-auto">
//             {touristPlaces.map((place) => (
//               <li
//                 key={place.id}
//                 className="flex justify-between items-center text-sm text-primary border-b py-1"
//               >
//                 <span>{place.name} ({place.lat.toFixed(4)}, {place.lng.toFixed(4)})</span>
//                 <button
//                   onClick={() => handleRemovePlace(place.id)}
//                   className="text-red-500 hover:text-red-700"
//                 >
//                   <Trash2 size={16} />
//                 </button>
//               </li>
//             ))}
//           </ul>
//         ) : (
//           <p className="text-sm text-gray-500">Chưa có vị trí nào.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default LocationSelector;


import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Hàm trích xuất location_name từ display_name
const extractLocationName = (displayName) => {
  if (!displayName) return "Unknown Location";
  const parts = displayName.split(", ").map(part => part.trim());
  const provinceIndex = parts.indexOf("Vietnam") - 1;
  return provinceIndex >= 0 ? parts[provinceIndex].replace(" Province", "") : parts[parts.length - 2] || "Unknown Location";
};

const LocationSelector = ({
  touristPlaces,
  setTouristPlaces,
  tempPosition,
  setTempPosition,
  searchQuery,
  setSearchQuery,
}) => {
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
        const locationName = extractLocationName(display_name);
        setTempPosition({
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          name: display_name,
          location_name: locationName
        });
      } else {
        toast.error('Không tìm thấy địa điểm!');
      }
    } catch (err) {
      console.error('Lỗi tìm kiếm:', err);
      toast.error('Lỗi khi tìm kiếm địa điểm!');
    }
  };

  // Thêm vị trí
  const handleAddPlace = () => {
    if (!tempPosition) return;
    setTouristPlaces([
      ...touristPlaces,
      {
        id: Date.now().toString(),
        name: tempPosition.name || `Vị trí ${touristPlaces.length + 1}`,
        lat: tempPosition.lat,
        lng: tempPosition.lng,
        location_name: tempPosition.location_name
      },
    ]);
    setTempPosition(null);
    setSearchQuery('');
  };

  // Xóa vị trí
  const handleRemovePlace = (id) => {
    setTouristPlaces(touristPlaces.filter((place) => place.id !== id));
  };

  // Xử lý sự kiện bản đồ
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setTempPosition({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          name: '',
          location_name: ''
        });
      },
    });
    return null;
  };

  // Điều khiển bản đồ
  const MapController = ({ places, temp }) => {
    const map = useMap();
    const bounds = [
      ...places.map((p) => ([p.lat, p.lng])),
      ...temp ? [[temp.lat, temp.lng]] : [],
    ];
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([21.0285, 105.8542], 13);
    }
    return null;
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
              Vị trí tạm: {tempPosition.name || `${tempPosition.lat.toFixed(4)}, ${tempPosition.lng.toFixed(4)}`}
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
          {touristPlaces.map((place) => (
            <Marker key={place.id} position={[place.lat, place.lng]} />
          ))}
          {tempPosition && <Marker position={[tempPosition.lat, tempPosition.lng]} />}
          <MapEvents />
          <MapController places={touristPlaces} temp={tempPosition} />
        </MapContainer>
        <h4 className="text-sm font-semibold text-primary mb-1">Danh sách vị trí</h4>
        {touristPlaces.length > 0 ? (
          <ul className="max-h-32 overflow-y-auto">
            {touristPlaces.map((place) => (
              <li
                key={place.id}
                className="flex justify-between items-center text-sm text-primary border-b py-1"
              >
                <span>
                  {place.name} ({place.lat.toFixed(4)}, {place.lng.toFixed(4)})
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

export default LocationSelector;
