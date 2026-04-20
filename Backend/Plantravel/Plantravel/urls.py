from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from app.views import (
    LoginView, RegisterView, PostViewSet, CommentViewSet, ReportViewSet, UserViewSet,
    ProfileViewSet, GenerateItineraryView, AdminStatsView,
    request_password_reset, reset_password_confirm, SendOTPView, VerifyOTPView,
    AnalyticsView, NotificationViewSet, TripViewSet, ExpenseViewSet
)

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')
router.register(r'comments', CommentViewSet)
router.register(r'reports', ReportViewSet)
router.register(r'users', UserViewSet)
router.register(r'profile', ProfileViewSet, basename='profile')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'notifications', NotificationViewSet, basename='notification')
# router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'trips', TripViewSet, basename='trip')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/otp/send/', SendOTPView.as_view(), name='send-otp'),
    path('api/otp/verify/', VerifyOTPView.as_view(), name='verify-otp'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/password-reset/', request_password_reset),
    path('api/reset-confirm/<str:uidb64>/<str:token>/', reset_password_confirm),

    # AI & TRIP ENDPOINTS
    path('api/trips/generate-itinerary/', GenerateItineraryView.as_view(), name='generate-itinerary'),
    # path('api/trips/generate-vibe/', GenerateVibeDestinationView.as_view(), name='generate-vibe'),
    # path('api/trips/image-recommendation/', ImageRecommendationView.as_view(), name='image-recommendation'),
    # Public read-only shared itinerary (no auth required)
    # path('api/public-trip/<int:pk>/', PublicTripView.as_view(), name='public-trip'),

    # ADMIN ENDPOINTS
    path('api/admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('api/analytics/', AnalyticsView.as_view(), name='analytics'),

    path('api/', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)