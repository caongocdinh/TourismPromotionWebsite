import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import sanitizeHtml from "sanitize-html";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useSelector } from "react-redux";
import { Heart, Trash2 } from "lucide-react";

const Post = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState(null);
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        // Lấy thông tin bài viết
        const postResponse = await axios.get(`http://localhost:5000/api/posts/${id}`);
        setPost(postResponse.data.data);

        // Lấy danh sách bình luận
        const commentResponse = await axios.get(`http://localhost:5000/api/comments/post/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setComments(commentResponse.data.data || []);

        // Kiểm tra xem bài viết có trong danh sách yêu thích không
        if (token) {
          const favoriteResponse = await axios.get(`http://localhost:5000/api/favorites/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const favorites = favoriteResponse.data.data || [];
          setIsFavorited(favorites.some((fav) => fav.id === parseInt(id)));
        }

        setLoading(false);
      } catch (error) {
        toast.error("Lỗi khi tải bài viết hoặc bình luận!");
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [id, token]);

  // Hàm xử lý thêm/xóa yêu thích
  const handleFavorite = async () => {
    try {
      if (!token) {
        toast.error("Vui lòng đăng nhập để thêm bài viết vào yêu thích!");
        return;
      }

      if (isFavorited) {
        await axios.delete(`http://localhost:5000/api/favorites/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Đã xóa bài viết khỏi danh sách yêu thích!");
        setIsFavorited(false);
      } else {
        await axios.post(
          `http://localhost:5000/api/favorites/add`,
          { post_id: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Đã thêm bài viết vào danh sách yêu thích!");
        setIsFavorited(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Lỗi khi xử lý yêu thích!");
      console.error("Error handling favorite:", error);
    }
  };

  // Hàm xử lý thêm bình luận
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Vui lòng đăng nhập để bình luận!");
      return;
    }
    if (!newComment.trim()) {
      setCommentError("Nội dung bình luận không được để trống.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/comments/add",
        { post_id: id, content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments([response.data.data, ...comments]);
      setNewComment("");
      setCommentError(null);
      toast.success("Đã thêm bình luận thành công!");
    } catch (error) {
      setCommentError(error.response?.data?.error || "Không thể thêm bình luận.");
      toast.error(error.response?.data?.error || "Lỗi khi thêm bình luận!");
    }
  };

  // Hàm xử lý xóa bình luận
  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`http://localhost:5000/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(comments.filter((comment) => comment.id !== commentId));
      toast.success("Đã xóa bình luận thành công!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Lỗi khi xóa bình luận!");
    }
  };

  // Component điều khiển bản đồ
  const MapController = ({ center }) => {
    const map = useMap();
    if (center) {
      map.setView([center.lat, center.lng], 13);
    }
    return null;
  };

  // Hàm mở Google Maps để chỉ đường
  const openGoogleMaps = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return <div className="text-center p-4">Đang tải...</div>;
  }

  if (!post) {
    return <div className="text-center p-4 text-red-600">Bài viết không tồn tại!</div>;
  }

  const sanitizedContent = sanitizeHtml(post.content, {
    allowedTags: ["p", "img", "strong", "em", "h1", "h2", "h3", "ul", "ol", "li"],
    allowedAttributes: {
      img: ["src", "alt"],
    },
    transformTags: {
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, alt: attribs.alt || "Hình ảnh bài viết" },
      }),
    },
  });

  const hasValidCoordinates =
    post.latitude && post.longitude && !isNaN(parseFloat(post.latitude)) && !isNaN(parseFloat(post.longitude));

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <Link
          to="/posts"
          className="inline-block mb-6 text-primary hover:text-primary-dark transition-colors"
        >
          ← Quay lại danh sách bài viết
        </Link>

        <h1 className="text-4xl font-bold text-primary mb-6">{post.title}</h1>

        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-1">
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Tác giả:</span> {post.author || "Không xác định"}
            </p>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Địa điểm:</span>{" "}
              {post.tourist_place_name
                ? `${post.tourist_place_name}`
                : "Không có thông tin địa điểm"}
            </p>
            <div className="flex gap-2 mb-4">
              <span className="font-semibold text-gray-600">Danh mục:</span>
              {post.categories && post.categories.length > 0 ? (
                post.categories.map((category) => (
                  <span key={category.id} className="badge badge-primary badge-sm">
                    {category.name}
                  </span>
                ))
              ) : (
                <span className="text-gray-600">Không có danh mục</span>
              )}
            </div>
            <button
              onClick={handleFavorite}
              className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                isFavorited ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              <Heart size={20} fill={isFavorited ? "white" : "none"} />
              {isFavorited ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
            </button>
          </div>
        </div>

        <div className="prose max-w-none text-primary mb-20" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />

        {hasValidCoordinates ? (
          <button
            onClick={() => openGoogleMaps(parseFloat(post.latitude), parseFloat(post.longitude))}
            className="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-md transition-colors mb-4"
          >
            Chỉ đường
          </button>
        ) : (
          <p className="text-gray-600 mb-4">Không có tọa độ để hiển thị chỉ đường.</p>
        )}

        {hasValidCoordinates ? (
          <div className="h-64 w-full rounded mb-4">
            <MapContainer
              center={[parseFloat(post.latitude), parseFloat(post.longitude)]}
              zoom={13}
              className="h-full w-full rounded"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[parseFloat(post.latitude), parseFloat(post.longitude)]} />
              <MapController center={{ lat: parseFloat(post.latitude), lng: parseFloat(post.longitude) }} />
            </MapContainer>
          </div>
        ) : (
          <p className="text-gray-600 mb-4">Không có tọa độ để hiển thị bản đồ.</p>
        )}

        {/* Phần bình luận */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Bình luận</h2>
          {token ? (
            <form onSubmit={handleAddComment} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Nhập bình luận của bạn..."
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                rows="4"
              />
              {commentError && <p className="text-red-500 text-sm mt-1">{commentError}</p>}
              <button
                type="submit"
                className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                Gửi bình luận
              </button>
            </form>
          ) : (
            <p className="text-gray-600 mb-4">
              <Link to="/login" className="text-primary hover:underline">
                Đăng nhập
              </Link>{" "}
              để bình luận.
            </p>
          )}

          {comments.length === 0 ? (
            <p className="text-gray-600">Chưa có bình luận nào.</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border-b border-gray-200 pb-4 flex justify-between items-start"
                >
                  <div>
                    <p className="font-medium text-gray-800">{comment.user_name}</p>
                    <p className="text-gray-600">{comment.content}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </div>
                  {(comment.user_id === user?.id || user?.role === "admin") && (
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
    </section>
  );
};

export default Post;