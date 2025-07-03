import requests
import json
import time
import random
from datetime import datetime
import os

class AutoEvaluationSystem:
    def __init__(self, base_url="http://localhost:5000/api/posts"):
        self.base_url = base_url
        self.results_log = []
    
    def evaluate_search_quality(self, num_tests=50):
        """Tự động đánh giá chất lượng tìm kiếm"""
        print(f"Starting automatic evaluation with {num_tests} tests...")
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'total_tests': num_tests,
            'metrics': {
                'precision_at_5': [],
                'precision_at_10': [],
                'response_times': [],
                'similarity_scores': []
            }
        }
        
        for i in range(num_tests):
            try:
                # Lấy random image từ database để làm query
                test_result = self.run_single_test()
                
                if test_result:
                    results['metrics']['precision_at_5'].append(test_result['precision_at_5'])
                    results['metrics']['precision_at_10'].append(test_result['precision_at_10'])
                    results['metrics']['response_times'].append(test_result['response_time'])
                    results['metrics']['similarity_scores'].extend(test_result['top_similarities'])
                
                print(f"Test {i+1}/{num_tests} completed")
                time.sleep(0.5)  # Tránh overload server
                
            except Exception as e:
                print(f"Test {i+1} failed: {e}")
                continue
        
        # Tính toán metrics tổng hợp
        summary = self.calculate_summary_metrics(results['metrics'])
        results['summary'] = summary
        
        # Lưu kết quả
        self.save_results(results)
        return results
    
    def run_single_test(self):
        """Chạy một test đơn lẻ"""
        # Lấy danh sách file ảnh thực tế trong thư mục test_images
        image_dir = "test_images"
        image_files = [f for f in os.listdir(image_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if not image_files:
            raise Exception("No test images found in test_images/")

        # Chọn ngẫu nhiên một file ảnh
        test_image_file = random.choice(image_files)
        test_image_path = os.path.join(image_dir, test_image_file)
        
        start_time = time.time()
        
        try:
            # Bước 1: Gửi ảnh lên Flask API để trích xuất features
        with open(test_image_path, 'rb') as f:
            files = {'image': f}
                extract_response = requests.post("http://localhost:5001/extract", files=files)
            
            if extract_response.status_code != 200:
                print(f"[ERROR] Flask API failed for {test_image_file}: {extract_response.status_code}")
                return None
            
            features = extract_response.json()['features']
            
            # Bước 2: Gửi features lên backend Node.js để tìm kiếm
            search_data = {'features': features}
            search_response = requests.post(f"{self.base_url}/search-posts-by-image", json=search_data)
        
        response_time = time.time() - start_time
        
            if search_response.status_code == 200:
                result = search_response.json()['data']
                print(f"[DEBUG] API result for {test_image_file}:", result)  # Log kết quả trả về
            
            # Đánh giá chất lượng kết quả
                top_similarities = [float(r['similarity']) for r in result[:10]]
            
                # Tính precision (giả định: similarity > 0.5 là relevant)
                relevant_threshold = 0.5
            precision_at_5 = sum(1 for s in top_similarities[:5] if s > relevant_threshold) / 5
            precision_at_10 = sum(1 for s in top_similarities if s > relevant_threshold) / 10
            
            return {
                'precision_at_5': precision_at_5,
                'precision_at_10': precision_at_10,
                'response_time': response_time,
                'top_similarities': top_similarities
            }
            else:
                print(f"[ERROR] Backend API failed for {test_image_file}: {search_response.status_code}")
                return None
        
        except Exception as e:
            print(f"[ERROR] Exception for {test_image_file}: {e}")
        return None
    
    def calculate_summary_metrics(self, metrics):
        """Tính toán metrics tổng hợp"""
        import numpy as np

        avg_precision_at_5 = np.mean(metrics['precision_at_5']) if metrics['precision_at_5'] else 0
        avg_precision_at_10 = np.mean(metrics['precision_at_10']) if metrics['precision_at_10'] else 0
        avg_response_time = np.mean(metrics['response_times']) if metrics['response_times'] else 0
        avg_similarity_score = np.mean(metrics['similarity_scores']) if metrics['similarity_scores'] else 0
        min_similarity = np.min(metrics['similarity_scores']) if metrics['similarity_scores'] else None
        max_similarity = np.max(metrics['similarity_scores']) if metrics['similarity_scores'] else None
        response_time_95th = np.percentile(metrics['response_times'], 95) if metrics['response_times'] else None
        total_successful_tests = len(metrics['precision_at_5'])
        
        return {
            'avg_precision_at_5': avg_precision_at_5,
            'avg_precision_at_10': avg_precision_at_10,
            'avg_response_time': avg_response_time,
            'avg_similarity_score': avg_similarity_score,
            'min_similarity': min_similarity,
            'max_similarity': max_similarity,
            'response_time_95th': response_time_95th,
            'total_successful_tests': total_successful_tests
        }
    
    def save_results(self, results):
        """Lưu kết quả đánh giá"""
        filename = f"evaluation_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"Results saved to {filename}")
    
    def generate_report(self, results):
        """Tạo báo cáo đánh giá"""
        summary = results['summary']
        
        def fmt(val):
            return f"{val:.3f}" if isinstance(val, (int, float)) and val is not None else (str(val) if val is not None else "N/A")

        report = f"""
=== IMAGE SEARCH ACCURACY EVALUATION REPORT ===
Timestamp: {results['timestamp']}
Total Tests: {results['total_tests']}
Successful Tests: {summary['total_successful_tests']}

PRECISION METRICS:
- Average Precision@5: {fmt(summary['avg_precision_at_5'])}
- Average Precision@10: {fmt(summary['avg_precision_at_10'])}

SIMILARITY METRICS:
- Average Similarity Score: {fmt(summary['avg_similarity_score'])}
- Min Similarity: {fmt(summary['min_similarity'])}
- Max Similarity: {fmt(summary['max_similarity'])}

PERFORMANCE METRICS:
- Average Response Time: {fmt(summary['avg_response_time'])}s
- 95th Percentile Response Time: {fmt(summary['response_time_95th'])}s

QUALITY ASSESSMENT:
- Precision@5 >= 0.8: {'✓ EXCELLENT' if summary['avg_precision_at_5'] is not None and summary['avg_precision_at_5'] >= 0.8 else '✗ NEEDS IMPROVEMENT'}
- Precision@10 >= 0.7: {'✓ GOOD' if summary['avg_precision_at_10'] is not None and summary['avg_precision_at_10'] >= 0.7 else '✗ NEEDS IMPROVEMENT'}
- Response Time < 1s: {'✓ FAST' if summary['avg_response_time'] is not None and summary['avg_response_time'] < 1.0 else '✗ SLOW'}
"""
        
        print(report)
        return report

if __name__ == "__main__":
    evaluator = AutoEvaluationSystem()
    
    # Chạy đánh giá tự động
    results = evaluator.evaluate_search_quality(num_tests=20)
    
    # Tạo báo cáo
    report = evaluator.generate_report(results)
    
    # Lưu báo cáo
    with open(f"evaluation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt", 'w', encoding='utf-8') as f:
        f.write(report)