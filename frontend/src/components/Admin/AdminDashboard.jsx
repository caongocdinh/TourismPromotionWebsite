import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0 });
  const [searchUser, setSearchUser] = useState('');
  const [searchPost, setSearchPost] = useState('');
  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const [currentPagePosts, setCurrentPagePosts] = useState(1);
  const [usersPerPage] = useState(5);
  const [postsPerPage] = useState(5);
  const [editUser, setEditUser] = useState(null);
  const [editPost, setEditPost] = useState(null);

  // Kiểm tra vai trò admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('Bạn không có quyền truy cập trang này');
      return;
    }

    const fetchData = async () => {
      try {
        // Lấy danh sách người dùng
        const usersResponse = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = usersResponse.data.data || usersResponse.data;
        setUsers(Array.isArray(usersData) ? usersData : []); // Đảm bảo users luôn là mảng

        // Lấy thống kê
        // const statsResponse = await axios.get('http://localhost:5000/api/stats', {
        //   headers: { Authorization: `Bearer ${token}` },
        // });
        // setStats(statsResponse.data || { totalUsers: 0, totalPosts: 0 });

        // Lấy danh sách bài viết
        // const postsResponse = await fetch('http://localhost:5000/api/posts', {
        //   headers: { Authorization: `Bearer ${token}` },
        // });
        // if (postsResponse.status === 401 || postsResponse.status === 403) {
        //   toast.error('Bạn không có quyền truy cập!');
        //   return;
        // }
        // const postsData = await postsResponse.json();
        // // Kiểm tra dữ liệu trả về từ API
        // const postsArray = Array.isArray(postsData) ? postsData : postsData.data || [];
        // setPosts(postsArray); // Đảm bảo posts luôn là mảng
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        toast.error(error.response?.data?.message || 'Lỗi khi tải dữ liệu');
        // setPosts([]); // Đặt lại posts thành mảng rỗng nếu có lỗi
        // setUsers([]); // Đặt lại users thành mảng rỗng nếu có lỗi
      }
    };

    fetchData();
  }, [user, token]);

  // Xóa người dùng
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      try {
        const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setUsers(users.filter((u) => u.id !== userId));
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

  // Xóa bài viết
  const handleDeletePost = async (postId) => {
    if (window.confirm('Bạn có chắc muốn xóa bài viết này?')) {
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${postId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setPosts(posts.filter((p) => p.id !== postId));
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

  // Chỉnh sửa người dùng
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

  // Chỉnh sửa bài viết
  const handleEditPost = (post) => {
    setEditPost({ ...post });
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`http://localhost:5000/api/posts/${editPost.id}`, editPost, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setPosts(posts.map((p) => (p.id === editPost.id ? editPost : p)));
        setEditPost(null);
        toast.success('Cập nhật bài viết thành công!');
      }
    } catch (error) {
      toast.error('Cập nhật bài viết thất bại!');
      console.error('Lỗi khi cập nhật bài viết:', error);
    }
  };

  // Lọc và phân trang
  const filteredUsers = Array.isArray(users)
    ? users.filter((u) =>
        u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.email.toLowerCase().includes(searchUser.toLowerCase())
      )
    : [];
  const filteredPosts = Array.isArray(posts)
    ? posts.filter((p) =>
        p.title.toLowerCase().includes(searchPost.toLowerCase()) ||
        p.user_name.toLowerCase().includes(searchPost.toLowerCase())
      )
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

      {/* Thống kê */}
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

      {/* Quản lý người dùng */}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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

      {/* Quản lý bài viết */}

    </div>
  );
};

export default AdminDashboard;