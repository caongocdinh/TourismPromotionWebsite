import React from 'react';
import { Bold, Italic, List, RotateCcw } from 'lucide-react';
import Loading from '../Common/Loading';

const EditorToolbar = ({ editor, onImageUpload, isUploading }) => (
  <div className="flex flex-wrap gap-2 mb-2">
    {/* Font Family */}
    <select
      onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
      className="px-2 py-1 rounded-md text-sm bg-gray-200 text-primary hover:bg-gray-300 transition-colors"
    >
      <option value="" disabled>Font</option>
      <option value="Inter">Inter</option>
      <option value="Arial">Arial</option>
      <option value="Times New Roman">Times New Roman</option>
    </select>

    {/* Heading H1 */}
    <button
      onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
      className={`p-2 rounded-md ${
        editor?.isActive('heading', { level: 1 })
          ? 'bg-primary text-white'
          : 'bg-gray-200 text-primary'
      } hover:bg-primary-light hover:text-white transition-colors`}
    >
      H1
    </button>

    {/* Heading H2 */}
    <button
      onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
      className={`p-2 rounded-md ${
        editor?.isActive('heading', { level: 2 })
          ? 'bg-primary text-white'
          : 'bg-gray-200 text-primary'
      } hover:bg-primary-light hover:text-white transition-colors`}
    >
      H2
    </button>

    {/* Bold */}
    <button
      onClick={() => editor?.chain().focus().toggleBold().run()}
      className={`p-2 rounded-md ${
        editor?.isActive('bold') ? 'bg-primary text-white' : 'bg-gray-200 text-primary'
      } hover:bg-primary-light hover:text-white transition-colors`}
    >
      <Bold size={16} />
    </button>

    {/* Italic */}
    <button
      onClick={() => editor?.chain().focus().toggleItalic().run()}
      className={`p-2 rounded-md ${
        editor?.isActive('italic') ? 'bg-primary text-white' : 'bg-gray-200 text-primary'
      } hover:bg-primary-light hover:text-white transition-colors`}
    >
      <Italic size={16} />
    </button>

    {/* Bullet List */}
    <button
      onClick={() => editor?.chain().focus().toggleBulletList().run()}
      className={`p-2 rounded-md ${
        editor?.isActive('bulletList') ? 'bg-primary text-white' : 'bg-gray-200 text-primary'
      } hover:bg-primary-light hover:text-white transition-colors`}
    >
      <List size={16} />
    </button>

    {/* Undo */}
    <button
      onClick={() => editor?.chain().focus().undo().run()}
      disabled={!editor?.can().undo()}
      className={`p-2 rounded-md ${
        !editor?.can().undo() ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-primary'
      } hover:bg-primary-light hover:text-white transition-colors`}
    >
      <RotateCcw size={16} />
    </button>

    {/* Image Upload */}
    <label className="relative inline-flex items-center px-3 py-1 bg-accent text-white hover:bg-yellow-500 rounded-md transition-colors cursor-pointer">
      {isUploading ? (
          <Loading size="sm" color="white" text="Đang tải..."/>
      ) : (
        <>
          <span className="mr-2">Tải ảnh</span>
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            disabled={isUploading}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </>
      )}
    </label>
  </div>
);

export default EditorToolbar;
