import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AdminPostImages = ({ postId }) => {
  const [images, setImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Lấy danh sách ảnh của bài viết
  useEffect(() => {
    if (!postId) return;
    const fetchImages = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/posts/${postId}`);
        setImages(res.data.data.images || []);
      } catch (err) {
        console.error("Lỗi khi lấy ảnh:", err);
        setImages([]);
      }
    };
    fetchImages();
  }, [postId]);

  // Xử lý chọn file
  const handleFileChange = (e) => {
    setSelectedFiles([...e.target.files]);
  };

  // Kiểm tra trùng lặp vector
  const checkDuplicateVector = async (postId, newVector) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/images/check-duplicate`, {
        postId,
        features: newVector
      });
      return response.data.isDuplicate;
    } catch (err) {
      console.error("Lỗi kiểm tra trùng lặp:", err);
      return false;
    }
  };

  // Upload nhiều ảnh với logic từ script.js
  const handleUpload = async () => {
    if (!selectedFiles.length) {
      toast.error("Vui lòng chọn ảnh để upload!");
      return;
    }

    setUploading(true);
    const results = { success: 0, duplicate: 0, error: 0 };

    try {
      for (const file of selectedFiles) {
        try {
          // Upload ảnh lên Cloudinary và kiểm tra trùng lặp
          const formData = new FormData();
          formData.append("image", file);
          
          const uploadResponse = await axios.post(
            "http://localhost:5000/api/images/upload",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
              params: { postId, folder: "dataset" }
            }
          );

          if (uploadResponse.data.success) {
            console.log(`✅ Gán ảnh vào post ${postId}: ${file.name}`);
            results.success++;
          } else {
            throw new Error(uploadResponse.data.message || "Upload thất bại");
          }

        } catch (err) {
          if (err.response?.data?.isDuplicate) {
            console.log(`⏩ Trùng lặp, bỏ qua: ${file.name}`);
            results.duplicate++;
            toast.error(`Ảnh "${file.name}" đã tồn tại trong bài viết!`);
          } else {
            console.error(`❌ Lỗi upload ${file.name}:`, err.message);
            results.error++;
          }
        }
      }

      // Reload danh sách ảnh sau khi upload xong
      const res = await axios.get(`http://localhost:5000/api/posts/${postId}`);
      setImages(res.data.data.images || []);
      setSelectedFiles([]);

      // Hiển thị kết quả
      if (results.success > 0) {
        toast.success(`Upload hoàn tất: ${results.success} thành công, ${results.duplicate} trùng lặp, ${results.error} lỗi`);
      }

    } catch (err) {
      console.error("Lỗi tổng quát:", err);
      toast.error("Có lỗi xảy ra khi upload ảnh!");
    } finally {
      setUploading(false);
    }
  };

  // Xóa ảnh
  const handleDelete = async (imageId) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa ảnh này?")) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/images/${imageId}`);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Xóa ảnh thành công!");
    } catch (err) {
      console.error("Lỗi khi xóa ảnh:", err);
      toast.error("Lỗi khi xóa ảnh!");
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="text-sm font-semibold mb-3 text-gray-700">
        Quản lý ảnh bài viết #{postId}
      </h3>
      
      {/* Upload section */}
      <div className="mb-4 p-3 bg-white rounded border">
        <div className="flex items-center gap-2 mb-2">
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleFileChange}
            className="text-sm"
            disabled={uploading}
          />
          <button
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
            onClick={handleUpload}
            disabled={uploading || !selectedFiles.length}
          >
            {uploading ? "Đang tải..." : "Thêm ảnh"}
          </button>
        </div>
        {selectedFiles.length > 0 && (
          <div className="text-xs text-gray-600">
            Đã chọn {selectedFiles.length} ảnh
          </div>
        )}
      </div>

      {/* Images grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {images.map((img) => (
          <div key={img.id} className="relative bg-white rounded border overflow-hidden">
            <img 
              src={img.url} 
              alt="" 
              className="w-full h-24 object-cover" 
            />
            <button
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
              onClick={() => handleDelete(img.id)}
              title="Xóa ảnh"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-4">
          Chưa có ảnh nào cho bài viết này
        </div>
      )}
    </div>
  );
};

export default AdminPostImages;