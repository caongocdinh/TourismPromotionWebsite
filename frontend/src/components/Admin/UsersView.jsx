import React, { useState, useMemo } from "react";
import { Search, Plus, Lock, Unlock, Trash2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAdminData } from "./AdminDataContext";
import Pagination from "./Pagination";
import StatusBadge from "./StatusBadge";
import Loading from "../Common/Loading";

const UsersView = ({ token }) => {
  const [searchUser, setSearchUser] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { users, posts, loading } = useAdminData();

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
          u.email.toLowerCase().includes(searchUser.toLowerCase())
      ),
    [users, searchUser]
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading || users.length === 0 || posts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loading size="md" color="blue" text="Đang tải người dùng..." />;
      </div>
    );
  }
  const handleAction = async (
    url,
    method = "delete",
    successMessage,
    errorMessage,
    updateState
  ) => {
    try {
      const res = await axios({
        url,
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        updateState();
        toast.success(successMessage);
      } else {
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error(errorMessage);
      console.error(error);
    }
  };

  const handleDeleteUser = (userId) =>
    window.confirm("Bạn có chắc muốn xóa người dùng này?") &&
    handleAction(
      `http://localhost:5000/api/users/${userId}`,
      "delete",
      "Xóa người dùng thành công!",
      "Xóa người dùng thất bại!",
      () => setUsers(users.filter((u) => u.id !== userId))
    );

  const handleToggleStatus = (userId) =>
    handleAction(
      `http://localhost:5000/api/users/${userId}/status`,
      "patch",
      "Cập nhật trạng thái thành công!",
      "Cập nhật trạng thái thất bại!",
      () =>
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, status: u.status === "active" ? "inactive" : "active" }
              : u
          )
        )
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Quản lý người dùng</h1>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setIsAddUserOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Thêm người dùng
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                Người dùng
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                Vai trò
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                Trạng thái
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                Ngày tham gia
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
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
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={user.role} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={user.status || "active"} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className="text-yellow-600 hover:text-yellow-800 p-1"
                      title={
                        user.status === "active" ? "Khóa người dùng" : "Mở khóa"
                      }
                    >
                      {user.status === "active" ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Xóa người dùng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredUsers.length}
          type="người dùng"
        />
      </div>
    </div>
  );
};

export default UsersView;
