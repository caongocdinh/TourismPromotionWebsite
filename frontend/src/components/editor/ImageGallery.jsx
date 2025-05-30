
// src/components/editor/ImageGallery.jsx
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const ImageGallery = ({ images, onDragEnd }) => (
  <>
    <h3 className="text-lg font-semibold mt-4 mb-2 text-primary">Hình ảnh bài viết</h3>
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="images">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {images.map((image, index) => (
              <Draggable key={image.id} draggableId={image.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="border border-gray-300 rounded-lg p-2 relative shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img src={image.url} alt="Hình ảnh" className="w-full h-32 object-cover rounded" />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  </>
);

export default ImageGallery;
