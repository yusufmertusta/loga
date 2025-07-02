from django.shortcuts import render
from django.contrib.auth.decorators import login_required

def index_view(request):
    """Ana sayfa - Kullanıcı girişi yoksa login'e yönlendir"""
    return render(request, 'index.html')

def login_view(request):
    """Kullanıcı giriş sayfası"""
    return render(request, 'auth/login.html')

def register_view(request):
    """Kullanıcı kayıt sayfası"""
    return render(request, 'auth/register.html')

def dashboard_view(request):
    """Ana dashboard sayfası"""
    return render(request, 'dashboard/dashboard.html')

def logs_view(request):
    """Log kayıtları listeleme sayfası"""
    return render(request, 'logs/logs.html')

def upload_view(request):
    """CSV dosya yükleme sayfası"""
    return render(request, 'upload/upload.html')

def statistics_view(request):
    """İstatistikler ve grafikler sayfası"""
    return render(request, 'statistics/statistics.html')

def profile_view(request):
    """Kullanıcı profil sayfası"""
    return render(request, 'profile/profile.html')