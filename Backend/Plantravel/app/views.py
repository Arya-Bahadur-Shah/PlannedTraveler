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
from openai import OpenAI

from .models import User, Post, Comment, Like, Report, Trip, ItineraryActivity
from .serializers import (
    UserSerializer, RegisterSerializer, PostSerializer, 
    CommentSerializer, ReportSerializer, TripSerializer
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

class GenerateItineraryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        destination = data.get('destination')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        budget = data.get('budget')
        group_size = data.get('group_size', 'Solo Explorer')

        if not all([destination, start_date, end_date, budget]):
            return Response({"error": "Missing required fields"}, status=400)

        # 1. Save Base Trip to DB
        trip = Trip.objects.create(
            user=request.user, destination=destination, start_date=start_date,
            end_date=end_date, budget=budget, group_size=group_size
        )

        
       # 2. Construct OpenAI Prompt (UPDATED FOR MAPS)
        prompt = f"""
        Act as an expert travel planner. Create a day-by-day itinerary for a trip to {destination}.
        Start Date: {start_date}, End Date: {end_date}. Budget: Rs. {budget} (Currency: NPR). Group: {group_size}.
        Output ONLY valid JSON in this exact format. Provide real approximate latitude and longitude coordinates:
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
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo-1106",
                response_format={ "type": "json_object" },
                messages=[{"role": "system", "content": prompt}]
            )

            content = response.choices[0].message.content
            ai_data = json.loads(content)
            
            # 5. Save Activities to Database (UPDATED FOR MAPS)
            activities_to_create = []
            for day in ai_data.get('days', []):
                for act in day.get('activities', []):
                    activities_to_create.append(ItineraryActivity(
                        trip=trip, day_number=day['day_number'], time_of_day=act['time_of_day'],
                        title=act['title'], description=act['description'],
                        estimated_cost=act.get('estimated_cost', ''),
                        latitude=act.get('latitude'), longitude=act.get('longitude')
                    ))
            ItineraryActivity.objects.bulk_create(activities_to_create)

            return Response({"message": "Itinerary generated successfully", "trip_id": trip.id, "itinerary": ai_data}, status=201)
        except json.JSONDecodeError:
            return Response({"error": "AI returned invalid JSON."}, status=500)
        except Exception as e:
            return Response({"error": str(e)}, status=500)