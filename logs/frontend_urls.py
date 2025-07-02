from django.urls import path
from . import frontend_views

# Frontend URL patterns 
urlpatterns = [
    path('', frontend_views.index_view, name='index'),
    path('login/', frontend_views.login_view, name='login'),
    path('register/', frontend_views.register_view, name='register'),
    path('dashboard/', frontend_views.dashboard_view, name='dashboard'),
    path('logs/', frontend_views.logs_view, name='logs'),
    path('upload/', frontend_views.upload_view, name='upload'),
    path('statistics/', frontend_views.statistics_view, name='statistics'),
    path('profile/', frontend_views.profile_view, name='profile'),
]