import requests

BASE_URL = "http://localhost:8000/api"

def test_get_me_unauthenticated():
    response = requests.get(f"{BASE_URL}/auth/me")
    assert response.status_code == 401