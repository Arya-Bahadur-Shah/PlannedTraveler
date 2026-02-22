from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import UserSerializer
from rest_framework import generics
from .models import User
from rest_framework.permissions import AllowAny
from rest_framework import viewsets, permissions
from .models import Post, Comment, Like, Report
from rest_framework.decorators import action
from rest_framework.response import Response

class MyTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims to the token (visible in JWT)
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add extra info to the JSON response (Frontend uses this)
        data['role'] = self.user.role
        data['username'] = self.user.username
        return data

class LoginView(TokenObtainPairView):
    serializer_class = MyTokenSerializer

# You'll also need a Register View for Travelers
from rest_framework.serializers import ModelSerializer

class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.filter(is_blocked=False) # Only show unblocked posts
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created: like.delete() # Toggle like
        return Response({'likes': post.likes.count()})

    @action(detail=True, methods=['post'])
    def report(self, request, pk=None):
        Report.objects.create(post=self.get_object(), reported_by=request.user, reason=request.data.get('reason'))
        return Response({'message': 'Report submitted'})