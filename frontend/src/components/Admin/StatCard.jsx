// src/components/AdminDashboard/StatCard.jsx
import React from "react";

const StatCard = ({ title, value, icon: Icon, color = "blue" }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-3xl font-bold text-${color}-600 mt-2`}>{value}</p>
        
      </div>
      <div className={`p-3 bg-${color}-50 rounded-lg`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
  </div>
);

export default StatCard;
