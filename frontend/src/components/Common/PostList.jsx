import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import sanitizeHtml from 'sanitize-html';
import { Link } from 'react-router-dom';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/posts');
        // console.log('Posts API response:', response.data); // Log để gỡ lỗi
        setPosts(response.data.data || []);
        setLoading(false);
      } catch (error) {
        toast.error('Lỗi khi tải danh sách bài viết!');
        // console.error('Error fetching posts:', error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const getShortDescription = (content) => {
    const cleanText = sanitizeHtml(content, {
      allowedTags: [],
      allowedAttributes: {},
    });
    return cleanText.length > 100 ? cleanText.substring(0, 100) + '...' : cleanText;
  };

  if (loading) {
    return <div className="text-center p-4">Đang tải...</div>;
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary">Bài Viết Du Lịch</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.length === 0 ? (
            <p className="text-center text-gray-600 col-span-3">Chưa có bài viết nào.</p>
          ) : (
            posts.map((post) => (
              <Link
                to={`/posts/${post.id}`}
                key={post.id}
                className="relative bg-gray-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 group no-underline"
              >
                <img
                  src={post.images[0]?.url || 'https://via.placeholder.com/300x200'}
                  alt={post.title}
                  className="w-full h-48 object-cover rounded-t-md mb-2 transition-transform duration-300 group-hover:scale-105"
                />
                <h3 className="text-xl font-semibold mb-2 text-primary">{post.title}</h3>
                <p className="text-gray-600 mb-2">{getShortDescription(post.content)}</p>
                <p className="text-sm text-gray-500 mb-1">
                  Tác giả: {post.author || 'Không xác định'} | Địa điểm: {post.tourist_place_name || 'Không xác định'}
                </p>
                <div className="flex gap-2">
                  {post.categories && post.categories.length > 0 ? (
                    post.categories.map((category) => (
                      <span
                        key={`${post.id}-${category.id}`} // Sử dụng key duy nhất
                        className="badge badge-primary badge-sm"
                      >
                        {category.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-600">Không có danh mục</span>
                  )}
                </div>
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default PostList;