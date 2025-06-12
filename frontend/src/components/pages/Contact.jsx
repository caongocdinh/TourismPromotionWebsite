import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function ContactPage() {



  return (
    <div className="max-w-6xl mx-auto px-4 py-12  gap-8">
      {/* Thông tin liên hệ */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-blue-800">Liên hệ với chúng tôi</h1>
        <p className="text-gray-600">
          Nếu bạn có bất kỳ câu hỏi, góp ý hoặc yêu cầu hỗ trợ, đừng ngần ngại liên hệ với chúng tôi!
        </p>
        <div className="text-gray-700">
          <p><strong>📍 Địa chỉ:</strong> 3/2, Phường Xuân Khánh, Ninh Kiều, Cần Thơ</p>
          <p><strong>📞 Điện thoại:</strong> (028) 1234 5678</p>
          <p><strong>✉️ Email:</strong> info@khamphadulich.com</p>
        </div>

        {/* Bản đồ */}
        <MapContainer
          center={[10.762622, 106.660172]}
          zoom={13}
          scrollWheelZoom={false}
          className="h-64 w-full rounded-lg shadow"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[10.762622, 106.660172]} icon={markerIcon}>
            <Popup>Chúng tôi ở đây!</Popup>
          </Marker>
        </MapContainer>
      </div>

      
    </div>
  );
}
