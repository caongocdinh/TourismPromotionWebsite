import React, { useMemo } from "react";
import { Users, FileText, Eye, Heart, MessageSquare } from "lucide-react";
import { useAdminData } from "./AdminDataContext";
import StatCard from "./Statcard";
import StatusBadge from "./StatusBadge";
import Loading from "../Common/Loading";

const DashboardView = () => {
  const { users, posts, loading } = useAdminData();

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      totalPosts: posts.length,
      approvedPosts: posts.filter((p) => p.status === "approved").length,
      pendingPosts: posts.filter((p) => p.status === "pending").length,
      totalViews: posts.reduce((sum, post) => sum + (post.views || 0), 0),
      totalLikes: posts.reduce((sum, post) => sum + (post.likes || 0), 0),
      totalComments: posts.reduce(
        (sum, post) => sum + (post.commentCount || 0),
        0
      ),
    }),
    [users, posts]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loading size="md" color="blue" text="Đang tải dữ liệu..." />;
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tổng quan</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard
          title="Tổng người dùng"
          value={stats.totalUsers}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Tổng bài viết"
          value={stats.totalPosts}
          icon={FileText}
          color="green"
        />
        <StatCard
          title="Lượt xem"
          value={stats.totalViews.toLocaleString()}
          icon={Eye}
          color="purple"
        />
        <StatCard
          title="Lượt thích"
          value={stats.totalLikes.toLocaleString()}
          icon={Heart}
          color="orange"
        />
        <StatCard
          title="Tổng bình luận"
          value={stats.totalComments.toLocaleString()}
          icon={MessageSquare}
          color="teal"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Trạng thái bài viết
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Đã duyệt</span>
              <span className="text-green-600 font-semibold">
                {stats.approvedPosts}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Chờ duyệt</span>
              <span className="text-yellow-600 font-semibold">
                {stats.pendingPosts}
              </span>
            </div>
            <div className="flex justify-between">
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
              <div key={post.id} className="flex justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-800 truncate max-w-48">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-500">{post.author}</p>
                </div>
                <StatusBadge status={post.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
