import React from 'react';
import Banner from './Banner';
import Services from './Services';
import Locations from './Locations'; // New component for Locations
import TouristPlaces from './TouristPlaces'; // New component for Tourist Places

function Homepage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Banner with Search */}
      <Banner />

      {/* Categories Section */}
      <Services />

      {/* Locations Section */}
      <Locations />

      {/* Tourist Places Section */}
      <TouristPlaces />
    </div>
  );
}

export default Homepage;