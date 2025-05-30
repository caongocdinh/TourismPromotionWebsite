
// src/components/editor/Header.jsx
import React from 'react';

const Header = ({ onPreview, onPublish }) => (
  <div className="flex justify-between items-center p-4 bg-white shadow-lg sticky top-0 z-50">
    <a
      href="/dashboard"
      className="px-4 py-2 text-primary hover:bg-primary-light hover:text-white rounded-md transition-colors"
    >
      Quay lại
    </a>
    <h1 className="text-xl font-bold text-primary">Tạo bài viết mới</h1>
    <div className="flex gap-2">
      <button
        onClick={onPreview}
        className="px-4 py-2 text-primary hover:bg-primary-light hover:text-white rounded-md transition-colors"
      >
        Xem trước
      </button>
      <button
        onClick={onPublish}
        className="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-md transition-colors animate-fadeIn"
      >
        Xuất bản
      </button>
    </div>
  </div>
);

export default Header;
