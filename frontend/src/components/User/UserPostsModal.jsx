import React, { useEffect, useState } from 'react';
import { X, Heart, MessageCircle, Edit } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import PostEditor from '../Admin/PostEditor';

const UserPostsModal = ({ isOpen, onClose }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const { token } = useSelector((state) => state.auth);

  const fetchUserPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/posts/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.error || 'Không thể tải danh sách bài viết.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !editingPost) {
      fetchUserPosts();
    }
  }, [isOpen, token, editingPost]);

  const handleSavePost = () => {
    setEditingPost(null);
    fetchUserPosts();
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
  };

  if (!isOpen) return null;

  if (editingPost) {
    console.log('Editing post:', editingPost);
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <PostEditor
            post={editingPost}
            onClose={handleCancelEdit}
            onSave={handleSavePost}
          />
        </div>
      </div>
    );
  }

  return (
    <div className=" pt-40 fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
              <div
                key={post.id}
                className="block border-b border-gray-200 pb-4 last:border-b-0 hover:bg-gray-100 p-2 rounded"
              >
                <div className="flex justify-between items-center">
                  <Link
                    to={`/posts/${post.id}`}
                    className="text-lg font-medium text-gray-800 hover:underline"
                    onClick={onClose}
                  >
                    {post.title}
                  </Link>
                  <button
                    className="ml-2 px-2 py-1 text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    onClick={e => { e.stopPropagation(); setEditingPost(post); }}
                    title="Chỉnh sửa bài viết"
                  >
                    <Edit size={18} /> Chỉnh sửa
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Địa điểm: {post.tourist_place_name} ({post.location_name})
                </p>
                <p className="text-sm text-gray-600">
                  Trạng thái:{' '}
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      post.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : post.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {post.status === 'pending'
                      ? 'Đang chờ duyệt'
                      : post.status === 'approved'
                      ? 'Đã được duyệt'
                      : 'Đã bị từ chối'}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPostsModal;
