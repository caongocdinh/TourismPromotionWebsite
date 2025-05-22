import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, Image as ImageIcon, Text, GripVertical } from 'lucide-react';

const ArticleEditor = () => {
  const [blocks, setBlocks] = useState([]);
  const [newText, setNewText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Thêm khối văn bản
  const handleAddText = () => {
    if (newText.trim()) {
      setBlocks([...blocks, { id: Date.now().toString(), type: 'text', content: newText }]);
      setNewText('');
    }
  };

  // Thêm khối hình ảnh
  const handleAddImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBlocks([...blocks, { id: Date.now().toString(), type: 'image', content: url }]);
      setSelectedImage(null);
      setPreviewImage(null);
    }
  };

  // Cập nhật nội dung khối
  const handleUpdateBlock = (id, content) => {
    setBlocks(blocks.map((block) => (block.id === id ? { ...block, content } : block)));
  };

  // Xóa khối
  const handleDeleteBlock = (id) => {
    setBlocks(blocks.filter((block) => block.id !== id));
  };

  // Xử lý kéo thả
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setBlocks(items);
  };

  // Lưu bài viết (giả lập)
  const handleSaveArticle = () => {
    const articleData = {
      title: 'Bài viết mới', // Có thể thêm input cho tiêu đề nếu cần
      blocks: blocks.map((block) => ({ type: block.type, content: block.content })),
    };
    console.log('Bài viết đã lưu:', articleData);
    // Ở đây bạn có thể gửi `articleData` đến server hoặc lưu vào localStorage
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-primary">Tạo Bài Viết Mới</h2>

      {/* Khu vực thêm nội dung mới */}
      <div className="mb-6 flex space-x-4">
        {/* Thêm văn bản */}
        <div className="flex-1">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Nhập văn bản..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={handleAddText}
            className="mt-2 bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Text size={18} className="mr-2" /> Thêm văn bản
          </button>
        </div>

        {/* Thêm hình ảnh */}
        <div>
          <label className="cursor-pointer bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <ImageIcon size={18} className="mr-2" /> Tải ảnh lên
            <input type="file" accept="image/*" onChange={handleAddImage} className="hidden" />
          </label>
        </div>
      </div>

      {/* Khu vực kéo thả và chỉnh sửa nội dung */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {blocks.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="bg-white p-4 rounded-lg shadow-md border border-gray-200 relative"
                    >
                      <div className="flex items-start">
                        <GripVertical className="text-gray-400 mr-2 cursor-move" size={20} />
                        {block.type === 'text' ? (
                          <textarea
                            value={block.content}
                            onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            rows="3"
                          />
                        ) : (
                          <div className="relative">
                            <img
                              src={block.content}
                              alt="Article"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => handleDeleteBlock(block.id)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Nút lưu bài viết */}
      <div className="mt-6">
        <button
          onClick={handleSaveArticle}
          className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Lưu bài viết
        </button>
      </div>
    </div>
  );
};

export default ArticleEditor;