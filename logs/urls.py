from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

# API URL patterns
urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.UserRegistrationView.as_view(), name='user_register'),
    path('auth/login/', views.UserLoginView.as_view(), name='user_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Log endpoints
    path('logs/', views.LogListView.as_view(), name='log_list'),
    path('upload/', views.upload_csv_view, name='csv_upload'),
    
    # Statistics endpoints
    path('stats/', views.stats_view, name='stats'),
    
    # User endpoints
    path('profile/', views.user_profile_view, name='user_profile'),
    path('upload-history/', views.upload_history_view, name='upload_history'),
]