from flask import Flask, request, jsonify
from PIL import Image
import io
import numpy as np
import tensorflow as tf
from flask_cors import CORS
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

# Load model MobileNetV2 pretrained, bỏ lớp phân loại cuối cùng
# model = tf.keras.applications.MobileNetV2(weights='imagenet', include_top=False, pooling='avg')
model = tf.keras.applications.MobileNetV2(
    weights='imagenet',
    include_top=False,
    pooling='avg',
    input_shape=(224, 224, 3)
)

model.trainable = False
def preprocess_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB').resize((224, 224))
    arr = np.array(img)
    arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)
    return np.expand_dims(arr, axis=0)

@app.route('/extract', methods=['POST'])
def extract():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    image = request.files['image'].read()
    arr = preprocess_image(image)
    features = model.predict(arr)[0].tolist()
    # print(features)
    return jsonify({'features': features})
    

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)

# from flask import Flask, request, jsonify
# from PIL import Image
# import io
# import numpy as np
# import tensorflow as tf
# import warnings

# # Tắt cảnh báo TensorFlow và FutureWarning
# warnings.filterwarnings('ignore', category=FutureWarning)
# tf.get_logger().setLevel('ERROR')

# app = Flask(__name__)

# # Tải model với cấu hình tối ưu
# model = tf.keras.applications.MobileNetV2(
#     weights='imagenet',
#     include_top=False,
#     pooling='avg',
#     input_shape=(224, 224, 3)
# )
# # Đóng băng model để tối ưu hiệu suất
# model.trainable = False

# def preprocess_image(image_bytes):
#     """Tiền xử lý ảnh đầu vào"""
#     img = Image.open(io.BytesIO(image_bytes)).convert('RGB').resize((224, 224))
#     arr = np.array(img)
#     # Sử dụng preprocess_input phù hợp với MobileNetV2
#     arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)
#     return np.expand_dims(arr, axis=0)

# @app.route('/extract', methods=['POST'])
# def extract():
#     """API trích xuất đặc trưng ảnh"""
#     if 'image' not in request.files:
#         return jsonify({'error': 'No image uploaded'}), 400
    
#     try:
#         image = request.files['image'].read()
#         arr = preprocess_image(image)
#         # Sử dụng predict với batch_size xác định
#         features = model.predict(arr, batch_size=1)[0].tolist()
#         return jsonify({'features': features})
    
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500

# if __name__ == '__main__':
#     # Chạy server với multithreading
#     app.run(host='0.0.0.0', port=5001, threaded=True)


# from fastapi import FastAPI, File, UploadFile
# from fastapi.responses import JSONResponse
# import psycopg2
# from psycopg2.extras import execute_values
# from tensorflow.keras.applications import MobileNetV2
# from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
# from tensorflow.keras.preprocessing import image
# import numpy as np
# from io import BytesIO
# from PIL import Image as PILImage
# import os

# app = FastAPI()
# model = MobileNetV2(weights='imagenet', include_top=False, pooling='avg')

# # Kết nối PostgreSQL
# conn = psycopg2.connect(
#     dbname="tourism",
#     user="tourism_owner",
#     password="npg_pK9h5VfmsYCF",
#     host="ep-frosty-fire-a8ypnb73-pooler.eastus2.azure.neon.tech",
#     sslmode="require"
# )
# cur = conn.cursor()

# def extract_features(img_bytes):
#     img = PILImage.open(BytesIO(img_bytes)).convert('RGB')
#     img = img.resize((224, 224))
#     x = image.img_to_array(img)
#     x = np.expand_dims(x, axis=0)
#     x = preprocess_input(x)
#     features = model.predict(x)
#     return features.flatten().tolist()

# @app.post("/extract-features")
# async def extract_features_api(file: UploadFile = File(...)):
#     try:
#         img_bytes = await file.read()
#         features = extract_features(img_bytes)
#         return JSONResponse(content={"features": features})
#     except Exception as e:
#         return JSONResponse(content={"error": str(e)}, status_code=500)

# @app.post("/preprocess-dataset")
# async def preprocess_dataset(dataset_path: str):
#     try:
#         image_paths = [os.path.join(dataset_path, f) for f in os.listdir(dataset_path) if f.endswith(('.png', '.jpg', '.jpeg'))]
#         features_data = []
#         for img_path in image_paths:
#             with open(img_path, 'rb') as f:
#                 img_bytes = f.read()
#                 features = extract_features(img_bytes)
#                 features_data.append((img_path, features))
#         return JSONResponse(content={"features_data": features_data})
#     except Exception as e:
#         return JSONResponse(content={"error": str(e)}, status_code=500)

# @app.on_event("shutdown")
# def shutdown_event():
#     cur.close()
#     conn.close()