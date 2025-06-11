import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  ChevronDown,
  Search,
  User,
  Phone,
  Book,
  Image,
  LogOut,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  setShowProfile,
  setShowArticles,
  setShowAuth,
} from "../../redux/slices/uiSlice";
import { logout } from "../../redux/slices/authSlice";
import ProfileModal from "../ProfileModal";
import ArticlesModal from "../ArticlesModal";
import AuthModal from "./AuthModal";
import PostCreateForm from "../PostCreateForm";
import { useNavigate, Link } from "react-router-dom";
import ImageSearchModal from "./ImageSearchModal";
import UserPostsModal from "../User/UserPostsModal";
import FavoritePostsModal from "../User/FavoritePostsModal";
import axios from "axios";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  // Đóng SearchBar khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
      console.log("Kết quả tìm kiếm:", response.data);
      setSearchResults(response.data.data.posts || []);
      setShowResults(true);
      setIsOpen(true);
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error.response?.data?.message || error.message);
      setSearchResults([]);
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
      className={`flex items-center justify-center w-full transition-all duration-300 ${
        isOpen
          ? "fixed top-0 left-0 w-full bg-white h-auto py-6 z-50 shadow-lg"
          : "w-auto"
      }`}
      ref={searchRef}
    >
      {isOpen ? (
        <div className="w-full max-w-4xl mx-auto px-4">
          <form
            onSubmit={handleSearch}
            className="relative flex items-center justify-center w-full"
          >
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-100 px-4 py-3 pl-4 pr-12 rounded-lg focus:outline-none w-full placeholder:text-gray-700 text-lg"
                disabled={isLoading}
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-gray-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-spin h-6 w-6">⏳</span>
                ) : (
                  <Search size={20} />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSearchToggle}
              className="ml-4 text-gray-600 hover:text-gray-800"
            >
              <X size={20} />
            </button>
          </form>
          {showResults && (
            <div className="bg-white shadow-lg rounded-lg mt-2 overflow-hidden">
              {searchResults.length > 0 ? (
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Kết quả tìm kiếm cho "{searchTerm}"
                  </h3>
                  <ul className="divide-y">
                    {searchResults.map((post) => (
                      <li
                        key={post.id}
                        className="py-3 hover:bg-gray-50 transition-colors"
                      >
                        <Link
                          to={`/posts/${post.id}`}
                          className="flex items-center"
                          onClick={() => {
                            setIsOpen(false);
                            setShowResults(false);
                          }}
                        >
                          {post.images && post.images.length > 0 ? (
                            <img
                              src={post.images[0].url}
                              alt={post.title}
                              className="w-16 h-16 object-cover rounded-md mr-3"
                              onError={(e) => {
                                e.target.src = "/placeholder-image.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-md mr-3 flex items-center justify-center">
                              <span className="text-xs text-gray-400">
                                Không có ảnh
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {post.title || "Bài viết"}
                            </h4>
                            {post.content && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                {post.content.replace(/<[^>]+>/g, '').substring(0, 100)}...
                              </p>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-6 text-center¡¡">
                  <p className="text-gray-500">
                    Không tìm thấy bài viết nào phù hợp với "{searchTerm}"
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Vui lòng thử lại với từ khóa khác
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <button onClick={handleSearchToggle} aria-label="Tìm kiếm">
          <Search size={20} />
        </button>
      )}
    </div>
  );
};

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [exploreDropdownOpen, setExploreDropdownOpen] = useState(false);
  const [editorDropdownOpen, setEditorDropdownOpen] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [imageSearchResult, setImageSearchResult] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [showUserPosts, setShowUserPosts] = useState(false);
  const [showFavoritePosts, setShowFavoritePosts] = useState(false);
  const [categories, setCategories] = useState([]);
  const [scrolled, setScrolled] = useState(false);

  const dispatch = useDispatch();
  const { showProfile, showArticles, showAuth } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleExploreDropdown = () => setExploreDropdownOpen(!exploreDropdownOpen);
  const toggleEditorDropdown = () => setEditorDropdownOpen(!editorDropdownOpen);
  const navigate = useNavigate();

  const [showCreatePost, setShowCreatePost] = useState(false);

  // Theo dõi scroll để thay đổi giao diện header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/categories");
        setCategories(response.data.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const menuItems = [
    { name: "Trang chủ", href: "/" },
    { name: "Cẩm nang du lịch", href: "/hanbook"},
    { name: "Khám phá", hasDropdown: true },
    { name: "Liên hệ", href: "/contact" },
  ];

  useEffect(() => {
    if (imageSearchResult) {
      console.log("Kết quả tìm kiếm hình ảnh:", imageSearchResult);
    }
  }, [imageSearchResult]);

  useEffect(() => {
    if (!showAuth) setAuthMode("login");
  }, [showAuth]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white shadow-md py-2"
            : "bg-white/95 backdrop-blur-sm py-4"
        }`}
      >
        <div className="bg-blue-900 text-white py-2">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-sm">
                <Phone size={14} />
                <span>Điện thoại: (028) 1234 5678</span>
              </div>
              <span className="text-sm">|</span>
              <span className="text-sm">Email: info@khamphadulich.com</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">{user.name}</span>
                  <button
                    onClick={() => {
                      dispatch(logout());
                      navigate("/");
                    }}
                    className="text-sm hover:text-blue-200 transition-colors flex items-center"
                  >
                    <LogOut size={16} className="mr-1" />
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      dispatch(setShowAuth(true));
                    }}
                    className="text-sm hover:text-blue-200 transition-colors"
                  >
                    Đăng nhập
                  </button>
                  <span className="text-sm">|</span>
                  <button
                    onClick={() => {
                      setAuthMode("register");
                      dispatch(setShowAuth(true));
                    }}
                    className="text-sm hover:text-blue-200 transition-colors"
                  >
                    Đăng ký
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                  K
                </div>
                <div>
                  <div className="font-bold text-lg text-primary">
                    KHÁM PHÁ DU LỊCH
                  </div>
                  <div className="text-xs text-gray-500">
                    Những địa điểm du lịch tuyệt vời ở Việt Nam!
                  </div>
                </div>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center">
              <ul className="flex space-x-8">
                {menuItems.map((item, index) => (
                  <li key={index} className="relative group">
                    <Link
                      to={item.href}
                      className="text-gray-700 font-medium hover:text-primary relative py-2 flex items-center"
                      onClick={
                        item.hasDropdown && item.name === "Cẩm nang du lịch"
                          ? toggleDropdown
                          : item.hasDropdown && item.name === "Khám phá"
                          ? toggleExploreDropdown
                          : undefined
                      }
                    >
                      {item.name}
                      {item.hasDropdown && <ChevronDown size={16} className="ml-1" />}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                    </Link>
                    {item.hasDropdown && item.name === "Cẩm nang du lịch" && dropdownOpen && (
                      <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 z-20">
                        <Link
                          to="/cam-nang/mien-bac"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                        >
                          Miền Bắc
                        </Link>
                        <Link
                          to="/cam-nang/mien-trung"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                        >
                          Miền Trung
                        </Link>
                        <Link
                          to="/cam-nang/mien-nam"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                        >
                          Miền Nam
                        </Link>
                      </div>
                    )}
                    {item.hasDropdown && item.name === "Khám phá" && exploreDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 z-20">
                        {categories.map((category) => (
                          <Link
                            key={category.id}
                            to={`/explore/${category.id}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
                {user?.role === "admin" && (
                  <li className="relative group">
                    <Link
                      to="/admin"
                      className="text-gray-700 font-medium hover:text-primary relative py-2 items-center flex"
                    >
                      Dashboard Admin
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                    </Link>
                  </li>
                )}
              </ul>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <SearchBar />
              </div>
              <button
                className="text-gray-600 hover:text-primary sm:hidden"
                title="Tìm kiếm"
              >
                <Search size={20} />
              </button>
              <button
                className="text-gray-600 hover:text-primary"
                title="Tìm kiếm bằng hình ảnh"
                onClick={() => setShowImageSearch(true)}
              >
                <Image size={20} />
              </button>
              <div className="relative">
                <button
                  onClick={toggleEditorDropdown}
                  className="text-gray-600 hover:text-primary flex items-center"
                >
                  <Book size={20} />
                  <ChevronDown size={16} className="ml-1" />
                </button>
                {editorDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 z-20">
                    <button
                      onClick={() => {
                        navigate("/editor");
                        setEditorDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      Tạo bài viết
                    </button>
                    <button
                      onClick={() => {
                        setShowUserPosts(true);
                        setEditorDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      Bài viết của bạn
                    </button>
                    <button
                      onClick={() => {
                        setShowFavoritePosts(true);
                        setEditorDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      Bài viết yêu thích
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => dispatch(setShowProfile(true))}
                className="text-gray-600 hover:text-primary hidden md:flex items-center space-x-1"
                title={user ? `Hồ sơ: ${user.name}` : "Hồ sơ người dùng"}
              >
                <User size={20} />
                {user && <span className="text-sm font-medium">{user.name}</span>}
              </button>
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden text-gray-600"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={`${scrolled ? "h-28" : "h-32"} transition-all duration-300`}></div>

      <div className="sm:hidden fixed top-28 left-0 right-0 z-40 px-4 py-2 bg-white/95 shadow-sm">
        <SearchBar />
      </div>

      {showCreatePost && <PostCreateForm close={() => setShowCreatePost(false)} />}
      {mobileMenuOpen && (
        <div
          className={`fixed top-0 left-0 w-full h-full bg-black/50 z-50 transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={toggleMobileMenu}
        >
          <div
            className={`absolute top-0 left-0 w-3/4 sm:w-1/2 h-full bg-white shadow-lg transform transition-transform duration-300 overflow-auto ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between p-4 bg-white border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  K
                </div>
                <span className="text-lg font-semibold">KHÁM PHÁ DU LỊCH</span>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              {user && (
                <div className="mb-4 pb-4 border-b">
                  <p className="font-medium">Xin chào, {user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              )}
              <nav className="space-y-4">
                {menuItems.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center">
                      <Link
                        to={item.href}
                        className="flex items-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
                        onClick={
                          item.hasDropdown && item.name === "Cẩm nang du lịch"
                            ? toggleDropdown
                            : item.hasDropdown && item.name === "Khám phá"
                            ? toggleExploreDropdown
                            : toggleMobileMenu
                        }
                      >
                        {item.name}
                      </Link>
                      {item.hasDropdown && (
                        <button
                          onClick={
                            item.name === "Cẩm nang du lịch"
                              ? toggleDropdown
                              : toggleExploreDropdown
                          }
                          className="text-gray-600"
                        >
                          <ChevronDown size={16} />
                        </button>
                      )}
                    </div>
                    {item.hasDropdown && item.name === "Cẩm nang du lịch" && dropdownOpen && (
                      <div className="pl-4">
                        <Link
                          to="/cam-nang/mien-bac"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                          onClick={toggleMobileMenu}
                        >
                          Miền Bắc
                        </Link>
                        <Link
                          to="/cam-nang/mien-trung"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                          onClick={toggleMobileMenu}
                        >
                          Miền Trung
                        </Link>
                        <Link
                          to="/cam-nang/mien-nam"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                          onClick={toggleMobileMenu}
                        >
                          Miền Nam
                        </Link>
                      </div>
                    )}
                    {item.hasDropdown && item.name === "Khám phá" && exploreDropdownOpen && (
                      <div className="pl-4">
                        {categories.map((category) => (
                          <Link
                            key={category.id}
                            to={`/explore/${category.id}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                            onClick={toggleMobileMenu}
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="flex items-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
                    onClick={toggleMobileMenu}
                  >
                    Dashboard Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    navigate("/editor");
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black transition-colors w-full text-left"
                >
                  Tạo bài viết
                </button>
                <button
                  onClick={() => {
                    setShowUserPosts(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black transition-colors w-full text-left"
                >
                  Bài viết của bạn
                </button>
                <button
                  onClick={() => {
                    setShowFavoritePosts(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black transition-colors w-full text-left"
                >
                  Bài viết yêu thích
                </button>
                {user ? (
                  <>
                    <div className="border-t my-2"></div>
                    <Link
                      to="/profileinsead-of-profile"
                      className="flex items-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
                      onClick={toggleMobileMenu}
                    >
                      Tài khoản của tôi
                    </Link>
                    <button
                      onClick={() => {
                        dispatch(logout());
                        navigate("/");
                        toggleMobileMenu();
                      }}
                      className="flex items-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black transition-colors w-full text-left"
                    >
                      <LogOut size={16} className="mr-2" />
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/dang-nhap"
                      className="flex items-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
                      onClick={toggleMobileMenu}
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      to="/dang-ky"
                      className="flex items-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
                      onClick={toggleMobileMenu}
                    >
                      Đăng ký
                    </Link>
                  </>
                )}
                <button
                  className="flex items-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
                  onClick={() => {
                    setShowImageSearch(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Image size={20} className="mr-2" />
                  Tìm kiếm bằng hình ảnh
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      <ProfileModal />
      <ArticlesModal />
      <AuthModal mode={authMode} />
      <ImageSearchModal
        show={showImageSearch}
        onClose={() => setShowImageSearch(false)}
        onResult={setImageSearchResult}
      />
      <UserPostsModal
        isOpen={showUserPosts}
        onClose={() => setShowUserPosts(false)}
      />
      <FavoritePostsModal
        isOpen={showFavoritePosts}
        onClose={() => setShowFavoritePosts(false)}
      />
    </>
  );
}

export default Header;