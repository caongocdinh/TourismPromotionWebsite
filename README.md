
---

## 2. Hướng dẫn cài đặt

### 2.1. Backend (Node.js)

```bash
cd backend
npm install
npm start
# Mặc định chạy ở http://localhost:5000
```

- Cấu hình database trong `backend/config/db.js`
- Các API chính: `/api/posts`, `/api/images`, `/api/posts/search-posts-by-image`, ...

### 2.2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
# Mặc định chạy ở http://localhost:5173
```

- Sửa file `.env` (nếu có) để trỏ đúng API backend

### 2.3. Python Service (Flask)

```bash
cd python_service
pip install -r requirements.txt
python image_feature_service.py
# Mặc định chạy ở http://localhost:5001
```

- Service này dùng để trích xuất đặc trưng ảnh (feature vector) phục vụ tìm kiếm ảnh tương tự.

---

## 3. Chức năng tìm kiếm hình ảnh

### Luồng hoạt động:
1. Người dùng upload ảnh lên frontend.
2. Ảnh được gửi tới Flask API (`/extract`) để trích xuất feature vector.
3. Frontend gửi feature vector lên backend Node.js (`/api/posts/search-posts-by-image`).
4. Backend so sánh vector với database, trả về các bài viết/ảnh tương tự.

### Đánh giá độ chính xác mô hình:
- Sử dụng script:  
  ```bash
  cd python_service
  python accuracy_test.py
  ```
- Kết quả sẽ được lưu ra file và in ra màn hình.

---

## 4. Đánh giá mô hình tự động

- Chạy script:
  ```bash
  python auto_evaluation.py
  ```
- Script sẽ tự động lấy ảnh trong `python_service/test_images/`, gửi lên Flask API để trích xuất đặc trưng, sau đó gửi lên backend để tìm kiếm và đánh giá các chỉ số như precision, recall, response time, ...

---

## 5. Một số lưu ý

- Đảm bảo các service (backend, frontend, flask) đều đang chạy đúng cổng.
- Ảnh test trong `python_service/test_images/` nên trùng với ảnh đã upload vào hệ thống để có kết quả đánh giá chính xác.
- Có thể cần chỉnh sửa các URL hoặc cổng trong code cho phù hợp với môi trường thực tế.

---

## 6. Liên hệ & đóng góp

- Nếu có lỗi hoặc muốn đóng góp, hãy tạo issue hoặc pull request trên repository này.

---

**Chúc bạn sử dụng và phát triển hệ thống hiệu quả!**
