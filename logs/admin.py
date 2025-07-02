from django.contrib import admin
from .models import Log, UploadHistory

@admin.register(Log)
class LogAdmin(admin.ModelAdmin):
    """
    Log model için admin panel konfigürasyonu
    """
    
    list_display = [
        'receive_time', 'severity', 'type', 'source_ip', 
        'threat_short', 'uploaded_by', 'created_at'
    ]
    
    list_filter = [
        'severity', 'type', 'uploaded_by', 'created_at', 'receive_time'
    ]
    
    search_fields = [
        'threat', 'source_ip', 'type', 'uploaded_by__username'
    ]
    
    date_hierarchy = 'receive_time'
    
    ordering = ['-receive_time']
    
    readonly_fields = ['created_at']
    
    list_per_page = 50
    
    def threat_short(self, obj):
        """Tehdit açıklamasının kısa versiyonu"""
        return obj.threat[:50] + '...' if len(obj.threat) > 50 else obj.threat
    threat_short.short_description = 'Tehdit (Kısa)'
    
    fieldsets = (
        ('Log Bilgileri', {
            'fields': ('receive_time', 'type', 'severity', 'threat', 'source_ip')
        }),
        ('Sistem Bilgileri', {
            'fields': ('uploaded_by', 'created_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UploadHistory)
class UploadHistoryAdmin(admin.ModelAdmin):
    """
    UploadHistory model için admin panel konfigürasyonu
    """
    
    list_display = [
        'filename', 'user', 'upload_time', 'record_count', 'success'
    ]
    
    list_filter = [
        'success', 'upload_time', 'user'
    ]
    
    search_fields = [
        'filename', 'user__username', 'error_message'
    ]
    
    date_hierarchy = 'upload_time'
    
    ordering = ['-upload_time']
    
    readonly_fields = ['upload_time']
    
    list_per_page = 30
    
    fieldsets = (
        ('Dosya Bilgileri', {
            'fields': ('filename', 'user', 'upload_time')
        }),
        ('Sonuç Bilgileri', {
            'fields': ('record_count', 'success', 'error_message')
        }),
    )