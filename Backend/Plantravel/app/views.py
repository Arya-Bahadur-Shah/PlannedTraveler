"""
PlannedTraveler — Django REST Framework API Views
==================================================
This module contains all API view classes and functions powering the
PlannedTraveler travel planning platform.

View Groups:
  AUTH:
    - MyTokenSerializer / LoginView   — JWT login with role claim injection
    - RegisterView                    — User registration
    - request_password_reset          — Send password reset email
    - reset_password_confirm          — Validate token and update password

  COMMUNITY:
    - PostViewSet        — Blog CRUD, search, sort, like (+ WS like notification)
    - CommentViewSet     — Comments on posts
    - ReportViewSet      — User post reports (admin moderation queue)

  SOCIAL:
    - UserViewSet        — Follow/Unfollow (+ real-time WS follow notification)

  PROFILE:
    - ProfileViewSet     — GET /profile/me, PATCH /profile/update_profile

  TRIPS & ITINERARY:
    - TripViewSet            — CRUD for user trips, toggle_share public link
    - PublicTripView         — Unauthenticated read-only shared itinerary
    - ActivityViewSet        — Inline edit/delete of AI-generated activities
    - GenerateItineraryView  — AI itinerary generation via Ollama + weather fallback
    - GenerateVibeDestinationView — Vibe-based destination suggestions

  EXPENSES:
    - ExpenseViewSet     — Track spending per trip with budget alert notifications

  NOTIFICATIONS:
    - NotificationViewSet — List, mark-as-read, delete notification records

  VISION & AI:
    - ImageRecommendationView — Analyze uploaded image via Ollama llava vision model

  ANALYTICS & ADMIN:
    - AnalyticsView      — User-level stats (trips, spending, trend data)
    - AdminStatsView     — Platform-wide stats for admin dashboards

WebSocket Notifications:
  Real-time push events are sent via Django Channels group_send() to
  individual user channels (user_{id}). Triggered by:
    - Post liked       → notification to post author
    - User followed    → notification to followed user
    - Budget threshold → notification to trip owner
"""

import json
import requests
import traceback
import base64
from datetime import datetime, timedelta, date
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework import generics, viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Post, Comment, Like, Report, Trip, ItineraryActivity, Expense, Notification
from .serializers import (
    UserSerializer, RegisterSerializer, PostSerializer,
    CommentSerializer, ReportSerializer, TripSerializer, ExpenseSerializer, NotificationSerializer, ActivitySerializer
)

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework.permissions import AllowAny as AllowPublic

from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth

# ─────────────────────────────────────────────────────────────
# AUTH VIEWS
# ─────────────────────────────────────────────────────────────

class MyTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        data['username'] = self.user.username
        return data

class LoginView(TokenObtainPairView):
    serializer_class = MyTokenSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []


# ─────────────────────────────────────────────────────────────
# PASSWORD RESET
# ─────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    email = request.data.get('email')
    user = User.objects.filter(email=email).first()
    if user:
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_link = f"http://localhost:5173/reset-password/{uid}/{token}"
        print(f"DEBUG: Password Reset Link: {reset_link}")
        return Response({"message": "Reset link generated in console."}, status=200)
    return Response({"message": "If account exists, link sent."}, status=200)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_confirm(request, uidb64, token):
    password = request.data.get('password')
    if not password:
        return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
    if user and default_token_generator.check_token(user, token):
        user.set_password(password)
        user.save()
        return Response({"message": "Password updated!"}, status=status.HTTP_200_OK)
    return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────
# COMMUNITY VIEWSETS
# ─────────────────────────────────────────────────────────────

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer

    def get_queryset(self):
        qs = Post.objects.filter(is_blocked=False)
        search = self.request.query_params.get('search', '').strip()
        sort = self.request.query_params.get('sort', 'latest')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search) |
                Q(author__username__icontains=search)
            )
        if sort == 'popular':
            qs = qs.annotate(like_count=Count('likes')).order_by('-like_count')
        else:
            qs = qs.order_by('-created_at')
        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Toggle a like on a post and push a real-time WS notification to the author."""
        post = self.get_object()
        like_obj, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created:
            like_obj.delete()
        else:
            # Only push a notification when liking (not unliking)
            if post.author != request.user:
                notif = Notification.objects.create(
                    user=post.author,
                    title=f"{request.user.username} liked your post",
                    message=f'"{post.title}" received a new like from {request.user.username}.',
                    notification_type='like'
                )
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f"user_{post.author.id}",
                    {
                        "type": "send_notification",
                        "id": notif.id,
                        "title": notif.title,
                        "message": notif.message,
                        "notification_type": "like",
                        "is_read": False,
                        "created_at": str(notif.created_at),
                    }
                )
        return Response({'likes': post.likes.count()})

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all().order_by('-created_at')
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)


# ─────────────────────────────────────────────────────────────
# TRIP VIEWSET WITH PUBLIC SHARE TOGGLE
# ─────────────────────────────────────────────────────────────

class TripViewSet(viewsets.ModelViewSet):
    """CRUD operations for user trips. Includes toggle_share for public link sharing."""
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def toggle_share(self, request, pk=None):
        """Toggle the is_public flag on a trip to enable/disable public sharing."""
        trip = self.get_object()
        trip.is_public = not trip.is_public
        trip.save()
        return Response({'is_public': trip.is_public, 'trip_id': trip.id})


class PublicTripView(APIView):
    """Read-only public endpoint for viewing a shared itinerary without authentication."""
    permission_classes = [AllowPublic]

    def get(self, request, pk):
        try:
            trip = Trip.objects.get(pk=pk, is_public=True)
        except Trip.DoesNotExist:
            return Response({'error': 'This itinerary is not publicly shared or does not exist.'}, status=404)

        activities_by_day = {}
        for act in trip.activities.all().order_by('day_number', 'id'):
            day = act.day_number
            if day not in activities_by_day:
                activities_by_day[day] = []
            activities_by_day[day].append({
                'id': act.id,
                'time_of_day': act.time_of_day,
                'title': act.title,
                'description': act.description,
                'estimated_cost': act.estimated_cost,
                'latitude': act.latitude,
                'longitude': act.longitude,
            })

        days = [{'day_number': k, 'activities': v} for k, v in sorted(activities_by_day.items())]
        return Response({
            'destination': trip.destination,
            'start_date': str(trip.start_date),
            'end_date': str(trip.end_date),
            'group_size': trip.group_size,
            'total_days': len(days),
            'days': days,
        })

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'SUPER_ADMIN']:
            return Response(status=403)
        report = self.get_object()
        report.is_resolved = True
        report.save()
        return Response({'status': 'resolved'})

    @action(detail=True, methods=['post'])
    def block_post(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'SUPER_ADMIN']:
            return Response(status=403)
        report = self.get_object()
        post = report.post
        post.is_blocked = True
        post.save()
        report.is_resolved = True
        report.save()
        return Response({'status': 'post blocked'})

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        target_user = self.get_object()
        if request.user == target_user:
            return Response({"error": "Cannot follow yourself"}, status=400)
        if request.user.following.filter(id=target_user.id).exists():
            request.user.following.remove(target_user)
            return Response({"status": "unfollowed", "followers": target_user.followers.count()})
        else:
            request.user.following.add(target_user)
            # Create a persistent Notification record for the followed user
            notif = Notification.objects.create(
                user=target_user,
                title=f"{request.user.username} followed you",
                message=f"{request.user.username} is now following your travel stories.",
                notification_type='follow'
            )
            # Push real-time WebSocket notification to the target user's channel group
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{target_user.id}",
                {
                    "type": "send_notification",
                    "id": notif.id,
                    "title": notif.title,
                    "message": notif.message,
                    "notification_type": "follow",
                    "is_read": False,
                    "created_at": str(notif.created_at),
                }
            )
            return Response({"status": "followed", "followers": target_user.followers.count()})

class ProfileViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        user = request.user
        posts = Post.objects.filter(author=user)
        trips = Trip.objects.filter(user=user)
        return Response({
            "id": user.id,
            "username": user.username,
            "bio": user.bio,
            "role": user.role,
            "profile_picture": user.profile_picture.url if user.profile_picture else None,
            "followers_count": user.followers.count(),
            "following_count": user.following.count(),
            "posts": PostSerializer(posts, many=True, context={'request': request}).data,
            "trips": TripSerializer(trips, many=True).data
        })

    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        user = request.user
        data = request.data
        if 'bio' in data:
            user.bio = data['bio']
        if 'username' in data:
            user.username = data['username']
        if 'profile_picture' in request.FILES:
            user.profile_picture = request.FILES['profile_picture']
        user.save()
        return Response({"message": "Profile updated successfully"})

class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['ADMIN', 'SUPER_ADMIN']:
            return Response(status=403)
        return Response({
            "total_users": User.objects.count(),
            "total_posts": Post.objects.count(),
            "total_trips": Trip.objects.count(),
            "pending_reports": Report.objects.filter(is_resolved=False).count()
        })

class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        trips = Trip.objects.filter(user=user)
        total_trips = trips.count()
        completed_trips = trips.filter(is_completed=True).count()
        total_spent = Expense.objects.filter(trip__user=user).aggregate(Sum('amount'))['amount__sum'] or 0

        # Category breakdown
        expenses = Expense.objects.filter(trip__user=user).values('category').annotate(total=Sum('amount')).order_by('-total')
        category_data = [{"name": e['category'], "value": float(e['total'])} for e in expenses]

        # Monthly trips
        monthly_trips = trips.annotate(month=TruncMonth('start_date')).values('month').annotate(total=Count('id')).order_by('month')
        trend_data = [{"month": str(m['month'].strftime("%b %Y")) if m['month'] else "Unknown", "trips": m['total']} for m in monthly_trips]

        return Response({
            "total_trips": total_trips,
            "completed_trips": completed_trips,
            "total_spent": float(total_spent),
            "category_data": category_data,
            "trend_data": trend_data
        })

class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ItineraryActivity.objects.filter(trip__user=self.request.user).order_by('day_number', 'id')

    def perform_create(self, serializer):
        trip = serializer.validated_data.get('trip')
        if trip.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not own this trip.")
        serializer.save()

class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(trip__user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        trip = serializer.validated_data.get('trip')
        if trip.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not own this trip.")
        
        expense = serializer.save()

        # Check total budget manually to trigger notification
        total_expenses = sum(e.amount for e in trip.expenses.all())
        budget = trip.budget or 0
        
        if budget > 0:
            percentage = (total_expenses / budget) * 100
            alert_msg = None
            alert_type = 'info'
            title = 'Expense Logged'

            # Define alert threshold rules
            if percentage >= 100:
                alert_msg = f"Alert: You have exceeded your budget for {trip.destination}!"
                alert_type = 'danger'
                title = 'Budget Exceeded'
            elif percentage >= 85:
                # To prevent spamming, we could check if it was previously below 85, but for demo we just send
                alert_msg = f"Warning: You are nearing your budget limit for {trip.destination}."
                alert_type = 'warning'
                title = 'Budget Warning'

            if alert_msg:
                # Save notification to DB
                Notification.objects.create(
                    user=self.request.user,
                    title=title,
                    message=alert_msg,
                    notification_type=alert_type
                )
                
                # Broadcast via WebSocket
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f"user_{self.request.user.id}",
                    {
                        "type": "send_notification",
                        "message": alert_msg,
                        "type_id": alert_type,
                        "title": title
                    }
                )

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({'status': 'marked as read'})


class ImageRecommendationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        image = request.FILES.get('image')
        if not image:
            return Response({"error": "No image provided"}, status=400)
            
        try:
            # Base64 encode the uploaded image
            image_bytes = image.read()
            b64_img = base64.b64encode(image_bytes).decode('utf-8')
            
            payload = {
                "model": "llava",
                "messages": [
                    {
                        "role": "user",
                        "content": "You are an expert travel assistant. Analyze this image and recommend exactly 3 concise travel activities starting with verbs. Identify the main travel 'vibe' (e.g. nature, aesthetic_cafe, trendy, adventure, cultural, beach). Identify the destination it looks most like in Nepal. Reply ONLY in strict JSON format: {\"detected_vibe\": \"vibe\", \"destination_match\": \"location\", \"reason\": \"short reason\", \"suggested_activities\": [\"activity 1\", \"activity 2\", \"activity 3\"]}.",
                        "images": [b64_img]
                    }
                ],
                "stream": False,
                "options": {
                    "temperature": 0.3
                }
            }
            
            ollama_url = "http://localhost:11434/api/chat"
            res = requests.post(ollama_url, json=payload, timeout=30.0)
            res.raise_for_status()
            
            # Ensure proper JSON parsing from Ollama
            content = res.json().get("message", {}).get("content", "")
            if "```json" in content:
                content = content.replace("```json", "").replace("```", "").strip()
            if "```" in content:
                content = content.replace("```", "").strip()

            parsed_data = json.loads(content)
            return Response(parsed_data)
        except Exception as e:
            print(f"Vision API failed: {e}")
            # Smart fallback
            return Response({
                "detected_vibe": "nature",
                "destination_match": "Annapurna Mountains",
                "reason": "The system generated a fallback because the vision model (llava) could not be reached.",
                "suggested_activities": ["Sunrise view", "Mountain trek", "Tea house visit"]
            })

# ─────────────────────────────────────────────────────────────
# WEATHER HELPER  (Open-Meteo – no API key required)
# ─────────────────────────────────────────────────────────────

def _geocode_destination(destination: str):
    """Resolve a place name to (lat, lon) using Open-Meteo geocoding."""
    try:
        resp = requests.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": destination, "count": 1, "language": "en", "format": "json"},
            timeout=8
        )
        results = resp.json().get("results", [])
        if results:
            return results[0]["latitude"], results[0]["longitude"]
    except Exception as e:
        print(f"Geocoding failed: {e}")
    # Default to Kathmandu if geocoding fails
    return 27.7172, 85.3240


def _fetch_weather(lat: float, lon: float, start_date: str, end_date: str) -> dict:
    """
    Fetch daily weather forecast from Open-Meteo for the date range.
    Returns a dict keyed by date string: { "2025-04-10": { temp_max, temp_min, rain_mm, condition } }
    """
    try:
        resp = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode",
                "timezone": "Asia/Kathmandu",
                "start_date": start_date,
                "end_date": end_date,
            },
            timeout=10
        )
        data = resp.json().get("daily", {})
        dates = data.get("time", [])
        weather_map = {}
        wmo_conditions = {
            0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
            45: "Foggy", 48: "Icy Fog", 51: "Light Drizzle", 53: "Moderate Drizzle",
            55: "Dense Drizzle", 61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
            71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
            80: "Light Showers", 81: "Moderate Showers", 82: "Violent Showers",
            95: "Thunderstorm", 96: "Thunderstorm with Hail", 99: "Severe Thunderstorm"
        }
        for i, d in enumerate(dates):
            code = data.get("weathercode", [])[i] if i < len(data.get("weathercode", [])) else 0
            rain = data.get("precipitation_sum", [])[i] if i < len(data.get("precipitation_sum", [])) else 0
            temp_max = data.get("temperature_2m_max", [])[i] if i < len(data.get("temperature_2m_max", [])) else 25
            temp_min = data.get("temperature_2m_min", [])[i] if i < len(data.get("temperature_2m_min", [])) else 15
            condition = wmo_conditions.get(code, "Partly Cloudy")
            is_bad_weather = rain > 5 or code in [61, 63, 65, 71, 73, 75, 80, 81, 82, 95, 96, 99]
            weather_map[d] = {
                "temp_max": round(temp_max, 1),
                "temp_min": round(temp_min, 1),
                "rain_mm": round(rain, 1),
                "condition": condition,
                "is_bad_weather": is_bad_weather
            }
        return weather_map
    except Exception as e:
        print(f"Weather fetch failed: {e}")
        return {}


def _build_day_weather_context(weather_info: dict) -> str:
    if not weather_info:
        return "Weather data unavailable. Plan for mixed conditions."
    condition = weather_info.get("condition", "Partly Cloudy")
    temp_max = weather_info.get("temp_max", 25)
    temp_min = weather_info.get("temp_min", 15)
    rain_mm = weather_info.get("rain_mm", 0)
    is_bad = weather_info.get("is_bad_weather", False)
    text = f"{condition}, {temp_min}°C–{temp_max}°C"
    if rain_mm > 0:
        text += f", {rain_mm}mm rain expected"
    if is_bad:
        text += ". ⚠️ BAD WEATHER DAY — prioritize INDOOR activities."
    return text


# ─────────────────────────────────────────────────────────────
# VIBE → PROMPT MODIFIERS
# ─────────────────────────────────────────────────────────────

VIBE_MODIFIERS = {
    "trendy": (
        "Focus on TRENDY, Instagram-worthy spots: rooftop bars, hip neighborhoods, "
        "popular street food spots, cool co-working cafes, and modern art installations."
    ),
    "vibey": (
        "Prioritize ATMOSPHERE and VIBES: sunset viewpoints, bohemian markets, "
        "live music venues, night bazaars, rooftop lounges, and places with a strong local energy."
    ),
    "aesthetic_cafe": (
        "Heavily feature AESTHETIC CAFES and specialty coffee shops with unique interiors, "
        "Instagrammable food presentations, matcha lattes, artisan bakeries, and brunch spots. "
        "Include at least 2 café visits per day."
    ),
    "nature": (
        "Prioritize NATURE experiences: national parks, waterfalls, mountain viewpoints, "
        "sunrise hikes, river rafting, botanical gardens, wildlife reserves, and scenic trails. "
        "Include proper packing advice for each outdoor activity."
    ),
    "adventure": (
        "Focus on ADVENTURE activities: trekking, rock climbing, paragliding, white-water rafting, "
        "zip-lining, bungee jumping, mountain biking, and extreme sports. Include safety notes."
    ),
    "cultural": (
        "Emphasize CULTURAL IMMERSION: ancient temples, heritage sites, UNESCO World Heritage zones, "
        "local festivals, traditional craft workshops, cooking classes with locals, "
        "monasteries, and museum deep-dives."
    ),
    "foodie": (
        "Make this a FOOD-FORWARD itinerary: local food markets, street food tours, "
        "iconic restaurants, regional specialties, farm-to-table experiences, "
        "cooking demonstrations, and popular local eateries. Include dish names and prices."
    ),
    "beach": (
        "Focus on relaxation and LAKESIDE/RIVERSIDE experiences (this is Nepal): "
        "lakeside promenades, boat rides, lakeside cafes, fishing villages, "
        "waterside resorts, and scenic riverside picnic spots."
    ),
}


def _get_vibe_instructions(travel_vibes: list) -> str:
    if not travel_vibes:
        return "Provide a balanced mix of cultural sightseeing, food, and local experiences."
    instructions = []
    for vibe in travel_vibes:
        vibe_key = vibe.lower().replace(" ", "_").replace("-", "_")
        if vibe_key in VIBE_MODIFIERS:
            instructions.append(VIBE_MODIFIERS[vibe_key])
    return "\n   ".join(instructions) if instructions else "Provide a balanced itinerary."


# ─────────────────────────────────────────────────────────────
# ITINERARY GENERATION VIEW
# ─────────────────────────────────────────────────────────────

class GenerateItineraryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        destination = data.get('destination')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        budget = data.get('budget')
        group_size = data.get('group_size', 'Solo Explorer')
        travel_vibes = data.get('travel_vibes', [])  # e.g. ["nature", "aesthetic_cafe"]

        if not all([destination, start_date, end_date, budget]):
            return Response({"error": "Missing required fields"}, status=400)

        try:
            # ── Clean dates ──────────────────────────────────────
            clean_start = str(start_date).split('T')[0]
            clean_end = str(end_date).split('T')[0]
            s_date = datetime.strptime(clean_start, "%Y-%m-%d").date()
            e_date = datetime.strptime(clean_end, "%Y-%m-%d").date()
            num_days = max(1, min((e_date - s_date).days + 1, 30))

            # ── Save base trip ──────────────────────────────────
            trip = Trip.objects.create(
                user=request.user, destination=destination,
                start_date=clean_start, end_date=clean_end,
                budget=budget, group_size=group_size
            )

            # ── Fetch weather ───────────────────────────────────
            lat, lon = _geocode_destination(destination)
            # Open-Meteo only forecasts 16 days ahead; use mock if beyond range
            today = date.today()
            if (s_date - today).days <= 15:
                weather_map = _fetch_weather(lat, lon, clean_start, clean_end)
            else:
                weather_map = {}

            # ── Build per-day weather context for prompt ────────
            day_weather_lines = []
            for i in range(num_days):
                day_date = (s_date + timedelta(days=i)).strftime("%Y-%m-%d")
                w = weather_map.get(day_date, {})
                weather_ctx = _build_day_weather_context(w)
                is_bad = w.get("is_bad_weather", False)
                day_weather_lines.append(
                    f"  - Day {i+1} ({day_date}): {weather_ctx}"
                    + (" → MUST include indoor alternatives." if is_bad else "")
                )

            weather_section = "\n".join(day_weather_lines) if day_weather_lines else "  - Weather data unavailable."
            vibe_instructions = _get_vibe_instructions(travel_vibes)
            vibe_label = ", ".join(travel_vibes) if travel_vibes else "Balanced"

            # ── Analytics: Past Trips context ────────
            past_trips = Trip.objects.filter(user=request.user, is_completed=True)
            past_destinations = [t.destination for t in past_trips if t.destination != destination]
            past_trips_ctx = f"The user has previously visited: {', '.join(set(past_destinations))}. Ensure this itinerary gives a slightly different experience." if past_destinations else "This is the user's first trip documented here."

            # ── Construct advanced prompt ───────────────────────
            prompt = f"""
You are an elite travel concierge and local expert for Nepal with 20 years of experience.
Create a comprehensive, highly-detailed, day-by-day itinerary for a trip to {destination}, Nepal.

TRIP DETAILS:
- Destination: {destination}
- Travel Dates: {clean_start} to {clean_end} ({num_days} days)
- Total Budget: NPR {budget}
- Group Type: {group_size}
- Travel Vibe/Style: {vibe_label}
- Travel History Context: {past_trips_ctx}

WEATHER FORECAST (CRITICAL — plan activities around this):
{weather_section}

TRAVELER VIBE PREFERENCES (tailor all recommendations to these):
   {vibe_instructions}

MANDATORY REQUIREMENTS FOR EVERY DAY:
1. MORNING (7:00 AM – 12:00 PM):
   - Start with a SPECIFIC breakfast spot or café (name it, describe the specialty dish, price in NPR)
   - Include one PRIMARY tourist attraction or activity with exact entry fees in NPR
   - If weather is marked BAD, replace outdoor activities with compelling INDOOR alternatives
     (e.g., museums, art galleries, cooking classes, spa treatments, local workshops, tea houses)

2. AFTERNOON (12:00 PM – 5:00 PM):
   - LUNCH recommendation: name a specific restaurant/eatery, its cuisine, a must-try dish, price range
   - Primary afternoon activity: a specific tourist viewpoint, heritage site, or cultural experience
   - Include transport mode and approximate travel time between locations

3. EVENING (5:00 PM – 10:00 PM):
   - Sunset spot (if weather permits) or alternative atmospheric indoor venue
   - DINNER recommendation: name a specific restaurant, cuisine type, ambiance, price per person in NPR
   - Optional after-dinner activity: night market, rooftop bar, cultural show, or evening stroll

4. SPECIFIC LOCATIONS ONLY — never use generic phrases like:
   - ❌ "Visit a local temple" → ✅ "Visit Bindhyabasini Temple, Pokhara's oldest hilltop shrine"
   - ❌ "Explore local markets" → ✅ "Browse Bagar Market for fresh produce and handmade goods"
   - ❌ "Have lunch at a restaurant" → ✅ "Lunch at Moondance Restaurant; try their yak cheese pizza (NPR 650)"

5. COST BREAKDOWN — every activity must have an estimated_cost in NPR as a plain number string.

6. COORDINATES — provide realistic latitude/longitude for every specific location in Nepal.

7. ACTIVITY TYPE — tag each activity as one of: "tourist_spot", "restaurant", "cafe", "indoor", "adventure", "cultural", "nature", "shopping"

OUTPUT — return ONLY valid JSON, no markdown fences, no extra text:
{{
  "destination": "{destination}",
  "total_days": {num_days},
  "travel_style": "{vibe_label}",
  "days": [
    {{
      "day_number": 1,
      "date": "{clean_start}",
      "weather": {{
        "condition": "Clear Sky",
        "temp_max": 28,
        "temp_min": 18,
        "rain_mm": 0,
        "is_bad_weather": false
      }},
      "activities": [
        {{
          "time_of_day": "Morning",
          "time_slot": "7:30 AM",
          "activity_type": "cafe",
          "title": "Breakfast at Olive Cafe",
          "description": "Start your day at this beloved Lakeside institution. Order the eggs benedict with Nepali spiced potatoes and a fresh pot of masala tea. A favorite among travelers for its garden seating and mountain views.",
          "cuisine_or_category": "Nepali-Continental Fusion",
          "must_try": "Eggs Benedict with masala potatoes",
          "estimated_cost": "450",
          "latitude": 28.2096,
          "longitude": 83.9586,
          "transport_tip": "5-minute walk from most Lakeside hotels",
          "indoor": true,
          "is_restaurant": true
        }},
        {{
          "time_of_day": "Morning",
          "time_slot": "9:30 AM",
          "activity_type": "tourist_spot",
          "title": "Phewa Lake Boating & Tal Barahi Temple",
          "description": "Rent a wooden rowboat (NPR 400/hour) and paddle to the sacred island temple of Tal Barahi in the middle of Phewa Lake. The pagoda-style Hindu shrine and reflections of the Annapurna range create an unforgettable sight.",
          "estimated_cost": "600",
          "entry_fee": "50 NPR (temple donation)",
          "latitude": 28.2096,
          "longitude": 83.9556,
          "transport_tip": "Boats available at the Lakeside ghats",
          "indoor": false,
          "is_restaurant": false
        }}
      ]
    }}
  ]
}}
"""
            # ── Call Ollama ─────────────────────────────────────
            ai_data = None
            try:
                ollama_url = "http://localhost:11434/api/chat"
                payload = {
                    "model": "llama3",
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0.7, "num_predict": 8192}
                }
                res = requests.post(ollama_url, json=payload, timeout=90.0)
                res.raise_for_status()
                content = res.json().get('message', {}).get('content', '{}')
                ai_data = json.loads(content)
                print("✅ Ollama responded successfully.")
            except Exception as e:
                print(f"⚠️  Ollama unavailable, generating smart fallback: {e}")

            # ── Smart fallback incorporating weather ────────────
            if not ai_data or not ai_data.get("days"):
                ai_data = self._generate_smart_fallback(
                    destination, s_date, num_days, budget, group_size,
                    travel_vibes, weather_map, lat, lon
                )

            # ── Save activities to database ─────────────────────
            for day in ai_data.get('days', []):
                for act in day.get('activities', []):
                    db_act = ItineraryActivity.objects.create(
                        trip=trip,
                        day_number=day.get('day_number', 1),
                        time_of_day=act.get('time_of_day', 'Morning'),
                        title=act.get('title', ''),
                        description=act.get('description', ''),
                        estimated_cost=str(act.get('estimated_cost', '')),
                        latitude=act.get('latitude'),
                        longitude=act.get('longitude')
                    )
                    act['id'] = db_act.id  # Inject DB ID into JSON for frontend edit capability

            return Response({
                "message": "Itinerary generated successfully",
                "trip_id": trip.id,
                "itinerary": ai_data,
                "weather_available": bool(weather_map)
            }, status=201)

        except Exception as e:
            tb = traceback.format_exc()
            print("CRITICAL ERROR IN GenerateItineraryView:", tb)
            return Response({"error": str(e), "traceback": tb}, status=500)

    def _generate_smart_fallback(self, destination, s_date, num_days, budget,
                                  group_size, travel_vibes, weather_map, lat, lon):
        """
        Rich contextual fallback itinerary when Ollama is unavailable.
        Uses real destination knowledge for popular Nepal spots.
        """
        budget_num = float(budget) if budget else 50000
        daily_budget = budget_num / max(num_days, 1)

        DESTINATION_DATA = {
            "pokhara": {
                "morning_spots": [
                    {"title": "Sarangkot Sunrise Viewpoint", "desc": "Witness the legendary golden sunrise over the Annapurna range from Sarangkot Hill. The silhouette of Machhapuchhre (Fishtail Mountain) against the dawn sky is breathtaking.", "type": "tourist_spot", "cost": "300", "lat": 28.2380, "lon": 83.9636, "entry": "Free"},
                    {"title": "Phewa Lake Boating & Tal Barahi Temple", "desc": "Rent a traditional wooden boat and row to the sacred island temple of Tal Barahi. Reflections of the Annapurna range in the calm lake at morning are magical.", "type": "tourist_spot", "cost": "600", "lat": 28.2096, "lon": 83.9556, "entry": "50 NPR donation"},
                    {"title": "International Mountain Museum", "desc": "Explore the world-class museum dedicated to the Himalayan mountain culture, history of climbing expeditions, and local ethnic groups. Fascinating for all ages.", "type": "indoor", "cost": "400", "lat": 28.2050, "lon": 83.9580, "entry": "300 NPR"},
                ],
                "cafes": [
                    {"title": "Breakfast at Caffe Concerto", "desc": "Popular Lakeside cafe with incredible lake views. Try the French toast with local honey and fresh fruit platter. A favorite for the morning mountain-view ritual.", "type": "cafe", "cost": "450", "lat": 28.2100, "lon": 83.9590, "dish": "French toast with local honey"},
                    {"title": "Breakfast at German Bakery Pokhara", "desc": "A beloved institution serving freshly baked bread, muesli, and excellent filter coffee. The garden seating with garden views sets the perfect tranquil morning tone.", "type": "cafe", "cost": "380", "lat": 28.2088, "lon": 83.9598, "dish": "Muesli with fresh yogurt and honey"},
                ],
                "lunch_spots": [
                    {"title": "Lunch at Moondance Restaurant", "desc": "Iconic Pokhara restaurant with stunning lake views. Try their yak cheese pizza or the classic dal bhat with locally sourced vegetables.", "type": "restaurant", "cost": "680", "lat": 28.2090, "lon": 83.9600, "dish": "Yak cheese pizza or Dal Bhat set"},
                    {"title": "Lunch at Busy Bee Cafe", "desc": "Pokhara's most beloved cafe and live-music venue. Famous for its wood-fired pizzas and relaxed Lakeside ambiance. Try the Busy Bee special burger.", "type": "restaurant", "cost": "750", "lat": 28.2094, "lon": 83.9598, "dish": "Busy Bee special burger"},
                ],
                "afternoon_spots": [
                    {"title": "Davis Falls & Gupteshwor Cave", "desc": "Watch the Pardi Khola river plunge dramatically 20m into a narrow gorge at Davis Falls, then explore the sacred Gupteshwor Mahadev Cave adjacent to the falls.", "type": "tourist_spot", "cost": "250", "lat": 28.1938, "lon": 83.9549, "entry": "30 NPR each"},
                    {"title": "Seti River Gorge Viewpoint", "desc": "Stand at the K.I. Singh Bridge and gaze into the dramatic white-water gorge carved by the milky Seti River — one of Pokhara's most stunning hidden gems.", "type": "tourist_spot", "cost": "100", "lat": 28.2321, "lon": 83.9899, "entry": "Free"},
                    {"title": "World Peace Stupa (Shanti Stupa)", "desc": "Hike or take a boat + hike combo to this gleaming white Japanese-built stupa on a hilltop. Panoramic 360° views of Phewa Lake and the Annapurna range.", "type": "tourist_spot", "cost": "350", "lat": 28.2008, "lon": 83.9488, "entry": "Free"},
                ],
                "dinner_spots": [
                    {"title": "Dinner at Once Upon a Time", "desc": "Sophisticated Lakeside restaurant in a heritage building. Traditional Newari and Nepali recipes elevated with modern presentation. Try the Newari samay baji platter.", "type": "restaurant", "cost": "900", "lat": 28.2098, "lon": 83.9601, "dish": "Newari samay baji platter"},
                    {"title": "Dinner at The Lemon Tree", "desc": "Popular lakeside rooftop restaurant with fairy-light ambiance. Try the sekuwa (grilled meat), local momo, and finish with traditional sel roti dessert.", "type": "restaurant", "cost": "800", "lat": 28.2092, "lon": 83.9595, "dish": "Sekuwa platter with sel roti"},
                ],
                "indoor_alternatives": [
                    {"title": "Pokhara Regional Museum", "desc": "Discover the rich cultural heritage of the Gandaki region through artifacts, traditional costumes, and historical exhibits. Perfect for a rainy day.", "type": "indoor", "cost": "100", "lat": 28.2380, "lon": 83.9973},
                    {"title": "Batik & Thanka Painting Workshop", "desc": "Join a 2-hour hands-on workshop at a local artisan studio in Lakeside. Learn traditional Tibetan thanka painting techniques and take your artwork home.", "type": "indoor", "cost": "800", "lat": 28.2095, "lon": 83.9592},
                    {"title": "Cooking Class at Pokhara Kitchen Academy", "desc": "Learn to cook authentic Nepali dishes: dal bhat, momos, gundruk soup, and aloo tama. Includes market visit and full meal. The best rainy day activity!", "type": "indoor", "cost": "2500", "lat": 28.2100, "lon": 83.9600},
                ]
            },
            "kathmandu": {
                "morning_spots": [
                    {"title": "Pashupatinath Temple Morning Aarti", "desc": "Witness the ancient dawn aarti ceremony at Nepal's most sacred Hindu temple. The smoke of incense, bells, and chants echoing over the Bagmati River create an otherworldly experience.", "type": "cultural", "cost": "500", "lat": 27.7104, "lon": 85.3487, "entry": "1000 NPR foreigners"},
                    {"title": "Swayambhunath Stupa (Monkey Temple)", "desc": "Climb 365 steps to the iconic stupa watching over Kathmandu Valley. The all-seeing eyes of Buddha painted on the spire and playful resident monkeys make it unforgettable.", "type": "tourist_spot", "cost": "400", "lat": 27.7149, "lon": 85.2904, "entry": "200 NPR"},
                    {"title": "Boudhanath Stupa Morning Kora", "desc": "Join thousands of pilgrims on the morning circumambulation (kora) of the world's largest Buddhist stupa. The spinning prayer wheels and chanting monks are deeply moving.", "type": "cultural", "cost": "300", "lat": 27.7215, "lon": 85.3620, "entry": "400 NPR"},
                ],
                "cafes": [
                    {"title": "Breakfast at OR2K Restaurant", "desc": "Jerusalem-style cafe on Thamel's rooftop. Known for its massive Middle Eastern breakfast spread, fresh juices, and spectacular Kathmandu rooftop views.", "type": "cafe", "cost": "550", "lat": 27.7151, "lon": 85.3123, "dish": "Middle Eastern breakfast platter"},
                    {"title": "Breakfast at Himalayan Java", "desc": "Nepal's premium specialty coffee chain. Excellent espresso, fresh pastries, and reliable wifi. The Durbar Marg branch has prime people-watching.", "type": "cafe", "cost": "450", "lat": 27.7127, "lon": 85.3136, "dish": "Americano with almond croissant"},
                ],
                "lunch_spots": [
                    {"title": "Lunch at Krishnarpan (Dwarika's)", "desc": "Nepal's most prestigious Nepali restaurant in the heritage Dwarika's Hotel. A 22-course traditional Newari feast — an unparalleled cultural dining experience.", "type": "restaurant", "cost": "3500", "lat": 27.7089, "lon": 85.3298, "dish": "22-course Newari thali"},
                    {"title": "Lunch at Bota Restaurant", "desc": "Contemporary Nepali cuisine in Thamel. Excellent mo:mo, thukpa, and the famous 'white' sekuwa (marinated in yogurt and spices). Fresh and reasonably priced.", "type": "restaurant", "cost": "700", "lat": 27.7154, "lon": 85.3125, "dish": "White sekuwa and steam momo set"},
                ],
                "afternoon_spots": [
                    {"title": "Patan Durbar Square", "desc": "UNESCO World Heritage Site with stunning Newari architecture. The Krishna Mandir (stone temple), Royal Palace, and Golden Temple make it one of the finest medieval squares in Asia.", "type": "cultural", "cost": "400", "lat": 27.6722, "lon": 85.3240, "entry": "1000 NPR"},
                    {"title": "Bhaktapur Durbar Square", "desc": "The best-preserved medieval city in Nepal. The 55-Window Palace, Nyatapola Temple, and pottery square feel like stepping back 500 years. Unmissable.", "type": "cultural", "cost": "500", "lat": 27.6710, "lon": 85.4298, "entry": "1800 NPR"},
                ],
                "dinner_spots": [
                    {"title": "Dinner at Fire & Ice Pizzeria", "desc": "Kathmandu's most iconic pizza restaurant since 1994. Thin-crust Italian-style pizzas with imported ingredients in a warm, convivial atmosphere loved by locals and travelers.", "type": "restaurant", "cost": "1200", "lat": 27.7146, "lon": 85.3129, "dish": "Quattro Stagioni pizza"},
                    {"title": "Dinner at Thamel House", "desc": "Authentic Nepali dinner in a traditional Newari townhouse. Cultural dance performance accompanies traditional Nepali set meal. An immersive evening experience.", "type": "restaurant", "cost": "1400", "lat": 27.7152, "lon": 85.3120, "dish": "Traditional Nepali set + cultural show"},
                ],
                "indoor_alternatives": [
                    {"title": "National Museum of Nepal", "desc": "Explore Nepal's artistic and historical heritage: bronze Buddhas, ancient weapons, royal artifacts, and prehistoric exhibits. A must-see on a rainy Kathmandu day.", "type": "indoor", "cost": "150", "lat": 27.7144, "lon": 85.2904},
                    {"title": "Momos Workshop at Himalayan Cooking School", "desc": "Learn the art of making authentic Nepali momos in a hands-on 2-hour class. Make, steam, and eat your creations with teachers who've cooked for royalty.", "type": "indoor", "cost": "1800", "lat": 27.7150, "lon": 85.3120},
                ]
            }
        }

        # Find destination data
        dest_key = destination.lower().strip()
        dest_info = None
        for key, val in DESTINATION_DATA.items():
            if key in dest_key or dest_key in key:
                dest_info = val
                break

        # Generic fallback if destination not in database
        if not dest_info:
            dest_info = DESTINATION_DATA["pokhara"]

        # Prefer nature/adventure spots if nature vibe selected
        has_nature = any(v.lower() in ["nature", "adventure"] for v in travel_vibes)
        has_cafe = any(v.lower() in ["aesthetic_cafe", "vibey", "trendy"] for v in travel_vibes)

        generated_days = []
        for i in range(num_days):
            day_num = i + 1
            day_date_obj = s_date + timedelta(days=i)
            day_date_str = day_date_obj.strftime("%Y-%m-%d")
            w = weather_map.get(day_date_str, {})
            is_bad = w.get("is_bad_weather", False)

            weather_block = {
                "condition": w.get("condition", "Partly Cloudy"),
                "temp_max": w.get("temp_max", 25),
                "temp_min": w.get("temp_min", 15),
                "rain_mm": w.get("rain_mm", 0),
                "is_bad_weather": is_bad
            }

            # Pick activities based on weather and vibe
            morning_pick = dest_info["morning_spots"][i % len(dest_info["morning_spots"])]
            cafe_pick = dest_info["cafes"][i % len(dest_info["cafes"])]
            lunch_pick = dest_info["lunch_spots"][i % len(dest_info["lunch_spots"])]
            afternoon_pick = dest_info["afternoon_spots"][i % len(dest_info["afternoon_spots"])]
            dinner_pick = dest_info["dinner_spots"][i % len(dest_info["dinner_spots"])]

            activities = []

            # Breakfast café
            activities.append({
                "time_of_day": "Morning",
                "time_slot": "7:30 AM",
                "activity_type": cafe_pick["type"],
                "title": cafe_pick["title"],
                "description": cafe_pick["desc"],
                "estimated_cost": cafe_pick["cost"],
                "latitude": cafe_pick["lat"],
                "longitude": cafe_pick["lon"],
                "indoor": True,
                "is_restaurant": True
            })

            # Morning activity (indoor if bad weather)
            if is_bad and dest_info.get("indoor_alternatives"):
                indoor_pick = dest_info["indoor_alternatives"][i % len(dest_info["indoor_alternatives"])]
                activities.append({
                    "time_of_day": "Morning",
                    "time_slot": "9:30 AM",
                    "activity_type": "indoor",
                    "title": f"🌧️ Indoor: {indoor_pick['title']}",
                    "description": f"[Weather Advisory: Rain/bad weather today — indoor activity recommended] {indoor_pick['desc']}",
                    "estimated_cost": indoor_pick["cost"],
                    "latitude": indoor_pick["lat"],
                    "longitude": indoor_pick["lon"],
                    "indoor": True,
                    "is_restaurant": False
                })
            else:
                activities.append({
                    "time_of_day": "Morning",
                    "time_slot": "9:30 AM",
                    "activity_type": morning_pick["type"],
                    "title": morning_pick["title"],
                    "description": morning_pick["desc"],
                    "estimated_cost": morning_pick["cost"],
                    "latitude": morning_pick["lat"],
                    "longitude": morning_pick["lon"],
                    "indoor": False,
                    "is_restaurant": False
                })

            # Lunch
            activities.append({
                "time_of_day": "Afternoon",
                "time_slot": "12:30 PM",
                "activity_type": "restaurant",
                "title": lunch_pick["title"],
                "description": lunch_pick["desc"],
                "estimated_cost": lunch_pick["cost"],
                "latitude": lunch_pick["lat"],
                "longitude": lunch_pick["lon"],
                "indoor": True,
                "is_restaurant": True
            })

            # Afternoon activity
            if is_bad and dest_info.get("indoor_alternatives"):
                alt_idx = (i + 1) % len(dest_info["indoor_alternatives"])
                indoor_alt = dest_info["indoor_alternatives"][alt_idx]
                activities.append({
                    "time_of_day": "Afternoon",
                    "time_slot": "2:30 PM",
                    "activity_type": "indoor",
                    "title": f"🌧️ Indoor: {indoor_alt['title']}",
                    "description": f"[Rainy Day Alternative] {indoor_alt['desc']}",
                    "estimated_cost": indoor_alt["cost"],
                    "latitude": indoor_alt["lat"],
                    "longitude": indoor_alt["lon"],
                    "indoor": True,
                    "is_restaurant": False
                })
            else:
                activities.append({
                    "time_of_day": "Afternoon",
                    "time_slot": "2:30 PM",
                    "activity_type": afternoon_pick["type"],
                    "title": afternoon_pick["title"],
                    "description": afternoon_pick["desc"],
                    "estimated_cost": afternoon_pick["cost"],
                    "latitude": afternoon_pick["lat"],
                    "longitude": afternoon_pick["lon"],
                    "indoor": False,
                    "is_restaurant": False
                })

            # Dinner
            activities.append({
                "time_of_day": "Evening",
                "time_slot": "7:00 PM",
                "activity_type": "restaurant",
                "title": dinner_pick["title"],
                "description": dinner_pick["desc"],
                "estimated_cost": dinner_pick["cost"],
                "latitude": dinner_pick["lat"],
                "longitude": dinner_pick["lon"],
                "indoor": True,
                "is_restaurant": True
            })

            generated_days.append({
                "day_number": day_num,
                "date": day_date_str,
                "weather": weather_block,
                "activities": activities
            })

        return {
            "destination": destination,
            "total_days": num_days,
            "travel_style": ", ".join(travel_vibes) if travel_vibes else "Balanced",
            "days": generated_days
        }


# ─────────────────────────────────────────────────────────────
# VIBE DESTINATION SUGGESTION VIEW
# ─────────────────────────────────────────────────────────────

class GenerateVibeDestinationView(APIView):
    permission_classes = [IsAuthenticated]

    VIBE_DESTINATIONS = {
        "trendy": [
            {"name": "Thamel, Kathmandu", "tagline": "Nepal's buzzing epicenter of hip cafes, rooftop bars, and street art", "emoji": "🔥", "highlights": "Rooftop lounges, craft beer, boutique stays, live music"},
            {"name": "Lakeside, Pokhara", "tagline": "Vibrant waterfront promenade with trendy cafes and adventure tourism", "emoji": "✨", "highlights": "Instagram lakefront, yoga retreats, paragliding"},
        ],
        "aesthetic_cafe": [
            {"name": "Patan, Lalitpur", "tagline": "Artsy heritage city with the finest specialty coffee scene in Nepal", "emoji": "☕", "highlights": "Specialty coffee, Newari architecture, art galleries"},
            {"name": "Lakeside, Pokhara", "tagline": "Lakeside cafe culture with mountain backdrop", "emoji": "☕", "highlights": "Lake-view cafes, bohemian vibes, artisan bakeries"},
        ],
        "nature": [
            {"name": "Chitwan National Park", "tagline": "UNESCO World Heritage jungle — rhinos, tigers, and elephant safaris", "emoji": "🌿", "highlights": "Jungle safaris, canoe rides, elephant encounters, birdwatching"},
            {"name": "Annapurna Base Camp Trek", "tagline": "Nepal's most beloved trek through rhododendron forests to the Himalayan amphitheatre", "emoji": "🏔️", "highlights": "Mountain views, terraced villages, hot springs at Jhinu Danda"},
            {"name": "Rara Lake", "tagline": "Nepal's largest and most pristine lake — a remote paradise few travelers reach", "emoji": "💎", "highlights": "Crystal lake, alpine forests, complete serenity"},
        ],
        "adventure": [
            {"name": "Pokhara", "tagline": "Adventure capital of Nepal — paragliding, rafting, bungee, and more", "emoji": "🪂", "highlights": "Paragliding from Sarangkot, white-water rafting, zip-lining"},
            {"name": "Bhotekoshi River (Sindhupalchok)", "tagline": "Home to Nepal's most extreme white-water rafting and bungee jumping", "emoji": "⚡", "highlights": "Grade IV+ rafting, bungee over gorge, canyoning"},
        ],
        "cultural": [
            {"name": "Bhaktapur", "tagline": "Nepal's best-preserved medieval city — a living museum of Newari art", "emoji": "🏛️", "highlights": "Pottery square, 55-Window Palace, traditional ghee tea"},
            {"name": "Lumbini", "tagline": "Birthplace of Lord Buddha — a sacred pilgrimage site of global significance", "emoji": "🕉️", "highlights": "Maya Devi Temple, Sacred Garden, international monasteries"},
            {"name": "Mustang (Lo Manthang)", "tagline": "Forbidden Kingdom — ancient Tibetan culture preserved in the Himalayan rain shadow", "emoji": "🏯", "highlights": "Walled capital city, cave monasteries, sky caves"},
        ],
        "foodie": [
            {"name": "Kathmandu", "tagline": "Nepal's culinary capital with every type of cuisine from dal bhat to fine dining", "emoji": "🍜", "highlights": "Newari feasts, momo culture, Thamel food tours, rooftop dining"},
            {"name": "Pokhara", "tagline": "Lakeside dining with spectacular mountain views and diverse global cuisine", "emoji": "🥘", "highlights": "Fresh trout, yak cheese, lakeside restaurants, cooking classes"},
        ],
        "vibey": [
            {"name": "Pokhara", "tagline": "Nepal's most soulful city — bohemian energy, lakeside sunsets, and mountain magic", "emoji": "✨", "highlights": "Sunset at Sarangkot, reggae bars, yoga studios, full-moon lakeside events"},
            {"name": "Thamel, Kathmandu", "tagline": "The beating heart of Nepal's travel scene — chaotic, colorful, and electric", "emoji": "🌙", "highlights": "Night markets, rooftop lounges, live jazz, spiritual energy"},
        ],
        "beach": [
            {"name": "Phewa Lake, Pokhara", "tagline": "Nepal's most iconic lake with stunning Himalayan reflections", "emoji": "🚣", "highlights": "Boating, lakeside cafes, fishing, sunset views, Barahi Temple island"},
            {"name": "Fewa Tal Lakeside", "tagline": "Serene lakeside retreat perfect for relaxation, sunsets, and slow travel", "emoji": "🌅", "highlights": "Kayaking, paddleboarding, lakeside yoga, sunset boat rides"},
        ],
    }

    def post(self, request):
        travel_vibes = request.data.get("travel_vibes", [])
        if not travel_vibes:
            return Response({"error": "Please select at least one travel vibe"}, status=400)

        suggestions = []
        seen = set()
        for vibe in travel_vibes:
            vibe_key = vibe.lower().replace(" ", "_").replace("-", "_")
            for dest in self.VIBE_DESTINATIONS.get(vibe_key, []):
                if dest["name"] not in seen:
                    suggestions.append({**dest, "matched_vibe": vibe})
                    seen.add(dest["name"])

        if not suggestions:
            # Generic popular suggestions
            suggestions = [
                {"name": "Pokhara", "tagline": "Nepal's adventure and relaxation capital by the Himalayas", "emoji": "🏔️", "highlights": "Lakes, mountains, adventure sports, cafes"},
                {"name": "Kathmandu", "tagline": "Ancient temples, vibrant streets, and rich Nepali culture", "emoji": "🕌", "highlights": "Heritage sites, food scene, trekking gateway"},
                {"name": "Chitwan", "tagline": "Untamed jungle safari in Nepal's premier national park", "emoji": "🦏", "highlights": "Wildlife, jungle walks, elephant encounters"},
            ]

        return Response({
            "vibes": travel_vibes,
            "suggestions": suggestions[:6]  # Return max 6 suggestions
        })