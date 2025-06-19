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
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB').resize((224, 224), Image.LANCZOS)
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