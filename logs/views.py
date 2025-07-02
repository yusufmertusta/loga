import pandas as pd
from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Log, UploadHistory
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, LogSerializer,
    UploadHistorySerializer, StatsSerializer, CSVUploadSerializer
)

class UserRegistrationView(APIView):
    """
    Yeni kullanıcı kaydı API view'ı.
    POST: Yeni kullanıcı hesabı oluşturur.
    """
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # JWT token oluştur
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Kullanıcı başarıyla oluşturuldu.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """
    Kullanıcı giriş API view'ı.
    POST: JWT token ile giriş yapar.
    """
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # JWT token oluştur
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Giriş başarılı.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogListView(ListAPIView):
    """
    Log kayıtlarını listeleyen API view'ı.
    GET: Tüm log kayıtlarını sayfalama ile döndürür.
    Arama ve filtreleme desteği vardır.
    """
    
    serializer_class = LogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Log.objects.all()
        
        # Arama parametresi
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(threat__icontains=search) |
                Q(source_ip__icontains=search) |
                Q(type__icontains=search)
            )
        
        # Severity filtresi
        severity = self.request.query_params.get('severity', None)
        if severity:
            queryset = queryset.filter(severity=severity)
        
        # Tarih aralığı filtresi
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(receive_time__date__gte=date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(receive_time__date__lte=date_to)
            except ValueError:
                pass
        
        return queryset


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_csv_view(request):
    """
    CSV dosya yükleme API view'ı.
    POST: CSV dosyasını alır, parse eder ve veritabanına kaydeder.
    """
    
    serializer = CSVUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    csv_file = serializer.validated_data['file']
    
    try:
        # Pandas ile CSV dosyasını oku
        df = pd.read_csv(csv_file)
        
        # Gerekli sütunların varlığını kontrol et
        required_columns = ['receive_time', 'type', 'severity', 'threat', 'source_ip']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return Response({
                'error': f'CSV dosyasında eksik sütunlar: {", ".join(missing_columns)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Log kayıtlarını oluştur
        logs_to_create = []
        processed_count = 0
        error_count = 0
        
        for index, row in df.iterrows():
            try:
                # Tarih formatını düzenle
                receive_time_str = str(row['receive_time'])
                
                # Farklı tarih formatlarını dene
                try:
                    receive_time = pd.to_datetime(receive_time_str)
                except:
                    # Manuel format denemesi
                    try:
                        receive_time = datetime.strptime(receive_time_str, '%Y-%m-%d %H:%M:%S')
                    except:
                        receive_time = datetime.strptime(receive_time_str, '%Y-%m-%d %H:%M')
                
                # Severity değerini normalize et
                severity = str(row['severity']).lower().strip()
                if severity not in ['low', 'medium', 'high', 'critical']:
                    # Bazı genel dönüşümler
                    if severity in ['düşük', 'low']:
                        severity = 'low'
                    elif severity in ['orta', 'medium']:
                        severity = 'medium'
                    elif severity in ['yüksek', 'high']:
                        severity = 'high'
                    elif severity in ['kritik', 'critical']:
                        severity = 'critical'
                    else:
                        severity = 'medium'  # Default
                
                log = Log(
                    receive_time=receive_time,
                    type=str(row['type']),
                    severity=severity,
                    threat=str(row['threat']),
                    source_ip=str(row['source_ip']),
                    uploaded_by=request.user
                )
                logs_to_create.append(log)
                processed_count += 1
                
            except Exception as e:
                error_count += 1
                continue
        
        # Bulk create ile veritabanına kaydet
        if logs_to_create:
            Log.objects.bulk_create(logs_to_create)
        
        # Upload history kaydet
        UploadHistory.objects.create(
            user=request.user,
            filename=csv_file.name,
            record_count=processed_count,
            success=error_count == 0,
            error_message=f'{error_count} kayıt işlenemedi' if error_count > 0 else None
        )
        
        return Response({
            'message': 'CSV dosyası başarıyla yüklendi.',
            'processed_count': processed_count,
            'error_count': error_count,
            'total_rows': len(df)
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        # Hata durumunda upload history kaydet
        UploadHistory.objects.create(
            user=request.user,
            filename=csv_file.name,
            record_count=0,
            success=False,
            error_message=str(e)
        )
        
        return Response({
            'error': f'CSV dosyası işlenirken hata oluştu: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_view(request):
    """
    İstatistik verileri API view'ı.
    GET: Chart.js için gerekli istatistik verilerini döndürür.
    """
    
    # Toplam log sayısı
    total_logs = Log.objects.count()
    
    # Severity dağılımı
    severity_stats = dict(Log.objects.values('severity').annotate(count=Count('severity')))
    
    # En aktif 10 IP adresi
    ip_stats = list(
        Log.objects.values('source_ip')
        .annotate(count=Count('source_ip'))
        .order_by('-count')[:10]
    )
    
    # Saatlik dağılım (son 24 saat)
    now = timezone.now()
    hourly_data = []
    for i in range(24):
        hour_start = now - timedelta(hours=i+1)
        hour_end = now - timedelta(hours=i)
        count = Log.objects.filter(
            receive_time__gte=hour_start,
            receive_time__lt=hour_end
        ).count()
        hourly_data.append({
            'hour': hour_start.strftime('%H:00'),
            'count': count
        })
    
    hourly_data.reverse()  # Cronological order
    
    # En sık karşılaşılan tehditler (Top 10)
    threat_stats = list(
        Log.objects.values('threat')
        .annotate(count=Count('threat'))
        .order_by('-count')[:10]
    )
    
    # Type dağılımı
    type_stats = dict(Log.objects.values('type').annotate(count=Count('type')))
    
    # Son 7 günün günlük log sayıları
    daily_data = []
    for i in range(7):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = Log.objects.filter(
            receive_time__gte=day_start,
            receive_time__lt=day_end
        ).count()
        daily_data.append({
            'date': day_start.strftime('%d.%m'),
            'count': count
        })
    
    daily_data.reverse()  # Chronological order
    
    # Son 24 saatteki log sayısı
    last_24h_start = now - timedelta(hours=24)
    last_24h_count = Log.objects.filter(receive_time__gte=last_24h_start).count()
    
    # En aktif IP'ler (sadece IP ve sayı)
    top_ips = list(
        Log.objects.values('source_ip')
        .annotate(count=Count('source_ip'))
        .order_by('-count')[:5]
        .values_list('source_ip', 'count')
    )
    
    stats_data = {
        'total_logs': total_logs,
        'severity_stats': severity_stats,
        'ip_stats': ip_stats,
        'hourly_stats': hourly_data,
        'threat_stats': threat_stats,
        'type_stats': type_stats,
        'daily_stats': daily_data,
        'top_ips': top_ips,
        'last_24h_count': last_24h_count
    }
    
    serializer = StatsSerializer(stats_data)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upload_history_view(request):
    """
    Dosya yükleme geçmişi API view'ı.
    GET: Kullanıcının yükleme geçmişini döndürür.
    """
    
    history = UploadHistory.objects.filter(user=request.user)
    serializer = UploadHistorySerializer(history, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    Kullanıcı profil bilgileri API view'ı.
    GET: Mevcut kullanıcının bilgilerini döndürür.
    """
    
    user = request.user
    user_logs_count = Log.objects.filter(uploaded_by=user).count()
    user_uploads_count = UploadHistory.objects.filter(user=user).count()
    
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'date_joined': user.date_joined.strftime('%d.%m.%Y'),
        },
        'stats': {
            'logs_uploaded': user_logs_count,
            'upload_sessions': user_uploads_count,
        }
    }, status=status.HTTP_200_OK)