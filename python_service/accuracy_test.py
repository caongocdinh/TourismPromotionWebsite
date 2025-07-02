import requests
import json
import numpy as np
from PIL import Image
import io
import os

class ImageSearchAccuracyTester:
    def __init__(self, extract_url="http://localhost:5001/extract", 
                 search_url="http://localhost:5002/search",
                 evaluate_url="http://localhost:5002/evaluate"):
        self.extract_url = extract_url
        self.search_url = search_url
        self.evaluate_url = evaluate_url
    
    def extract_features(self, image_path):
        """Trích xuất features từ ảnh"""
        with open(image_path, 'rb') as f:
            files = {'image': f}
            response = requests.post(self.extract_url, files=files)
            return response.json()['features']
    
    def search_similar(self, features, k=10):
        """Tìm kiếm ảnh tương tự"""
        data = {'features': features, 'k': k}
        response = requests.post(self.search_url, json=data)
        return response.json()
    
    def evaluate_with_ground_truth(self, query_image, relevant_images, k_values=[5, 10, 20]):
        """Đánh giá độ chính xác với ground truth"""
        # Extract features từ query image
        features = self.extract_features(query_image)
        
        # Gọi API evaluate
        data = {
            'features': features,
            'relevant_images': relevant_images,
            'k_values': k_values
        }
        response = requests.post(self.evaluate_url, json=data)
        return response.json()
    
    def run_batch_evaluation(self, test_cases):
        """Chạy đánh giá trên nhiều test cases"""
        all_results = []
        
        for i, test_case in enumerate(test_cases):
            print(f"Testing case {i+1}/{len(test_cases)}: {test_case['query_image']}")
            
            try:
                result = self.evaluate_with_ground_truth(
                    test_case['query_image'],
                    test_case['relevant_images']
                )
                result['test_case'] = test_case['name']
                all_results.append(result)
                
            except Exception as e:
                print(f"Error in test case {i+1}: {e}")
                continue
        
        return self.calculate_average_metrics(all_results)
    
    def calculate_average_metrics(self, results):
        """Tính trung bình các metrics"""
        if not results:
            return {}
        
        k_values = list(results[0]['evaluation_results'].keys())
        avg_metrics = {}
        
        for k in k_values:
            metrics = ['precision_at_k', 'recall_at_k', 'f1_score', 'map_score']
            avg_metrics[k] = {}
            
            for metric in metrics:
                values = [r['evaluation_results'][k][metric] for r in results]
                avg_metrics[k][metric] = np.mean(values)
                avg_metrics[k][f'{metric}_std'] = np.std(values)
        
        return {
            'average_metrics': avg_metrics,
            'total_test_cases': len(results),
            'individual_results': results
        }

# Ví dụ sử dụng
def create_test_cases():
    """Tạo test cases mẫu"""
    return [
        {
            'name': 'Beach Query',
            'query_image': 'test_images/beach1.jpg',
            'relevant_images': [101, 102, 103, 104, 105]  # IDs của ảnh beach tương tự
        },
        {
            'name': 'Mountain Query', 
            'query_image': 'test_images/mountain1.jpg',
            'relevant_images': [201, 202, 203, 204]  # IDs của ảnh mountain tương tự
        },
        {
            'name': 'City Query',
            'query_image': 'test_images/city1.jpg', 
            'relevant_images': [301, 302, 303, 304, 305, 306]  # IDs của ảnh city tương tự
        }
    ]

if __name__ == "__main__":
    tester = ImageSearchAccuracyTester()
    
    # Test đơn lẻ
    print("=== Single Test ===")
    result = tester.evaluate_with_ground_truth(
        'test_images/sample.jpg',
        [1, 2, 3, 4, 5],  # Ground truth IDs
        [5, 10, 20]
    )
    print(json.dumps(result, indent=2))
    
    # Test batch
    print("\n=== Batch Test ===")
    test_cases = create_test_cases()
    batch_results = tester.run_batch_evaluation(test_cases)
    print(json.dumps(batch_results['average_metrics'], indent=2))