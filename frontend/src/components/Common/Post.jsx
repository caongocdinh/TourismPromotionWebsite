import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import sanitizeHtml from 'sanitize-html';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Post = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/posts/${id}`);
        // console.log('API response:', response.data); // Log toàn bộ phản hồi
        setPost(response.data.data);
        // console.log('Raw content:', response.data.data.content);
        setLoading(false);
      } catch (error) {
        toast.error('Lỗi khi tải bài viết!');
        console.error('Error fetching post:', error);
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

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
    window.open(url, '_blank');
  };

  if (loading) {
    return <div className="text-center p-4">Đang tải...</div>;
  }

  if (!post) {
    return <div className="text-center p-4 text-red-600">Bài viết không tồn tại!</div>;
  }

  const sanitizedContent = sanitizeHtml(post.content, {
    allowedTags: ['p', 'img', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
    allowedAttributes: {
      img: ['src', 'alt'],
    },
    transformTags: {
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, alt: attribs.alt || 'Hình ảnh bài viết' },
      }),
    },
  });
  // console.log('Sanitized content:', sanitizedContent);

  // Kiểm tra tọa độ hợp lệ
  const hasValidCoordinates = post.latitude && post.longitude && !isNaN(parseFloat(post.latitude)) && !isNaN(parseFloat(post.longitude));

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
              <span className="font-semibold">Tác giả:</span> {post.author || 'Không xác định'}
            </p>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Địa điểm:</span>{' '}
              {post.tourist_place_name
                ? `${post.tourist_place_name}
               
                `
                : 'Không có thông tin địa điểm'}
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
            
          </div>
        </div>

        {/* Nội dung bài viết */}
        <div
          className="prose max-w-none text-primary mb-20"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

       

        {/* Nút Chỉ đường */}
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
            {/* Bản đồ */}
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
      </div>
    </section>
  );
};

export default Post;