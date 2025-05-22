import React, { useState } from 'react';
import { Search } from 'lucide-react';

function Banner() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Search query:', searchQuery);
    // Add logic to filter categories, locations, or tourist places
  };

  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-110 transition-transform duration-1000 ease-out"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')",
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent"></div>
      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 animate-fadeIn">
          Khám Phá Du Lịch Việt Nam
        </h1>
        <p className="text-xl md:text-2xl mb-6 animate-fadeIn delay-200">
          Hành trình trải nghiệm văn hóa và thiên nhiên tuyệt đẹp ở Việt Nam
        </p>
        <form onSubmit={handleSearch} className="flex justify-center mb-6 animate-fadeIn delay-400">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm địa điểm, danh mục..."
              className="w-full p-3 pr-12 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary"
            >
              <Search size={24} />
            </button>
          </div>
        </form>
        <button className="bg-accent text-primary px-8 py-3 rounded-full font-semibold text-lg hover:bg-yellow-500 transition-colors animate-fadeIn delay-600">
          Khám Phá Ngay
        </button>
      </div>
    </section>
  );
}

export default Banner;