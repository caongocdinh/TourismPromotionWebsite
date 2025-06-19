import { useState, useEffect, useCallback } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../editor/Header';
import ContentEditor from '../editor/ContentEditor';
import ImageGallery from '../editor/ImageGallery';
import LocationSelector from '../editor/LocationSelector';
import PreviewModal from '../editor/PreviewModal';
import useAuth from '../../hooks/useAuth';

const PostEditor = ({ post = null, onClose, onSave }) => {
  const [title, setTitle] = useState(post ? post.title : '');
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState(post?.images || []);
  const [touristPlaces, setTouristPlaces] = useState([]);
  const [tempPosition, setTempPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(post?.status || 'pending');
  const [isInitialized, setIsInitialized] = useState(false);

  const { user, token } = useAuth();

  // Initialize editor with proper content
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
    ],
    content: post?.content || '<p>Viết bài quảng bá du lịch tại đây...</p>',
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[400px] p-4 border border-gray-300 rounded-md bg-white text-primary',
      },
    },
    onUpdate: ({ editor }) => {
      // Optional: Add any editor update handling here
    },
  });

  // Initialize tourist places from post data
  useEffect(() => {
    if (post && !isInitialized) {
      const initialTouristPlaces = post.touristPlaces || [];
      if (post.tourist_place_name && !initialTouristPlaces.length) {
        initialTouristPlaces.push({
          name: post.tourist_place_name,
          lat: parseFloat(post.latitude) || 0,
          lng: parseFloat(post.longitude) || 0,
          location_name: post.location_name,
        });
      }
      setTouristPlaces(initialTouristPlaces);
      setIsInitialized(true);
    }
  }, [post, isInitialized]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/categories');
        const data = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.data)
          ? response.data.data
          : [];
        const mappedCategories = data.map(c => ({
          ...c,
          selected: post?.categories?.some(cat => cat.id === c.id) || false,
        }));
        setCategories(mappedCategories);
        setLoadingCategories(false);
      } catch (err) {
        setError('Lỗi khi tải danh mục');
        setCategories([]);
        setLoadingCategories(false);
        toast.error('Lỗi khi tải danh mục');
      }
    };
    fetchCategories();
  }, [post?.categories]);

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  const validatePost = () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài viết');
      return false;
    }
    if (!editor?.getHTML().trim()) {
      toast.error('Vui lòng nhập nội dung bài viết');
      return false;
    }
    if (!touristPlaces.length) {
      toast.error('Vui lòng chọn ít nhất một địa điểm du lịch');
      return false;
    }
    if (!categories.some(c => c.selected)) {
      toast.error('Vui lòng chọn ít nhất một danh mục');
      return false;
    }
    return true;
  };

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Kích thước ảnh vượt quá 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      toast.error('Định dạng ảnh không hợp lệ');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await axios.post('http://localhost:5000/api/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const { id, url, public_id } = response.data.data;
        if (editor) {
          editor.chain().focus().setImage({ src: url }).run();
        }
        setImages((prev) => [...prev, { id, url, public_id }]);
        toast.success('Tải ảnh lên thành công');
      } else {
        toast.error('Không thể tải ảnh lên');
      }
    } catch (error) {
      toast.error('Lỗi khi tải ảnh lên');
      console.error('Lỗi tải ảnh:', error);
    } finally {
      setIsUploading(false);
    }
  }, [editor]);

  const handlePublish = useCallback(async () => {
    if (!editor || !user || !token) {
      toast.error('Vui lòng đăng nhập để tiếp tục');
      return;
    }

    if (!validatePost()) {
      return;
    }

    const confirmSave = window.confirm('Bạn có chắc chắn muốn lưu thay đổi?');
    if (!confirmSave) return;

    try {
      const content = editor.getHTML();
      const imageIds = images.map(img => img.id);
      const selectedCategories = categories
        .filter(c => c.selected)
        .map(c => ({ value: c.id, label: c.name }));

      let response;
      if (post) {
        response = await axios.put(`http://localhost:5000/api/posts/${post.id}`, {
          title,
          content,
          user_id: user.id,
          touristPlaces,
          categories: selectedCategories,
          imageIds,
          status,
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        response = await axios.post('http://localhost:5000/api/posts/add', {
          title,
          content,
          user_id: user.id,
          touristPlaces,
          categories: selectedCategories,
          imageIds,
          status: 'pending', // New posts always start as pending
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      if (response.data.success) {
        toast.success(response.data.message || 'Bài viết đã được lưu thành công!', { position: 'top-right' });
        onSave(response.data.data);
        onClose();
      } else {
        throw new Error(response.data.message || 'Lỗi khi lưu bài viết');
      }
    } catch (error) {
      console.error('Lỗi khi lưu bài viết:', error);
      toast.error('Lưu bài viết thất bại: ' + (error.response?.data?.message || error.message), { position: 'top-right' });
    }
  }, [editor, user, token, title, categories, images, touristPlaces, post, status, onClose, onSave]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Vui lòng đăng nhập để tiếp tục</h2>
          <p className="text-gray-600">Bạn cần đăng nhập để có thể tạo hoặc chỉnh sửa bài viết.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      <Toaster position="top-right" />
      <Header
        onPreview={() => setIsPreviewOpen(true)}
        onPublish={handlePublish}
        onCancel={onClose}
        isEditing={!!post}
      />
      <div className="container mx-auto p-4 flex flex-col lg:flex-row gap-4 animate-fadeIn">
        <div className="lg:w-3/4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Trạng thái bài viết</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-1/4 p-2 border border-gray-300 rounded-md"
              disabled={user.role !== 'admin'}
            >
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
            </select>
            {user.role !== 'admin' && (
              <p className="text-sm text-gray-500 mt-1">Chỉ admin mới có thể thay đổi trạng thái bài viết.</p>
            )}
          </div>
          <ContentEditor
            title={title}
            setTitle={setTitle}
            categories={categories}
            setCategories={setCategories}
            editor={editor}
            onImageUpload={handleImageUpload}
            isUploading={isUploading}
          />
        </div>
        <LocationSelector
          touristPlaces={touristPlaces}
          setTouristPlaces={setTouristPlaces}
          tempPosition={tempPosition}
          setTempPosition={setTempPosition}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={title}
        categories={categories.filter(c => c.selected).map(c => ({ value: c.id, label: c.name }))}
        content={editor?.getHTML() || ''}
        images={images}
        touristPlaces={touristPlaces}
      />
    </div>
  );
};

export default PostEditor;