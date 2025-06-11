import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import sanitizeHtml from "sanitize-html";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
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
  const [userLocation, setUserLocation] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const { token, user } = useSelector((state) => state.auth);
  const hasIncrementedView = useRef(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          toast.error("Không thể lấy vị trí của bạn. Vui lòng cho phép truy cập vị trí.");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      toast.error("Trình duyệt không hỗ trợ định vị.");
    }
  }, []);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        const postId = parseInt(id, 10);
        if (isNaN(postId)) {
          throw new Error("Invalid post ID");
        }
        console.log(`Fetching post with ID: ${postId}`);

        const postResponse = await axios.get(`http://localhost:5000/api/posts/${postId}`);
        setPost(postResponse.data.data);

        if (!hasIncrementedView.current) {
          try {
            await axios.post(
              `http://localhost:5000/api/posts/view/${postId}`,
              {},
              {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              }
            );
            hasIncrementedView.current = true;
          } catch (viewError) {
            console.error("Error incrementing view:", viewError);
          }
        }

        const commentResponse = await axios.get(`http://localhost:5000/api/comments/post/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setComments(commentResponse.data.data || []);

        if (token) {
          const favoriteResponse = await axios.get(`http://localhost:5000/api/favorites/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsFavorited(favoriteResponse.data.data.some((fav) => fav.id === postId));
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

  useEffect(() => {
    return () => {
      hasIncrementedView.current = false;
    };
  }, [id]);

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
        setPost((prev) => ({ ...prev, likes: Math.max((prev.likes || 0) - 1, 0) }));
      } else {
        await axios.post(
          `http://localhost:5000/api/favorites/add`,
          { post_id: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Đã thêm bài viết vào danh sách yêu thích!");
        setIsFavorited(true);
        setPost((prev) => ({ ...prev, likes: (prev.likes || 0) + 1 }));
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Lỗi khi xử lý yêu thích!");
      console.error("Error handling favorite:", error);
    }
  };

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

  const MapController = ({ center, userLocation, showRoute }) => {
    const map = useMap();

    useEffect(() => {
      if (center && showRoute && userLocation) {
        map.eachLayer((layer) => {
          if (layer instanceof L.Routing.Control) {
            map.removeControl(layer);
          }
        });

        const routingControl = L.Routing.control({
          waypoints: [
            L.latLng(userLocation.lat, userLocation.lng),
            L.latLng(center.lat, center.lng),
          ],
          routeWhileDragging: true,
          show: true,
          lineOptions: {
            styles: [{ color: "#0078A8", weight: 4 }],
          },
          createMarker: () => null,
          router: L.Routing.osrmv1(),
          formatter: new L.Routing.Formatter({
            instructions: {
              "Head {dir}": "Đi về hướng {dir}",
              "Continue onto {road}": "Tiếp tục đi trên {road}",
              "Turn left onto {road}": "Rẽ trái vào {road}",
              "Turn right onto {road}": "Rẽ phải vào {road}",
              "Merge left onto {road}": "Nhập làn bên trái vào {road}",
              "Merge right onto {road}": "Nhập làn bên phải vào {road}",
              "Turn left": "Rẽ trái",
              "Turn right": "Rẽ phải",
              "Continue straight": "Tiếp tục đi thẳng",
              "Slight left onto {road}": "Rẽ nhẹ sang trái vào {road}",
              "Slight right onto {road}": "Rẽ nhẹ sang phải vào {road}",
              "Take the {exit} exit": "Đi vào lối ra {exit}",
              "Arrive at your destination": "Đến nơi",
              "Slight left": "Rẽ nhẹ sang trái",
              "Slight right": "Rẽ nhẹ sang phải",
              "Sharp left onto {road}": "Rẽ gắt sang trái vào {road}",
              "Sharp right onto {road}": "Rẽ gắt sang phải vào {road}",
              "U-turn onto {road}": "Quay đầu vào {road}",
              "Roundabout": "Vào vòng xoay",
              "Exit roundabout onto {road}": "Thoát vòng xoay vào {road}",
              "Keep left": "Giữ bên trái",
              "Keep right": "Giữ bên phải",
            },
            directions: {
              N: "Bắc",
              NE: "Đông Bắc",
              E: "Đông",
              SE: "Đông Nam",
              S: "Nam",
              SW: "Tây Nam",
              W: "Tây",
              NW: "Tây Bắc",
            },
            units: {
              meters: "m",
              kilometers: "km",
              yards: "m",
              miles: "km",
              hours: "giờ",
              minutes: "phút",
              seconds: "giây",
            },
          }),
        }).addTo(map);
      }
    }, [map, center, userLocation, showRoute]);

    if (center) {
      map.setView([center.lat, center.lng], 13);
    }

    return null;
  };

  const toggleRoute = () => {
    if (!userLocation) {
      toast.error("Không thể hiển thị tuyến đường vì không có vị trí của bạn.");
      return;
    }
    setShowRoute(!showRoute);
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
              {post.tourist_place_name ? post.tourist_place_name : "Không có thông tin địa điểm"}
            </p>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Lượt xem:</span> {post.views || 0}
            </p>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Lượt thích:</span> {post.likes || 0}
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
            onClick={toggleRoute}
            className="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-md transition-colors mb-4"
          >
            {showRoute ? "Ẩn tuyến đường" : "Hiển thị tuyến đường"}
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
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[parseFloat(post.latitude), parseFloat(post.longitude)]} />
              {userLocation && <Marker position={[userLocation.lat, userLocation.lng]} />}
              <MapController
                center={{ lat: parseFloat(post.latitude), lng: parseFloat(post.longitude) }}
                userLocation={userLocation}
                showRoute={showRoute}
              />
            </MapContainer>
          </div>
        ) : (
          <p className="text-gray-600 mb-4">Không có tọa độ để hiển thị bản đồ.</p>
        )}

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