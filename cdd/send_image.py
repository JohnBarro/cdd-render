import requests

url = "http://127.0.0.1:8000/predict/"
file_path = "data/data/data/test/Coccidiosis/cocci.0.jpg_aug36.JPG"  # Change this to your image file

with open(file_path, "rb") as file:
    files = {"file": file}
    response = requests.post(url, files=files)

print(response.json())  # Print the result
