


import React, { useState, useEffect } from "react";
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
  setShowAuth,
} from "../../redux/slices/uiSlice";
import { logout } from "../../redux/slices/authSlice";
import ProfileModal from "../ProfileModal";
import ArticlesModal from "../ArticlesModal";
import AuthModal from "./AuthModal";
import PostCreateForm from "../PostCreateForm";
import { useNavigate } from "react-router-dom";
import ImageSearchModal from "./ImageSearchModal";
import UserPostsModal from "../User/UserPostsModal";
import axios from "axios";
import FavoritePostsModal from "../User/FavoritePostsModal";


function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [exploreDropdownOpen, setExploreDropdownOpen] = useState(false); // State for Khám phá dropdown
  const [editorDropdownOpen, setEditorDropdownOpen] = useState(false);
  
 
  const [authMode, setAuthMode] = useState('login');
  const [showUserPosts, setShowUserPosts] = useState(false);
  const [showFavoritePosts, setShowFavoritePosts] = useState(false);
  const [categories, setCategories] = useState([]); // State for categories

  const dispatch = useDispatch();
  const { showProfile, showArticles, showAuth } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleExploreDropdown = () => setExploreDropdownOpen(!exploreDropdownOpen);
  const toggleEditorDropdown = () => setEditorDropdownOpen(!editorDropdownOpen);
  const navigate = useNavigate();

  const [showCreatePost, setShowCreatePost] = useState(false);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/categories');
        setCategories(response.data.data);
        console.log(categories)
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const menuItems = [
    { name: 'Trang chủ', href: '/' },
    { name: 'Cẩm nang du lịch', href: '/hanbook'},
    { name: 'Khám phá',  hasDropdown: true },
    { name: 'Liên hệ', href: '/contact' },
  ];



  useEffect(() => {
    if (!showAuth) setAuthMode('login');
  }, [showAuth]);

  return (
    <header className="w-full">
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
                    navigate('/');
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
                    setAuthMode('login');
                    dispatch(setShowAuth(true));
                  }}
                  className="text-sm hover:text-blue-200 transition-colors"
                >
                  Đăng nhập
                </button>
                <span className="text-sm">|</span>
                <button
                  onClick={() => {
                    setAuthMode('register');
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

      <div className="bg-white border-b border-gray-200 py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <a href="/" className="flex items-center space-x-2">
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
              </a>
            </div>

            <nav className="hidden lg:flex items-center">
              <ul className="flex space-x-8">
                {menuItems.map((item, index) => (
                  <li key={index} className="relative group">
                    <a
                      href={item.href}
                      className="text-gray-700 font-medium hover:text-primary relative py-2 flex items-center"
                      onClick={item.hasDropdown && item.name === 'Cẩm nang du lịch' ? toggleDropdown : item.hasDropdown && item.name === 'Khám phá' ? toggleExploreDropdown : undefined}
                    >
                      {item.name}
                      {item.hasDropdown && (
                        <ChevronDown size={16} className="ml-1" />
                      )}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                    </a>
                    {item.hasDropdown && item.name === 'Cẩm nang du lịch' && dropdownOpen && (
                      <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 z-20">
                        <a
                          href="/cam-nang/mien-bac"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                        >
                          Miền Bắc
                        </a>
                        <a
                          href="/cam-nang/mien-trung"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                        >
                          Miền Trung
                        </a>
                        <a
                          href="/cam-nang/mien-nam"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                        >
                          Miền Nam
                        </a>
                      </div>
                    )}
                    {item.hasDropdown && item.name === 'Khám phá' && exploreDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 z-20">
                        {categories.map((category) => (
                          <a
                            key={category.id}
                            href={`/explore/${category.id}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                          >
                            {category.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
                {user?.role === 'admin' && (
                  <li className="relative group">
                    <a
                      href="/admin"
                      className="text-gray-700 font-medium hover:text-primary relative py-2 items-center flex"
                    >
                      Dashboard Admin
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                    </a>
                  </li>
                )}
              </ul>
            </nav>

            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-primary">
                <Search size={22} />
              </button>
            

              <ImageSearchModal/>
              <div className="relative">
                <button
                  onClick={toggleEditorDropdown}
                  className="text-gray-600 hover:text-primary flex items-center"
                >
                  <Book size={22} />
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
                title={user ? `Hồ sơ: ${user.name}` : 'Hồ sơ người dùng'}
              >
                <User size={22} />
                {user && <span className="text-sm font-medium">{user.name}</span>}
              </button>
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden text-gray-600"
              >
                {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCreatePost && (
        <PostCreateForm close={() => setShowCreatePost(false)} />
      )}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <ul className="space-y-3">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <div className="flex justify-between items-center">
                    <a
                      href={item.href}
                      className="block text-gray-700 font-medium py-2 border-b border-gray-100"
                    >
                      {item.name}
                    </a>
                    {item.hasDropdown && item.name === 'Cẩm nang du lịch' && (
                      <button
                        onClick={toggleDropdown}
                        className="text-gray-700"
                      >
                        <ChevronDown size={16} />
                      </button>
                    )}
                    {item.hasDropdown && item.name === 'Khám phá' && (
                      <button
                        onClick={toggleExploreDropdown}
                        className="text-gray-700"
                      >
                        <ChevronDown size={16} />
                      </button>
                    )}
                  </div>
                  {item.hasDropdown && item.name === 'Cẩm nang du lịch' && dropdownOpen && (
                    <div className="pl-4">
                      <a
                        href="/cam-nang/mien-bac"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                      >
                        Miền Bắc
                      </a>
                      <a
                        href="/cam-nang/mien-trung"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                      >
                        Miền Trung
                      </a>
                      <a
                        href="/cam-nang/mien-nam"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                      >
                        Miền Nam
                      </a>
                    </div>
                  )}
                  {item.hasDropdown && item.name === 'Khám phá' && exploreDropdownOpen && (
                    <div className="pl-4">
                      {categories.map((category) => (
                        <a
                          key={category.id}
                          href={`/explore/${category.id}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                        >
                          {category.name}
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ))}
              {user?.role === 'admin' && (
                <li>
                  <a
                    href="/admin"
                    className="block text-gray-700 font-medium py-2 border-b border-gray-100"
                  >
                    Dashboard Admin
                  </a>
                </li>
              )}
              <li>
                <button
                  onClick={() => {
                    navigate("/editor");
                    setMobileMenuOpen(false);
                  }}
                  className="block text-gray-700 font-medium py-2 border-b border-gray-100 w-full text-left"
                >
                  Tạo bài viết
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setShowUserPosts(true);
                    setMobileMenuOpen(false);
                  }}
                  className="block text-gray-700 font-medium py-2 border-b border-gray-100 w-full text-left"
                >
                  Bài viết của bạn
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setShowFavoritePosts(true);
                    setMobileMenuOpen(false);
                  }}
                  className="block text-gray-700 font-medium py-2 border-b border-gray-100 w-full text-left"
                >
                  Bài viết yêu thích
                </button>
              </li>
              <li className="pt-2">
                <div className="flex space-x-3">
                  {user ? (
                    <>
                      <span className="text-gray-700 font-medium py-2">
                        Xin chào, {user.name}
                      </span>
                      <button
                        onClick={() => {
                          dispatch(logout());
                          navigate('/');
                          toggleMobileMenu();
                        }}
                        className="bg-primary text-white px-4 py-2 rounded text-sm flex items-center"
                      >
                        <LogOut size={16} className="mr-1" />
                        Đăng xuất
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setAuthMode('login');
                          dispatch(setShowAuth(true));
                          toggleMobileMenu();
                        }}
                        className="bg-primary text-white px-4 py-2 rounded text-sm"
                      >
                        Đăng nhập
                      </button>
                      <button
                        onClick={() => {
                          setAuthMode('register');
                          dispatch(setShowAuth(true));
                          toggleMobileMenu();
                        }}
                        className="border border-primary text-primary px-4 py-2 rounded text-sm"
                      >
                        Đăng ký
                      </button>
                    </>
                  )}
                </div>
              </li>
              <li>
                <button
                  className="flex items-center text-gray-700 hover:text-primary py-2"
                  onClick={() => {
                   
                    setMobileMenuOpen(false);
                  }}
                >
                  <Image size={20} className="mr-2" />
                  Tìm kiếm bằng hình ảnh
                </button>
              </li>
            </ul>
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
    </header>
  );
}

export default Header;