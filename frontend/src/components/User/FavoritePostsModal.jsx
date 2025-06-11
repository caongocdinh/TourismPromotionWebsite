import React, { useEffect, useState } from 'react';
import { X, Trash2, Heart, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const FavoritePostsModal = ({ isOpen, onClose }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isOpen) {
      const fetchFavoritePosts = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.get('http://localhost:5000/api/favorites/', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setFavorites(response.data.data || []);
        } catch (error) {
          setError(error.response?.data?.error || 'Không thể tải danh sách bài viết yêu thích.');
        } finally {
          setLoading(false);
        }
      };
      fetchFavoritePosts();
    }
  }, [isOpen, token]);

  const handleDeleteFavorite = async (postId, e) => {
    e.preventDefault(); // Prevent Link navigation
    try {
      await axios.delete(`http://localhost:5000/api/favorites/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(favorites.filter((post) => post.id !== postId));
      setError(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Không thể xóa bài viết yêu thích.');
    }
  };

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
        <h2 className="text-2xl font-semibold mb-4">Danh sách bài viết yêu thích</h2>

        {loading ? (
          <p>Đang tải...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : favorites.length === 0 ? (
          <p>Chưa có bài viết yêu thích nào.</p>
        ) : (
          <div className="space-y-4">
            {favorites.map((post) => (
              <div
                key={post.id}
                className="border-b border-gray-200 pb-4 last:border-b-0 p-2 rounded flex justify-between items-center"
              >
                <Link
                  to={`/posts/${post.id}`}
                  className="flex-1 hover:bg-gray-100 rounded"
                  onClick={onClose}
                >
                  <h3 className="text-lg font-medium text-gray-800">{post.title}</h3>
                  <p className="text-sm text-gray-600">
                    Địa điểm: {post.tourist_place_name} ({post.location_name})
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
                <button
                  onClick={(e) => handleDeleteFavorite(post.id, e)}
                  className="text-red-500 hover:text-red-700 ml-2"
                  title="Xóa khỏi danh sách yêu thích"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritePostsModal;