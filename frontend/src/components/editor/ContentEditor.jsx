
// src/components/editor/ContentEditor.jsx
import React from 'react';
import { EditorContent } from '@tiptap/react';
import Select from 'react-select';
import EditorToolbar from './EditorToolbar';

const ContentEditor = ({ title, setTitle, categories, setCategories, editor, onImageUpload, isUploading }) => (
  <>
    <input
      type="text"
      placeholder="Nhập tiêu đề bài viết..."
      className="w-full text-2xl font-bold mb-4 p-3 border border-gray-300 rounded-md text-primary focus:outline-none focus:border-primary-light"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
    />
    <div className="mb-4">
      <label className="block font-semibold mb-1 text-primary">Danh mục</label>
      <Select
        isMulti
        options={categories.map(c => ({ value: c.id, label: c.name }))}
        value={categories.filter(c => c.selected).map(c => ({ value: c.id, label: c.name }))}
        onChange={(selected) => {
          setCategories(categories.map(c => ({
            ...c,
            selected: selected.some(s => s.value === c.id),
          })));
        }}
        placeholder="Chọn danh mục..."
        className="text-primary"
        styles={{
          control: (base) => ({
            ...base,
            borderColor: '#3b82f6',
            '&:hover': { borderColor: '#1e40af' },
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: '#e5e7eb',
          }),
        }}
      />
    </div>
    <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-md">
      <EditorToolbar editor={editor} onImageUpload={onImageUpload} isUploading={isUploading} />
      <EditorContent editor={editor} />
    </div>
  </>
);

export default ContentEditor;