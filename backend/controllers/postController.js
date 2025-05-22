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


export const addPost = async (req, res) => {
  const { title, content, user_id, tourist_place_id, category_ids } = req.body;

  if (!title || !content || !user_id || !tourist_place_id || !category_ids) {
    return res.status(400).json({
      success: false,
      error: "Thiếu thông tin cần thiết",
    });
  }

  let categories;
  try {
    categories = Array.isArray(category_ids)
      ? category_ids
      : JSON.parse(category_ids);
  } catch {
    return res.status(400).json({
      success: false,
      error: "Danh sách category không hợp lệ",
    });
  }

  try {
    console.log("🧾 Raw content:", content);

    // Làm sạch ban đầu để tránh tag độc hại
    let cleanedContent = sanitizeHtml(content, {
      allowedTags: ['p', 'img', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
      allowedAttributes: {
        img: ['src', 'alt'],
      },
    });

    console.log("🧼 Cleaned content:", cleanedContent);

    // Tạo bài viết trước để có ID
    const [post] = await sql`
      INSERT INTO posts (title, content, user_id, tourist_place_id)
      VALUES (${title}, ${cleanedContent}, ${user_id}, ${tourist_place_id})
      RETURNING id, title, content, user_id, tourist_place_id, created_at
    `;

    let updatedContent = cleanedContent;
    const imageInserts = [];

    if (req.files && req.files.length > 0) {
      const imageResults = await Promise.all(
        req.files.map(file =>
          uploadImageCloudinary(file, "tourism_posts").catch(err => {
            console.error("❌ Upload ảnh thất bại:", err);
            return null;
          })
        )
      );

      imageResults.forEach((result, index) => {
        if (result) {
          const placeholder = `[image:${index}]`;
          const regex = new RegExp(`<img[^>]*src=["']${placeholder}["'][^>]*>`, 'g');

          updatedContent = updatedContent.replace(
            regex,
            `<img src="${result.secure_url}?w=800&q=80" alt="Image ${index}" />`
          );

          imageInserts.push(sql`
            INSERT INTO images (url, public_id, entity_type, entity_id)
            VALUES (${result.secure_url}, ${result.public_id}, 'post', ${post.id})
          `);
        }
      });

      if (imageInserts.length > 0) {
        await Promise.all(imageInserts);
      }

      // Làm sạch lại lần cuối để tránh rủi ro
      updatedContent = sanitizeHtml(updatedContent, {
        allowedTags: ['p', 'img', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
        allowedAttributes: {
          img: ['src', 'alt'],
        },
        allowedSchemes: ['http', 'https'],
      });

      // Cập nhật lại nội dung đã thay hình vào DB
      await sql`
        UPDATE posts SET content = ${updatedContent} WHERE id = ${post.id}
      `;
    }

    // Gán danh mục
    if (categories.length > 0) {
      const categoryInserts = categories.map(category_id =>
        sql`
          INSERT INTO post_categories (post_id, category_id)
          VALUES (${post.id}, ${category_id})
        `
      );
      await Promise.all(categoryInserts);
    }

    // Lấy chi tiết bài viết đã thêm
    const [postWithDetails] = await sql`
      SELECT 
        p.id, p.title, p.content, p.user_id, u.name AS author,
        p.tourist_place_id, tp.name AS tourist_place_name,
        l.name AS location_name, tp.longitude, tp.latitude,
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
      WHERE p.id = ${post.id}
      GROUP BY p.id, u.name, tp.name, l.name, tp.longitude, tp.latitude
    `;

    res.status(201).json({
      success: true,
      data: postWithDetails,
    });
  } catch (error) {
    console.error("🔥 Lỗi khi thêm bài viết:", error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : "Lỗi server",
    });
  }
};


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