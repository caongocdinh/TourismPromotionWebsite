import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import { Menu} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import Sidebar from "./Sidebar";
import DashboardView from "./DashboardView";
import UsersView from "./UsersView";
import PostsView from "./PostsView";
import PostEditor from "./PostEditor";
import AddUser from "./AddUser";

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingPost, setEditingPost] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster position="top-right" />
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between p-4 bg-white shadow-md md:hidden">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <main className="p-6 max-w-6xl mx-auto">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "users" && <UsersView token={token} />}
          {activeTab === "posts" && <PostsView token={token} setEditingPost={setEditingPost} />}
        </main>
        {editingPost && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full h-[90vh] overflow-y-auto">
              <PostEditor
                post={editingPost}
                onClose={() => setEditingPost(null)}
                onSave={(updatedPost) => {
                  // Giả sử PostsView đã xử lý cập nhật state
                  setEditingPost(null);
                }}
              />
            </div>
          </div>
        )}
        {isAddUserOpen && <AddUser onClose={() => setIsAddUserOpen(false)} token={token} />}
      </div>
    </div>
  );
};

export default AdminDashboard;