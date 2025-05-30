import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  ChevronDown,
  Search,
  User,
  ShoppingBag,
  Phone,
  Book,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  setShowProfile,
  setShowArticles,
  setShowAuth,
} from "../../redux/slices/uiSlice";
import ProfileModal from "../ProfileModal";
import ArticlesModal from "../ArticlesModal";
import AuthModal from "./AuthModal";
import PostCreateForm from "../PostCreateForm";
import { useNavigate } from "react-router-dom";

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dispatch = useDispatch();
  const { showProfile, showArticles, showAuth } = useSelector(
    (state) => state.ui
  );
  const { user } = useSelector((state) => state.auth);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const navigate = useNavigate();
  const menuItems = [
    { name: "Trang chủ", href: "/" },
    { name: "Cẩm nang du lịch", href: "/cam-nang", hasDropdown: true },
    { name: "Di sản Việt Nam", href: "/di-san" },
    { name: "Liên hệ", href: "/lien-he" },
  ];

  return (
    <header className="w-full">
      <div className="bg-blue-900 text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-sm">
              <Phone size={14} />
              <span>Hotline: 1900 1234</span>
            </div>
            <span className="text-sm">|</span>
            <span className="text-sm">Email: info@khamphavirus.com</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => dispatch(setShowAuth(true))}
              className="text-sm hover:text-blue-200 transition-colors"
            >
              Đăng nhập
            </button>
            <span className="text-sm">|</span>
            <button
              onClick={() => dispatch(setShowAuth(true))}
              className="text-sm hover:text-blue-200 transition-colors"
            >
              Đăng ký
            </button>
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
                    KHÁM PHÁ DI SẢN
                  </div>
                  <div className="text-xs text-gray-500">
                    Dấu ấn di sản thế giới ở Việt Nam!
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
                      onClick={item.hasDropdown ? toggleDropdown : undefined}
                    >
                      {item.name}
                      {item.hasDropdown && (
                        <ChevronDown size={16} className="ml-1" />
                      )}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                    </a>
                    {item.hasDropdown && dropdownOpen && (
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
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-primary">
                <Search size={22} />
              </button>
              <button
                onClick={() => dispatch(setShowArticles(true))}
                className="text-gray-600 hover:text-primary relative"
              >
                <ShoppingBag size={22} />
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {user?.articles?.length || 0}
                </span>
              </button>
              <button
                onClick={() => navigate("/editor")}
                className="text-gray-600 hover:text-primary"
              >
                <Book />
              </button>
              <button
                onClick={() => dispatch(setShowProfile(true))}
                className="text-gray-600 hover:text-primary hidden md:block"
              >
                <User size={22} />
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
        // <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        //   <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl h-[90vh] overflow-y-auto transform transition-all duration-300 bg-gradient-to-br from-gray-100 to-white">
        <PostCreateForm close={() => setShowCreatePost(false)} />
        //   </div>
        // </div>
      )}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <ul className="space-y-3">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.href}
                    className="block text-gray-700 font-medium py-2 border-b border-gray-100"
                  >
                    <div className="flex justify-between items-center">
                      {item.name}
                      {item.hasDropdown && <ChevronDown size={16} />}
                    </div>
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      dispatch(setShowAuth(true));
                      toggleMobileMenu();
                    }}
                    className="bg-primary text-white px-4 py-2 rounded text-sm"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => {
                      dispatch(setShowAuth(true));
                      toggleMobileMenu();
                    }}
                    className="border border-primary text-primary px-4 py-2 rounded text-sm"
                  >
                    Đăng ký
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      )}

      <ProfileModal />
      <ArticlesModal />
      <AuthModal />
      {/* <PostCreateForm/> */}
    </header>
  );
}

export default Header;
