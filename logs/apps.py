from django.apps import AppConfig


class LogsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'logs'
    verbose_name = 'Log Yönetimi'
    
    def ready(self):
        """
        Uygulama başlatıldığında çalışacak kodlar
        """
        pass