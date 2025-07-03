import React, { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, User, Phone, Book, LogOut } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setShowProfile, setShowAuth } from "../../redux/slices/uiSlice";
import { logout } from "../../redux/slices/authSlice";
import ProfileModal from "../User/ProfileModal";
import ArticlesModal from "../ArticlesModal";
import AuthModal from "./AuthModal";
import PostCreateForm from "../PostCreateForm";
import { useNavigate, Link } from "react-router-dom";
import ImageSearchModal from "./ImageSearchModal";
import UserPostsModal from "../User/UserPostsModal";
import FavoritePostsModal from "../User/FavoritePostsModal";
import axios from "axios";

import SearchBar from "./SearchBar";



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
  const { showProfile, showArticles, showAuth } = useSelector(
    (state) => state.ui
  );
  const { user } = useSelector((state) => state.auth);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleExploreDropdown = () =>
    setExploreDropdownOpen(!exploreDropdownOpen);
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
        const response = await axios.get(
          "http://localhost:5000/api/categories"
        );
        setCategories(response.data.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const menuItems = [
    { name: "Trang chủ", href: "/" },
    { name: "Cẩm nang du lịch", href: "/hanbook" },
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
      <header className="fixed top-0 left-0 w-full z-[9999] transition-all duration-300 ">
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

        <div className="bg-slate-50 py-4 ">
          <div className="w-full flex gap-0 sm:gap-20 items-center justify-center">
            <div>
              <Link
                to="/"
                className="flex items-center space-x-3 transition-transform duration-200 hover:scale-105"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-white shadow">
                  K
                </div>

                <div className="leading-tight">
                  <h1 className="text-lg font-semibold text-primary sm:text-xl">
                    KHÁM PHÁ DU LỊCH
                  </h1>
                  <p className="text-xs font-medium text-gray-500 sm:text-sm">
                    Những địa điểm du lịch tuyệt vời ở Việt Nam!
                  </p>
                </div>
              </Link>
            </div>

            <div>
              <nav className="hidden lg:flex items-center">
                <ul className="flex space-x-8">
                  {menuItems.map((item, index) => (
                    <li key={index} className="relative group">
                      <Link
                        to={item.href || "#"}
                        className="relative flex items-center py-2 font-medium text-gray-700 hover:text-primary transition-colors"
                        onClick={(e) => {
                          if (item.hasDropdown) {
                            e.preventDefault();
                            if (item.name === "Khám phá")
                              toggleExploreDropdown();
                          }
                        }}
                      >
                        {item.name}
                        {item.hasDropdown && (
                          <ChevronDown size={16} className="ml-1" />
                        )}
                        <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all duration-300 group-hover:w-full"></span>
                      </Link>

                      {/* Dropdown cho "Khám phá" */}
                      {item.hasDropdown &&
                        item.name === "Khám phá" &&
                        exploreDropdownOpen && (
                          <div className="absolute left-0 top-full mt-2 w-56 rounded-md bg-white shadow-lg z-20">
                            {categories.map((category) => (
                              <Link
                                key={category.id}
                                to={`/explore/${category.id}`}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                                onClick={() => setExploreDropdownOpen(false)}
                              >
                                {category.name}
                              </Link>
                            ))}
                          </div>
                        )}
                    </li>
                  ))}

                  {/* Mục admin */}
                  {user?.role === "admin" && (
                    <li className="relative group">
                      <Link
                        to="/admin"
                        className="relative flex items-center py-2 font-medium text-gray-700 hover:text-primary transition-colors"
                      >
                        Dashboard Admin
                        <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all duration-300 group-hover:w-full"></span>
                      </Link>
                    </li>
                  )}
                </ul>
              </nav>
            </div>

            <div>
              <div className="flex items-center space-x-4">
                <div className="">
                  <SearchBar />
                </div>

                <div className=" sm:block">
                  <ImageSearchModal />
                </div>
                <div className="relative group hidden sm:block">
                  <button
                    onClick={toggleEditorDropdown}
                    className="text-gray-600 group-hover:text-primary flex items-center transition-colors"
                  >
                    <Book size={20} />
                    <ChevronDown size={16} className="ml-1 transition-colors" />
                  </button>

                  {editorDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-md py-2 z-20 border border-gray-100">
                      <button
                        onClick={() => {
                          navigate("/editor");
                          setEditorDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                      >
                        ✍️ Tạo bài viết
                      </button>
                      <button
                        onClick={() => {
                          setShowUserPosts(true);
                          setEditorDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                      >
                        📄 Bài viết của bạn
                      </button>
                      <button
                        onClick={() => {
                          setShowFavoritePosts(true);
                          setEditorDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                      >
                        ❤️ Bài viết yêu thích
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
                  {user && (
                    <span className="text-sm font-medium">{user.name}</span>
                  )}
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
        </div>
      </header>

      <div
        className={`${scrolled ? "h-28" : "h-32"} transition-all duration-300`}
      ></div>

      {/* <div className="sm:hidden fixed top-28 left-0 right-0 z-40 px-4 py-2 bg-white/95 shadow-sm">
        <SearchBar />
      </div> */}

      {showCreatePost && (
        <PostCreateForm close={() => setShowCreatePost(false)} />
      )}
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
                    <div className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <Link
                        to={item.href || "#"}
                        onClick={
                          item.hasDropdown && item.name === "Khám phá"
                            ? toggleExploreDropdown
                            : toggleMobileMenu
                        }
                        className="flex-1 text-gray-600 group-hover:text-black transition-colors"
                      >
                        {item.name}
                      </Link>
                      {item.hasDropdown && item.name === "Khám phá" && (
                        <ChevronDown
                          size={16}
                          className="text-gray-600 group-hover:text-black transition-colors"
                        />
                      )}
                    </div>

                    {/* Dropdown cho "Khám phá" */}
                    {item.hasDropdown &&
                      item.name === "Khám phá" &&
                      exploreDropdownOpen && (
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
                <div className="flex items-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black transition-colors">
                  <ImageSearchModal />
                  <span className="ml-2">Tìm kiếm bằng hình ảnh</span>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      <ProfileModal />
      <ArticlesModal />
      <AuthModal mode={authMode} />

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
