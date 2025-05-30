import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Image as ImageIcon,
  Send,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  RotateCcw,
  RotateCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';
import { setShowArticles } from '../redux/slices/uiSlice';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ArticlesModal = () => {
  const dispatch = useDispatch();
  const { showArticles } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState([10.7769, 106.7009]); // [lat, lng] cho Leaflet
  const [searchQuery, setSearchQuery] = useState(''); // Lưu trữ từ khóa tìm kiếm
  const [uploadedImages, setUploadedImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[300px] border border-gray-300 rounded-lg p-4',
      },
    },
  });

  useEffect(() => {
    setTimeout(() => {
      setCategories([
        { category_id: "1", name: "Địa điểm du lịch" },
        { category_id: "2", name: "Ẩm thực" },
        { category_id: "3", name: "Văn hóa" },
      ]);
      setLoadingCategories(false);
    }, 1000);
  }, []);

  // Hàm tìm kiếm địa điểm với Nominatim
  const handleSearchLocation = async () => {
    if (!searchQuery) return;

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const results = response.data;
      if (results.length > 0) {
        const { lat, lon } = results[0]; // Lấy tọa độ từ kết quả đầu tiên
        setLocation([parseFloat(lat), parseFloat(lon)]);
      } else {
        alert('Không tìm thấy địa điểm!');
      }
    } catch (err) {
      console.error('Lỗi khi tìm kiếm địa điểm:', err);
      alert('Có lỗi xảy ra khi tìm kiếm địa điểm!');
    }
  };

  const handleAddImage = async (e) => {
    const file = e.target.files[0];
    if (file && editor) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const response = await axios.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const imageUrl = response.data.url;
        setUploadedImages((prev) => [...prev, imageUrl]);
        editor.chain().focus().setImage({ src: imageUrl }).run();
      } catch (error) {
        console.error('Lỗi khi upload ảnh:', error);
        alert('Có lỗi khi upload ảnh');
      }
    }
  };

  const handleSubmitArticle = async () => {
    if (!editor) return;

    const articleData = {
      userId: user?._id,
      title,
      categoryId,
      location: { lat: location[0], lng: location[1] },
      content: [{ type: 'text', content: editor.getHTML() }],
      images: uploadedImages,
      status: 'pending',
    };
    try {
      await axios.post('/api/articles/submit', articleData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      alert('Bài viết đã được gửi cho admin duyệt');
      setTitle('');
      setCategoryId('');
      setLocation([10.7769, 106.7009]);
      setUploadedImages([]);
      editor.commands.clearContent();
      dispatch(setShowArticles(false));
    } catch (error) {
      console.error('Lỗi khi gửi bài viết:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  // Thành phần để điều khiển bản đồ
  const MapController = ({ location }) => {
    const map = useMap(); // Lấy đối tượng bản đồ
    useEffect(() => {
      map.setView(location, map.getZoom()); // Cập nhật trung tâm bản đồ
    }, [location, map]);
    return null;
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setLocation([e.latlng.lat, e.latlng.lng]);
      },
    });
    return location ? <Marker position={location} /> : null;
  };

  if (!showArticles) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl h-[90vh] overflow-y-auto transform transition-all duration-300 bg-gradient-to-br from-gray-100 to-white">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Tạo bài viết mới</h3>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề bài viết"
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        >
          <option value="" disabled>Chọn loại bài viết</option>
          {(categories || []).map((cat) => (
            <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
          ))}
        </select>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Chọn địa điểm</label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm địa điểm (ví dụ: Ho Chi Minh City)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <button
              onClick={handleSearchLocation}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Tìm
            </button>
          </div>
          <MapContainer center={location} zoom={13} style={{ height: '200px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker />
            <MapController location={location} />
          </MapContainer>
        </div>

        <div className="mb-6">
          <div className="border border-gray-300 rounded-lg p-2 bg-white">
            <div className="flex flex-wrap gap-1 mb-3 p-2 bg-gray-50 rounded-t-lg border-b border-gray-200">
              <div className="flex items-center gap-1">
                <select
                  onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
                  disabled={!editor}
                  className="px-2 py-1 rounded-md text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  defaultValue=""
                >
                  <option value="" disabled>Font</option>
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                  <option value="Courier New">Courier New</option>
                </select>
                <select
                  onChange={(e) => editor?.chain().focus().setFontSize(`${e.target.value}px`).run()}
                  disabled={!editor}
                  className="px-2 py-1 rounded-md text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  defaultValue=""
                >
                  <option value="" disabled>Cỡ</option>
                  <option value="12">12</option>
                  <option value="14">14</option>
                  <option value="16">16</option>
                  <option value="18">18</option>
                  <option value="20">20</option>
                  <option value="24">24</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  disabled={!editor}
                  className={`p-2 rounded-md ${editor?.isActive('bold') ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors`}
                  title="Tô đậm"
                >
                  <Bold size={16} />
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  disabled={!editor}
                  className={`p-2 rounded-md ${editor?.isActive('italic') ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors`}
                  title="In nghiêng"
                >
                  <Italic size={16} />
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  disabled={!editor}
                  className={`p-2 rounded-md ${editor?.isActive('bulletList') ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors`}
                  title="Danh sách không thứ tự"
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  disabled={!editor}
                  className={`p-2 rounded-md ${editor?.isActive('orderedList') ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors`}
                  title="Danh sách có thứ tự"
                >
                  <ListOrdered size={16} />
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  disabled={!editor}
                  className={`p-2 rounded-md ${editor?.isActive('heading', { level: 1 }) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors`}
                  title="Tiêu đề 1"
                >
                  <Heading1 size={16} />
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  disabled={!editor}
                  className={`p-2 rounded-md ${editor?.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors`}
                  title="Tiêu đề 2"
                >
                  <Heading2 size={16} />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                  disabled={!editor}
                  className={`p-2 rounded-md ${editor?.isActive({ textAlign: 'left' }) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors`}
                  title="Căn trái"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                  disabled={!editor}
                  className={`p-2 rounded-md ${editor?.isActive({ textAlign: 'center' }) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors`}
                  title="Căn giữa"
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                  disabled={!editor}
                  className={`p-2 rounded-md ${editor?.isActive({ textAlign: 'right' }) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors`}
                  title="Căn phải"
                >
                  <AlignRight size={16} />
                </button>
                <button
                  onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                  disabled={!editor}
                  className={`p-2 rounded-md ${editor?.isActive({ textAlign: 'justify' }) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors`}
                  title="Căn đều"
                >
                  <AlignJustify size={16} />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor || !editor.can().undo()}
                  className={`p-2 rounded-md ${!editor?.can().undo() ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors`}
                  title="Undo"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor || !editor.can().redo()}
                  className={`p-2 rounded-md ${!editor?.can().redo() ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors`}
                  title="Redo"
                >
                  <RotateCw size={16} />
                </button>
                <label className="cursor-pointer bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors flex items-center">
                  <ImageIcon size={16} title="Chèn ảnh" />
                  <input type="file" accept="image/*" onChange={handleAddImage} className="hidden" />
                </label>
              </div>
            </div>
            {editor ? <EditorContent editor={editor} /> : <p className="text-gray-500">Loading editor...</p>}
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => dispatch(setShowArticles(false))}
            className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors shadow-md"
          >
            Đóng
          </button>
          <button
            onClick={handleSubmitArticle}
            disabled={!editor || !title || !categoryId}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md"
          >
            <Send size={18} className="mr-2" /> Gửi duyệt
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticlesModal;