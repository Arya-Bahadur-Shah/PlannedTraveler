from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Trip, Expense

User = get_user_model()

class BackendEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@test.com', password='testpassword123')
        # Login
        response = self.client.post('/api/login/', {'username': 'testuser', 'password': 'testpassword123'})
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        
        self.trip = Trip.objects.create(
            user=self.user,
            destination="Pokhara",
            start_date="2026-06-01",
            end_date="2026-06-05",
            budget=20000
        )

    def test_user_profile(self):
        url = reverse('profile-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_analytics_endpoint(self):
        url = reverse('analytics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res_data = response.data
        self.assertEqual(res_data['total_trips'], 1)
        self.assertEqual(res_data['total_spent'], 0)

    def test_create_expense(self):
        url = reverse('expense-list')
        data = {
            "trip": self.trip.id,
            "amount": 500,
            "category": "FOOD",
            "description": "Lunch"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Expense.objects.count(), 1)
        
        # Test if analytics dynamically updates
        url_analytics = reverse('analytics')
        res_analytics = self.client.get(url_analytics)
        self.assertEqual(float(res_analytics.data['total_spent']), 500.0)
