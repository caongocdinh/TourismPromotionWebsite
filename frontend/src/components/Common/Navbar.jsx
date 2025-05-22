import React from 'react';

function Navbar() {
  return (
    <nav className="sticky top-0 bg-primary text-white shadow-lg z-20">
      <div className="container mx-auto flex justify-between items-center p-4">
        <div className="flex items-center space-x-2">
          <img
            src="https://via.placeholder.com/100x40?text=TOLF+TOUR+HEN"
            alt="Logo TOLF TOUR HEN"
            className="h-8"
          />
          <span className="text-xl font-semibold">TOLF TOUR HEN</span>
        </div>
        <ul className="flex space-x-6">
          {['Trang chủ', 'Cẩm nang', 'Tour mới', 'Khách sạn', 'Liên hệ'].map((item, index) => (
            <li key={index}>
              <a
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="relative text-sm uppercase font-medium hover:text-accent transition-colors duration-300 group"
              >
                {item}
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full"></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;