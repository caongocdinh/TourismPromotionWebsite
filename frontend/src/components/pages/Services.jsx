import React from 'react';

function Services() {
  const categories = [
    {
      title: 'Địa điểm du lịch',
      description: 'Khám phá các điểm đến nổi tiếng tại Việt Nam.',
      image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
    },
    {
      title: 'Di sản văn hóa',
      description: 'Tìm hiểu về các di sản văn hóa độc đáo.',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
    },
    {
      title: 'Ẩm thực',
      description: 'Thưởng thức những món ăn đặc sản địa phương.',
      image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
    },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary">Danh Mục Nổi Bật</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div
              key={index}
              className="relative bg-gray-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 group"
            >
              <img
                src={category.image}
                alt={category.title}
                className="w-full h-48 object-cover rounded-t-md mb-2 transition-transform duration-300 group-hover:scale-105"
              />
              <h3 className="text-xl font-semibold mb-2 text-primary">{category.title}</h3>
              <p className="text-gray-600">{category.description}</p>
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Services;