import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import sanitizeHtml from "sanitize-html";
import { LocateFixed, UserIcon } from "lucide-react";
import { div } from "@tensorflow/tfjs";
const CategoryPage = () => {
  const { category_id } = useParams();
  const [posts, setPosts] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching posts for category_id:", category_id);
        const response = await axios.get(
          `http://localhost:5000/api/posts/posts/category?category_id=${category_id}`
        );
        console.log("Posts response:", response.data);
        setPosts(response.data.data || []);

        console.log("Fetching categories");
        const categoryResponse = await axios.get(
          `http://localhost:5000/api/categories`
        );
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
  }, [category_id]);
  const getShortDescription = (content) => {
    const cleanText = sanitizeHtml(content, {
      allowedTags: [],
      allowedAttributes: {},
    });
    return cleanText.length > 100
      ? cleanText.substring(0, 100) + "..."
      : cleanText;
  };
  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <div className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
            🌍 {categoryName}
          </h1>

        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
          role="alert"
        >
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
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            Không có bài viết nào
          </h3>
          <p className="mt-1 text-gray-500">
            Hiện không có bài viết nào trong danh mục này.
          </p>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="grid gap-8">
          {posts.map((post) => (
            <Link
              to={`/posts/${post.id}`}
              key={post.id}
              className="flex flex-col md:flex-row overflow-hidden bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="md:w-1/3">
                <img
                  src={
                    post.images[0]?.url ||
                    "https://via.placeholder.com/600x400?text=No+Image"
                  }
                  alt={post.title}
                  className="w-96 h-52 object-cover"
                />
              </div>
              <div className="p-6 md:w-2/3">
                <h3 className="text-2xl font-bold text-gray-800 mb-2 hover:text-blue-600 transition-colors duration-200">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-lg mb-4">
                  {getShortDescription(post.content)}
                </p>

                <div className="flex items-center text-sm text-gray-500">
                  <UserIcon size={15} />
                  <span className="ml-2">
                    {post.author || "Không xác định"}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <LocateFixed size={15} />
                  <span className="ml-2">
                    {post.tourist_place_name || "Không xác định"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
