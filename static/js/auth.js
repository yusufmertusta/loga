/**
 * Authentication JavaScript Functions
 * JWT token yönetimi ve kullanıcı durumu kontrolü
 */

// Auth durumunu kontrol et ve UI'ı güncelle
function checkAuthStatus() {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    
    const loginNavItem = document.getElementById('loginNavItem');
    const registerNavItem = document.getElementById('registerNavItem');
    const authNavItems = document.getElementById('authNavItems');
    const userDropdown = document.getElementById('userDropdown');
    const usernameDisplay = document.getElementById('usernameDisplay');
    
    if (token && userData) {
        // Kullanıcı giriş yapmış
        if (loginNavItem) loginNavItem.style.display = 'none';
        if (registerNavItem) registerNavItem.style.display = 'none';
        if (authNavItems) authNavItems.style.display = 'block';
        if (userDropdown) userDropdown.style.display = 'block';
        
        // Kullanıcı adını göster
        if (usernameDisplay) {
            try {
                const user = JSON.parse(userData);
                usernameDisplay.textContent = user.first_name || user.username;
            } catch (e) {
                console.error('User data parse error:', e);
                usernameDisplay.textContent = 'Kullanıcı';
            }
        }
    } else {
        // Kullanıcı giriş yapmamış
        if (loginNavItem) loginNavItem.style.display = 'block';
        if (registerNavItem) registerNavItem.style.display = 'block';
        if (authNavItems) authNavItems.style.display = 'none';
        if (userDropdown) userDropdown.style.display = 'none';
    }
}

// Çıkış yap
function logout() {
    // localStorage'dan token'ları temizle
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    
    // Ana sayfaya yönlendir
    window.location.href = '/';
}

// Token'ın geçerliliğini kontrol et
async function validateToken() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        return false;
    }
    
    try {
        const response = await fetch('/api/profile/', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            return true;
        } else if (response.status === 401) {
            // Token geçersiz, refresh token ile yenile
            return await refreshToken();
        } else {
            return false;
        }
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}

// Refresh token ile access token yenile
async function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        return false;
    }
    
    try {
        const response = await fetch('/api/auth/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                refresh: refreshToken
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access);
            return true;
        } else {
            // Refresh token da geçersiz, çıkış yap
            logout();
            return false;
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        logout();
        return false;
    }
}

// API istekleri için auth header ekle
function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    if (token) {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    return {
        'Content-Type': 'application/json'
    };
}

// Korumalı API isteği yap
async function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        throw new Error('Authentication required');
    }
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        // Token geçersiz, refresh dene
        const refreshed = await refreshToken();
        if (refreshed) {
            // Yeni token ile tekrar dene
            const newToken = localStorage.getItem('access_token');
            headers['Authorization'] = `Bearer ${newToken}`;
            return await fetch(url, {
                ...options,
                headers
            });
        } else {
            throw new Error('Authentication failed');
        }
    }
    
    return response;
}

// Sayfa yüklendiğinde token kontrolü
document.addEventListener('DOMContentLoaded', function() {
    // Korumalı sayfalar listesi
    const protectedPages = ['/dashboard/', '/logs/', '/upload/', '/statistics/', '/profile/'];
    const currentPath = window.location.pathname;
    
    // Eğer korumalı bir sayfadaysa token kontrolü yap
    if (protectedPages.includes(currentPath)) {
        validateToken().then(isValid => {
            if (!isValid) {
                window.location.href = '/login/';
            }
        });
    }
    
    // Login/register sayfalarında zaten giriş yapılmışsa dashboard'a yönlendir
    if (['/login/', '/register/'].includes(currentPath)) {
        const token = localStorage.getItem('access_token');
        if (token) {
            validateToken().then(isValid => {
                if (isValid) {
                    window.location.href = '/dashboard/';
                }
            });
        }
    }
});

// Token'ın expire zamanını kontrol et
function isTokenExpired(token) {
    if (!token) return true;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp < currentTime;
    } catch (error) {
        console.error('Token parse error:', error);
        return true;
    }
}

// Kullanıcı bilgilerini al
function getCurrentUser() {
    const userData = localStorage.getItem('user_data');
    if (userData) {
        try {
            return JSON.parse(userData);
        } catch (error) {
            console.error('User data parse error:', error);
            return null;
        }
    }
    return null;
}

// Kullanıcı giriş yapmış mı kontrolü
function isAuthenticated() {
    const token = localStorage.getItem('access_token');
    return token && !isTokenExpired(token);
}

// Auth durumu değiştiğinde callback çalıştır
let authCallbacks = [];

function onAuthStateChange(callback) {
    authCallbacks.push(callback);
}

function triggerAuthStateChange() {
    authCallbacks.forEach(callback => {
        try {
            callback(isAuthenticated(), getCurrentUser());
        } catch (error) {
            console.error('Auth callback error:', error);
        }
    });
}

// Storage değişikliklerini dinle (multi-tab support)
window.addEventListener('storage', function(e) {
    if (e.key === 'access_token' || e.key === 'user_data') {
        checkAuthStatus();
        triggerAuthStateChange();
    }
});

// Her 5 dakikada bir token kontrolü yap
setInterval(() => {
    if (isAuthenticated()) {
        validateToken();
    }
}, 5 * 60 * 1000);