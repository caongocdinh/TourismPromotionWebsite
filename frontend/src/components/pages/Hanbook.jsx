import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Hanbook = () => {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations');
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        const data = await response.json();
        setLocations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleLocationClick = (locationName) => {
    const slug = locationName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/cam-nang/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Cẩm Nang Du Lịch
          </h1>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {locations.map((location) => (
              <div
                key={location.id}
                onClick={() => handleLocationClick(location.name)}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="bg-blue-100 h-32 flex items-center justify-center">
                  <span className="text-blue-600 text-xl font-semibold">
                    {location.name.charAt(0).toUpperCase() + location.name.slice(1)}
                  </span>
                </div>
                <div className="p-4 text-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Du Lịch {location.name}
                  </h2>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default Hanbook;