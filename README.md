# 🛡️ Log Analyzer - Güvenlik Log Analiz Sistemi

Django tabanlı, JWT korumalı güvenlik log analizi ve görselleştirme sistemi. CSV formatındaki log verilerini sisteme yükleyerek kapsamlı analiz ve istatistikler elde edebilirsiniz.

## 🎯 Özellikler

- ✅ **JWT Token Tabanlı Kimlik Doğrulama**
- ✅ **CSV Dosya Yükleme ve İşleme**
- ✅ **Responsive Bootstrap 5 Arayüzü**
- ✅ **Chart.js ile İnteraktif Grafikler**
- ✅ **Gelişmiş Arama ve Filtreleme**
- ✅ **Kullanıcı Profil Yönetimi**
- ✅ **Upload Geçmişi Takibi**
- ✅ **REST API Dokümantasyonu**

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Python 3.10+
- Django 4.x
- Node.js (isteğe bağlı, frontend geliştirme için)

### Kurulum

1. **Projeyi klonlayın:**
```bash
git clone <repository-url>
cd log-analyzer
```

2. **Sanal ortam oluşturun ve aktifleştirin:**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

3. **Gerekli paketleri yükleyin:**
```bash
pip install -r requirements.txt
```

4. **Environment dosyası oluşturun:**
```bash
# .env dosyası oluşturun ve aşağıdaki değişkenleri ekleyin
SECRET_KEY=your-secret-key-here
DEBUG=True
```

5. **Veritabanı migrasyonlarını çalıştırın:**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Süper kullanıcı oluşturun:**
```bash
python manage.py createsuperuser
```

7. **Geliştirme sunucusunu başlatın:**
```bash
python manage.py runserver
```

8. **Tarayıcınızda açın:**
```
http://127.0.0.1:8000/
```

## 📋 CSV Format Gereksinimleri

CSV dosyanız aşağıdaki sütunları içermelidir:

| Sütun Adı | Açıklama | Örnek |
|-----------|----------|-------|
| `receive_time` | Log tarihi ve saati | 2025-06-24 07:34:42 |
| `type` | Log türü | vulnerability, intrusion, malware |
| `severity` | Önem derecesi | low, medium, high, critical |
| `threat` | Tehdit açıklaması | Nmap Scripting Engine Detection |
| `source_ip` | Kaynak IP adresi | 185.67.33.193 |

### Örnek CSV İçeriği:
```csv
receive_time,type,severity,threat,source_ip
2025-06-24 07:34:42,vulnerability,medium,Nmap Scripting Engine Detection,185.67.33.193
2025-06-24 07:32:37,vulnerability,critical,Realtek SDK RCE,144.172.91.97
2025-06-24 07:30:15,intrusion,high,SQL Injection Attempt,192.168.1.100
```

## 🏗️ Proje Yapısı

```
log-analyzer/
├── log_analyzer/              # Ana proje dizini
│   ├── __init__.py
│   ├── settings.py           # Django ayarları
│   ├── urls.py              # Ana URL yapılandırması
│   ├── wsgi.py              # WSGI yapılandırması
│   └── asgi.py              # ASGI yapılandırması
├── logs/                     # Ana uygulama modülü
│   ├── models.py            # Veritabanı modelleri
│   ├── views.py             # API view'ları
│   ├── serializers.py       # DRF serializer'ları
│   ├── urls.py              # API URL'leri
│   ├── frontend_urls.py     # Frontend URL'leri
│   ├── frontend_views.py    # Frontend view'ları
│   └── admin.py             # Admin panel yapılandırması
├── templates/                # HTML şablonları
│   ├── base.html            # Ana şablon
│   ├── index.html           # Ana sayfa
│   ├── auth/                # Kimlik doğrulama şablonları
│   ├── dashboard/           # Dashboard şablonları
│   ├── logs/                # Log görüntüleme şablonları
│   ├── upload/              # Dosya yükleme şablonları
│   ├── statistics/          # İstatistik şablonları
│   └── profile/             # Profil şablonları
├── static/                   # Statik dosyalar
│   ├── css/
│   │   └── style.css        # Ana CSS dosyası
│   └── js/
│       ├── auth.js          # Kimlik doğrulama JS
│       └── utils.js         # Yardımcı fonksiyonlar
├── requirements.txt          # Python bağımlılıkları
├── manage.py                # Django yönetim scripti
└── README.md                # Bu dosya
```

## 🔗 API Endpoint'leri

### Kimlik Doğrulama
- `POST /api/auth/register/` - Kullanıcı kaydı
- `POST /api/auth/login/` - Kullanıcı girişi
- `POST /api/auth/refresh/` - Token yenileme

### Log İşlemleri
- `GET /api/logs/` - Log kayıtlarını listele
- `POST /api/upload/` - CSV dosya yükleme
- `GET /api/stats/` - İstatistik verileri

### Kullanıcı İşlemleri
- `GET /api/profile/` - Kullanıcı profili
- `GET /api/upload-history/` - Yükleme geçmişi

## 📊 Grafik Türleri

Sistem aşağıdaki grafik türlerini destekler:

1. **Severity Dağılımı** (Pie Chart) - Önem derecesi dağılımı
2. **IP Bazlı Log Sayısı** (Bar Chart) - En aktif IP adresleri
3. **Saatlik İşlem Yoğunluğu** (Line Chart) - 24 saatlik aktivite
4. **En Sık Tehditler** (Doughnut Chart) - Tehdit türü dağılımı
5. **Günlük Trend** (Area Chart) - 7 günlük aktivite trendi

## 🛠️ Geliştirme Notları

### Kullanılan Teknolojiler

**Backend:**
- Django 4.2.7
- Django REST Framework 3.14.0
- SimpleJWT 5.3.0
- Pandas 2.1.3
- SQLite (geliştirme)

**Frontend:**
- Bootstrap 5.3.0
- Chart.js
- Font Awesome 6.4.0
- Vanilla JavaScript
- Fetch API

### Güvenlik Özellikleri

- JWT token tabanlı kimlik doğrulama
- CORS koruması
- SQL injection koruması
- XSS koruması
- CSRF koruması
- Dosya türü validasyonu
- Dosya boyutu sınırlaması (10MB)

### Performans Optimizasyonları

- Database indexleme
- Pagination (sayfalama)
- Bulk insert operations
- Static file compression
- Browser caching
- API response caching

## 🔧 Konfigürasyon

### Environment Değişkenleri (.env)

```env
SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

### Production Ayarları

Production ortamı için aşağıdaki ayarları değiştirin:

1. `DEBUG = False`
2. `SECRET_KEY` - güçlü bir key kullanın
3. `ALLOWED_HOSTS` - domain'inizi ekleyin
4. PostgreSQL veya MySQL kullanın
5. Static files için CDN kullanın
6. HTTPS aktifleştirin

## 📝 API Dokümantasyonu

### Authentication Header
```javascript
Authorization: Bearer <your-jwt-token>
```

### Örnek API Kullanımı

```javascript
// Log listesi alma
const response = await fetch('/api/logs/', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

// CSV yükleme
const formData = new FormData();
formData.append('file', csvFile);

const response = await fetch('/api/upload/', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});
```

## 🐛 Sorun Giderme

### Yaygın Sorunlar

1. **Migration Hataları:**
```bash
python manage.py makemigrations --empty logs
python manage.py migrate --fake-initial
```

2. **Static Files Sorunu:**
```bash
python manage.py collectstatic
```

3. **JWT Token Sorunu:**
- Token süresini kontrol edin
- Refresh token kullanarak yenileyin

4. **CSV Import Hataları:**
- Dosya formatını kontrol edin
- Encoding'i UTF-8 olarak ayarlayın
- Sütun isimlerini kontrol edin

## 📱 Responsive Tasarım

Sistem tüm cihazlarda optimum görüntüleme için tasarlanmıştır:

- **Desktop:** Full özellik seti
- **Tablet:** Dokunmatik optimized
- **Mobile:** Compact layout, touch-friendly

## 🎨 Renk Paleti

```css
--primary-color: #0d6efd
--success-color: #198754
--danger-color: #dc3545
--warning-color: #ffc107
--info-color: #0dcaf0
```

## 📈 Gelecek Özellikler

- [ ] Email bildirimler
- [ ] Excel export
- [ ] Advanced filtering
- [ ] Real-time updates
- [ ] Dashboard widgets
- [ ] API rate limiting
- [ ] Multi-tenant support
- [ ] Advanced analytics

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 👨‍💻 Geliştirici

Django ve REST API ile geliştirildi.

---

⭐ Bu projeyi beğendiyseniz star vermeyi unutmayın!