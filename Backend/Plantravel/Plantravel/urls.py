from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from app.views import (
    LoginView, RegisterView, PostViewSet, 
    ProfileViewSet, request_password_reset, reset_password_confirm
)

router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'profile', ProfileViewSet, basename='profile')

urlpatterns = [
    path('admin/', admin.site.urls),
    # Auth
    path('api/login/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/password-reset/', request_password_reset),
    path('api/reset-confirm/<str:uidb64>/<str:token>/', reset_password_confirm),
    # Viewsets (Posts, Profile)
    path('api/', include(router.urls)),
]