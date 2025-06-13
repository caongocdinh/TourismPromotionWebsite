import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import sanitizeHtml from "sanitize-html";
import { LocateFixed, UserIcon } from "lucide-react";

const CategoryPage = () => {
  const { category_id } = useParams();
  const [posts, setPosts] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const postsPerPage = 6; // Số bài viết mỗi trang

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching posts for category_id:", category_id, "page:", currentPage);
        const response = await axios.get(
          `http://localhost:5000/api/posts/posts/category`,
          {
            params: {
              category_id,
              page: currentPage,
              limit: postsPerPage,
            },
          }
        );
        console.log("Posts response:", response.data);
        setPosts(response.data.data.posts || []);
        setTotalPages(Math.ceil(response.data.data.totalPosts / postsPerPage) || 1);

        console.log("Fetching categories");
        const categoryResponse = await axios.get(`http://localhost:5000/api/categories`);
        console.log("Categories response:", categoryResponse.data);
        if (!categoryResponse.data?.data) {
          throw new Error("Dữ liệu danh mục không hợp lệ");
        }
        const category = categoryResponse.data.data.find(
          (c) => c.id === parseInt(category_id)
        );
        setCategoryName(category?.name || "Khám phá");
      } catch (error) {
        console.error(
          "Error fetching posts:",
          error.message,
          error.response?.data || error
        );
        setError("Không thể tải bài viết hoặc danh mục. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [category_id, currentPage]);

  const getShortDescription = (content) => {
    const cleanText = sanitizeHtml(content, {
      allowedTags: [],
      allowedAttributes: {},
    });
    return cleanText.length > 100 ? cleanText.substring(0, 100) + "..." : cleanText;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" }); // Cuộn lên đầu trang
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <div className="bg-white py-12 rounded-xl shadow-lg mb-8">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 animate-fade-in">
            Khám phá {categoryName}
          </h1>
          <p className="mt-4 text-lg text-blue-800">
            Những địa điểm tuyệt vời đang chờ bạn khám phá!
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-b-4 border-transparent"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-3 text-xl font-semibold text-gray-800">
            Không có bài viết nào
          </h3>
          <p className="text-gray-500 mt-1">
            Hiện không có bài viết nào trong danh mục này.
          </p>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="grid gap-6 md:grid-cols-1 mb-10">
          {posts.map((post) => (
            <Link
              to={`/posts/${post.id}`}
              key={post.id}
              className="flex flex-col md:flex-row bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
            >
              <div className="md:w-1/3 w-full bg-slate-200">
                <img
                  src={
                    post.images[0]?.url ||
                    "https://via.placeholder.com/600x400?text=No+Image"
                  }
                  alt={post.title}
                  className="w-full h-52 object-cover md:rounded-l-xl"
                />
              </div>
              <div className="md:w-2/3 p-6">
                <h2 className="text-2xl font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-gray-600 mt-2 line-clamp-3 text-base">
                  {getShortDescription(post.content)}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <UserIcon size={15} className="mr-1" />
                    {post.author || "Không xác định"}
                  </div>
                  <div className="flex items-center">
                    <LocateFixed size={15} className="mr-1" />
                    {post.tourist_place_name || "Không xác định"}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Phân trang */}
      {!loading && !error && posts.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 my-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
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
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
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
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
            }`}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;