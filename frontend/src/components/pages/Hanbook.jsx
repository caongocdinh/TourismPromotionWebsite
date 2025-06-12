import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Handbook = () => {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Danh sách hình ảnh mẫu cho các địa điểm du lịch Việt Nam
  const locationImages = {
    'an giang': 'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=500',
    'kiên giang': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500',
    'cần thơ': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
    'long an': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
    'tiền giang': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500',
    'bến tre': 'https://images.unsplash.com/photo-1580274407945-d5f79b2e9ad1?w=500',
    'trà vinh': 'https://images.unsplash.com/photo-1571406252097-e1e2e5b3e4d0?w=500',
    'vĩnh long': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500',
    'đồng tháp': 'https://images.unsplash.com/photo-1591895862143-c8f8f6b4fdc1?w=500',
    'hậu giang': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
    'sóc trăng': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500',
    'bạc liêu': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
    'cà mau': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500',
  };

  const getLocationImage = (locationName) => {
    const key = locationName.toLowerCase();
    return locationImages[key] || 'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=500';
  };

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/locations/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setLocations(result.data);
        } else {
          throw new Error(result.message || 'Không thể lấy dữ liệu locations');
        }
      } catch (err) {
        console.error('Lỗi khi fetch locations:', err);
        setError(err.message);

        // Fallback data cho demo nếu API không hoạt động
        const mockData = [
          { id: 1, name: 'An Giang' },
          { id: 2, name: 'Bà Rịa - Vũng Tàu' },
          { id: 3, name: 'Bắc Giang' },
          { id: 4, name: 'Bắc Kạn' },
          { id: 5, name: 'Bạc Liêu' },
          { id: 6, name: 'Bắc Ninh' },
          { id: 7, name: 'Bến Tre' },
          { id: 8, name: 'Bình Dương' },
        ];
        setLocations(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleLocationClick = (locationName) => {
    const slug = locationName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/\s+/g, '-');
    navigate(`/hanbook/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error && locations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
            🌍 Cẩm Nang Du Lịch Việt Nam
          </h1>
          <p className="text-center text-gray-600 text-lg">
            Khám phá vẻ đẹp các vùng miền đất nước
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {locations.map((location) => (
            <div
              key={location.id}
              onClick={() => handleLocationClick(location.name)}
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white">
                {/* Image Container */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getLocationImage(location.name)}
                    alt={`Du lịch ${location.name}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                  {/* Location Name Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-white text-xl font-bold mb-1 drop-shadow-lg">
                      Du Lịch {location.name}
                    </h2>
                    <div className="flex items-center text-white/90 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Khám phá ngay
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600 text-sm">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Việt Nam
                    </div>
                    <div className="flex items-center text-blue-500 text-sm font-medium group-hover:text-blue-600">
                      Xem thêm
                      <svg
                        className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Hover Effect Indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {locations.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Chưa có địa điểm nào
            </h3>
            <p className="text-gray-500">
              Hãy thêm các địa điểm du lịch để hiển thị tại đây
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white mt-16 py-8 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            © 2024 Cẩm Nang Du Lịch Việt Nam. Khám phá vẻ đẹp quê hương.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Handbook;