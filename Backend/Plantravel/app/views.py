from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import generics, viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from .models import User, Post, Comment, Like, Report, Trip
from rest_framework import serializers
import json
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Trip 
from .models import ItineraryActivity
import openai
# --- 1. AUTHENTICATION LOGIC ---

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

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

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
        print(f"DEBUG: Password Reset Link: {reset_link}")
        return Response({"message": "Reset link generated in console."}, status=200)
    return Response({"message": "If account exists, link sent."}, status=200)

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

# --- 3. COMMUNITY / BLOG LOGIC ---

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)

    class Meta:
        model = Post
        fields = '__all__'
        extra_kwargs = {'author': {'read_only': True}}

# PlannedTraveler\Backend\Plantravel\app\views.py

class PostViewSet(viewsets.ModelViewSet):
    # Added order_by so results are consistent
    queryset = Post.objects.filter(is_blocked=False).order_by('-created_at')
    serializer_class = PostSerializer

    def get_permissions(self):
        # 'list' and 'retrieve' (single post) are public
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        # Everything else (create, like, delete) requires login
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        # This will now correctly 401 if a guest tries to like, 
        # because this action isn't 'list' or 'retrieve'
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created: 
            like.delete()
        return Response({'likes': post.likes.count()})

# --- 4. PROFILE & HISTORY LOGIC ---

class ProfileViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        user = request.user
        posts = Post.objects.filter(author=user).values()
        trips = Trip.objects.filter(user=user).values()
        return Response({
            "username": user.username,
            "bio": user.bio,
            "role": user.role,
            "followers_count": user.followers.count(),
            "following_count": user.following.count(),
            "posts": PostSerializer(posts, many=True, context={'request': request}).data,
            "trips": list(trips)
        })
    
    openai.api_key = getattr(settings, 'OPENAI_API_KEY', '')

class GenerateItineraryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        destination = data.get('destination')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        budget = data.get('budget')
        group_size = data.get('group_size')

        if not all([destination, start_date, end_date, budget]):
            return Response({"error": "Missing required fields"}, status=400)

        # 1. Save Base Trip to DB
        trip = Trip.objects.create(
            user=request.user,
            destination=destination,
            start_date=start_date,
            end_date=end_date,
            budget=budget,
            group_size=group_size
        )

        
       # 2. Construct OpenAI Prompt (UPDATED FOR MAPS)
        prompt = f"""
        Act as an expert travel planner. Create a day-by-day itinerary for a trip to {destination}.
        Start Date: {start_date}, End Date: {end_date}.
        Budget: Rs. {budget} (Currency: NPR).
        Group: {group_size}.
        
        Output ONLY valid JSON in this exact format. You MUST provide real approximate latitude and longitude coordinates for mapping:
        {{
            "days": [
                {{
                    "day_number": 1,
                    "activities": [
                        {{
                            "time_of_day": "Morning", 
                            "title": "...", 
                            "description": "...", 
                            "estimated_cost": "...",
                            "latitude": 28.2096,
                            "longitude": 83.9856
                        }}
                    ]
                }}
            ]
        }}
        """

        try:
             # 3. Call OpenAI
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo-1106",
                response_format={ "type": "json_object" },
                messages=[{"role": "system", "content": prompt}]
            )

            # 4. Parse AI Response
            ai_data = json.loads(response.choices[0].message.content)
            
            # 5. Save Activities to Database (UPDATED FOR MAPS)
            activities_to_create = []
            for day in ai_data.get('days', []):
                for act in day.get('activities', []):
                    activities_to_create.append(ItineraryActivity(
                        trip=trip,
                        day_number=day['day_number'],
                        time_of_day=act['time_of_day'],
                        title=act['title'],
                        description=act['description'],
                        estimated_cost=act['estimated_cost'],
                        latitude=act.get('latitude'),    # <--- NEW
                        longitude=act.get('longitude')   # <--- NEW
                    ))
            ItineraryActivity.objects.bulk_create(activities_to_create)

            return Response({"message": "Itinerary generated successfully", "trip_id": trip.id, "itinerary": ai_data}, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=500)