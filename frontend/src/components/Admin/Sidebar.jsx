import React from "react";
import { BarChart3, Users, FileText, X } from "lucide-react";

const Sidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, user }) => {
  const navItems = [
    { id: "dashboard", label: "Tổng quan", icon: BarChart3 },
    { id: "users", label: "Người dùng", icon: Users },
    { id: "posts", label: "Bài viết", icon: FileText },
  ];

  return (
    <div
  className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-10 transform ${
    sidebarOpen ? "translate-x-0" : "-translate-x-full"
  } md:transform-none md:static md:translate-x-0 transition-transform duration-200`}
>

      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-medium">{user?.name?.charAt(0).toUpperCase() || "A"}</span>
          </div>
          <span className="text-lg font-bold text-gray-800">{user?.name || "Quản trị viên"}</span>
          <span className="text-lg  text-red-700">({user?.role})</span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center px-4 py-3 hover:bg-gray-100 ${
              activeTab === item.id ? "bg-blue-50 text-blue-600" : "text-gray-600"
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;