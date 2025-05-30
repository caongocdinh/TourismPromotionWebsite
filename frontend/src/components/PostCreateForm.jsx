import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
} from "lucide-react";
import { setShowArticles } from "../redux/slices/uiSlice";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import axios from "axios";
import Select from "react-select";

const PostCreateForm = ({ close}) => {
  const dispatch = useDispatch();
  const { showArticles } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const [title, setTitle] = useState("");
  const [categoryIds, setCategoryIds] = useState([]);
  const [touristPlaceId, setTouristPlaceId] = useState("");
  const [touristPlaces, setTouristPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTouristPlaces, setLoadingTouristPlaces] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontFamily,
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[300px] border border-gray-300 rounded-lg p-4",
      },
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/categories"
        );
        console.log(response);
        const data = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setCategories(data);
        setLoadingCategories(false);
      } catch (err) {
        setError("Lỗi khi tải danh mục");
        setCategories([]);
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchTouristPlaces = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/tourist_places"
        );
        console.log(response);
        const data = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setTouristPlaces(data);
        setLoadingTouristPlaces(false);
      } catch (err) {
        setError("Lỗi khi tải địa điểm");
        setTouristPlaces([]);
        setLoadingTouristPlaces(false);
      }
    };
    fetchTouristPlaces();
  }, []);

  const handleAddImage = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0 && editor) {
      selectedFiles.forEach((file, index) => {
        const placeholder = `[image:${files.length + index}]`;
        editor.chain().focus().insertContent(placeholder).run();
      });
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const handleSubmitArticle = async () => {
    if (!editor || !title || !categoryIds.length || !touristPlaceId) {
      alert("Vui lòng điền đầy đủ thông tin: tiêu đề, danh mục, địa điểm");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", editor.getHTML());
    formData.append("user_id", user?.id || user?._id || "1");
    formData.append("tourist_place_id", touristPlaceId || "1");
    formData.append("category_ids", JSON.stringify(categoryIds));
    files.forEach((file, index) => {
      formData.append("images", file);
    });

    try {
      await axios.post("http://localhost:5000/api/posts/add", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      alert("Bài viết đã được gửi cho admin duyệt");
      setTitle("");
      setCategoryIds([]);
      setTouristPlaceId("");
      setFiles([]);
      editor.commands.clearContent();
      dispatch(setShowArticles(false));
    } catch (error) {
      console.error("Lỗi khi gửi bài viết:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={close}
        >
          Đóng
        </button>
        <h2 className="text-2xl font-bold mb-4">Tạo bài viết mới</h2>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Tiêu đề</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Danh mục</label>
          <Select
            isMulti
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={categories
              .filter((c) => categoryIds.includes(c.id))
              .map((c) => ({ value: c.id, label: c.name }))}
            onChange={(selected) =>
              setCategoryIds(selected.map((s) => s.value))
            }
            isLoading={loadingCategories}
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Địa điểm du lịch</label>
          <Select
            options={touristPlaces.map((tp) => ({
              value: tp.id,
              label: tp.name,
            }))}
            value={touristPlaces
              .filter((tp) => tp.id === touristPlaceId)
              .map((tp) => ({ value: tp.id, label: tp.name }))}
            onChange={(selected) => setTouristPlaceId(selected.value)}
            isLoading={loadingTouristPlaces}
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Nội dung</label>
          <EditorContent editor={editor} />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Hình ảnh</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleAddImage}
          />
        </div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={handleSubmitArticle}
          disabled={loading}
        >
          {loading ? "Đang gửi..." : "Gửi bài viết"}
        </button>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  );
};

export default PostCreateForm;