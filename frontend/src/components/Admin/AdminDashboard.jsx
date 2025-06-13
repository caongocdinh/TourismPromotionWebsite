import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  FileText,
  BarChart3,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Check,
  X,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Star,
  TrendingUp,
  Settings,
  Menu,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import ContentEditor from "../editor/ContentEditor";
import { LocationProvider, LocationSelector } from "../editor/LocationSelector";
import PreviewModal from "../editor/PreviewModal";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [searchPost, setSearchPost] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const [currentPagePosts, setCurrentPagePosts] = useState(1);
  const [usersPerPage] = useState(5);
  const [postsPerPage] = useState(5);
  const [editUser, setEditUser] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [title, setTitle] = useState("");
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [touristPlaces, setTouristPlaces] = useState([]);
  const [tempPosition, setTempPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState("pending");

  // TipTap editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontFamily,
    ],
    content: "<p>Viết bài quảng bá du lịch tại đây...</p>",
    editorProps: {
      attributes: {
        class:
          "prose max-w-none min-h-[400px] p-4 border border-gray-300 rounded-md bg-white text-gray-900",
      },
    },
  });

  // Fetch users, posts, and categories
  useEffect(() => {
    if (!user || user.role !== "admin") {
      toast.error("Bạn không có quyền truy cập trang này");
      return;
    }

    const fetchData = async () => {
      try {
        const usersResponse = await axios.get(
          "http://localhost:5000/api/users",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const usersData = usersResponse.data.data || usersResponse.data;
        setUsers(Array.isArray(usersData) ? usersData : []);

        const postsResponse = await axios.get(
          "http://localhost:5000/api/posts",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const postsData = postsResponse.data.data || postsResponse.data;
        const sortedPosts = Array.isArray(postsData)
          ? postsData.sort((a, b) => b.id - a.id)
          : [];
        setPosts(sortedPosts);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        toast.error(error.response?.data?.message || "Lỗi khi tải dữ liệu");
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/categories"
        );
        const data = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setCategories(data.map((c) => ({ ...c, selected: false })));
        setLoadingCategories(false);
      } catch (err) {
        setCategories([]);
        setLoadingCategories(false);
        toast.error("Lỗi khi tải danh mục");
      }
    };

    fetchData();
    fetchCategories();
  }, [user, token]);

  // Update editor when editing a post
  useEffect(() => {
    if (editingPost && editor) {
      setTitle(editingPost.title || "");
      setImages(editingPost.images || []);
      setTouristPlaces(
        editingPost.touristPlaces ||
          (editingPost.tourist_place_name
            ? [
                {
                  id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                  name: editingPost.tourist_place_name,
                  lat: Number(editingPost.latitude) || 0,
                  lng: Number(editingPost.longitude) || 0,
                  location_name: editingPost.location_name,
                },
              ]
            : [])
      );
      const updatedCategories = categories.map((c) => ({
        ...c,
        selected:
          editingPost.categories?.some((cat) => cat.id === c.id) || false,
      }));
      setCategories(updatedCategories);
      setStatus(editingPost.status || "pending");
      editor.commands.setContent(editingPost.content || "");
    }
  }, [editingPost, editor, categories]);

  // Stats calculation
  const stats = {
    totalUsers: users.length,
    totalPosts: posts.length,
    approvedPosts: posts.filter((p) => p.status === "approved").length,
    pendingPosts: posts.filter((p) => p.status === "pending").length,
    totalViews: posts.reduce((sum, post) => sum + (post.views || 0), 0),
    totalLikes: posts.reduce((sum, post) => sum + (post.likes || 0), 0),
  };

  // Filter and pagination
  const filteredUsers = Array.isArray(users)
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
          u.email.toLowerCase().includes(searchUser.toLowerCase())
      )
    : [];

  const filteredPosts = Array.isArray(posts)
    ? posts.filter((p) => {
        const matchesSearch = p.title
          .toLowerCase()
          .includes(searchPost.toLowerCase());
        const matchesStatus =
          filterStatus === "all" || p.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
    : [];

  const indexOfLastUser = currentPageUsers * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalUsersPages = Math.ceil(filteredUsers.length / usersPerPage);

  const indexOfLastPost = currentPagePosts * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPostsPages = Math.ceil(filteredPosts.length / postsPerPage);

  // Action handlers
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Bạn có chắc muốn xóa người dùng này?")) {
      try {
        const res = await axios.delete(
          `http://localhost:5000/api/users/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.status === 200) {
          setUsers(users.filter((u) => u.id !== userId));
          toast.success("Xóa người dùng thành công!");
        } else {
          toast.error("Xóa người dùng thất bại!");
        }
      } catch (error) {
        toast.error("Lỗi khi xóa người dùng!");
        console.error("Lỗi khi xóa người dùng:", error);
      }
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Bạn có chắc muốn xóa bài viết này?")) {
      try {
        const res = await axios.delete(
          `http://localhost:5000/api/posts/${postId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.status === 200) {
          setPosts(posts.filter((p) => p.id !== postId));
          toast.success("Xóa bài viết thành công!");
        } else {
          toast.error("Xóa bài viết thất bại!");
        }
      } catch (error) {
        toast.error("Lỗi khi xóa bài viết!");
        console.error("Lỗi khi xóa bài viết:", error);
      }
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/posts/approve/${postId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 200) {
        const updatedPost = await axios.get(
          `http://localhost:5000/api/posts/${postId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPosts(
          posts.map((p) => (p.id === postId ? updatedPost.data.data : p))
        );
        toast.success("Duyệt bài viết thành công!");
      }
    } catch (error) {
      toast.error("Duyệt bài viết thất bại!");
      console.error("Lỗi khi duyệt bài viết:", error);
    }
  };

  const handleRejectPost = async (postId) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/posts/reject/${postId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 200) {
        const updatedPost = await axios.get(
          `http://localhost:5000/api/posts/${postId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPosts(
          posts.map((p) => (p.id === postId ? updatedPost.data.data : p))
        );
        toast.success("Từ chối bài viết thành công!");
      }
    } catch (error) {
      toast.error("Từ chối bài viết thất bại!");
      console.error("Lỗi khi từ chối bài viết:", error);
    }
  };

  const handleEditUser = (user) => {
    setEditUser({ ...user });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `http://localhost:5000/api/users/${editUser.id}`,
        editUser,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 200) {
        setUsers(users.map((u) => (u.id === editUser.id ? editUser : u)));
        setEditUser(null);
        toast.success("Cập nhật người dùng thành công!");
      }
    } catch (error) {
      toast.error("Cập nhật người dùng thất bại!");
      console.error("Lỗi khi cập nhật người dùng:", error);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setActiveTab("editor");
  };

  const handleImageUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Kích thước ảnh vượt quá 5MB");
        return;
      }
      if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
        toast.error("Định dạng ảnh không hợp lệ");
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", file);
        const response = await axios.post(
          "http://localhost:5000/api/images/upload",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (response.data.success) {
          const { id, url, public_id } = response.data.data;
          if (editor) {
            editor.chain().focus().setImage({ src: url }).run();
          }
          setImages((prev) => [...prev, { id, url, public_id }]);
          toast.success("Tải ảnh lên thành công");
        } else {
          toast.error("Không thể tải ảnh lên");
        }
      } catch (error) {
        toast.error("Lỗi khi tải ảnh lên");
        console.error("Lỗi tải ảnh:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [editor]
  );

  const handleSavePost = async () => {
    if (!editor || !user || !editingPost) return;

    const confirmSave = window.confirm("Bạn có chắc chắn muốn lưu thay đổi?");
    if (!confirmSave) return;

    try {
      const content = editor.getHTML();
      const imageIds = images.map((img) => img.id);
      const selectedCategories = categories
        .filter((c) => c.selected)
        .map((c) => ({ value: c.id, label: c.name }));

      const response = await axios.put(
        `http://localhost:5000/api/posts/${editingPost.id}`,
        {
          title,
          content,
          touristPlaces,
          categories: selectedCategories,
          imageIds,
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const updatedPost = await axios.get(
          `http://localhost:5000/api/posts/${editingPost.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPosts(
          posts.map((p) =>
            p.id === editingPost.id ? updatedPost.data.data : p
          )
        );
        toast.success("Cập nhật bài viết thành công!");
        setEditingPost(null);
        setTitle("");
        setImages([]);
        setTouristPlaces([]);
        setTempPosition(null);
        setSearchQuery("");
        setCategories(categories.map((c) => ({ ...c, selected: false })));
        editor.commands.clearContent();
        setActiveTab("posts");
      }
    } catch (error) {
      toast.error(
        "Cập nhật bài viết thất bại: " +
          (error.response?.data?.message || error.message)
      );
      console.error("Lỗi khi cập nhật bài viết:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setTitle("");
    setImages([]);
    setTouristPlaces([]);
    setTempPosition(null);
    setSearchQuery("");
    setCategories(categories.map((c) => ({ ...c, selected: false })));
    editor.commands.clearContent();
    setActiveTab("posts");
  };

  // Components
  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = "blue",
  }) => (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600 mt-2`}>{value}</p>
          {trend && (
            <div
              className={`flex items-center mt-2 text-sm ${
                trend === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              <TrendingUp
                className={`w-4 h-4 mr-1 ${
                  trend === "down" ? "rotate-180" : ""
                }`}
              />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 bg-${color}-50 rounded-lg`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const Sidebar = () => (
    <div
      className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:transform-none md:static md:w-64 transition-transform duration-200 ease-in-out z-10`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-2 rounded-md hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="mt-4">
        {[
          { id: "dashboard", label: "Tổng quan", icon: BarChart3 },
          { id: "users", label: "Người dùng", icon: Users },
          { id: "posts", label: "Bài viết", icon: FileText },
          { id: "settings", label: "Cài đặt", icon: Settings },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
              activeTab === item.id
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600"
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user?.name?.charAt(0) || "A"}
          </span>
        </div>
        <span className="text-sm text-gray-600">{user?.name}</span>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-4">Tổng quan</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng người dùng"
          value={stats.totalUsers}
          icon={Users}
          trend="up"
          trendValue="+12%"
          color="blue"
        />
        <StatCard
          title="Tổng bài viết"
          value={stats.totalPosts}
          icon={FileText}
          trend="up"
          trendValue="+8%"
          color="green"
        />
        <StatCard
          title="Lượt xem"
          value={stats.totalViews.toLocaleString()}
          icon={Eye}
          trend="up"
          trendValue="+25%"
          color="purple"
        />
        <StatCard
          title="Lượt thích"
          value={stats.totalLikes.toLocaleString()}
          icon={Star}
          trend="up"
          trendValue="+15%"
          color="orange"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Trạng thái bài viết
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Đã duyệt</span>
              <span className="text-green-600 font-semibold">
                {stats.approvedPosts}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Chờ duyệt</span>
              <span className="text-yellow-600 font-semibold">
                {stats.pendingPosts}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Đã từ chối</span>
              <span className="text-red-600 font-semibold">
                {posts.filter((p) => p.status === "rejected").length}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Bài viết gần đây
          </h3>
          <div className="space-y-3">
            {posts.slice(0, 5).map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 truncate max-w-48">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-500">{post.author}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    post.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : post.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {post.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const UsersView = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-4">Quản lý người dùng</h1>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />
            Thêm người dùng
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tham gia
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-medium">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.status || "active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Hiển thị {indexOfFirstUser + 1} đến{" "}
            {Math.min(indexOfLastUser, filteredUsers.length)} của{" "}
            {filteredUsers.length} người dùng
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setCurrentPageUsers(Math.max(1, currentPageUsers - 1))
              }
              disabled={currentPageUsers === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              {currentPageUsers} / {totalUsersPages}
            </span>
            <button
              onClick={() =>
                setCurrentPageUsers(
                  Math.min(totalUsersPages, currentPageUsers + 1)
                )
              }
              disabled={currentPageUsers === totalUsersPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const PostsView = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-4">Quản lý bài viết</h1>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchPost}
              onChange={(e) => setSearchPost(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
            </select>
          </div>
        </div>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Download className="w-4 h-4" />
          Xuất báo cáo
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bài viết
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tác giả
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Địa điểm
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thống kê
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentPosts.map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {post.title}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {post.created_at
                          ? new Date(post.created_at).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {post.author || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                      {post.tourist_place_name || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        post.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : post.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {post.status === "approved"
                        ? "Đã duyệt"
                        : post.status === "pending"
                        ? "Chờ duyệt"
                        : "Đã từ chối"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {post.views || 0}
                        </span>
                        <span className="flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          {post.likes || 0}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/posts/${post.id}`}>
                        <button className="text-blue-600 hover:text-blue-800 p-1">
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleEditPost(post)}
                        className="text-gray-600 hover:text-gray-800 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {post.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprovePost(post.id)}
                            className="text-green-600 hover:text-green-800 p-1"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectPost(post.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Hiển thị {indexOfFirstPost + 1} đến{" "}
            {Math.min(indexOfLastPost, filteredPosts.length)} của{" "}
            {filteredPosts.length} bài viết
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setCurrentPagePosts(Math.max(1, currentPagePosts - 1))
              }
              disabled={currentPagePosts === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              {currentPagePosts} / {totalPostsPages}
            </span>
            <button
              onClick={() =>
                setCurrentPagePosts(
                  Math.min(totalPostsPages, currentPagePosts + 1)
                )
              }
              disabled={currentPagePosts === totalPostsPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const EditorView = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-4">Chỉnh sửa bài viết</h1>
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setIsPreviewOpen(true)}
          className="flex items-center space-x-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>Xem trước</span>
        </button>
        <button
          onClick={handleSavePost}
          className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Check className="w-4 h-4" />
          <span>Lưu</span>
        </button>
        <button
          onClick={handleCancelEdit}
          className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Hủy</span>
        </button>
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-3/4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Trạng thái bài viết
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-1/4 p-2 border border-gray-300 rounded-md"
            >
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
            </select>
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
        <LocationProvider
          initialPlaces={touristPlaces}
          setPlaces={setTouristPlaces}
        >
          <LocationSelector
            touristPlaces={touristPlaces}
            setTouristPlaces={setTouristPlaces}
            tempPosition={tempPosition}
            setTempPosition={setTempPosition}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </LocationProvider>
      </div>
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={title}
        categories={categories
          .filter((c) => c.selected)
          .map((c) => ({ value: c.id, label: c.name }))}
        content={editor?.getHTML() || ""}
        images={images}
        touristPlaces={touristPlaces}
      />
    </div>
  );

  const SettingsView = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-4">Cài đặt</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-600">
          Cài đặt hệ thống (chưa được triển khai).
        </p>
      </div>
    </div>
  );

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex-1">
        <div className="flex items-center justify-between p-4 bg-white shadow-md md:hidden">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <main className="p-6 max-w-6xl mx-auto">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "users" && <UsersView />}
          {activeTab === "posts" && <PostsView />}
          {activeTab === "editor" && <EditorView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>
      {editUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Chỉnh sửa người dùng</h2>
            <form onSubmit={handleSaveUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Tên
                </label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={(e) =>
                    setEditUser({ ...editUser, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <inputz
                  type="email"
                  value={editUser.email}
                  onChange={(e) =>
                    setEditUser({ ...editUser, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Vai trò
                </label>
                <select
                  value={editUser.role}
                  onChange={(e) =>
                    setEditUser({ ...editUser, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
