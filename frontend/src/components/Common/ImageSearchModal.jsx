import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Search, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const ImageSearchModal = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [postDetails, setPostDetails] = useState([]);
  const [noResult, setNoResult] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.fromImageSearch) {
      setPosts(location.state.posts || []);
      setPostDetails(location.state.postDetails || []);
      setPreviewImage(location.state.previewImage || null);
      setShowModal(true);
    }
  }, []);

  useEffect(() => {
    setPosts([]);
    setPostDetails([]);
    setNoResult(false);
  }, [previewImage]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setNoResult(false);
    if (!selectedImage) {
      toast.error("Vui lòng chọn một ảnh để tìm kiếm!");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedImage);

      const extractRes = await axios.post(
        "http://localhost:5001/extract",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const features = extractRes.data.features;
      if (!features || !Array.isArray(features)) {
        throw new Error("Invalid image features");
      }

      const response = await axios.post(
        "http://localhost:5000/api/posts/search-posts-by-image",
        { features }
      );

      setPosts(response.data.data);
      toast.success("Tìm kiếm thành công!");

      const postIds = response.data.data
        .filter((img) => img.entity_type === "post")
        .map((img) => img.entity_id);

      const postDetailsArr = await Promise.all(
        postIds.map(async (id) => {
          try {
            const res = await axios.get(
              `http://localhost:5000/api/posts/${id}`
            );
            return res.data.data;
          } catch (e) {
            return null;
          }
        })
      );

      const filteredPosts = postDetailsArr.filter((post) => post !== null);
      setPostDetails(filteredPosts);
      if (filteredPosts.length === 0) {
        setNoResult(true);
      } else {
        setNoResult(false);
      }
    } catch (error) {
      toast.error("Lỗi khi tìm kiếm bài viết!");
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setPosts([]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowModal(true)}
        className="text-gray-600 hover:text-primary flex items-center"
        title="Tìm kiếm bằng hình ảnh"
      >
        <ImageIcon size={22} />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  Tìm bài viết bằng hình ảnh
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetSearch();
                  }}
                  className="text-gray-500 hover:text-red-500 transition"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4 items-end">
                  <div className="col-span-2">
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Ảnh cần tìm
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !selectedImage}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium flex items-center justify-center gap-2 transition ${
                      loading || !selectedImage
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-primary hover:bg-primary-dark"
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        Đang tìm...
                      </>
                    ) : (
                      <>
                        <Search size={16} />
                        Tìm kiếm
                      </>
                    )}
                  </button>
                </div>

                {previewImage && (
                  <div className="mt-4">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="max-h-60 mx-auto rounded-lg border border-gray-300 shadow-sm"
                    />
                  </div>
                )}
              </form>
              {postDetails.map((post) => (
                <Link
                  to={`/posts/${post.id}`}
                  state={{
                    fromImageSearch: true,
                    posts,
                    postDetails,
                    previewImage,
                  }}
                  onClick={() => setShowModal(false)}
                  className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex gap-4 items-center">
                    <img
                      src={
                        post.images?.[0]?.url ||
                        "https://via.placeholder.com/150"
                      }
                      alt={post.title}
                      className="w-24 h-24 object-cover rounded-md"
                    />
                    <div>
                      <p className="text-sm text-gray-700 font-medium">
                        {post.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {post.tourist_place_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {post.location_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Tác giả: {post.author}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              {noResult && (
                <div className="text-center text-gray-500 py-4">
                  ❌ Không tìm thấy bài viết phù hợp
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSearchModal;
