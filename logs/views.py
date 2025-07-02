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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_view(request):
    """
    İstatistik verileri API view'ı.
    GET: Chart.js için gerekli istatistik verilerini döndürür.
    """
    try:
        # Toplam log sayısı
        total_logs = Log.objects.count()
        
        # Severity dağılımı - Düzeltme: value yerine değerleri doğru format
        severity_data = Log.objects.values('severity').annotate(count=Count('severity'))
        severity_stats = {}
        
        # Tüm severity seviyelerini initialize et
        for severity in ['low', 'medium', 'high', 'critical']:
            severity_stats[severity] = 0
        
        # Gerçek verileri ekle
        for item in severity_data:
            severity_name = item['severity'].lower() if item['severity'] else 'medium'
            if severity_name in severity_stats:
                severity_stats[severity_name] = item['count']
        
        print(f"DEBUG - Severity Stats: {severity_stats}")  # Debug için
        
        # En aktif IP adresleri - Düzeltme: object format
        ip_data = Log.objects.values('source_ip').annotate(count=Count('source_ip')).order_by('-count')[:20]
        ip_stats = []
        for item in ip_data:
            ip_stats.append({
                'source_ip': item['source_ip'],
                'count': item['count']
            })
        
        # Saatlik dağılım - Düzeltme: 24 saatlik tam veri
        now = timezone.now()
        hourly_stats = []
        
        # Her saat için veri hazırla (0-23)
        hourly_counts = {}
        
        # Son 24 saatteki verileri al
        last_24h = now - timedelta(hours=24)
        recent_logs = Log.objects.filter(receive_time__gte=last_24h)
        
        # Saate göre grupla
        for log in recent_logs:
            hour = log.receive_time.hour
            hourly_counts[hour] = hourly_counts.get(hour, 0) + 1
        
        # 24 saatlik array oluştur
        for hour in range(24):
            hourly_stats.append({
                'hour': f"{hour:02d}:00",
                'count': hourly_counts.get(hour, 0)
            })
        
        print(f"DEBUG - Hourly Stats Sample: {hourly_stats[7]}")  # Debug için saat 7
        
        # Tehdit istatistikleri - Düzeltme: object format
        threat_data = Log.objects.values('threat').annotate(count=Count('threat')).order_by('-count')[:20]
        threat_stats = []
        for item in threat_data:
            threat_stats.append({
                'threat': item['threat'],
                'count': item['count']
            })
        
        # Type dağılımı - Düzeltme: dict format
        type_data = Log.objects.values('type').annotate(count=Count('type'))
        type_stats = {}
        for item in type_data:
            type_stats[item['type']] = item['count']
        
        # Son 7 günün günlük log sayıları - Düzeltme: date format
        daily_stats = []
        today = timezone.now().date()
        
        # Günlük sayıları hesapla
        daily_counts = {}
        for i in range(7):
            target_date = today - timedelta(days=i)
            count = Log.objects.filter(receive_time__date=target_date).count()
            daily_counts[target_date] = count
        
        # Kronolojik sırada array oluştur
        for i in range(6, -1, -1):  # 6 gün önceden bugüne
            target_date = today - timedelta(days=i)
            daily_stats.append({
                'date': target_date.strftime('%Y-%m-%d'),  # ISO format
                'count': daily_counts.get(target_date, 0)
            })
        
        # Son 24 saatteki log sayısı
        last_24h_start = now - timedelta(hours=24)
        last_24h_count = Log.objects.filter(receive_time__gte=last_24h_start).count()
        
        # En aktif IP'ler (tuple array format - eski kod uyumluluğu için)
        top_ips_data = Log.objects.values('source_ip').annotate(count=Count('source_ip')).order_by('-count')[:10]
        top_ips = []
        for item in top_ips_data:
            top_ips.append([item['source_ip'], item['count']])
        
        # Final response
        stats_data = {
            'total_logs': total_logs,
            'severity_stats': severity_stats,
            'ip_stats': ip_stats,
            'hourly_stats': hourly_stats,
            'threat_stats': threat_stats,
            'type_stats': type_stats,
            'daily_stats': daily_stats,
            'top_ips': top_ips,
            'last_24h_count': last_24h_count
        }
        
        # Debug log
        print(f"DEBUG - Final stats summary:")
        print(f"  Total logs: {total_logs}")
        print(f"  Critical count: {severity_stats.get('critical', 0)}")
        print(f"  IP stats count: {len(ip_stats)}")
        print(f"  Hourly stats count: {len(hourly_stats)}")
        print(f"  Daily stats count: {len(daily_stats)}")
        
        # Serializer kullan
        serializer = StatsSerializer(stats_data)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"ERROR in stats_view: {str(e)}")  # Debug için
        
        # Hata durumunda boş veri döndür
        empty_stats = {
            'total_logs': 0,
            'severity_stats': {'low': 0, 'medium': 0, 'high': 0, 'critical': 0},
            'ip_stats': [],
            'hourly_stats': [{'hour': f"{h:02d}:00", 'count': 0} for h in range(24)],
            'threat_stats': [],
            'type_stats': {},
            'daily_stats': [],
            'top_ips': [],
            'last_24h_count': 0
        }
        
        return Response(empty_stats, status=status.HTTP_200_OK)


# Ek olarak, CSV upload fonksiyonunda da bir düzeltme önerisi:

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_csv_view(request):
    """
    CSV dosya yükleme API view'ı - Düzeltilmiş versiyon.
    POST: CSV dosyasını alır, parse eder ve veritabanına kaydeder.
    """
    
    serializer = CSVUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    csv_file = serializer.validated_data['file']
    
    try:
        # Pandas ile CSV dosyasını oku
        df = pd.read_csv(csv_file)
        
        # Sütun isimlerini temizle
        df.columns = df.columns.str.strip()
        
        print(f"DEBUG - CSV columns: {list(df.columns)}")
        print(f"DEBUG - CSV shape: {df.shape}")
        print(f"DEBUG - First row: {df.iloc[0].to_dict() if len(df) > 0 else 'Empty'}")
        
        # Gerekli sütunların varlığını kontrol et
        required_columns = ['receive_time', 'type', 'severity', 'threat', 'source_ip']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return Response({
                'error': f'CSV dosyasında eksik sütunlar: {", ".join(missing_columns)}',
                'available_columns': list(df.columns)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Log kayıtlarını oluştur
        logs_to_create = []
        processed_count = 0
        error_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Tarih formatını düzenle
                receive_time_str = str(row['receive_time']).strip()
                
                # Tarih parse et
                try:
                    receive_time = pd.to_datetime(receive_time_str)
                except:
                    try:
                        receive_time = datetime.strptime(receive_time_str, '%Y-%m-%d %H:%M:%S')
                    except:
                        try:
                            receive_time = datetime.strptime(receive_time_str, '%Y-%m-%d %H:%M')
                        except:
                            raise ValueError(f"Tarih formatı tanınamadı: {receive_time_str}")
                
                # Severity değerini normalize et
                severity = str(row['severity']).lower().strip()
                valid_severities = ['low', 'medium', 'high', 'critical']
                
                if severity not in valid_severities:
                    # Türkçe değerleri İngilizce'ye çevir
                    severity_mapping = {
                        'düşük': 'low',
                        'orta': 'medium', 
                        'yüksek': 'high',
                        'kritik': 'critical'
                    }
                    severity = severity_mapping.get(severity, 'medium')
                
                # Type ve threat alanlarını temizle
                log_type = str(row['type']).strip()
                threat = str(row['threat']).strip()
                source_ip = str(row['source_ip']).strip()
                
                # IP adresini validate et (basit kontrol)
                if not source_ip or source_ip == 'nan':
                    source_ip = '0.0.0.0'
                
                log = Log(
                    receive_time=receive_time,
                    type=log_type,
                    severity=severity,
                    threat=threat,
                    source_ip=source_ip,
                    uploaded_by=request.user
                )
                logs_to_create.append(log)
                processed_count += 1
                
            except Exception as e:
                error_count += 1
                errors.append(f"Satır {index + 2}: {str(e)}")
                continue
        
        # Bulk create ile veritabanına kaydet
        if logs_to_create:
            Log.objects.bulk_create(logs_to_create, batch_size=1000)
            print(f"DEBUG - Successfully created {len(logs_to_create)} logs")
        
        # Upload history kaydet
        UploadHistory.objects.create(
            user=request.user,
            filename=csv_file.name,
            record_count=processed_count,
            success=error_count == 0,
            error_message=f'{error_count} kayıt işlenemedi' if error_count > 0 else None
        )
        
        response_data = {
            'message': 'CSV dosyası başarıyla yüklendi.',
            'processed_count': processed_count,
            'error_count': error_count,
            'total_rows': len(df)
        }
        
        if error_count > 0 and len(errors) <= 10:  # İlk 10 hatayı göster
            response_data['sample_errors'] = errors[:10]
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        error_msg = str(e)
        print(f"ERROR in upload_csv_view: {error_msg}")
        
        # Hata durumunda upload history kaydet
        UploadHistory.objects.create(
            user=request.user,
            filename=csv_file.name,
            record_count=0,
            success=False,
            error_message=error_msg
        )
        
        return Response({
            'error': f'CSV dosyası işlenirken hata oluştu: {error_msg}'
        }, status=status.HTTP_400_BAD_REQUEST)

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