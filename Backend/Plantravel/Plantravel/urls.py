from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from app.views import (
    LoginView, RegisterView, PostViewSet, 
    ProfileViewSet, GenerateItineraryView, request_password_reset, reset_password_confirm
)

router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'profile', ProfileViewSet, basename='profile')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/password-reset/', request_password_reset),
    path('api/reset-confirm/<str:uidb64>/<str:token>/', reset_password_confirm),
    
    #  AI ENDPOINT
    path('api/trips/generate-itinerary/', GenerateItineraryView.as_view(), name='generate-itinerary'),
    
    path('api/', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)