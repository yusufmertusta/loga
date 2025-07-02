from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Log, UploadHistory

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Kullanıcı kayıt serializer'ı.
    Yeni kullanıcı hesabı oluşturmak için kullanılır.
    """
    
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password', 'password_confirm')
    
    def validate(self, attrs):
        """Şifre doğrulama kontrolü"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Şifreler eşleşmiyor.")
        return attrs
    
    def create(self, validated_data):
        """Yeni kullanıcı oluşturma"""
        validated_data.pop('password_confirm')  # Confirmation alanını kaldır
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Kullanıcı giriş serializer'ı.
    JWT token almak için kullanılır.
    """
    
    username = serializers.CharField()
    password = serializers.CharField(
        style={'input_type': 'password'},
        trim_whitespace=False
    )
    
    def validate(self, attrs):
        """Kullanıcı kimlik doğrulama"""
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(request=self.context.get('request'),
                              username=username, password=password)
            
            if not user:
                raise serializers.ValidationError('Kullanıcı adı veya şifre hatalı.')
            
            if not user.is_active:
                raise serializers.ValidationError('Kullanıcı hesabı devre dışı.')
                
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Kullanıcı adı ve şifre gerekli.')


class LogSerializer(serializers.ModelSerializer):
    """
    Log kayıtları için serializer.
    API'dan log verilerini almak ve göndermek için kullanılır.
    """
    
    uploaded_by_username = serializers.CharField(
        source='uploaded_by.username',
        read_only=True
    )
    
    severity_display = serializers.CharField(
        source='get_severity_display_tr',
        read_only=True
    )
    
    receive_time_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = Log
        fields = [
            'id', 'receive_time', 'receive_time_formatted', 'type', 
            'severity', 'severity_display', 'threat', 'source_ip', 
            'created_at', 'uploaded_by_username'
        ]
        read_only_fields = ['id', 'created_at', 'uploaded_by_username']
    
    def get_receive_time_formatted(self, obj):
        """Formatlanmış tarih-saat döndürme"""
        return obj.receive_time.strftime('%d.%m.%Y %H:%M:%S')


class UploadHistorySerializer(serializers.ModelSerializer):
    """
    Dosya yükleme geçmişi için serializer.
    """
    
    user_username = serializers.CharField(
        source='user.username',
        read_only=True
    )
    
    upload_time_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = UploadHistory
        fields = [
            'id', 'filename', 'upload_time', 'upload_time_formatted',
            'record_count', 'success', 'error_message', 'user_username'
        ]
        read_only_fields = ['id', 'upload_time', 'user_username']
    
    def get_upload_time_formatted(self, obj):
        """Formatlanmış yükleme tarihi"""
        return obj.upload_time.strftime('%d.%m.%Y %H:%M:%S')


class StatsSerializer(serializers.Serializer):
    """
    İstatistik verileri için serializer.
    Chart.js için gerekli veri formatını sağlar.
    """
    
    total_logs = serializers.IntegerField()
    severity_stats = serializers.DictField()
    ip_stats = serializers.ListField()
    hourly_stats = serializers.ListField()
    threat_stats = serializers.ListField()
    type_stats = serializers.DictField()
    
    # Günlük bazda log sayıları
    daily_stats = serializers.ListField()
    
    # En aktif IP adresleri
    top_ips = serializers.ListField()
    
    # Son 24 saatteki log sayısı
    last_24h_count = serializers.IntegerField()


class CSVUploadSerializer(serializers.Serializer):
    """
    CSV dosya yükleme için serializer.
    Dosya doğrulama ve işleme için kullanılır.
    """
    
    file = serializers.FileField(
        help_text="CSV formatında log dosyası"
    )
    
    def validate_file(self, value):
        """Dosya doğrulama"""
        if not value.name.endswith('.csv'):
            raise serializers.ValidationError("Sadece CSV dosyaları yüklenebilir.")
        
        # Dosya boyutu kontrolü (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Dosya boyutu 10MB'dan büyük olamaz.")
        
        return value