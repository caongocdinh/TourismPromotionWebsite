// frontend/src/components/Post.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import sanitizeHtml from 'sanitize-html';

const Post = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/posts/${id}`);
        setPost(response.data.data);
        console.log('Raw content:', response.data.data.content); // Log nội dung gốc
        setLoading(false);
      } catch (error) {
        toast.error('Lỗi khi tải bài viết!');
        console.error('Error fetching post:', error);
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

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
  console.log('Sanitized content:', sanitizedContent); // Log nội dung đã làm sạch

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
              <span className="font-semibold">Tác giả:</span> {post.author}
            </p>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Địa điểm:</span> {post.tourist_place_name},{' '}
              {post.location_name}
            </p>
            <div className="flex gap-2">
              <span className="font-semibold text-gray-600">Danh mục:</span>
              {post.categories.map((category) => (
                <span key={category.id} className="badge badge-primary badge-sm">
                  {category.name}
                </span>
              ))}
            </div>
          </div>
          {/* {post.images.length > 0 && (
            <div className="flex justify-center">
              <img
                src={post.images[0].url}
                alt={post.title}
                className="w-full h-64 object-cover rounded-lg shadow-md"
              />
            </div>
          )} */}
        </div>

        {/* Thử render thủ công để debug */}
        <div className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
        </div>

        {/* {post.latitude && post.longitude && (
          <div className="mt-8">
            <h3 className="text-2xl font-semibold text-primary mb-4">Vị trí</h3>
            <p className="text-gray-600 mb-2">
              Kinh độ: {post.longitude} | Vĩ độ: {post.latitude}
            </p>
            <iframe
              title="Bản đồ"
              className="w-full h-64 rounded-lg"
              src={`https://www.google.com/maps/embed/v1/place?q=${post.latitude},${post.longitude}&key=YOUR_GOOGLE_MAPS_API_KEY`}
            ></iframe>
          </div>
        )}*/}
      </div> 
    </section>
  );
};

export default Post;