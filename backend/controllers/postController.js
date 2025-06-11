import { sql } from "../config/db.js";
import sanitizeHtml from 'sanitize-html';

// Hàm trích xuất location_name từ name
const extractLocationName = (name) => {
  const parts = name.split(',');
  return parts.length > 1 ? parts[parts.length - 2].trim() : name;
};

export const addPost = async (req, res) => {
  console.log("Request body:", req.body);
  let { title, content, user_id, touristPlaces, categories, imageIds } = req.body;

  try {
    // Parse JSON nếu là FormData
    if (typeof touristPlaces === 'string') {
      touristPlaces = JSON.parse(touristPlaces);
    }
    if (typeof categories === 'string') {
      categories = JSON.parse(categories);
    }
    if (typeof imageIds === 'string') {
      imageIds = JSON.parse(imageIds);
    }

    // Validate dữ liệu
    if (!title || !content || !user_id) {
      return res.status(400).json({
        success: false,
        error: "Thiếu tiêu đề, nội dung hoặc user_id",
      });
    }
    if (!Array.isArray(touristPlaces) || touristPlaces.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Phải cung cấp ít nhất một địa điểm du lịch",
      });
    }
    for (const place of touristPlaces) {
      if (!place.name || place.lat == null || place.lng == null) {
        return res.status(400).json({
          success: false,
          error: "Địa điểm du lịch thiếu name, lat hoặc lng",
        });
      }
    }

    // Kiểm tra user_id
    const userExists = await sql`SELECT id FROM users WHERE id = ${user_id}`;
    if (!userExists.length) {
      return res.status(400).json({
        success: false,
        error: "User ID không hợp lệ",
      });
    }

    // Xử lý tourist_places
    let touristPlaceId;
    const place = touristPlaces[0];
    const existingPlace = await sql`
      SELECT id FROM tourist_places
      WHERE ABS(latitude - ${place.lat}) < 0.0001
      AND ABS(longitude - ${place.lng}) < 0.0001
      LIMIT 1
    `;
    if (existingPlace.length) {
      touristPlaceId = existingPlace[0].id;
    } else {
      const newPlace = await sql`
        INSERT INTO tourist_places (name, latitude, longitude, location_id)
        VALUES (
          ${place.name}, 
          ${place.lat}, 
          ${place.lng}, 
          ${place.location_name ? (await sql`SELECT id FROM locations WHERE name = ${place.location_name} LIMIT 1`).length ? (await sql`SELECT id FROM locations WHERE name = ${place.location_name} LIMIT 1`)[0].id : (await sql`INSERT INTO locations (name) VALUES (${place.location_name}) RETURNING id`)[0].id : null}
        )
        RETURNING id
      `;
      touristPlaceId = newPlace[0].id;
    }

    // Sanitize content
    const cleanedContent = sanitizeHtml(content, {
      allowedTags: ['p', 'img', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
      allowedAttributes: { img: ['src', 'alt'] },
    });

    // Lưu bài viết
    const post = await sql`
      INSERT INTO posts (title, content, user_id, tourist_place_id, status)
      VALUES (${title}, ${cleanedContent}, ${user_id}, ${touristPlaceId}, 'pending')
      RETURNING id
    `;
    const postId = post[0].id;

    // Lưu danh mục
    if (Array.isArray(categories) && categories.length) {
      const categoryValues = categories
        .filter(c => c.value)
        .map(c => `(${postId}, ${c.value})`);
      if (categoryValues.length) {
        await sql`
          INSERT INTO post_categories (post_id, category_id)
          VALUES ${sql.unsafe(categoryValues.join(','))}
        `;
      }
    }

    // Cập nhật hình ảnh trong bảng images (thay vì post_images)
    if (Array.isArray(imageIds) && imageIds.length) {
      for (const imageId of imageIds) {
        await sql`
          UPDATE images
          SET entity_type = 'post', entity_id = ${postId}
          WHERE id = ${imageId}
        `;
      }
    }

    res.status(201).json({
      success: true,
      message: "Bài viết đã được gửi để duyệt",
      data: { postId },
    });
  } catch (error) {
    console.error("Add post error:", error.message, error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : "Lỗi server",
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
      ),
      post_likes AS (
        SELECT 
          post_id,
          COUNT(*) AS likes
        FROM favorites
        GROUP BY post_id
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
        p.views,
        COALESCE(pl.likes, 0)::INTEGER AS likes, -- Đếm từ favorites
        COALESCE(pi.images, ARRAY[]::json[]) AS images,
        COALESCE(pc.categories, ARRAY[]::json[]) AS categories
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN tourist_places tp ON p.tourist_place_id = tp.id
      JOIN locations l ON tp.location_id = l.id
      LEFT JOIN post_images pi ON pi.post_id = p.id
      LEFT JOIN post_categories_agg pc ON pc.post_id = p.id
      LEFT JOIN post_likes pl ON pl.post_id = p.id
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

  // Kiểm tra id có phải là số nguyên
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({
      success: false,
      error: "ID bài viết không hợp lệ",
    });
  }

  try {
    const post = await sql`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.user_id,
        u.name as author,
        p.created_at,
        p.status,
        p.tourist_place_id,
        tp.name as tourist_place_name,
        COALESCE(l.name, ${extractLocationName('tp.name')}) as location_name,
        tp.latitude,
        tp.longitude,
        json_agg(
          json_build_object(
            'id', c.id,
            'name', c.name
          )
        ) FILTER (WHERE c.id IS NOT NULL) as categories,
        (SELECT json_agg(json_build_object('id', i.id, 'url', i.url))
         FROM images i WHERE i.entity_type = 'post' AND i.entity_id = p.id) as images
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN tourist_places tp ON p.tourist_place_id = tp.id
      LEFT JOIN locations l ON tp.location_id = l.id
      LEFT JOIN post_categories pc ON p.id = pc.post_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.id = ${parseInt(id)}
      GROUP BY p.id, u.name, tp.name, l.name, tp.latitude, tp.longitude
    `;
    if (!post.length) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy bài viết",
      });
    }
    res.status(200).json({
      success: true,
      data: post[0],
    });
  } catch (error) {
    console.error("Get post by id error:", error.message, error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : "Lỗi server",
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

export const incrementPostView = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await sql`
      UPDATE posts
      SET views = views + 1
      WHERE id = ${id}
      RETURNING id, views
    `;
    if (!post.length) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bài viết',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Đã tăng lượt xem',
      data: post[0],
    });
  } catch (error) {
    console.error('Lỗi khi tăng lượt xem:', error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Lỗi server nội bộ',
    });
  }
};

export const searchPosts = async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  try {
    const query = decodeURIComponent(q);
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
      )
      SELECT 
        p.id, 
        p.title, 
        p.content, 
        p.user_id, 
        p.tourist_place_id, 
        p.status, 
        p.views, 
        p.created_at,
        pc.category_id, 
        c.name AS category_name,
        COALESCE(pi.images, ARRAY[]::json[]) AS images
      FROM posts p
      LEFT JOIN post_categories pc ON p.id = pc.post_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN post_images pi ON pi.post_id = p.id
      WHERE p.title ILIKE ${`%${query}%`} OR p.content ILIKE ${`%${query}%`}
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;
    res.json({ data: { posts } });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm bài viết:", error.stack);
    res.status(500).json({ message: "Lỗi khi tìm kiếm bài viết", error: error.message });
  }
};

export const getPendingPosts = async (req, res) => {
  try {
    const posts = await sql`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.user_id,
        u.name as author,
        p.created_at,
        p.status,
        p.tourist_place_id,
        tp.name as tourist_place_name,
        COALESCE(l.name, ${extractLocationName('tp.name')}) as location_name,
        tp.latitude,
        tp.longitude,
        json_agg(
          json_build_object(
            'id', c.id,
            'name', c.name
          )
        ) FILTER (WHERE c.id IS NOT NULL) as categories,
        (SELECT json_agg(json_build_object('id', i.id, 'url', i.url))
         FROM images i WHERE i.entity_type = 'post' AND i.entity_id = p.id) as images
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN tourist_places tp ON p.tourist_place_id = tp.id
      LEFT JOIN locations l ON tp.location_id = l.id
      LEFT JOIN post_categories pc ON p.id = pc.post_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.status = 'pending'
      GROUP BY p.id, u.name, tp.name, l.name, tp.latitude, tp.longitude
      ORDER BY p.created_at DESC
    `;
    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("Get pending posts error:", error.message, error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : "Lỗi server",
    });
  }
};