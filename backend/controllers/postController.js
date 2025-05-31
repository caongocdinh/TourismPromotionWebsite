import { sql } from "../config/db.js";
import uploadImageCloudinary from "../utils/cloundinary.js";


// export const getAllPosts = async (req, res) => {
//   try {
//     const posts = await sql`
//       SELECT 
//         p.id, 
//         p.title, 
//         p.content, 
//         p.user_id, 
//         u.name AS author, 
//         p.created_at,
//         p.tourist_place_id, 
//         tp.name AS tourist_place_name,
//         l.name AS location_name, 
//         tp.longitude, 
//         tp.latitude,
//         COALESCE(
//           ARRAY_AGG(
//             json_build_object('url', i.url, 'public_id', i.public_id)
//           ) FILTER (WHERE i.url IS NOT NULL),
//           ARRAY[]::json[]
//         ) AS images,
//         COALESCE(
//           ARRAY_AGG(
//             json_build_object('id', c.id, 'name', c.name)
//           ) FILTER (WHERE c.id IS NOT NULL),
//           ARRAY[]::json[]
//         ) AS categories
//       FROM posts p
//       JOIN users u ON p.user_id = u.id
//       JOIN tourist_places tp ON p.tourist_place_id = tp.id
//       JOIN locations l ON tp.location_id = l.id
//       LEFT JOIN images i ON i.entity_type = 'post' AND i.entity_id = p.id
//       LEFT JOIN post_categories pc ON pc.post_id = p.id
//       LEFT JOIN categories c ON pc.category_id = c.id
//       GROUP BY p.id, u.name, tp.name, l.name, tp.longitude, tp.latitude
//     `;
//     res.status(200).json({
//       success: true,
//       data: posts,
//     });
//   } catch (error) {
//     console.error("Lỗi khi lấy danh sách bài viết:", error.stack);
//     res.status(500).json({ 
//       success: false,
//       error: process.env.NODE_ENV === 'development' ? error.message : "Lỗi server nội bộ"
//     });
//   }
// };


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
    // Log cảnh báo nếu có danh mục trùng lặp
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


import sanitizeHtml from 'sanitize-html';


import logger from '../utils/logger.js';


// export const addPost = async (req, res) => {
//   const { title, content, user_id, touristPlaces, categories, imageIds } = req.body;

//   console.log("Request body:", req.body);
//   if (!title || !content || !user_id || !touristPlaces || !categories) {
//     console.log("Missing fields:", {
//       title: !title,
//       content: !content,
//       user_id: !user_id,
//       touristPlaces: !touristPlaces,
//       categories: !categories,
//     });
//     return res.status(400).json({
//       success: false,
//       error: "Thiếu thông tin cần thiết",
//     });
//   }

//   try {
//     const categoryIds = Array.isArray(categories)
//       ? categories.map((c) => c.value)
//       : JSON.parse(categories).map((c) => c.value);

//     const cleanedContent = sanitizeHtml(content, {
//       allowedTags: ["p", "img", "strong", "em", "h1", "h2", "h3", "ul", "ol", "li"],
//       allowedAttributes: { img: ["src", "alt"] },
//     });

//     // Kiểm tra và thêm touristPlaces
//     let touristPlaceId;
//     const place = touristPlaces[0]; // Lấy địa điểm đầu tiên (nếu chỉ cần một)
//     if (!place) {
//       return res.status(400).json({
//         success: false,
//         error: "Phải cung cấp ít nhất một địa điểm du lịch",
//       });
//     }

//     // Kiểm tra xem địa điểm đã tồn tại chưa
//     const existingPlace = await sql`
//       SELECT id FROM tourist_places 
//       WHERE latitude = ${place.lat} AND longitude = ${place.lng}
//     `;
//     if (existingPlace.length > 0) {
//       touristPlaceId = existingPlace[0].id;
//     } else {
//       // Thêm địa điểm mới với location_id mặc định (1) nếu không có
//       const newPlace = await sql`
//         INSERT INTO tourist_places (name, latitude, longitude, location_id)
//         VALUES (${place.name}, ${place.lat}, ${place.lng}, ${place.location_id || 1})
//         RETURNING id
//       `;
//       touristPlaceId = newPlace[0].id;
//     }

//     // Chèn bài đăng với tourist_place_id
//     const post = await sql`
//       INSERT INTO posts (title, content, user_id, tourist_place_id)
//       VALUES (${title}, ${cleanedContent}, ${user_id}, ${touristPlaceId})
//       RETURNING id, title, content, user_id, created_at
//     `;

   

//     // Xử lý images
//     if (imageIds && imageIds.length > 0) {
//       await Promise.all(
//         imageIds.map((id) => sql`
//           UPDATE images
//           SET entity_type = 'post', entity_id = ${post[0].id}
//           WHERE id = ${id}
//         `)
//       );
//     }

//     // Xử lý categories
//     const categoryInserts = categoryIds.map((category_id) => sql`
//       INSERT INTO post_categories (post_id, category_id)
//       VALUES (${post[0].id}, ${category_id})
//     `);
//     if (categoryInserts.length > 0) {
//       await Promise.all(categoryInserts);
//     }

//     // Lấy chi tiết bài đăng
//     const postWithDetails = await sql`
//       SELECT p.id, p.title, p.content, p.user_id, u.name AS author,
//              COALESCE(
//                ARRAY_AGG(json_build_object('id', tp.id, 'name', tp.name, 'latitude', tp.latitude, 'longitude', tp.longitude)) 
//                FILTER (WHERE tp.id IS NOT NULL),
//                ARRAY[]::json[]
//              ) AS tourist_places,
//              COALESCE(
//                ARRAY_AGG(json_build_object('url', i.url, 'public_id', i.public_id)) 
//                FILTER (WHERE i.url IS NOT NULL),
//                ARRAY[]::json[]
//              ) AS images,
//              COALESCE(
//                ARRAY_AGG(json_build_object('id', c.id, 'name', c.name)) 
//                FILTER (WHERE c.id IS NOT NULL),
//                ARRAY[]::json[]
//              ) AS categories
//       FROM posts p
//       JOIN users u ON p.user_id = u.id
     
//     JOIN tourist_places tp ON p.tourist_place_id = tp.id
//       LEFT JOIN images i ON i.entity_type = 'post' AND i.entity_id = p.id
//       LEFT JOIN post_categories pc ON pc.post_id = p.id
//       LEFT JOIN categories c ON pc.category_id = c.id
//       WHERE p.id = ${post[0].id}
//       GROUP BY p.id, u.name
//     `;

//     res.status(201).json({
//       success: true,
//       data: postWithDetails[0],
//     });
//   } catch (error) {
//     console.error(`Add post error: ${error.message}`);
//     res.status(500).json({
//       success: false,
//       error: process.env.NODE_ENV === "development" ? error.message : "Server error",
//     });
//   }
// };


// Hàm trích xuất location_name từ display_name

// Hàm trích xuất location_name từ name
const extractLocationName = (name) => {
  if (!name) return "Unknown Location";
  const parts = name.split(",").map(part => part.trim());
  // Giả định tỉnh/thành phố nằm trước "Vietnam" hoặc là phần thứ hai từ cuối
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
    const place = touristPlaces[0]; // Lấy địa điểm đầu tiên
    if (!place) {
      return res.status(400).json({
        success: false,
        error: "Phải cung cấp ít nhất một địa điểm du lịch",
      });
    }

    // Trích xuất location_name
    const locationName = place.location_name || extractLocationName(place.name);

    // Kiểm tra/tạo location
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

    // Kiểm tra xem địa điểm đã tồn tại chưa
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

    // Chèn bài đăng với tourist_place_id
    const post = await sql`
      INSERT INTO posts (title, content, user_id, tourist_place_id)
      VALUES (${title}, ${cleanedContent}, ${user_id}, ${touristPlaceId})
      RETURNING id, title, content, user_id, created_at
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
      SELECT p.id, p.title, p.content, p.user_id, u.name AS author,
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

    res.status(201).json({
      success: true,
      data: postWithDetails[0],
    });
  } catch (error) {
    console.error(`Add post error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : "Server error",
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
    // Log cảnh báo nếu có danh mục trùng lặp
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
// export const getPostById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const post = await sql`
//       SELECT 
//         p.id, 
//         p.title, 
//         p.content, 
//         p.user_id, 
//         u.name AS author, 
//         p.created_at,
//         p.tourist_place_id, 
//         tp.name AS tourist_place_name,
//         l.name AS location_name, 
//         tp.longitude, 
//         tp.latitude,
//         COALESCE(
//           ARRAY_AGG(
//             json_build_object('url', i.url, 'public_id', i.public_id)
//           ) FILTER (WHERE i.url IS NOT NULL),
//           ARRAY[]::json[]
//         ) AS images,
//         COALESCE(
//           ARRAY_AGG(
//             json_build_object('id', c.id, 'name', c.name)
//           ) FILTER (WHERE c.id IS NOT NULL),
//           ARRAY[]::json[]
//         ) AS categories
//       FROM posts p
//       JOIN users u ON p.user_id = u.id
//       JOIN tourist_places tp ON p.tourist_place_id = tp.id
//       JOIN locations l ON tp.location_id = l.id
//       LEFT JOIN images i ON i.entity_type = 'post' AND i.entity_id = p.id
//       LEFT JOIN post_categories pc ON pc.post_id = p.id
//       LEFT JOIN categories c ON pc.category_id = c.id
//       WHERE p.id = ${id}
//       GROUP BY p.id, u.name, tp.name, l.name, tp.longitude, tp.latitude
//     `;
//     if (!post.length) {
//       return res.status(404).json({
//         success: false,
//         error: 'Không tìm thấy bài viết',
//       });
//     }
//     res.status(200).json({
//       success: true,
//       data: post[0],
//     });
//   } catch (error) {
//     console.error('Lỗi khi lấy bài viết:', error.stack);
//     res.status(500).json({
//       success: false,
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Lỗi server nội bộ',
//     });
//   }
// };
