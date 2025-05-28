import React, { useState } from 'react';

export default function ImageSearchModal({ show, onClose, onResult }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('http://localhost:5000/api/images/search', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setLoading(false);
    onResult(data);
    onClose();
  };

  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-lg">
        <h2 className="text-lg font-bold mb-4">Tìm kiếm bằng hình ảnh</h2>
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} required />
        <div className="mt-4 flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>
          <button type="button" className="px-4 py-2" onClick={onClose}>Đóng</button>
        </div>
      </form>
    </div>
  );
}