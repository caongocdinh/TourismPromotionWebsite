
import React, { useEffect, useState } from 'react';
import { X, Heart, MessageCircle, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import sanitizeHtml from 'sanitize-html';

const UserPostsModal = ({ isOpen, onClose }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentError, setCommentError] = useState(null);
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isOpen) {
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
      fetchUserPosts();
    }
  }, [isOpen, token]);

  useEffect(() => {
    if (selectedPost) {
      const fetchComments = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/comments/post/${selectedPost.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setComments(response.data.data || []);
        } catch (error) {
          setError(error.response?.data?.error || 'Không thể tải danh sách bình luận.');
        }
      };
      fetchComments();
    }
  }, [selectedPost, token]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Vui lòng đăng nhập để bình luận.');
      return;
    }
    if (!newComment.trim()) {
      setCommentError('Nội dung bình luận không được để trống.');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/comments/add',
        { post_id: selectedPost.id, content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments([response.data.data, ...comments]);
      setNewComment('');
      setCommentError(null);
      setPosts(
        posts.map((post) =>
          post.id === selectedPost.id
            ? { ...post, comments_count: parseInt(post.comments_count) + 1 }
            : post
        )
      );
    } catch (error) {
      setCommentError(error.response?.data?.error || 'Không thể thêm bình luận.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`http://localhost:5000/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(comments.filter((comment) => comment.id !== commentId));
      setPosts(
        posts.map((post) =>
          post.id === selectedPost.id
            ? { ...post, comments_count: parseInt(post.comments_count) - 1 }
            : post
        )
      );
      setError(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Không thể xóa bình luận.');
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
        <h2 className="text-2xl font-semibold mb-4">
          {selectedPost ? 'Chi tiết bài viết' : 'Bài viết của bạn'}
        </h2>

        {selectedPost ? (
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="text-xl font-bold">{selectedPost.title}</h3>
            <p className="text-sm text-gray-600">
              Địa điểm: {selectedPost.tourist_place_name} ({selectedPost.location_name})
            </p>
            <p className="text-sm text-gray-600">Trạng thái: {selectedPost.status}</p>
            <div className="flex gap-4 mb-4">
              <span className="flex items-center gap-1 text-gray-600">
                <Heart size={16} /> {selectedPost.favorites_count} lượt yêu thích
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                <MessageCircle size={16} /> {selectedPost.comments_count} bình luận
              </span>
            </div>
            <div
              className="prose max-w-none text-primary mb-4"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(selectedPost.content, {
                  allowedTags: ['p', 'img', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
                  allowedAttributes: { img: ['src', 'alt'] },
                }),
              }}
            />
            <button
              onClick={() => setSelectedPost(null)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Quay lại danh sách
            </button>

            {/* Phần bình luận */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-2">Bình luận</h4>
              {token ? (
                <form onSubmit={handleAddComment} className="mb-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Nhập bình luận của bạn..."
                    className="w-full p-2 border rounded"
                    rows="4"
                  />
                  {commentError && <p className="text-red-500 text-sm mt-1">{commentError}</p>}
                  <button
                    type="submit"
                    className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
                  >
                    Gửi bình luận
                  </button>
                </form>
              ) : (
                <p className="text-gray-600 mb-4">Vui lòng đăng nhập để bình luận.</p>
              )}
              {comments.length === 0 ? (
                <p>Chưa có bình luận nào.</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border-b border-gray-200 pb-2 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{comment.user_name}</p>
                        <p className="text-sm text-gray-600">{comment.content}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      {(comment.user_id === user?.id || user?.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Xóa bình luận"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
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
                    className="border-b border-gray-200 pb-4 last:border-b-0 cursor-pointer hover:bg-gray-100 p-2 rounded"
                    onClick={() => setSelectedPost(post)}
                  >
                    <h3 className="text-lg font-medium text-gray-800">{post.title}</h3>
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
          </>
        )}
      </div>
    </div>
  );
};

export default UserPostsModal;
