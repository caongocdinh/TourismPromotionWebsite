import { sql } from "../config/db.js";
import uploadImageCloudinary from "../utils/cloundinary.js";

// export const getAllPosts = async (req, res) => {
//   try {
//     const posts = await sql`
//       SELECT p.id, p.title, p.content, p.user_id, u.name AS author, p.created_at,
//              COALESCE(
//                ARRAY_AGG(json_build_object('url', i.url, 'public_id', i.public_id)) FILTER (WHERE i.url IS NOT NULL),
//                ARRAY[]::json[]
//              ) AS images
//       FROM posts p
//       JOIN users u ON p.user_id = u.id
//       LEFT JOIN images i ON i.entity_type = 'post' AND i.entity_id = p.id
//       GROUP BY p.id, u.name
//     `;
//     res.status(200).json({
//       success: true,
//       data: posts,
//     });
//   } catch (error) {
//     console.error("Lỗi khi lấy danh sách bài viết:", error.stack);
//     res.status(500).json({ error: "Lỗi server" });
//   }
// };

// export const addPost = async (req, res) => {
//   const { title, content, user_id } = req.body;
//   if (!title || !content || !user_id) {
//     return res.status(400).json({
//       success: false,
//       error: "Thiếu thông tin cần thiết",
//     });
//   }
//   try {
//     const post = await sql`
//       INSERT INTO posts (title, content, user_id)
//       VALUES (${title}, ${content}, ${user_id})
//       RETURNING id, title, content, user_id, created_at
//     `;
//     const imageInserts = [];
//     if (req.files && req.files.length > 0) {
//       const imageResults = await Promise.all(
//         req.files.map(file =>
//           uploadImageCloudinary(file, "tourism_posts").catch(error => {
//             console.error("Lỗi khi upload hình ảnh:", error);
//             return null;
//           })
//         )
//       );
//       imageResults.forEach(result => {
//         if (result) {
//           imageInserts.push(
//             sql`
//               INSERT INTO images (url, public_id, entity_type, entity_id)
//               VALUES (${result.secure_url}, ${result.public_id}, 'post', ${post[0].id})
//             `
//           );
//         }
//       });
//       if (imageInserts.length > 0) {
//         await Promise.all(imageInserts);
//       }
//     }
//     const postWithImages = await sql`
//       SELECT p.id, p.title, p.content, p.user_id, u.name AS author, p.created_at,
//              COALESCE(
//                ARRAY_AGG(json_build_object('url', i.url, 'public_id', i.public_id)) FILTER (WHERE i.url IS NOT NULL),
//                ARRAY[]::json[]
//              ) AS images
//       FROM posts p
//       JOIN users u ON p.user_id = u.id
//       LEFT JOIN images i ON i.entity_type = 'post' AND i.entity_id = p.id
//       WHERE p.id = ${post[0].id}
//       GROUP BY p.id, u.name
//     `;
//     res.status(201).json({
//       success: true,
//       data: postWithImages[0],
//     });
//   } catch (error) {
//     console.error("Lỗi khi thêm bài viết:", error.stack);
//     res.status(500).json({ error: "Lỗi server" });
//   }
// };




// export const getAllPosts = async (req, res) => {
//   try {
//     const posts = await sql`
//       SELECT p.id, p.title, p.content, p.user_id, u.name AS author, p.created_at,
//              p.tourist_place_id, tp.name AS tourist_place_name,
//              l.name AS location_name, tp.longitude, tp.latitude,
//              COALESCE(
//                (SELECT ARRAY_AGG(json_build_object('url', i.url, 'public_id', i.public_id))
//                 FROM (
//                   SELECT DISTINCT i.url, i.public_id
//                   FROM images i
//                   WHERE i.entity_type = 'post' AND i.entity_id = p.id
//                 ) i
//                 WHERE i.url IS NOT NULL),
//                ARRAY[]::json[]
//              ) AS images,
//              COALESCE(
//                (SELECT ARRAY_AGG(json_build_object('id', c.id, 'name', c.name))
//                 FROM (
//                   SELECT DISTINCT c.id, c.name
//                   FROM post_categories pc
//                   JOIN categories c ON pc.category_id = c.id
//                   WHERE pc.post_id = p.id
//                 ) c
//                 WHERE c.id IS NOT NULL),
//                ARRAY[]::json[]
//              ) AS categories
//       FROM posts p
//       JOIN users u ON p.user_id = u.id
//       JOIN tourist_places tp ON p.tourist_place_id = tp.id
//       JOIN locations l ON tp.location_id = l.id
//       GROUP BY p.id, p.title, p.content, p.user_id, u.name, p.created_at,
//                p.tourist_place_id, tp.name, l.name, tp.longitude, tp.latitude
//     `;
//     res.status(200).json({
//       success: true,
//       data: posts,
//     });
//   } catch (error) {
//     console.error("Lỗi khi lấy danh sách bài viết:", error.stack);
//     res.status(500).json({ error: "Lỗi server" });
//   }
// };


export const getAllPosts = async (req, res) => {
  try {
    const posts = await sql`
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
        COALESCE(
          ARRAY_AGG(
            json_build_object('url', i.url, 'public_id', i.public_id)
          ) FILTER (WHERE i.url IS NOT NULL),
          ARRAY[]::json[]
        ) AS images,
        COALESCE(
          ARRAY_AGG(
            json_build_object('id', c.id, 'name', c.name)
          ) FILTER (WHERE c.id IS NOT NULL),
          ARRAY[]::json[]
        ) AS categories
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN tourist_places tp ON p.tourist_place_id = tp.id
      JOIN locations l ON tp.location_id = l.id
      LEFT JOIN images i ON i.entity_type = 'post' AND i.entity_id = p.id
      LEFT JOIN post_categories pc ON pc.post_id = p.id
      LEFT JOIN categories c ON pc.category_id = c.id
      GROUP BY p.id, u.name, tp.name, l.name, tp.longitude, tp.latitude
    `;
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


// Cập nhật tương tự cho addPost
// export const addPost = async (req, res) => {
//   const { title, content, user_id, tourist_place_id, category_ids } = req.body;
//   if (!title || !content || !user_id || !tourist_place_id || !category_ids) {
//     return res.status(400).json({
//       success: false,
//       error: "Thiếu thông tin cần thiết",
//     });
//   }
//   try {
//     const categories = Array.isArray(category_ids)
//       ? category_ids
//       : JSON.parse(category_ids);

//     const post = await sql`
//       INSERT INTO posts (title, content, user_id, tourist_place_id)
//       VALUES (${title}, ${content}, ${user_id}, ${tourist_place_id})
//       RETURNING id, title, content, user_id, tourist_place_id, created_at
//     `;

//     const imageInserts = [];
//     if (req.files && req.files.length > 0) {
//       const imageResults = await Promise.all(
//         req.files.map(file =>
//           uploadImageCloudinary(file, "tourism_posts").catch(error => {
//             console.error("Lỗi khi upload hình ảnh:", error);
//             return null;
//           })
//         )
//       );
//       imageResults.forEach(result => {
//         if (result) {
//           imageInserts.push(
//             sql`
//               INSERT INTO images (url, public_id, entity_type, entity_id)
//               VALUES (${result.secure_url}, ${result.public_id}, 'post', ${post[0].id})
//             `
//           );
//         }
//       });
//       if (imageInserts.length > 0) {
//         await Promise.all(imageInserts);
//       }
//     }

//     const categoryInserts = categories.map(category_id =>
//       sql`
//         INSERT INTO post_categories (post_id, category_id)
//         VALUES (${post[0].id}, ${category_id})
//       `
//     );
//     if (categoryInserts.length > 0) {
//       await Promise.all(categoryInserts);
//     }

//     const postWithDetails = await sql`
//       SELECT p.id, p.title, p.content, p.user_id, u.name AS author, 
//              p.tourist_place_id, tp.name AS tourist_place_name, 
//              l.name AS location_name, tp.longitude, tp.latitude,
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
//       JOIN tourist_places tp ON p.tourist_place_id = tp.id
//       JOIN locations l ON tp.location_id = l.id
//       LEFT JOIN images i ON i.entity_type = 'post' AND i.entity_id = p.id
//       LEFT JOIN post_categories pc ON pc.post_id = p.id
//       LEFT JOIN categories c ON pc.category_id = c.id
//       WHERE p.id = ${post[0].id}
//       GROUP BY p.id, u.name, tp.name, l.name, tp.longitude, tp.latitude
//     `;
//     res.status(201).json({
//       success: true,
//       data: postWithDetails[0],
//     });
//   } catch (error) {
//     console.error("Lỗi khi thêm bài viết:", error.stack);
//     res.status(500).json({ error: "Lỗi server" });
//   }
// };




import sanitizeHtml from 'sanitize-html';


import logger from '../utils/logger.js';

export const addPost = async (req, res) => {
  const { title, content, user_id, touristPlaces, categories, imageIds } = req.body;

  // if (!title || !content || !user_id || !touristPlaces || !categories) {
  //   return res.status(400).json({
  //     success: false,
  //     error: 'Thiếu thông tin cần thiết',
  //   });
  // }
  console.log('Request body:', req.body);
  if (!title || !content || !user_id || !touristPlaces || !categories) {
      console.log('Missing fields:', {
          title: !title,
          content: !content,
          user_id: !user_id,
          touristPlaces: !touristPlaces,
          categories: !categories
      });
      return res.status(400).json({
          success: false,
          error: 'Thiếu thông tin thiết cần'
      });
  }
  try {
    const categoryIds = Array.isArray(categories)
      ? categories.map(c => c.value)
      : JSON.parse(categories).map(c => c.value);

    const cleanedContent = sanitizeHtml(content, {
      allowedTags: ['p', 'img', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
      allowedAttributes: { img: ['src', 'alt'] },
    });

    const post = await sql`
      INSERT INTO posts (title, content, user_id)
      VALUES (${title}, ${cleanedContent}, ${user_id})
      RETURNING id, title, content, user_id, created_at
    `;

    const touristPlaceInserts = [];
    for (const place of touristPlaces) {
      let touristPlaceId;
      const existingPlace = await sql`
        SELECT id FROM tourist_places 
        WHERE latitude = ${place.lat} AND longitude = ${place.lng}
      `;
      if (existingPlace.length > 0) {
        touristPlaceId = existingPlace[0].id;
      } else {
        const newPlace = await sql`
          INSERT INTO tourist_places (name, latitude, longitude, location_id)
          VALUES (${place.name}, ${place.lat}, ${place.lng}, 1)
          RETURNING id
        `;
        touristPlaceId = newPlace[0].id;
      }
      touristPlaceInserts.push(sql`
        INSERT INTO post_tourist_places (post_id, tourist_place_id)
        VALUES (${post[0].id}, ${touristPlaceId})
      `);
    }
    await Promise.all(touristPlaceInserts);

    if (imageIds && imageIds.length > 0) {
      await Promise.all(imageIds.map(id => sql`
        UPDATE images
        SET entity_type = 'post', entity_id = ${post[0].id}
        WHERE id = ${id}
      `));
    }

    const categoryInserts = categoryIds.map(category_id => sql`
      INSERT INTO post_categories (post_id, category_id)
      VALUES (${post[0].id}, ${category_id})
    `);
    if (categoryInserts.length > 0) {
      await Promise.all(categoryInserts);
    }

    const postWithDetails = await sql`
      SELECT p.id, p.title, p.content, p.user_id, u.name AS author,
             COALESCE(
               ARRAY_AGG(json_build_object('id', tp.id, 'name', tp.name, 'latitude', tp.latitude, 'longitude', tp.longitude)) 
               FILTER (WHERE tp.id IS NOT NULL),
               ARRAY[]::json[]
             ) AS tourist_places,
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
      LEFT JOIN post_tourist_places ptp ON p.id = ptp.post_id
      LEFT JOIN tourist_places tp ON ptp.tourist_place_id = tp.id
      LEFT JOIN images i ON i.entity_type = 'post' AND i.entity_id = p.id
      LEFT JOIN post_categories pc ON pc.post_id = p.id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.id = ${post[0].id}
      GROUP BY p.id, u.name
    `;

    res.status(201).json({
      success: true,
      data: postWithDetails[0],
    });
  } catch (error) {
    logger.error(`Add post error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error',
    });
  }
};



// export const addPost = async (req, res) => {
//   const { title, content, user_id, category_ids, tourist_place, images } = req.body;
//   if (!title || !content || !user_id || !category_ids || !tourist_place) {
//     return res.status(400).json({
//       success: false,
//       error: 'Thiếu thông tin cần thiết',
//     });
//   }

//   try {
//     // 1. Kiểm tra/tạo location
//     let location_id;
//     const { name, lat, lng, location_name } = tourist_place;
//     const existingLocation = await sql`
//       SELECT id FROM locations WHERE name = ${location_name} LIMIT 1
//     `;
//     if (existingLocation.length > 0) {
//       location_id = existingLocation[0].id;
//     } else {
//       const newLoc = await sql`
//         INSERT INTO locations (name) VALUES (${location_name}) RETURNING id
//       `;
//       location_id = newLoc[0].id;
//     }

//     // 2. Kiểm tra/tạo tourist_place
//     let tourist_place_id;
//     const existingPlace = await sql`
//       SELECT id FROM tourist_places
//       WHERE name = ${name} AND latitude = ${lat} AND longitude = ${lng} AND location_id = ${location_id}
//       LIMIT 1
//     `;
//     if (existingPlace.length > 0) {
//       tourist_place_id = existingPlace[0].id;
//     } else {
//       const newPlace = await sql`
//         INSERT INTO tourist_places (name, location_id, latitude, longitude)
//         VALUES (${name}, ${location_id}, ${lat}, ${lng})
//         RETURNING id
//       `;
//       tourist_place_id = newPlace[0].id;
//     }

//     // 3. Tạo post
//     const post = await sql`
//       INSERT INTO posts (title, content, user_id, tourist_place_id)
//       VALUES (${title}, ${content}, ${user_id}, ${tourist_place_id})
//       RETURNING id, title, content, user_id, tourist_place_id, created_at
//     `;

//     // 4. Lưu url ảnh vào bảng images
//     if (images && Array.isArray(images)) {
//       await Promise.all(
//         images.map(url =>
//           sql`
//             INSERT INTO images (url, public_id, entity_type, entity_id)
//             VALUES (${url}, '', 'post', ${post[0].id})
//           `
//         )
//       );
//     }

//     // 5. Lưu category
//     const categories = Array.isArray(category_ids)
//       ? category_ids
//       : JSON.parse(category_ids);

//     const categoryInserts = categories.map(category_id =>
//       sql`
//         INSERT INTO post_categories (post_id, category_id)
//         VALUES (${post[0].id}, ${category_id})
//       `
//     );
//     if (categoryInserts.length > 0) {
//       await Promise.all(categoryInserts);
//     }

//     // 6. Trả về post mới (giữ nguyên như cũ)
//     const postWithDetails = await sql`
//       SELECT p.id, p.title, p.content, p.user_id, u.name AS author, 
//              p.tourist_place_id, tp.name AS tourist_place_name, 
//              l.name AS location_name, tp.longitude, tp.latitude,
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
//       JOIN tourist_places tp ON p.tourist_place_id = tp.id
//       JOIN locations l ON tp.location_id = l.id
//       LEFT JOIN images i ON i.entity_type = 'post' AND i.entity_id = p.id
//       LEFT JOIN post_categories pc ON pc.post_id = p.id
//       LEFT JOIN categories c ON pc.category_id = c.id
//       WHERE p.id = ${post[0].id}
//       GROUP BY p.id, u.name, tp.name, l.name, tp.longitude, tp.latitude
//     `;
//     res.status(201).json({
//       success: true,
//       data: postWithDetails[0],
//     });
//   } catch (error) {
//     console.error('Lỗi khi thêm bài viết:', error.stack);
//     res.status(500).json({
//       success: false,
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Lỗi server',
//     });
//   }
// };
export const getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await sql`
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
        COALESCE(
          ARRAY_AGG(
            json_build_object('url', i.url, 'public_id', i.public_id)
          ) FILTER (WHERE i.url IS NOT NULL),
          ARRAY[]::json[]
        ) AS images,
        COALESCE(
          ARRAY_AGG(
            json_build_object('id', c.id, 'name', c.name)
          ) FILTER (WHERE c.id IS NOT NULL),
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
      GROUP BY p.id, u.name, tp.name, l.name, tp.longitude, tp.latitude
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
    });
  } catch (error) {
    console.error('Lỗi khi lấy bài viết:', error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Lỗi server nội bộ',
    });
  }
};