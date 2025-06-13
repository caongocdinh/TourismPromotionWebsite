// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import toast from 'react-hot-toast';
// import sanitizeHtml from 'sanitize-html';
// import { Link } from 'react-router-dom';

// const PostList = () => {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//   const fetchPosts = async () => {
//     try {
//       const response = await axios.get('http://localhost:5000/api/posts');
//       const approvedPosts = response.data.data.filter(post => post.status === 'approved'); // Lọc bài viết được duyệt
//       setPosts(approvedPosts);
//       setLoading(false);
//     } catch (error) {
//       toast.error('Lỗi khi tải danh sách bài viết!');
//       setLoading(false);
//     }
//   };
//     fetchPosts();
//   }, []);

  

//   const getShortDescription = (content) => {
//     const cleanText = sanitizeHtml(content, {
//       allowedTags: [],
//       allowedAttributes: {},
//     });
//     return cleanText.length > 100 ? cleanText.substring(0, 100) + '...' : cleanText;
//   };

//   if (loading) {
//     return <div className="text-center p-4">Đang tải...</div>;
//   }

//   return (
//     <section className="py-12 bg-white">
//       <div className="container mx-auto px-4">
//         <h2 className="text-3xl font-bold text-center mb-8 text-primary">Bài Viết Du Lịch</h2>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {posts.length === 0 ? (
//             <p className="text-center text-gray-600 col-span-3">Chưa có bài viết nào.</p>
//           ) : (
//             posts.map((post) => (
//               <Link
//                 to={`/posts/${post.id}`}
//                 key={post.id}
//                 className="relative bg-gray-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 group no-underline"
//               >
//                 <img
//                   src={post.images[0]?.url || 'https://via.placeholder.com/300x200'}
//                   alt={post.title}
//                   className="w-full h-48 object-cover rounded-t-md mb-2 transition-transform duration-300 group-hover:scale-105"
//                 />
//                 <h3 className="text-xl font-semibold mb-2 text-primary">{post.title}</h3>
//                 <p className="text-gray-600 mb-2">{getShortDescription(post.content)}</p>
//                 <p className="text-sm text-gray-500 mb-1">
//                   Tác giả: {post.author || 'Không xác định'} | Địa điểm: {post.tourist_place_name || 'Không xác định'}
//                 </p>
//                 <div className="flex gap-2">
//                   {post.categories && post.categories.length > 0 ? (
//                     post.categories.map((category) => (
//                       <span
//                         key={`${post.id}-${category.id}`} // Sử dụng key duy nhất
//                         className="badge badge-primary badge-sm"
//                       >
//                         {category.name}
//                       </span>
//                     ))
//                   ) : (
//                     <span className="text-gray-600">Không có danh mục</span>
//                   )}
//                 </div>
//                 <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
//               </Link>
//             ))
//           )}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default PostList;


import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import sanitizeHtml from 'sanitize-html';
import { Link } from 'react-router-dom';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const postsPerPage = 6; // Number of posts per page, synced with API default

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/posts', {
          params: {
            page: currentPage,
            limit: postsPerPage,
          },
        });
        const approvedPosts = response.data.data.posts.filter(post => post.status === 'approved'); // Filter approved posts
        setPosts(approvedPosts);
        setTotalPages(response.data.data.totalPages || 1);
        setLoading(false);
      } catch (error) {
        toast.error('Lỗi khi tải danh sách bài viết!');
        setLoading(false);
      }
    };
    fetchPosts();
  }, [currentPage]);

  const getShortDescription = (content) => {
    const cleanText = sanitizeHtml(content, {
      allowedTags: [],
      allowedAttributes: {},
    });
    return cleanText.length > 100 ? cleanText.substring(0, 100) + '...' : cleanText;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-b-4 border-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    );
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              Trước
            </button>
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
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