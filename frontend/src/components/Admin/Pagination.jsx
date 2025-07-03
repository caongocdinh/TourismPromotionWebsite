// src/components/AdminDashboard/Pagination.jsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ currentPage, totalPages, setCurrentPage, itemsPerPage, totalItems, type }) => (
  <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
    <div className="text-sm text-gray-500">
      Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến {Math.min(currentPage * itemsPerPage, totalItems)} của {totalItems} {type}
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
        className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="px-3 py-1 text-sm text-gray-600">
        {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
        disabled={currentPage === totalPages}
        className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-50"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default Pagination;
