-- Bảng User
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'user',
    password VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    avt VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Category
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Bảng Location
CREATE TABLE IF NOT EXISTS locations (
    location_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

-- Bảng TouristPlace
CREATE TABLE IF NOT EXISTS tourist_places (
    tourist_place_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    longitude FLOAT,
    latitude FLOAT,
    location_id INT,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE SET NULL
);

-- Bảng Article
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT,
    status VARCHAR(50),
    user_id INT,
    tourist_place_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (tourist_place_id) REFERENCES tourist_places(tourist_place_id) ON DELETE SET NULL
);

-- Bảng Image
CREATE TABLE IF NOT EXISTS images (
    image_id SERIAL PRIMARY KEY,
    imageUrl TEXT NOT NULL,
    article_id INT,
    tourist_place_id INT,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL,
    FOREIGN KEY (tourist_place_id) REFERENCES tourist_places(tourist_place_id) ON DELETE SET NULL
);

-- Bảng ImageVector (lưu vector đặc trưng của hình ảnh)
CREATE TABLE IF NOT EXISTS image_vectors (
    image_vector_id SERIAL PRIMARY KEY,
    vector_image FLOAT[] NOT NULL,
    image_id INT,
    FOREIGN KEY (image_id) REFERENCES images(image_id) ON DELETE CASCADE
);

-- Bảng Comment
CREATE TABLE IF NOT EXISTS comments (
    comment_id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    user_id INT,
    article_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);