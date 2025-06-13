import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const { showProfile, showArticles, showAuth } = useSelector((state) => state.ui);

  // Đóng SearchBar khi các modal khác mở
  useEffect(() => {
    if (showProfile || showArticles || showAuth) {
      setIsOpen(false);
      setShowResults(false);
    }
  }, [showProfile, showArticles, showAuth]);

  // Đóng SearchBar khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowResults(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/posts/search", {
        params: {
          q: searchTerm,
          page: 1,
          limit: 10,
        },
      });
      setSearchResults(response.data.data.posts || []);
      setShowResults(true);
      setIsOpen(true);
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error.response?.data?.message || error.message);
      setSearchResults([]);
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div
      className={`relative flex items-center transition-all duration-300 ${
        isOpen ? "w-full sm:w-96" : "w-auto"
      }`}
      ref={searchRef}
    >
      <div
        className={`flex items-center w-full ${
          isOpen
            ? "bg-white shadow-md rounded-full px-4 py-2"
            : "bg-transparent"
        } transition-all duration-300`}
      >
        <form
          onSubmit={handleSearch}
          className="flex items-center w-full"
        >
          <button
            type="button"
            onClick={handleSearchToggle}
            className={`text-gray-600 hover:text-primary transition-colors ${
              isOpen ? "hidden" : "block"
            }`}
            aria-label="Tìm kiếm"
          >
            <Search size={20} />
          </button>

          {isOpen && (
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent px-3 py-1 text-gray-700 focus:outline-none text-sm placeholder-gray-500"
                disabled={isLoading}
                autoFocus
              />
             
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-spin text-sm">⏳</span>
                ) : (
                  <Search size={16} />
                )}
              </button>
            </div>
          )}
        </form>

        {isOpen && (
          <button
            type="button"
            onClick={handleSearchToggle}
            className="ml-2 text-gray-600 hover:text-primary"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showResults && isOpen && (
        <div className="absolute top-full mt-2 w-full sm:w-96 bg-white shadow-lg rounded-lg overflow-hidden z-20 max-h-96 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Kết quả tìm kiếm cho "{searchTerm}"
              </h3>
              <ul className="divide-y divide-gray-100">
                {searchResults.map((post) => (
                  <li
                    key={post.id}
                    className="py-2 hover:bg-blue-50 transition-colors"
                  >
                    <Link
                      to={`/posts/${post.id}`}
                      className="flex items-center px-2 py-1"
                      onClick={() => {
                        setIsOpen(false);
                        setShowResults(false);
                      }}
                    >
                      {post.images && post.images.length > 0 ? (
                        <img
                          src={post.images[0].url}
                          alt={post.title}
                          className="w-12 h-12 object-cover rounded-md mr-3"
                          onError={(e) => {
                            e.target.src = "/placeholder-image.jpg";
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-md mr-3 flex items-center justify-center">
                          <span className="text-xs text-gray-400">
                            No Image
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                          {post.title || "Bài viết"}
                        </h4>
                        {post.content && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {post.content.replace(/<[^>]+>/g, "").substring(0, 80)}...
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">
                Không tìm thấy bài viết nào phù hợp với "{searchTerm}"
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Vui lòng thử lại với từ khóa khác
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;