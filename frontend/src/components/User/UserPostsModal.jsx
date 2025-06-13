import React, { useEffect, useState } from "react";
import { X, Heart, MessageCircle } from "lucide-react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const UserPostsModal = ({ isOpen, onClose }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isOpen) {
      const fetchUserPosts = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.get(
            "http://localhost:5000/api/posts/user",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setPosts(response.data.data || []);
        } catch (error) {
          setError(
            error.response?.data?.error || "Không thể tải danh sách bài viết."
          );
        } finally {
          setLoading(false);
        }
      };
      fetchUserPosts();
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-semibold mb-4">Bài viết của bạn</h2>

        {loading ? (
          <p>Đang tải...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : posts.length === 0 ? (
          <p>Chưa có bài viết nào.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/posts/${post.id}`}
                className="block border-b border-gray-200 pb-4 last:border-b-0 hover:bg-gray-100 p-2 rounded"
                onClick={onClose}
              >
                <h3 className="text-lg font-medium text-gray-800">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600">
                  Địa điểm: {post.tourist_place_name} ({post.location_name})
                </p>
                <p className="text-sm text-gray-600">
                  Trạng thái:{" "}
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      post.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : post.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {post.status === "pending"
                      ? "Đang chờ duyệt"
                      : post.status === "approved"
                      ? "Đã được duyệt"
                      : "Đã bị từ chối"}
                  </span>
                </p>
                <div className="flex gap-2 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Heart size={16} /> {post.favorites_count} lượt thích
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={16} /> {post.comments_count} bình luận
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPostsModal;
