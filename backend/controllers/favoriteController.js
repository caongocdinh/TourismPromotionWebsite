import { sql } from "../config/db.js";

// Thêm bài viết vào danh sách yêu thích
export const addFavorite = async (req, res) => {
  const { post_id } = req.body;
  const user_id = req.user.id; // Lấy user_id từ middleware protect

  if (!post_id) {
    return res.status(400).json({
      success: false,
      error: "Thiếu post_id",
    });
  }

  try {
    // Kiểm tra xem bài viết có tồn tại không
    const postExists = await sql`
      SELECT id FROM posts WHERE id = ${post_id}
    `;
    if (!postExists.length) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy bài viết",
      });
    }

    // Kiểm tra xem bài viết đã có trong danh sách yêu thích chưa
    const alreadyFavorited = await sql`
      SELECT id FROM favorites WHERE user_id = ${user_id} AND post_id = ${post_id}
    `;
    if (alreadyFavorited.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Bài viết đã có trong danh sách yêu thích",
      });
    }

    // Thêm vào danh sách yêu thích
    const favorite = await sql`
      INSERT INTO favorites (user_id, post_id)
      VALUES (${user_id}, ${post_id})
      RETURNING id, user_id, post_id, created_at
    `;

    res.status(201).json({
      success: true,
      data: favorite[0],
      message: "Đã thêm bài viết vào danh sách yêu thích",
    });
  } catch (error) {
    console.error("Lỗi khi thêm bài viết yêu thích:", error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : "Lỗi server nội bộ",
    });
  }
};

// Lấy danh sách bài viết yêu thích của người dùng
export const getFavorites = async (req, res) => {
  const user_id = req.user.id;

  try {
    const favorites = await sql`
      WITH post_images AS (
        SELECT 
          entity_id AS post_id,
          ARRAY_AGG(
            json_build_object('url', url, 'public_id', public_id)
          ) FILTER (WHERE url IS NOT NULL) AS images
        FROM images
        WHERE entity_type = 'post'
        GROUP BY entity_id
      ),
      post_categories_agg AS (
        SELECT 
          pc.post_id,
          ARRAY_AGG(
            json_build_object('id', c.id, 'name', c.name)
          ) AS categories
        FROM (
          SELECT DISTINCT pc.post_id, pc.category_id
          FROM post_categories pc
        ) pc
        JOIN categories c ON pc.category_id = c.id
        GROUP BY pc.post_id
      )
      SELECT 
        p.id, 
        p.title, 
        p.content, 
        p.user_id, 
        u.name AS author, 
        p.created_at,
        p.status,
        p.tourist_place_id, 
        tp.name AS tourist_place_name,
        l.name AS location_name, 
        tp.longitude, 
        tp.latitude,
        COALESCE(pi.images, ARRAY[]::json[]) AS images,
        COALESCE(pc.categories, ARRAY[]::json[]) AS categories,
        (SELECT COUNT(*) FROM favorites f2 WHERE f2.post_id = p.id)::text AS favorites_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id)::text AS comments_count
      FROM favorites f
      JOIN posts p ON f.post_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN tourist_places tp ON p.tourist_place_id = tp.id
      JOIN locations l ON tp.location_id = l.id
      LEFT JOIN post_images pi ON pi.post_id = p.id
      LEFT JOIN post_categories_agg pc ON pc.post_id = p.id
      WHERE f.user_id = ${user_id}
      ORDER BY f.created_at DESC
    `;

    res.status(200).json({
      success: true,
      data: favorites,
      message: "Lấy danh sách bài viết yêu thích thành công",
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài viết yêu thích:", error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : "Lỗi server nội bộ",
    });
  }
};

// Xóa bài viết khỏi danh sách yêu thích
export const removeFavorite = async (req, res) => {
  const { post_id } = req.params;
  const user_id = req.user.id;

  try {
    // Kiểm tra xem bài viết có trong danh sách yêu thích không
    const favorite = await sql`
      SELECT id FROM favorites WHERE user_id = ${user_id} AND post_id = ${post_id}
    `;
    if (!favorite.length) {
      return res.status(404).json({
        success: false,
        error: "Bài viết không có trong danh sách yêu thích",
      });
    }

    // Xóa bài viết khỏi danh sách yêu thích
    await sql`
      DELETE FROM favorites WHERE user_id = ${user_id} AND post_id = ${post_id}
    `;

    res.status(200).json({
      success: true,
      message: "Đã xóa bài viết khỏi danh sách yêu thích",
    });
  } catch (error) {
    console.error("Lỗi khi xóa bài viết yêu thích:", error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : "Lỗi server nội bộ",
    });
  }
}