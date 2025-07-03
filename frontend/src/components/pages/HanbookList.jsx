import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import sanitizeHtml from 'sanitize-html';
import Loading from '../Common/Loading';

const HandbookList = () => {
  const { slug } = useParams();
  console.log('Current slug:', slug);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [postsByCategory, setPostsByCategory] = useState({});
  const [paginationByCategory, setPaginationByCategory] = useState({}); // Lưu page và totalPages
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const postsPerPage = 6; // Số bài viết mỗi trang

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Fetching location for slug: ${slug}`);
        const locationResponse = await fetch(`http://localhost:5000/api/locations/${slug}`);
        if (!locationResponse.ok) {
          const text = await locationResponse.text();
          console.error('Location non-JSON response:', text);
          throw new Error(`Không thể lấy thông tin địa điểm: ${locationResponse.status}`);
        }
        const locationData = await locationResponse.json();
        console.log('Location response:', locationData);
        if (!locationData.success || !locationData.data) {
          throw new Error('Không tìm thấy địa điểm');
        }
        setLocation(locationData.data);

        console.log('Fetching categories');
        const categoryResponse = await fetch('http://localhost:5000/api/categories');
        if (!categoryResponse.ok) {
          const text = await categoryResponse.text();
          console.error('Categories non-JSON response:', text);
          throw new Error(`Không thể lấy danh sách danh mục: ${categoryResponse.status}`);
        }
        const categoryData = await categoryResponse.json();
        console.log('Categories response:', categoryData);
        if (!categoryData.success || !categoryData.data) {
          throw new Error('Không có danh mục nào');
        }
        setCategories(categoryData.data);

        // Khởi tạo pagination cho mỗi danh mục
        const initialPagination = {};
        categoryData.data.forEach((category) => {
          initialPagination[category.id] = { currentPage: 1, totalPages: 1 };
        });
        setPaginationByCategory(initialPagination);

        // Fetch bài viết cho trang đầu tiên của mỗi danh mục
        await fetchPostsForCategories(categoryData.data, locationData.data.id, initialPagination);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const fetchPostsForCategories = async (categories, locationId, pagination) => {
    const postsByCat = { ...postsByCategory };
    try {
      await Promise.all(
        categories.map(async (category) => {
          const { currentPage } = pagination[category.id];
          console.log(
            `Fetching posts for category ${category.id}, location ${locationId}, page ${currentPage}`
          );
          const postsResponse = await fetch(
            `http://localhost:5000/api/posts/posts/category?category_id=${category.id}&location_id=${locationId}&page=${currentPage}&limit=${postsPerPage}`
          );
          if (!postsResponse.ok) {
            console.warn(`Không thể lấy bài viết cho danh mục ${category.name}: ${postsResponse.status}`);
            return;
          }
          const postsData = await postsResponse.json();
          console.log(`Posts for category ${category.id}:`, postsData);
          if (postsData.success && postsData.data.posts?.length > 0) {
            postsByCat[category.id] = postsData.data.posts;
            setPaginationByCategory((prev) => ({
              ...prev,
              [category.id]: {
                currentPage: postsData.data.currentPage,
                totalPages: postsData.data.totalPages,
              },
            }));
          } else {
            postsByCat[category.id] = [];
          }
        })
      );
      setPostsByCategory(postsByCat);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/posts/${postId}`);
  };

  const handlePageChange = (categoryId, page) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category || page < 1 || page > paginationByCategory[categoryId].totalPages) return;

    setPaginationByCategory((prev) => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], currentPage: page },
    }));

    // Fetch lại bài viết cho danh mục và trang mới
    fetchPostsForCategories([category], location?.id, {
      ...paginationByCategory,
      [categoryId]: { ...paginationByCategory[categoryId], currentPage: page },
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getShortDescription = (content) => {
    const cleanText = sanitizeHtml(content, {
      allowedTags: [],
      allowedAttributes: {},
    });
    return cleanText.length > 100 ? cleanText.substring(0, 100) + '...' : cleanText;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loading size="md" color="blue" text="Đang tải dữ liệu..." />;
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
            🌍 Khám Phá {location?.name}
          </h1>
          <p className="text-center text-gray-600 text-lg">
            Tìm hiểu về các địa điểm du lịch, ẩm thực và văn hóa tại {location?.name}
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        {categories.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Chưa có danh mục nào
            </h3>
            <p className="text-gray-500">
              Hãy thêm các danh mục để hiển thị bài viết tại đây
            </p>
          </div>
        )}

        {categories.map((category) => (
          <div key={category.id} className="mb-12">
            <h2 className="relative text-2xl font-semibold text-gray-800 mb-8 pb-2 inline-block">
              {category.name}
              <span className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></span>
              <span className="absolute bottom-0 left-16 w-4 h-1 bg-indigo-500 rounded-full opacity-50"></span>
            </h2>
            {postsByCategory[category.id]?.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {postsByCategory[category.id].map((post) => (
                    <div
                      key={post.id}
                      className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                      onClick={() => handlePostClick(post.id)}
                    >
                      <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white">
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={
                              post.images[0]?.url ||
                              'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=500'
                            }
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-white text-lg font-bold mb-1 drop-shadow-lg">
                              {post.title}
                            </h3>
                            <div className="flex items-center text-white/90 text-sm">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {post.location_name}
                            </div>
                          </div>
                        </div>
                        <div className="p-5">
                          <p className="text-gray-600 mb-2">{getShortDescription(post.content)}</p>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center text-gray-600 text-sm">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              {post.author}
                            </div>
                            <div className="flex items-center text-blue-500 text-sm font-medium group-hover:text-blue-600">
                              Xem thêm
                              <svg
                                className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Phân trang */}
                {paginationByCategory[category.id]?.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(category.id, paginationByCategory[category.id].currentPage - 1)}
                      disabled={paginationByCategory[category.id].currentPage === 1}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        paginationByCategory[category.id].currentPage === 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                    >
                      Trước
                    </button>
                    {[...Array(paginationByCategory[category.id].totalPages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(category.id, page)}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            paginationByCategory[category.id].currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(category.id, paginationByCategory[category.id].currentPage + 1)}
                      disabled={
                        paginationByCategory[category.id].currentPage ===
                        paginationByCategory[category.id].totalPages
                      }
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        paginationByCategory[category.id].currentPage ===
                        paginationByCategory[category.id].totalPages
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500">Chưa có bài viết nào trong danh mục này tại {location?.name}</p>
            )}
          </div>
        ))}
      </main>

      <footer className="bg-white mt-16 py-8 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            © 2025 Cẩm Nang Du Lịch Việt Nam. Khám phá vẻ đẹp quê hương.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HandbookList;