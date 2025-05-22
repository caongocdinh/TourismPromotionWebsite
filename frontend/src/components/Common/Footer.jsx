import React from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Twitter } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-blue-900 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-xl">K</div>
              <div>
                <div className="font-bold text-lg">KHÁM PHÁ DU LỊCH</div>
                <div className="text-xs text-blue-200">Những địa điểm tuyệt vời ở Việt Nam!</div>
              </div>
            </div>
            <p className="text-blue-200 text-sm mb-4">
              Với nhiều bài viết chia sẻ về các di sản văn hoá, thiên nhiên trên khắp Việt Nam. 
              Mang đến trải nghiệm du lịch chất lượng và đầy ý nghĩa.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <MapPin size={18} className="text-blue-300" />
                <span className="text-blue-100 text-sm">123 Nguyễn Huệ, Quận 1, TP. HCM</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={18} className="text-blue-300" />
                <span className="text-blue-100 text-sm">1900 1234</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={18} className="text-blue-300" />
                <span className="text-blue-100 text-sm">info@khamphavirus.com</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-100">Liên kết nhanh</h3>
            <ul className="space-y-2">
              {['Trang chủ', 'Giới thiệu', 'Tin tức du lịch', 'Liên hệ'].map((item, index) => (
                <li key={index}>
                  <a href={`/${item.toLowerCase().replace(' ', '-')}`} className="text-blue-200 hover:text-white transition-colors text-sm flex items-center">
                    <span className="mr-2">›</span> {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Destinations */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-100">Điểm đến nổi bật</h3>
            <ul className="space-y-2">
              {[
                'Hội An - Đà Nẵng',
                'Phong Nha - Kẻ Bàng',
                'Huế - Cố đô',
                'Tràng An - Ninh Bình',
                'Hạ Long - Quảng Ninh',
                'Châu Đốc - An Giang'
              ].map((item, index) => (
                <li key={index}>
                  <a href="#" className="text-blue-200 hover:text-white transition-colors text-sm flex items-center">
                    <span className="mr-2">›</span> {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-100">Đăng ký nhận tin</h3>
            <p className="text-blue-200 text-sm mb-4">
              Nhận thông tin về các bài viết mới, những địa điểm hấp dẫn và cẩm nang du lịch.
            </p>
            <div className="flex mb-4">
              <input
                type="email"
                placeholder="Email của bạn"
                className="px-4 py-2 rounded-l text-gray-800 w-full focus:outline-none text-sm"
              />
              <button className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-r text-sm">
                Đăng ký
              </button>
            </div>
            <h3 className="text-lg font-semibold mb-3 text-blue-100">Kết nối với chúng tôi</h3>
            <div className="flex space-x-3">
              <a href="#" className="bg-blue-800 p-2 rounded-full hover:bg-blue-700 transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="bg-blue-800 p-2 rounded-full hover:bg-blue-700 transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="bg-blue-800 p-2 rounded-full hover:bg-blue-700 transition-colors">
                <Youtube size={18} />
              </a>
              <a href="#" className="bg-blue-800 p-2 rounded-full hover:bg-blue-700 transition-colors">
                <Twitter size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-blue-800 my-6"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-blue-300">
          <p>© 2025 Khám Phá Di Sản. Tất cả quyền được bảo lưu.</p>
          <div className="flex space-x-4 mt-3 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-white transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;