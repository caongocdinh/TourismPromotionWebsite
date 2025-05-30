
// src/components/pages/EditorPage.jsx
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

const EditorPage = () => {
  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [touristPlaces, setTouristPlaces] = useState([]);
  const [tempPosition, setTempPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
    ],
    content: '<p>Viết bài quảng bá du lịch tại đây...</p>',
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[400px] p-4 border border-gray-300 rounded-md bg-white text-primary',
      },
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/categories');
        const data = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setCategories(data.map(c => ({ ...c, selected: false })));
        setLoadingCategories(false);
      } catch (err) {
        setError('Lỗi khi tải danh mục');
        setCategories([]);
        setLoadingCategories(false);
        toast.error('Lỗi khi tải danh mục');
      }
    };
    fetchCategories();

    setTitle('');
    setImages([]);
    setTouristPlaces([]);
    setTempPosition(null);
    setSearchQuery('');
    if (editor) editor.commands.clearContent();
  }, [editor]);

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;
    setImages((prev) => {
      const reordered = Array.from(prev);
      const [moved] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, moved);
      return reordered;
    });
  }, []);

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image size exceeds 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      toast.error('Invalid image format');
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
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      toast.error('Error uploading image');
      console.error('Image upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [editor]);

  const handlePublish = useCallback(async () => {
    if (!editor) return;
    try {
      const content = editor.getHTML();
      const imageIds = images.map(img => img.id);
      const selectedCategories = categories
        .filter(c => c.selected)
        .map(c => ({ value: c.id, label: c.name }));
      await axios.post('http://localhost:5000/api/posts/add', {
        title,
        content,
        user_id: 1, // Thay bằng user_id từ auth context
        touristPlaces,
        categories: selectedCategories,
        imageIds,
      });
      toast.success('Bài viết đã được xuất bản!', { position: 'top-right' });
      setTitle('');
      setCategories(categories.map(c => ({ ...c, selected: false })));
      setImages([]);
      setTouristPlaces([]);
      setTempPosition(null);
      setSearchQuery('');
      editor.commands.clearContent();
    } catch (error) {
      console.error('Lỗi xuất bản:', error);
      toast.error('Xuất bản thất bại.', { position: 'top-right' });
    }
  }, [editor, title, categories, images, touristPlaces]);

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      <Toaster position="top-right" />
      <Header onPreview={() => setIsPreviewOpen(true)} onPublish={handlePublish} />
      <div className="container mx-auto p-4 flex flex-col lg:flex-row gap-4 animate-fadeIn">
        <div className="lg:w-3/4">
          <ContentEditor
            title={title}
            setTitle={setTitle}
            categories={categories}
            setCategories={setCategories}
            editor={editor}
            onImageUpload={handleImageUpload}
            isUploading={isUploading}
          />
          <ImageGallery
            images={images}
            onDragEnd={onDragEnd}
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

export default EditorPage;
