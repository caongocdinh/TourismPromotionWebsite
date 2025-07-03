import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Check,
  X,
  Trash2,
  Calendar,
  MapPin,
  Heart,
  MessageSquare,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAdminData } from "./AdminDataContext";
import Pagination from "./Pagination";
import StatusBadge from "./StatusBadge";
import Loading from "../Common/Loading";

const PostsView = ({ token, setEditingPost }) => {
  const { posts, setPosts, loading } = useAdminData();
  const [searchPost, setSearchPost] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredPosts = useMemo(
    () =>
      posts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchPost.toLowerCase()) &&
          (filterStatus === "all" || p.status === filterStatus)
      ),
    [posts, searchPost, filterStatus]
  );

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading || posts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loading size="md" color="blue" text="Đang tải bài viết..." />;
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

  const handleDeletePost = (postId) =>
    window.confirm("Bạn có chắc muốn xóa bài viết này?") &&
    handleAction(
      `http://localhost:5000/api/posts/${postId}`,
      "delete",
      "Xóa bài viết thành công!",
      "Xóa bài viết thất bại!",
      () => setPosts(posts.filter((p) => p.id !== postId))
    );

  const handleApprovePost = (postId) =>
    handleAction(
      `http://localhost:5000/api/posts/approve/${postId}`,
      "put",
      "Duyệt bài viết thành công!",
      "Duyệt bài viết thất bại!",
      async () => {
        const updatedPost = await axios.get(
          `http://localhost:5000/api/posts/${postId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPosts(
          posts.map((p) => (p.id === postId ? updatedPost.data.data : p))
        );
      }
    );

  const handleRejectPost = (postId) =>
    handleAction(
      `http://localhost:5000/api/posts/reject/${postId}`,
      "put",
      "Từ chối bài viết thành công!",
      "Từ chối bài viết thất bại!",
      async () => {
        const updatedPost = await axios.get(
          `http://localhost:5000/api/posts/${postId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPosts(
          posts.map((p) => (p.id === postId ? updatedPost.data.data : p))
        );
      }
    );

  const handleEditPost = async (postId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/posts/${postId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEditingPost(response.data.data);
    } catch (error) {
      toast.error("Lỗi khi tải bài viết!");
      console.error("Lỗi khi tải bài viết:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Quản lý bài viết</h1>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchPost}
              onChange={(e) => setSearchPost(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
            </select>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                Bài viết
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                Tác giả
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                Địa điểm
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                Trạng thái
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                Thống kê
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentPosts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {post.title}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>
                        {post.created_at
                          ? new Date(post.created_at).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {post.author || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                    <span>{post.tourist_place_name || "N/A"}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={post.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex gap-3">
                    <span className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      {post.views || 0}
                    </span>
                    <span className="flex items-center">
                      <Heart className="w-3 h-3 mr-1" />
                      {post.likes || 0}
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {post.commentCount || 0}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Link to={`/posts/${post.id}`}>
                      <button className="text-blue-600 hover:text-blue-800 p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleEditPost(post.id)}
                      className="text-blue-600 hover:text-blue-800 p-1"
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredPosts.length}
          type="bài viết"
        />
      </div>
    </div>
  );
};

export default PostsView;
