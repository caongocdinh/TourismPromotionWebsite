
// src/components/editor/Header.jsx
import { ArrowBigLeft, ArrowLeft } from 'lucide-react';
import React from 'react';
import Loading from '../Common/Loading';

const Header = ({ onPreview, onPublish, isPublishing }) => (
  <div className="flex px-20 py-4 justify-between items-center bg-white shadow-lg sticky top-0 z-50">
    <a
      href="/"
      className=" text-primary-light hover:text-primary rounded-md transition-colors"
    >
      <ArrowLeft/>
    </a>
    <h1 className="text-2xl font-bold text-primary">TẠO BÀI VIẾT MỚI</h1>
    <div className="flex gap-2">
      <button
        onClick={onPreview}
        className="px-4 py-2 text-primary hover:bg-primary-light hover:text-white rounded-md transition-colors"
      >
        Xem trước
      </button>
      <button
        onClick={onPublish}
        className="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-md transition-colors animate-fadeIn flex items-center gap-2"
        disabled={isPublishing}
      >
        {isPublishing && (
        <Loading size="sm" color="white" />
        )}
        {isPublishing ? "Đang xuất bản..." : "Xuất bản"}
      </button>
    </div>
  </div>
);

export default Header;
