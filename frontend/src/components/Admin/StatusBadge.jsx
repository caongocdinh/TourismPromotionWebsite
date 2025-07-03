// src/components/AdminDashboard/StatusBadge.jsx
import React from "react";

const StatusBadge = ({ status, className }) => {
  const statusStyles = {
    approved: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
    active: "bg-green-100 text-green-700",
    inactive: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${statusStyles[status] || "bg-gray-100 text-gray-700"} ${className}`}
    >
      {status === "approved"
        ? "Đã duyệt"
        : status === "pending"
        ? "Chờ duyệt"
        : status === "rejected"
        ? "Đã từ chối"
        : status === "active"
        ? "Hoạt động"
        : status === "inactive"
        ? "Đã khóa"
        : status}
    </span>
  );
};

export default StatusBadge;
