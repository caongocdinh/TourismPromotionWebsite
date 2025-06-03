
// src/components/editor/PreviewModal.jsx
import React from 'react';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const PreviewModal = ({ isOpen, onClose, title, categories, content, images, touristPlaces }) => (
  <Modal
    isOpen={isOpen}
    onRequestClose={onClose}
    className="w-full max-w-4xl mx-auto mt-10 bg-gradient-to-br from-gray-200 to-white p-6 rounded-xl shadow-lg animate-modalOpen max-h-[80vh] overflow-y-auto relative transform transition-all duration-300"
    overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
  >
    <button
      onClick={onClose}
      className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-primary hover:bg-primary-light hover:text-white transition-colors"
    >
      ✕
    </button>
    <h2 className="text-2xl font-bold mb-2 text-primary">{title || 'Tiêu đề bài viết'}</h2>
    <p className=" mb-2">
      Danh mục: {categories.length ? categories.map((c) => c.label).join(', ') : 'Chưa chọn danh mục'}
    </p>
    <p className=" mb-4">
      Vị trí: {touristPlaces.length ? touristPlaces.map((p) => p.name).join(', ') : 'Chưa chọn vị trí'}
    </p>
    <div className="prose max-w-none text-primary" dangerouslySetInnerHTML={{ __html: content }} />
    <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-3">
      {images.map((img) => (
        <img
          key={img.id}
          src={img.url}
          alt="Preview"
          className="rounded shadow-sm"
        />
      ))}
    </div>
    <button
      onClick={onClose}
      className="mt-6 px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-md transition-colors"
    >
      Đóng
    </button>
  </Modal>
);

export default PreviewModal;
