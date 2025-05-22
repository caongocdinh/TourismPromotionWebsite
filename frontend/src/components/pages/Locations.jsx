import React from 'react';

function Locations() {
  const locations = [
    {
      name: 'Cần Thơ',
      description: 'Thành phố bên sông Hậu với chợ nổi Cái Răng nổi tiếng.',
      image: 'https://images.unsplash.com/photo-1599391680103-43ce87a4d76e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
    },
    {
      name: 'An Giang',
      description: 'Vùng đất của rừng tràm Trà Sư và lễ hội đua bò.',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
    },
    {
      name: 'Kiên Giang',
      description: 'Quần đảo Phú Quốc với biển xanh và hải sản tươi ngon.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80',
    },
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary">Địa Điểm Nổi Bật</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {locations.map((location, index) => (
            <div
              key={index}
              className="relative bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 group"
            >
              <img
                src={location.image}
                alt={location.name}
                className="w-full h-48 object-cover rounded-t-md mb-2 transition-transform duration-300 group-hover:scale-105"
              />
              <h3 className="text-xl font-semibold mb-2 text-primary">{location.name}</h3>
              <p className="text-gray-600">{location.description}</p>
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Locations;