import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import sanitizeHtml from 'sanitize-html';
import { Link } from 'react-router-dom';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12; // 4 rows * 4 columns = 16 posts per page

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/posts');
        const approvedPosts = response.data.data.filter(post => post.status === 'approved');
        setPosts(approvedPosts);
        setLoading(false);
      } catch (error) {
        toast.error('Lỗi khi tải danh sách bài viết!');
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

  // Calculate the posts to display on the current page
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  // Calculate total pages
  const totalPages = Math.ceil(posts.length / postsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Đang tải...</div>;
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary">Bài Viết Du Lịch</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {currentPosts.length === 0 ? (
            <p className="text-center text-gray-600 col-span-4">Chưa có bài viết nào.</p>
          ) : (
            currentPosts.map((post) => (
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
                        key={`${post.id}-${category.id}`}
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-primary text-white rounded disabled:bg-gray-300"
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded ${
                  currentPage === page ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-primary text-white rounded disabled:bg-gray-300"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PostList;