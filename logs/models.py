from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Log(models.Model):
    """
    Log kayıtlarını tutan model.
    CSV dosyalarından yüklenen güvenlik log verilerini saklar.
    """
    
    SEVERITY_CHOICES = [
        ('low', 'Düşük'),
        ('medium', 'Orta'),
        ('high', 'Yüksek'),
        ('critical', 'Kritik'),
    ]
    
    receive_time = models.DateTimeField(
        verbose_name="Alınma Zamanı",
        help_text="Log kaydının alındığı tarih ve saat"
    )
    
    type = models.CharField(
        max_length=100,
        verbose_name="Tip",
        help_text="Log türü (vulnerability, intrusion, etc.)"
    )
    
    severity = models.CharField(
        max_length=50,
        choices=SEVERITY_CHOICES,
        verbose_name="Önem Derecesi",
        help_text="Güvenlik olayının önem derecesi"
    )
    
    threat = models.TextField(
        verbose_name="Tehdit",
        help_text="Tespit edilen tehdit açıklaması"
    )
    
    source_ip = models.GenericIPAddressField(
        verbose_name="Kaynak IP",
        help_text="Tehdidi oluşturan IP adresi"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Oluşturulma Zamanı"
    )
    
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name="Yükleyen Kullanıcı",
        help_text="Bu log kaydını sisteme yükleyen kullanıcı"
    )
    
    class Meta:
        ordering = ['-receive_time']
        verbose_name = 'Log Kaydı'
        verbose_name_plural = 'Log Kayıtları'
        indexes = [
            models.Index(fields=['receive_time']),
            models.Index(fields=['severity']),
            models.Index(fields=['source_ip']),
            models.Index(fields=['type']),
        ]
    
    def __str__(self):
        return f"{self.receive_time.strftime('%Y-%m-%d %H:%M')} - {self.severity} - {self.source_ip}"
    
    def get_severity_badge_class(self):
        """Frontend'de kullanılmak üzere severity için Bootstrap badge class döndürür"""
        severity_classes = {
            'low': 'badge-success',
            'medium': 'badge-warning',
            'high': 'badge-danger',
            'critical': 'badge-dark'
        }
        return severity_classes.get(self.severity, 'badge-secondary')
    
    def get_severity_display_tr(self):
        """Türkçe severity gösterimi"""
        severity_tr = {
            'low': 'Düşük',
            'medium': 'Orta', 
            'high': 'Yüksek',
            'critical': 'Kritik'
        }
        return severity_tr.get(self.severity, self.severity)


class UploadHistory(models.Model):
    """
    CSV dosya yükleme geçmişini tutan model.
    Hangi kullanıcının ne zaman dosya yüklediğini takip eder.
    """
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name="Kullanıcı"
    )
    
    filename = models.CharField(
        max_length=255,
        verbose_name="Dosya Adı"
    )
    
    upload_time = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Yükleme Zamanı"
    )
    
    record_count = models.IntegerField(
        verbose_name="Kayıt Sayısı",
        help_text="Bu dosyadan kaç adet log kaydı eklendi"
    )
    
    success = models.BooleanField(
        default=True,
        verbose_name="Başarılı"
    )
    
    error_message = models.TextField(
        blank=True,
        null=True,
        verbose_name="Hata Mesajı"
    )
    
    class Meta:
        ordering = ['-upload_time']
        verbose_name = 'Yükleme Geçmişi'
        verbose_name_plural = 'Yükleme Geçmişleri'
    
    def __str__(self):
        return f"{self.user.username} - {self.filename} - {self.upload_time.strftime('%Y-%m-%d %H:%M')}"