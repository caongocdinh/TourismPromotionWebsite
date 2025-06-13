from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import psycopg2
from psycopg2.extras import execute_values
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing import image
import numpy as np
from io import BytesIO
from PIL import Image as PILImage
import os

app = FastAPI()
model = MobileNetV2(weights='imagenet', include_top=False, pooling='avg')

# Kết nối PostgreSQL
conn = psycopg2.connect(
    dbname="tourism",
    user="tourism_owner",
    password="npg_pK9h5VfmsYCF",
    host="ep-frosty-fire-a8ypnb73-pooler.eastus2.azure.neon.tech",
    sslmode="require"
)
cur = conn.cursor()

def extract_features(img_bytes):
    img = PILImage.open(BytesIO(img_bytes)).convert('RGB')
    img = img.resize((224, 224), PILImage.LANCZOS)
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    features = model.predict(x)
    return features.flatten().tolist()

@app.post("/extract-features")
async def extract_features_api(file: UploadFile = File(...)):
    try:
        img_bytes = await file.read()
        features = extract_features(img_bytes)
        return JSONResponse(content={"features": features})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/preprocess-dataset")
async def preprocess_dataset(dataset_path: str):
    try:
        image_paths = [os.path.join(dataset_path, f) for f in os.listdir(dataset_path) if f.endswith(('.png', '.jpg', '.jpeg'))]
        features_data = []
        for img_path in image_paths:
            with open(img_path, 'rb') as f:
                img_bytes = f.read()
                features = extract_features(img_bytes)
                features_data.append((img_path, features))
        return JSONResponse(content={"features_data": features_data})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.on_event("shutdown")
def shutdown_event():
    cur.close()
    conn.close()