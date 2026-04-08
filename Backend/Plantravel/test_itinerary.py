import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Plantravel.settings')
django.setup()

from django.test import RequestFactory
from app.views import GenerateItineraryView
from app.models import User

# Create a test user
user, created = User.objects.get_or_create(username='tester', email='test@test.com')
if created:
    user.set_password('password')
    user.save()

factory = RequestFactory()
data = {
    "destination": "Kathmandu",
    "start_date": "2026-05-10",
    "end_date": "2026-05-20",
    "budget": 50000,
    "group_size": "Solo Explorer"
}

from rest_framework.test import force_authenticate

request = factory.post('/api/trips/generate-itinerary/', data, content_type='application/json')
force_authenticate(request, user=user)

print("Triggering GenerateItineraryView...")
view = GenerateItineraryView.as_view()
response = view(request)

print(f"Status Code: {response.status_code}")
print("Response Data:")
print(json.dumps(response.data, indent=2))
