import { sql } from "../config/db.js";
import sanitizeHtml from 'sanitize-html';

// Hàm trích xuất location_name từ name
const extractLocationName = (name) => {
  if (!name) return "Unknown Location";
  const parts = name.split(",").map(part => part.trim());
  const provinceIndex = parts.indexOf("Vietnam") - 1;
  return provinceIndex >= 0 ? parts[provinceIndex].replace(" Province", "") : parts[parts.length - 2] || "Unknown Location";
};

export const addPost = async (req, res) => {
  const { title, content, user_id, touristPlaces, categories, imageIds } = req.body;

  console.log("Request body:", req.body);
  if (!title || !content || !user_id || !touristPlaces || !touristPlaces.length || !categories) {
    console.log("Missing fields:", {
      title: !title,
      content: !content,
      user_id: !user_id,
      touristPlaces: !touristPlaces || !touristPlaces.length,
      categories: !categories,
    });
    return res.status(400).json({
      success: false,
      error: "Thiếu thông tin cần thiết",
    });
  }

  try {
    const categoryIds = Array.isArray(categories)
      ? categories.map((c) => c.value)
      : JSON.parse(categories).map((c) => c.value);

    const cleanedContent = sanitizeHtml(content, {
      allowedTags: ["p", "img", "strong", "em", "h1", "h2", "h3", "ul", "ol", "li"],
      allowedAttributes: { img: ["src", "alt"] },
    });

    // Kiểm tra và thêm touristPlaces
    let touristPlaceId;
    const place = touristPlaces[0];
    if (!place) {
      return res.status(400).json({
        success: false,
        error: "Phải cung cấp ít nhất một địa điểm du lịch",
      });
    }

    const locationName = place.location_name || extractLocationName(place.name);

    let locationId;
    const existingLocation = await sql`
      SELECT id FROM locations WHERE name = ${locationName} LIMIT 1
    `;
    if (existingLocation.length > 0) {
      locationId = existingLocation[0].id;
    } else {
      const newLoc = await sql`
        INSERT INTO locations (name) VALUES (${locationName}) RETURNING id
      `;
      locationId = newLoc[0].id;
    }

    const existingPlace = await sql`
      SELECT id FROM tourist_places 
      WHERE latitude = ${place.lat} AND longitude = ${place.lng} AND location_id = ${locationId}
    `;
    if (existingPlace.length > 0) {
      touristPlaceId = existingPlace[0].id;
    } else {
      const newPlace = await sql`
        INSERT INTO tourist_places (name, latitude, longitude, location_id)
        VALUES (${place.name}, ${place.lat}, ${place.lng}, ${locationId})
        RETURNING id
      `;
      touristPlaceId = newPlace[0].id;
    }

    // Chèn bài đăng với trạng thái 'pending'
    const post = await sql`
      INSERT INTO posts (title, content, user_id, tourist_place_id, status)
      VALUES (${title}, ${cleanedContent}, ${user_id}, ${touristPlaceId}, 'pending')
      RETURNING id, title, content, user_id, created_at, status
    `;

    // Xử lý images
    if (imageIds && imageIds.length > 0) {
      await Promise.all(
        imageIds.map((id) => sql`
          UPDATE images
          SET entity_type = 'post', entity_id = ${post[0].id}
          WHERE id = ${id}
        `)
      );
    }

    // Xử lý categories
    const categoryInserts = categoryIds.map((category_id) => sql`
      INSERT INTO post_categories (post_id, category_id)
      VALUES (${post[0].id}, ${category_id})
    `);
    if (categoryInserts.length > 0) {
      await Promise.all(categoryInserts);
    }

    // Lấy chi tiết bài đăng
    const postWithDetails = await sql`
      SELECT p.id, p.title, p.content, p.user_id, u.name AS author, p.status,
             json_build_object(
               'id', tp.id, 
               'name', tp.name, 
               'latitude', tp.latitude, 
               'longitude', tp.longitude
             ) AS tourist_place,
             l.name AS location_name,
             COALESCE(
               ARRAY_AGG(json_build_object('url', i.url, 'public_id', i.public_id)) 
               FILTER (WHERE i.url IS NOT NULL),
               ARRAY[]::json[]
             ) AS images,
             COALESCE(
               ARRAY_AGG(json_build_object('id', c.id, 'name', c.name)) 
               FILTER (WHERE c.id IS NOT NULL),
               ARRAY[]::json[]
             ) AS categories
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN tourist_places tp ON p.tourist_place_id = tp.id
      JOIN locations l ON tp.location_id = l.id
      LEFT JOIN images i ON i.entity_type = 'post' AND i.entity_id = p.id
      LEFT JOIN post_categories pc ON pc.post_id = p.id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.id = ${post[0].id}
      GROUP BY p.id, u.name, tp.id, tp.name, tp.latitude, tp.longitude, l.name
    `;
    console.log("Images of post:", postWithDetails[0].images);

    res.status(201).json({
      success: true,
      data: postWithDetails[0],
      message: "Bài viết đã được gửi đến quản trị viên để duyệt.",
    });
  } catch (error) {
    console.error(`Add post error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await sql`
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
        COALESCE(pc.categories, ARRAY[]::json[]) AS categories
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN tourist_places tp ON p.tourist_place_id = tp.id
      JOIN locations l ON tp.location_id = l.id
      LEFT JOIN post_images pi ON pi.post_id = p.id
      LEFT JOIN post_categories_agg pc ON pc.post_id = p.id
      ORDER BY p.created_at DESC
    `;
    posts.forEach(post => {
      const categoryIds = post.categories.map(c => c.id);
      if (categoryIds.length > new Set(categoryIds).size) {
        console.warn(`Duplicate categories found in post ID ${post.id}:`, post.categories);
      }
    });
    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài viết:", error.stack);
    res.status(500).json({ 
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : "Lỗi server nội bộ"
    });
  }
};

export const getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await sql`
      WITH post_images AS (
        SELECT 
          entity_id AS post_id,
          ARRAY_AGG(
            json_build_object('url', url, 'public_id', public_id)
          ) FILTER (WHERE url IS NOT NULL) AS images
        FROM images
        WHERE entity_type = 'post' AND entity_id = ${id}
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
          WHERE pc.post_id = ${id}
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
        COALESCE(pc.categories, ARRAY[]::json[]) AS categories
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN tourist_places tp ON p.tourist_place_id = tp.id
      JOIN locations l ON tp.location_id = l.id
      LEFT JOIN post_images pi ON pi.post_id = p.id
      LEFT JOIN post_categories_agg pc ON pc.post_id = p.id
      WHERE p.id = ${id}
    `;
    if (!post.length) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bài viết',
      });
    }
    const categoryIds = post[0].categories.map(c => c.id);
    if (categoryIds.length > new Set(categoryIds).size) {
      console.warn(`Duplicate categories found in post ID ${id}:`, post[0].categories);
    }
    res.status(200).json({
      success: true,
      data: post[0],
    });
  } catch (error) {
    console.error('Lỗi khi lấy bài viết:', error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Lỗi server nội bộ',
    });
  }
};

export const approvePost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await sql`
      UPDATE posts
      SET status = 'approved'
      WHERE id = ${id}
      RETURNING id, title, status
    `;
    if (!post.length) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bài viết',
      });
    }
    res.status(200).json({
      success: true,
      data: post[0],
      message: 'Bài viết đã được duyệt thành công',
    });
  } catch (error) {
    console.error('Lỗi khi duyệt bài viết:', error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Lỗi server nội bộ',
    });
  }
};

export const rejectPost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await sql`
      UPDATE posts
      SET status = 'rejected'
      WHERE id = ${id}
      RETURNING id, title, status
    `;
    if (!post.length) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bài viết',
      });
    }
    res.status(200).json({
      success: true,
      data: post[0],
      message: 'Bài viết đã bị từ chối',
    });
  } catch (error) {
    console.error('Lỗi khi từ chối bài viết:', error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Lỗi server nội bộ',
    });
  }
};

export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, content, user_id, touristPlaces, categories, imageIds, status } = req.body;

  if (!title || !content || !user_id || !touristPlaces || !touristPlaces.length || !categories) {
    return res.status(400).json({
      success: false,
      error: "Thiếu thông tin cần thiết",
    });
  }

  try {
    // Lấy thông tin bài viết để kiểm tra tác giả
    const post = await sql`
      SELECT user_id FROM posts WHERE id = ${id}
    `;
    if (!post.length) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy bài viết",
      });
    }

    // Kiểm tra xem người gửi yêu cầu có phải là tác giả không
    if (post[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Bạn không có quyền chỉnh sửa bài viết này",
      });
    }

    const cleanedContent = sanitizeHtml(content, {
      allowedTags: ["p", "img", "strong", "em", "h1", "h2", "h3", "ul", "ol", "li"],
      allowedAttributes: { img: ["src", "alt"] },
    });

    // Kiểm tra và cập nhật touristPlaces
    const place = touristPlaces[0];
    const locationName = place.location_name || extractLocationName(place.name);

    let locationId;
    const existingLocation = await sql`
      SELECT id FROM locations WHERE name = ${locationName} LIMIT 1
    `;
    if (existingLocation.length > 0) {
      locationId = existingLocation[0].id;
    } else {
      const newLoc = await sql`
        INSERT INTO locations (name) VALUES (${locationName}) RETURNING id
      `;
      locationId = newLoc[0].id;
    }

    let touristPlaceId;
    const existingPlace = await sql`
      SELECT id FROM tourist_places 
      WHERE latitude = ${place.lat} AND longitude = ${place.lng} AND location_id = ${locationId}
    `;
    if (existingPlace.length > 0) {
      touristPlaceId = existingPlace[0].id;
      await sql`
        UPDATE tourist_places
        SET name = ${place.name}, latitude = ${place.lat}, longitude = ${place.lng}, location_id = ${locationId}
        WHERE id = ${touristPlaceId}
      `;
    } else {
      const newPlace = await sql`
        INSERT INTO tourist_places (name, latitude, longitude, location_id)
        VALUES (${place.name}, ${place.lat}, ${place.lng}, ${locationId})
        RETURNING id
      `;
      touristPlaceId = newPlace[0].id;
    }

    // Cập nhật bài đăng
    const updatedPost = await sql`
      UPDATE posts
      SET title = ${title}, content = ${cleanedContent}, user_id = ${user_id}, tourist_place_id = ${touristPlaceId}, status = ${status}
      WHERE id = ${id}
      RETURNING id, title, content, user_id, created_at, status
    `;

    if (!updatedPost.length) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy bài viết để cập nhật",
      });
    }

    // Cập nhật images
    if (imageIds && imageIds.length > 0) {
      await sql`
        UPDATE images
        SET entity_type = 'post', entity_id = ${id}
        WHERE id = ANY(${imageIds})
      `;
    }

    // Cập nhật categories
    await sql`DELETE FROM post_categories WHERE post_id = ${id}`;
    const categoryIds = Array.isArray(categories) ? categories.map(c => c.value) : JSON.parse(categories).map(c => c.value);
    const categoryInserts = categoryIds.map((category_id) => sql`
      INSERT INTO post_categories (post_id, category_id)
      VALUES (${id}, ${category_id})
    `);
    if (categoryInserts.length > 0) {
      await Promise.all(categoryInserts);
    }

    // Lấy chi tiết bài đăng đã cập nhật
    const postWithDetails = await sql`
      SELECT p.id, p.title, p.content, p.user_id, u.name AS author, p.status,
             json_build_object(
               'id', tp.id, 
               'name', tp.name, 
               'latitude', tp.latitude, 
               'longitude', tp.longitude
             ) AS tourist_place,
             l.name AS location_name,
             COALESCE(
               ARRAY_AGG(json_build_object('url', i.url, 'public_id', i.public_id)) 
               FILTER (WHERE i.url IS NOT NULL),
               ARRAY[]::json[]
             ) AS images,
             COALESCE(
               ARRAY_AGG(json_build_object('id', c.id, 'name', c.name)) 
               FILTER (WHERE c.id IS NOT NULL),
               ARRAY[]::json[]
             ) AS categories
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN tourist_places tp ON p.tourist_place_id = tp.id
      JOIN locations l ON tp.location_id = l.id
      LEFT JOIN images i ON i.entity_type = 'post' AND i.entity_id = p.id
      LEFT JOIN post_categories pc ON pc.post_id = p.id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.id = ${id}
      GROUP BY p.id, u.name, tp.id, tp.name, tp.latitude, tp.longitude, l.name
    `;

    res.status(200).json({
      success: true,
      data: postWithDetails[0],
      message: "Bài viết đã được cập nhật thành công",
    });
  } catch (error) {
    console.error(`Update post error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  }
};

export const getUserPosts = async (req, res) => {
  console.log('Request received for /api/posts/user');
  console.log('req.user:', req.user);

  if (!req.user || !req.user.id) {
    console.error('No user ID found in request');
    return res.status(401).json({ success: false, error: 'Không xác định được người dùng' });
  }

  const userId = req.user.id;
  console.log('Fetching posts for user ID:', userId);

  try {
    const posts = await sql`
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
        COALESCE(pc.categories, ARRAY[]::json[]) AS categories
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN tourist_places tp ON p.tourist_place_id = tp.id
      JOIN locations l ON tp.location_id = l.id
      LEFT JOIN post_images pi ON pi.post_id = p.id
      LEFT JOIN post_categories_agg pc ON pc.post_id = p.id
      WHERE p.user_id = ${userId}
      ORDER BY p.created_at DESC
    `;

    console.log('Fetched posts:', posts);
    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài viết của người dùng:", error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : "Lỗi server nội bộ",
    });
  }
};

export const getPostsByCategory = async (req, res) => {
  const category_id = parseInt(req.query.category_id, 10);
  const location_id = req.query.location_id ? parseInt(req.query.location_id, 10) : null;

  console.log('getPostsByCategory called with:', { category_id, location_id });

  if (isNaN(category_id)) {
    console.log('Invalid category_id:', req.query.category_id);
    return res.status(400).json({
      success: false,
      error: "category_id phải là một số nguyên hợp lệ",
    });
  }

  try {
    const posts = await sql`
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
        COALESCE(pc_agg.categories, ARRAY[]::json[]) AS categories
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN tourist_places tp ON p.tourist_place_id = tp.id
      JOIN locations l ON tp.location_id = l.id
      JOIN post_categories pc ON p.id = pc.post_id
      LEFT JOIN post_images pi ON pi.post_id = p.id
      LEFT JOIN post_categories_agg pc_agg ON pc_agg.post_id = p.id
      WHERE pc.category_id = ${category_id} AND p.status = 'approved'
      ${location_id ? sql`AND l.id = ${location_id}` : sql``}
      ORDER BY p.created_at DESC
    `;
    console.log('Posts fetched:', posts.length);

    posts.forEach(post => {
      const categoryIds = post.categories.map(c => c.id);
      if (categoryIds.length > new Set(categoryIds).size) {
        console.warn(`Duplicate categories found in post ID ${post.id}:`, post.categories);
      }
    });

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("Error fetching posts by category:", error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Lỗi server nội bộ.',
    });
  }
};

export async function searchPostsByImage(req, res) {
  try {
    const { features } = req.body;

    console.log("🔍 [Image Search] Received features:", features?.slice?.(0, 5)); // log vài giá trị đầu tiên

    if (!features || !Array.isArray(features)) {
      console.warn("⚠️ [Image Search] Invalid or missing features.");
      return res.status(400).json({ error: "Invalid or missing features." });
    }

    const results = await sql`
      SELECT 
        images.id AS image_id,
        images.url,
        images.public_id,
        images.entity_type,
        images.entity_id,
        features <=> ${JSON.stringify(features)} AS similarity
      FROM image_vectors
      JOIN images ON image_vectors.image_id = images.id
      ORDER BY features <=> ${JSON.stringify(features)}
      LIMIT 5;
    `;

    console.log(`✅ [Image Search] Found ${results.length} result(s)`);

    const formatted = results.map((r, index) => ({
      image_id: r.image_id,
      url: r.url,
      public_id: r.public_id,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      similarity: (1 - r.similarity).toFixed(4),
    }));

    console.log("📦 [Image Search] Formatted results (first 2):", formatted.slice(0, 2));

    return res.status(200).json({
      success: true,
      data: formatted,
      message: "Tìm kiếm ảnh thành công",
    });
  } catch (error) {
    console.error("❌ [Image Search] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}


