import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import ContentEditor from '../editor/ContentEditor';
import { LocationProvider, LocationSelector } from '../editor/LocationSelector';
import PreviewModal from '../editor/PreviewModal';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0 });
  const [searchUser, setSearchUser] = useState('');
  const [searchPost, setSearchPost] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // Thêm bộ lọc trạng thái
  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const [currentPagePosts, setCurrentPagePosts] = useState(1);
  const [usersPerPage] = useState(5);
  const [postsPerPage] = useState(5);
  const [editUser, setEditUser] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [touristPlaces, setTouristPlaces] = useState([]);
  const [tempPosition, setTempPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [status, setStatus] = useState('pending');

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
    if (!user || user.role !== 'admin') {
      toast.error('Bạn không có quyền truy cập trang này');
      return;
    }

    const fetchData = async () => {
      try {
        const usersResponse = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = usersResponse.data.data || usersResponse.data;
        setUsers(Array.isArray(usersData) ? usersData : []);

        const postsResponse = await axios.get('http://localhost:5000/api/posts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const postsData = postsResponse.data.data || postsResponse.data;
        // Sắp xếp bài viết theo ID giảm dần (mới nhất trước)
        const sortedPosts = Array.isArray(postsData)
          ? postsData.sort((a, b) => b.id - a.id)
          : [];
        setPosts(sortedPosts);

        setStats({
          totalUsers: usersData.length,
          totalPosts: sortedPosts.length,
        });
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        toast.error(error.response?.data?.message || 'Lỗi khi tải dữ liệu');
      }
    };

    fetchData();
  }, [user, token]);

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
        setCategories([]);
        setLoadingCategories(false);
        toast.error('Lỗi khi tải danh mục');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingPost && editor) {
      console.log('Editing Post Data:', editingPost);
      setTitle(editingPost.title || '');
      setImages(editingPost.images || []);
      setTouristPlaces(editingPost.touristPlaces || (editingPost.tourist_place_name ? [{
        id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name: editingPost.tourist_place_name,
        lat: Number(editingPost.latitude) || 0,
        lng: Number(editingPost.longitude) || 0,
        location_name: editingPost.location_name,
      }] : []));
      const updatedCategories = categories.map(c => ({
        ...c,
        selected: editingPost.categories?.some(cat => cat.id === c.id) || false,
      }));
      if (JSON.stringify(categories) !== JSON.stringify(updatedCategories)) {
        setCategories(updatedCategories);
      }
      setStatus(editingPost.status || 'pending');
      editor.commands.setContent(editingPost.content || '');
    }
  }, [editingPost, editor, categories]);

  const handleSearchChange = (e) => {
  setSearchPost(e.target.value);
  setCurrentPagePosts(1); // Reset về trang 1 khi tìm kiếm
};

const handleFilterChange = (e) => {
  setFilterStatus(e.target.value);
  setCurrentPagePosts(1); // Reset về trang 1 khi lọc
};

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      try {
        const res = await axios.delete(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 200) {
          setUsers(users.filter((u) => u.id !== userId));
          setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
          toast.success('Xóa người dùng thành công!');
        } else {
          toast.error('Xóa người dùng thất bại!');
        }
      } catch (error) {
        toast.error('Lỗi khi xóa người dùng!');
        console.error('Lỗi khi xóa người dùng:', error);
      }
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Bạn có chắc muốn xóa bài viết này?')) {
      try {
        const res = await axios.delete(`http://localhost:5000/api/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 200) {
          setPosts(posts.filter((p) => p.id !== postId));
          setStats((prev) => ({ ...prev, totalPosts: prev.totalPosts - 1 }));
          toast.success('Xóa bài viết thành công!');
        } else {
          toast.error('Xóa bài viết thất bại!');
        }
      } catch (error) {
        toast.error('Lỗi khi xóa bài viết!');
        console.error('Lỗi khi xóa bài viết:', error);
      }
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/posts/approve/${postId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setPosts(posts.map((p) => (p.id === postId ? { ...p, status: 'approved' } : p)));
        toast.success('Duyệt bài viết thành công!');
      }
    } catch (error) {
      toast.error('Duyệt bài viết thất bại!');
      console.error('Lỗi khi duyệt bài viết:', error);
    }
  };

  const handleRejectPost = async (postId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/posts/reject/${postId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setPosts(posts.map((p) => (p.id === postId ? { ...p, status: 'rejected' } : p)));
        toast.success('Từ chối bài viết thành công!');
      }
    } catch (error) {
      toast.error('Từ chối bài viết thất bại!');
      console.error('Lỗi khi từ chối bài viết:', error);
    }
  };

  const handleEditUser = (user) => {
    setEditUser({ ...user });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`http://localhost:5000/api/users/${editUser.id}`, editUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setUsers(users.map((u) => (u.id === editUser.id ? editUser : u)));
        setEditUser(null);
        toast.success('Cập nhật người dùng thành công!');
      }
    } catch (error) {
      toast.error('Cập nhật người dùng thất bại!');
      console.error('Lỗi khi cập nhật người dùng:', error);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
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

  const handleSavePost = async () => {
    if (!editor || !user || !editingPost) return;

    if (user.id !== editingPost.user_id) {
      toast.error('Bạn không có quyền chỉnh sửa bài viết này');
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

      const response = await axios.put(`http://localhost:5000/api/posts/${editingPost.id}`, {
        title,
        content,
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

      if (response.data.success) {
        setPosts(posts.map((p) => (p.id === editingPost.id ? response.data.data : p)));
        toast.success('Cập nhật bài viết thành công!');
        setEditingPost(null);
        setTitle('');
        setImages([]);
        setTouristPlaces([]);
        setTempPosition(null);
        setSearchQuery('');
        setCategories(categories.map(c => ({ ...c, selected: false })));
        editor.commands.clearContent();
      }
    } catch (error) {
      toast.error('Cập nhật bài viết thất bại: ' + (error.response?.data?.message || error.message));
      console.error('Lỗi khi cập nhật bài viết:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setTitle('');
    setImages([]);
    setTouristPlaces([]);
    setTempPosition(null);
    setSearchQuery('');
    setCategories(categories.map(c => ({ ...c, selected: false })));
    editor.commands.clearContent();
  };

  const filteredUsers = Array.isArray(users)
    ? users.filter((u) =>
        u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.email.toLowerCase().includes(searchUser.toLowerCase())
      )
    : [];

  const filteredPosts = Array.isArray(posts)
  ? posts.filter((p) => {
      const normalizedTitle = p.title.toLowerCase().trim();
      const normalizedSearch = searchPost.toLowerCase().trim();
      const matchesTitle = normalizedTitle.includes(normalizedSearch);
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchesTitle && matchesStatus;
    })
  : [];

  const indexOfLastUser = currentPageUsers * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const indexOfLastPost = currentPagePosts * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  const paginateUsers = (pageNumber) => setCurrentPageUsers(pageNumber);
  const paginatePosts = (pageNumber) => setCurrentPagePosts(pageNumber);

  if (!user || user.role !== 'admin') return null;

  if (editingPost) {
    return (
      <div className="min-h-screen bg-gray-50 animate-fadeIn">
        <Toaster position="top-right" />
        <div className="bg-white shadow-md py-4 sticky top-0 z-10">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">Chỉnh sửa bài viết</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center space-x-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                <span>Xem trước</span>
              </button>
              <button
                onClick={handleSavePost}
                className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <span>Lưu</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                <span>Hủy</span>
              </button>
            </div>
          </div>
        </div>
        <div className="container mx-auto p-4 flex flex-col lg:flex-row gap-4 animate-fadeIn">
          <div className="lg:w-3/4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Trạng thái bài viết</label>
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
          <LocationProvider initialPlaces={touristPlaces} setPlaces={setTouristPlaces}>
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
          categories={categories.filter(c => c.selected).map(c => ({ value: c.id, label: c.name }))}
          content={editor?.getHTML() || ''}
          images={images}
          touristPlaces={touristPlaces}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Bảng điều khiển Admin</h1>
        <div className="flex space-x-4">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
            Thống kê
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
            Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="mb-12 bg-white shadow-lg rounded-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Thống kê</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800">Tổng số người dùng</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-800">Tổng số bài viết</h3>
            <p className="text-2xl font-bold text-green-600">{stats.totalPosts}</p>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Quản lý người dùng</h2>
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Tên</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Vai trò</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-800 hover:underline mr-4"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 hover:underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Hiển thị <span className="font-medium">{indexOfFirstUser + 1}</span> đến{' '}
              <span className="font-medium">{Math.min(indexOfLastUser, filteredUsers.length)}</span> của{' '}
              <span className="font-medium">{filteredUsers.length}</span> người dùng
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => paginateUsers(currentPageUsers - 1)}
                disabled={currentPageUsers === 1}
                className="px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => paginateUsers(currentPageUsers + 1)}
                disabled={indexOfLastUser >= filteredUsers.length}
                className="px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

<div className="mb-12">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-2xl font-semibold text-gray-800">Quản lý bài viết</h2>
    <div className="flex space-x-4">
      <input
        type="text"
        placeholder="Tìm kiếm theo tiêu đề..."
        value={searchPost}
        onChange={handleSearchChange}
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
      <select
        value={filterStatus}
        onChange={handleFilterChange}
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <option value="all">Tất cả trạng thái</option>
        <option value="pending">Chưa duyệt</option>
        <option value="approved">Đã duyệt</option>
      </select>
    </div>
  </div>
  <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Tiêu đề</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Tác giả</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Địa điểm</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Trạng thái</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Hành động</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {currentPosts.map((post) => (
            <tr key={post.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{post.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{post.title}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{post.author}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{post.tourist_place_name}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  post.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  post.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {post.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEditPost(post)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Sửa
                  </button>
                  {post.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprovePost(post.id)}
                        className="text-green-600 hover:text-green-800 hover:underline"
                      >
                        Duyệt
                      </button>
                      <button
                        onClick={() => handleRejectPost(post.id)}
                        className="text-red-600 hover:text-red-800 hover:underline"
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-red-600 hover:text-red-800 hover:underline"
                  >
                    Xóa
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
        Hiển thị <span className="font-medium">{indexOfFirstPost + 1}</span> đến{' '}
        <span className="font-medium">{Math.min(indexOfLastPost, filteredPosts.length)}</span> của{' '}
        <span className="font-medium">{filteredPosts.length}</span> bài viết
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => paginatePosts(currentPagePosts - 1)}
          disabled={currentPagePosts === 1}
          className="px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Trước
        </button>
        <button
          onClick={() => paginatePosts(currentPagePosts + 1)}
          disabled={indexOfLastPost >= filteredPosts.length}
          className="px-3 py-1 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    </div>
  </div>
</div>

      {editUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Chỉnh sửa người dùng</h2>
            <form onSubmit={handleSaveUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Tên</label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Vai trò</label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex space-x-4">
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg">
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg"
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