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

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.filter(is_blocked=False)
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created: like.delete()
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
            "posts": list(posts),
            "trips": list(trips)
        })