import json
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
import requests
import re
import os
import traceback
from datetime import datetime, timedelta, date
from django.core.mail import send_mail
from .models import User, Post, Comment, Like, Report, Trip, ItineraryActivity, Expense, Notification, EmailOTP
from .serializers import (
    UserSerializer, RegisterSerializer, PostSerializer, 
    CommentSerializer, ReportSerializer, TripSerializer, NotificationSerializer
)

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

# --- 2. PASSWORD RESET LOGIC ---

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    email = request.data.get('email')
    user = User.objects.filter(email=email).first()
    if user:
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_link = f"http://localhost:5173/reset-password/{uid}/{token}"
        
        try:
            send_mail(
                'Password Reset Request - PlannedTraveler',
                f'Hello,\n\nPlease click the link below to reset your password:\n{reset_link}\n\nIf you did not request this, please ignore this email.',
                os.environ.get('EMAIL_HOST_USER', 'noreply@plannedtraveler.com'),
                [email],
                fail_silently=False,
            )
            print(f"DEBUG: Password Reset Link: {reset_link}")
        except Exception as e:
            print(f"Failed to send email: {e}")
            print(f"DEBUG: Password Reset Link: {reset_link}")

        return Response({"message": "Reset link sent to your email."}, status=200)
    return Response({"message": "If account exists, link sent."}, status=200)

class SendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=400)
        
        import random
        from django.utils import timezone
        otp = str(random.randint(100000, 999999))
        
        EmailOTP.objects.update_or_create(
            email=email,
            defaults={'otp': otp}
        )
        
        try:
            send_mail(
                'Your Login Code - PlannedTraveler',
                f'Your one-time login code is: {otp}\nThis code will expire in 10 minutes.',
                os.environ.get('EMAIL_HOST_USER', 'noreply@plannedtraveler.com'),
                [email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send OTP email: {e}")
            return Response({"error": "Failed to send OTP email."}, status=500)

        return Response({"message": "OTP sent successfully."}, status=200)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        try:
            record = EmailOTP.objects.get(email=email)
            if record.otp != otp:
                return Response({"error": "Invalid OTP."}, status=400)
            
            from django.utils import timezone
            from datetime import timedelta
            if timezone.now() > record.created_at + timedelta(minutes=10):
                return Response({"error": "OTP has expired."}, status=400)
            
            # Use filter().first() to handle duplicate emails gracefully
            user = User.objects.filter(email=email).first()
            if not user:
                base_username = email.split('@')[0]
                username = base_username
                counter = 1
                
                # Ensure the username is strictly unique in the DB
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1

                user = User.objects.create(
                    email=email,
                    username=username,
                    role='USER'
                )
                user.set_unusable_password()
                user.save()
            
            record.delete()
            
            refresh = MyTokenSerializer.get_token(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'username': user.username,
                'role': user.role
            }, status=200)
                
        except EmailOTP.DoesNotExist:
            return Response({"error": "No OTP requested for this email."}, status=400)
        except Exception as e:
            print(f"OTP Verify Error: {e}")
            return Response({"error": "Verification failed. Please try again."}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_confirm(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except: user = None

    if user and default_token_generator.check_token(user, token):
        user.set_password(request.data.get('password'))
        user.save()
        return Response({"message": "Password updated!"}, status=200)
    return Response({"error": "Invalid token"}, status=400)

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.filter(is_blocked=False).order_by('-created_at')
    serializer_class = PostSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created: 
            like.delete()
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

    @staticmethod
    def _geocode_destination(destination):
        """Fetch real latitude and longitude coordinates for a destination."""
        import requests
        try:
            url = f"https://nominatim.openstreetmap.org/search?q={destination}&format=json&limit=1"
            headers = {"User-Agent": "PlannedTravelerApp/1.0"}
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code == 200 and len(resp.json()) > 0:
                data = resp.json()[0]
                return float(data['lat']), float(data['lon'])
        except Exception as e:
            print(f"Geocoding error: {e}")
        return 27.7172, 85.3240  # Default to Kathmandu

    def post(self, request):
        data = request.data
        destination = data.get('destination')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        budget = data.get('budget')
        group_size = data.get('group_size', 'Solo Explorer')
        travel_vibes = data.get('travel_vibes', [])

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
            lat, lon = GenerateItineraryView._geocode_destination(destination)
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

            # ── Budget tier logic ──────────────────────────
            budget_num = float(budget) if budget else 50000
            daily_budget = round(budget_num / max(num_days, 1))

            if budget_num >= 80000:
                budget_tier = "LUXURY"
                breakfast_range = "NPR 1500-3000 (hotel buffet, rooftop cafe, fine dining brunch)"
                lunch_range = "NPR 2000-4000 (upscale restaurant, hotel dining, multi-course set lunch)"
                dinner_range = "NPR 3000-6000 (fine dining, hotel restaurant, premium cuisine)"
                activity_range = "NPR 2000-8000 (private guided tours, spa, premium experiences)"
                hotel_note = "Suggest 5-star hotels, luxury resorts, or boutique heritage properties."
            elif budget_num >= 40000:
                budget_tier = "MID-RANGE"
                breakfast_range = "NPR 600-1200 (popular cafe, bakery, or hotel breakfast)"
                lunch_range = "NPR 800-1800 (well-known restaurant with good ambiance)"
                dinner_range = "NPR 1200-2500 (quality restaurant, live music, or cultural dining)"
                activity_range = "NPR 500-3000 (guided tours, adventure activities, museum entry)"
                hotel_note = "Suggest 3-4 star hotels or well-rated guesthouses."
            else:
                budget_tier = "BUDGET"
                breakfast_range = "NPR 200-500 (local teahouse, dal bhat, street food)"
                lunch_range = "NPR 300-700 (local eatery, momo house, cheap thali)"
                dinner_range = "NPR 400-900 (popular local restaurant or street stall)"
                activity_range = "NPR 50-500 (free attractions, cheap entry fees, local markets)"
                hotel_note = "Suggest budget guesthouses, hostels, or cheap lodges."

            # ── Construct advanced prompt (Using Triple Quotes) ───────────────────────
            prompt = f"""Act as an expert local travel guide and financial planner. Create a highly specific {num_days}-day itinerary for {destination}.

--- TRIP PARAMETERS ---
Total Days: {num_days}
Dates: {clean_start} to {clean_end}
Group Type: {group_size}
Style: {vibe_label}
Total Budget: Rs. {int(budget_num)} NPR (approx Rs. {daily_budget} NPR per day).
Budget Tier: {budget_tier}
{'Weather: ' + weather_section if weather_section else ''}
{'Vibes: ' + vibe_instructions if vibe_instructions else ''}

--- BUDGET ENFORCEMENT (CRITICAL) ---
This is a {budget_tier} trip with a total budget of Rs. {int(budget_num)} NPR.
Breakfast per activity: {breakfast_range}
Lunch per activity: {lunch_range}
Dinner per activity: {dinner_range}
Activity/sightseeing: {activity_range}
Accommodation: {hotel_note}
The SUM of ALL estimated_cost values across ALL {num_days} days MUST be close to Rs. {int(budget_num)} NPR.
Do NOT use low values like 200-500 for a LUXURY or MID-RANGE budget.

--- STRICT INSTRUCTIONS ---
1. Generate exactly {num_days} days. Do not stop early.
2. Use real-world landmarks, specific restaurant names, and real streets in {destination}.
3. Provide highly accurate decimal latitude and longitude for EVERY activity.
4. Each estimated_cost must be a plain number string (e.g. "2500") with NO Rs. prefix.
5. Keep description to exactly 1 concise sentence.
6. Output ONLY valid JSON. No markdown, no extra text.

--- JSON SCHEMA ---
{{
  "destination": "{destination}",
  "total_days": {num_days},
  "travel_style": "{vibe_label}",
  "days": [
    {{
      "day_number": 1,
      "date": "{clean_start}",
      "activities": [
        {{
          "time_of_day": "Morning",
          "title": "Breakfast at Dwarika's Hotel",
          "description": "Enjoy a lavish breakfast buffet at this heritage 5-star property.",
          "estimated_cost": "2500",
          "latitude": 27.7089,
          "longitude": 85.3298,
          "activity_type": "cafe"
        }}
      ]
    }}
  ]
}}"""

            # ── Call Ollama ─────────────────────────────────────
            ai_data = None
            try:
                ollama_url = "http://localhost:11434/api/chat"
                payload = {
                    "model": "llama3.2:latest",
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0.7, "num_predict": 8192}
                }
                res = requests.post(ollama_url, json=payload, timeout=150.0)
                res.raise_for_status()
                content = res.json().get('message', {}).get('content', '{}')
                raw_text = content
                if raw_text.strip().startswith("```"):
                    raw_text = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_text.strip(), flags=re.MULTILINE)
                ai_data = json.loads(raw_text)
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
                    # Robust Cost Cleaning: Extract only the numbers so the DB and frontend don't crash
                    raw_cost = str(act.get('estimated_cost', '')).replace(',', '')
                    cost_match = re.search(r'[\d\.]+', raw_cost)
                    clean_cost = cost_match.group(0) if cost_match else "0"

                    db_act = ItineraryActivity.objects.create(
                        trip=trip,
                        day_number=day.get('day_number', 1),
                        time_of_day=act.get('time_of_day', 'Morning'),
                        title=act.get('title', ''),
                        description=act.get('description', ''),
                        estimated_cost=clean_cost,
                        latitude=act.get('latitude'),
                        longitude=act.get('longitude')
                    )
                    act['id'] = db_act.id  
                    act['estimated_cost'] = clean_cost  # Ensure returned JSON also has the clean cost

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


class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum
        user = request.user
        trips = Trip.objects.filter(user=user)
        total_trips = trips.count()
        completed_trips = trips.filter(is_completed=True).count()
        
        expenses = Expense.objects.filter(trip__user=user)
        total_spent = expenses.aggregate(total=Sum('amount'))['total'] or 0

        cat_data = expenses.values('category').annotate(value=Sum('amount'))
        category_data = [{"name": c['category'], "value": c['value']} for c in cat_data]

        trend_data = [{"month": "This Month", "trips": total_trips}]

        return Response({
            "total_trips": total_trips,
            "completed_trips": completed_trips,
            "total_spent": total_spent,
            "category_data": category_data,
            "trend_data": trend_data
        })

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({'status': 'read'})

class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)


class ExpenseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        from .serializers import ExpenseSerializer
        return ExpenseSerializer

    def get_queryset(self):
        from .models import Expense
        qs = Expense.objects.filter(trip__user=self.request.user).order_by('-date')
        trip_id = self.request.query_params.get('trip')
        if trip_id:
            qs = qs.filter(trip_id=trip_id)
        return qs

    def perform_create(self, serializer):
        trip = serializer.validated_data.get('trip')
        if trip.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not own this trip.")
        serializer.save()

    def perform_update(self, serializer):
        trip = serializer.validated_data.get('trip')
        if trip and trip.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You cannot move expense to a trip you do not own.")
        serializer.save()