// Modern JavaScript Application for Log Analyzer

class ModernApp {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.notifications = [];
        this.charts = {};
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Initialize core functionality
            this.initializeEventListeners();
            this.initializeSidebar();
            this.initializeAuth();
            this.initializeSearch();
            this.initializeNotifications();
            
            // Load user session
            await this.loadUserSession();
            
            // Update navigation
            this.updateNavigation();
            
            // Set active page
            this.setActivePage();
            
            this.isInitialized = true;
            console.log('ModernApp initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showToast('Failed to initialize application', 'danger');
        }
    }

    initializeEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Window resize handler
        window.addEventListener('resize', () => this.handleResize());

        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });
        }

        // Notification button
        const notificationBtn = document.getElementById('notifications-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => this.toggleNotifications());
        }

        // Handle page unload
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    initializeSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        // Restore sidebar state
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
        }

        // Mobile overlay
        this.createSidebarOverlay();
    }

    createSidebarOverlay() {
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
            
            overlay.addEventListener('click', () => this.closeSidebar());
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (window.innerWidth <= 1024) {
            // Mobile behavior
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        } else {
            // Desktop behavior
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }

    handleResize() {
        if (window.innerWidth > 1024) {
            this.closeSidebar();
        }
    }

    initializeAuth() {
        // Check if user is authenticated
        this.currentUser = this.getCurrentUser();
        
        // Setup auth state change listeners
        this.setupAuthListeners();
    }

    setupAuthListeners() {
        // Listen for storage changes (multi-tab support)
        window.addEventListener('storage', (e) => {
            if (e.key === 'access_token' || e.key === 'user_data') {
                this.loadUserSession();
                this.updateNavigation();
            }
        });
    }

    async loadUserSession() {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                
                // Validate token
                const isValid = await this.validateToken();
                if (!isValid) {
                    this.logout();
                    return;
                }
                
                // Update user avatar
                this.updateUserAvatar();
                
            } catch (error) {
                console.error('Failed to load user session:', error);
                this.logout();
            }
        }
    }

    async validateToken() {
        const token = localStorage.getItem('access_token');
        if (!token) return false;
        
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
                return await this.refreshToken();
            }
            
            return false;
            
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    async refreshToken() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return false;
        
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
            }
            
            return false;
            
        } catch (error) {
            console.error('Token refresh error:', error);
            return false;
        }
    }

    updateNavigation() {
        const analysisGroup = document.getElementById('analysis-group');
        const profileNav = document.getElementById('profile-nav');
        const loginNav = document.getElementById('login-nav');
        const registerNav = document.getElementById('register-nav');
        const sidebarFooter = document.getElementById('sidebar-footer');
        const userMenu = document.getElementById('user-menu');
        
        if (this.currentUser) {
            // User is authenticated
            if (analysisGroup) analysisGroup.style.display = 'block';
            if (profileNav) profileNav.style.display = 'block';
            if (loginNav) loginNav.style.display = 'none';
            if (registerNav) registerNav.style.display = 'none';
            if (sidebarFooter) sidebarFooter.style.display = 'block';
            if (userMenu) userMenu.style.display = 'block';
            
        } else {
            // User is not authenticated
            if (analysisGroup) analysisGroup.style.display = 'none';
            if (profileNav) profileNav.style.display = 'none';
            if (loginNav) loginNav.style.display = 'block';
            if (registerNav) registerNav.style.display = 'block';
            if (sidebarFooter) sidebarFooter.style.display = 'none';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    updateUserAvatar() {
        if (!this.currentUser) return;
        
        const name = this.currentUser.first_name || this.currentUser.username || 'User';
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff&size=80`;
        
        const userAvatarImg = document.getElementById('user-avatar-img');
        const headerUserAvatar = document.getElementById('header-user-avatar');
        const userName = document.getElementById('user-name');
        
        if (userAvatarImg) userAvatarImg.src = avatarUrl;
        if (headerUserAvatar) headerUserAvatar.src = avatarUrl;
        if (userName) userName.textContent = name;
    }

    setActivePage() {
        const currentPath = window.location.pathname;
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === currentPath) {
                item.classList.add('active');
            }
        });
    }

    getCurrentUser() {
        const userData = localStorage.getItem('user_data');
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (error) {
                console.error('Failed to parse user data:', error);
                return null;
            }
        }
        return null;
    }

    isAuthenticated() {
        return !!this.currentUser && !!localStorage.getItem('access_token');
    }

    logout() {
        // Clear authentication data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        
        this.currentUser = null;
        
        // Update UI
        this.updateNavigation();
        
        // Redirect to home if on protected page
        const protectedPages = ['/dashboard/', '/logs/', '/upload/', '/statistics/', '/profile/'];
        if (protectedPages.includes(window.location.pathname)) {
            window.location.href = '/';
        }
        
        this.showToast('Successfully logged out', 'success');
    }

    // Search functionality
    initializeSearch() {
        this.searchCache = new Map();
    }

    async handleSearch(query) {
        if (!query || query.length < 2) return;
        
        // Check cache first
        if (this.searchCache.has(query)) {
            this.displaySearchResults(this.searchCache.get(query));
            return;
        }
        
        try {
            this.showLoading(true);
            
            const token = localStorage.getItem('access_token');
            if (!token) {
                this.showToast('Please login to search', 'warning');
                return;
            }
            
            const response = await fetch(`/api/logs/?search=${encodeURIComponent(query)}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.searchCache.set(query, data.results);
                this.displaySearchResults(data.results);
            } else {
                throw new Error('Search failed');
            }
            
        } catch (error) {
            console.error('Search error:', error);
            this.showToast('Search failed', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    displaySearchResults(results) {
        // This would typically show a dropdown with search results
        console.log('Search results:', results);
    }

    // Notifications
    initializeNotifications() {
        this.loadNotifications();
    }

    loadNotifications() {
        // Mock notifications for demo
        this.notifications = [
            {
                id: 1,
                type: 'warning',
                title: 'High Severity Alert',
                message: 'Multiple failed login attempts detected',
                timestamp: new Date(Date.now() - 5 * 60 * 1000),
                read: false
            },
            {
                id: 2,
                type: 'info',
                title: 'System Update',
                message: 'New threat signatures available',
                timestamp: new Date(Date.now() - 30 * 60 * 1000),
                read: false
            },
            {
                id: 3,
                type: 'success',
                title: 'Backup Completed',
                message: 'Daily backup process completed successfully',
                timestamp: new Date(Date.now() - 60 * 60 * 1000),
                read: true
            }
        ];
        
        this.updateNotificationBadge();
    }

    updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    toggleNotifications() {
        // This would typically show a notification panel
        this.showToast('Notifications panel would open here', 'info');
    }

    // API utilities
    async makeAuthenticatedRequest(url, options = {}) {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('No authentication token');
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
            const refreshed = await this.refreshToken();
            if (refreshed) {
                // Retry with new token
                const newToken = localStorage.getItem('access_token');
                headers['Authorization'] = `Bearer ${newToken}`;
                return await fetch(url, {
                    ...options,
                    headers
                });
            } else {
                this.logout();
                throw new Error('Authentication failed');
            }
        }
        
        return response;
    }

    // UI utilities
    showLoading(show = true) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showToast(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toastContainer');
        if (!container) {
            console.log(`Toast: ${message} (${type})`);
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    }

    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            danger: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    showAlert(type, message, duration = 5000) {
        const container = document.getElementById('alertContainer');
        if (!container) {
            this.showToast(message, type, duration);
            return;
        }
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        
        const icon = this.getToastIcon(type);
        
        alert.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
            <button type="button" class="btn-ghost btn-sm" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(alert);
        
        if (duration > 0) {
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.remove();
                }
            }, duration);
        }
    }

    // Chart utilities
    createChart(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`Canvas with id "${canvasId}" not found`);
            return null;
        }
        
        // Destroy existing chart if it exists
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        // Create new chart
        this.charts[canvasId] = new Chart(canvas, config);
        return this.charts[canvasId];
    }

    destroyChart(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    }

    destroyAllCharts() {
        Object.keys(this.charts).forEach(canvasId => {
            this.destroyChart(canvasId);
        });
    }

    // Utility functions
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    formatNumber(number, options = {}) {
        if (typeof number !== 'number') return number;
        
        const defaultOptions = {
            locale: 'en-US',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        };
        
        return number.toLocaleString(defaultOptions.locale, {
            ...defaultOptions,
            ...options
        });
    }

    formatDate(date, format = 'short') {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const options = {
            short: { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            },
            long: { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            },
            time: {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }
        };
        
        return d.toLocaleDateString('en-US', options[format] || options.short);
    }

    getRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) {
            return 'Just now';
        } else if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else if (days < 7) {
            return `${days}d ago`;
        } else {
            return this.formatDate(date);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Copied to clipboard', 'success', 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
                this.showToast('Failed to copy', 'danger');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                this.showToast('Copied to clipboard', 'success', 2000);
            } catch (err) {
                this.showToast('Failed to copy', 'danger');
            }
            document.body.removeChild(textArea);
        }
    }

    downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Animation utilities
    animateNumber(element, targetValue, duration = 1000) {
        if (!element) return;
        
        const startValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
        const difference = targetValue - startValue;
        const steps = 60;
        const stepValue = difference / steps;
        const stepDuration = duration / steps;
        
        let currentStep = 0;
        
        const timer = setInterval(() => {
            currentStep++;
            const newValue = Math.round(startValue + (stepValue * currentStep));
            element.textContent = this.formatNumber(newValue);
            
            if (currentStep >= steps) {
                clearInterval(timer);
                element.textContent = this.formatNumber(targetValue);
            }
        }, stepDuration);
    }

    // Page navigation utilities
    navigateTo(url) {
        window.location.href = url;
    }

    reload() {
        window.location.reload();
    }

    redirectAfterDelay(url, delay = 2000) {
        setTimeout(() => {
            this.navigateTo(url);
        }, delay);
    }

    // Form utilities
    getFormData(formElement) {
        if (!formElement) return {};
        
        const formData = new FormData(formElement);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    clearForm(formElement) {
        if (!formElement) return;
        
        formElement.reset();
        
        // Clear validation states
        const invalidElements = formElement.querySelectorAll('.is-invalid');
        invalidElements.forEach(el => el.classList.remove('is-invalid'));
        
        const errorMessages = formElement.querySelectorAll('.invalid-feedback');
        errorMessages.forEach(el => el.textContent = '');
    }

    showFieldError(fieldName, message) {
        const field = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);
        if (!field) return;
        
        field.classList.add('is-invalid');
        
        let errorElement = field.parentElement.querySelector('.invalid-feedback');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            field.parentElement.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }

    clearFieldErrors(formElement) {
        if (!formElement) return;
        
        const invalidFields = formElement.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => field.classList.remove('is-invalid'));
        
        const errorMessages = formElement.querySelectorAll('.invalid-feedback');
        errorMessages.forEach(error => error.textContent = '');
    }

    // Local storage utilities
    setStorageItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Failed to set storage item:', error);
            return false;
        }
    }

    getStorageItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Failed to get storage item:', error);
            return defaultValue;
        }
    }

    removeStorageItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove storage item:', error);
            return false;
        }
    }

    // Cleanup
    cleanup() {
        // Destroy all charts
        this.destroyAllCharts();
        
        // Clear any intervals or timeouts
        // (would need to track these if used)
        
        console.log('App cleanup completed');
    }
}

// Page-specific functionality
class DashboardPage {
    constructor(app) {
        this.app = app;
        this.refreshInterval = null;
        this.init();
    }

    async init() {
        await this.loadData();
        this.initializeCharts();
        this.startAutoRefresh();
    }

    async loadData() {
        try {
            this.app.showLoading(true);
            
            const [statsResponse, logsResponse] = await Promise.all([
                this.app.makeAuthenticatedRequest('/api/stats/'),
                this.app.makeAuthenticatedRequest('/api/logs/?limit=10')
            ]);
            
            if (statsResponse.ok && logsResponse.ok) {
                const statsData = await statsResponse.json();
                const logsData = await logsResponse.json();
                
                this.updateStatsCards(statsData);
                this.updateCharts(statsData);
                this.updateRecentLogs(logsData.results);
            }
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.app.showToast('Failed to load dashboard data', 'danger');
        } finally {
            this.app.showLoading(false);
        }
    }

    updateStatsCards(data) {
        const cards = [
            { id: 'totalLogs', value: data.total_logs },
            { id: 'criticalThreats', value: data.severity_stats?.critical || 0 },
            { id: 'last24Hours', value: data.last_24h_count },
            { id: 'uniqueIps', value: data.ip_stats?.length || 0 }
        ];
        
        cards.forEach(card => {
            const element = document.getElementById(card.id);
            if (element) {
                this.app.animateNumber(element, card.value);
            }
        });
    }

    updateCharts(data) {
        this.createThreatTrendChart(data.daily_stats);
        this.createSeverityChart(data.severity_stats);
        this.createTopIPsChart(data.ip_stats);
    }

    createThreatTrendChart(dailyData) {
        if (!dailyData || dailyData.length === 0) return;
        
        const config = {
            type: 'line',
            data: {
                labels: dailyData.map(item => item.date),
                datasets: [{
                    label: 'Threats Detected',
                    data: dailyData.map(item => item.count),
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        };
        
        this.app.createChart('threatTrendChart', config);
    }

    createSeverityChart(severityData) {
        if (!severityData) return;
        
        const data = [
            severityData.low || 0,
            severityData.medium || 0,
            severityData.high || 0,
            severityData.critical || 0
        ];
        
        const config = {
            type: 'doughnut',
            data: {
                labels: ['Low', 'Medium', 'High', 'Critical'],
                datasets: [{
                    data: data,
                    backgroundColor: ['#22c55e', '#eab308', '#f97316', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        };
        
        this.app.createChart('severityChart', config);
    }

    createTopIPsChart(ipData) {
        if (!ipData || ipData.length === 0) return;
        
        const top10 = ipData.slice(0, 10);
        
        const config = {
            type: 'bar',
            data: {
                labels: top10.map(item => item.source_ip),
                datasets: [{
                    label: 'Requests',
                    data: top10.map(item => item.count),
                    backgroundColor: '#0ea5e9',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    },
                    x: {
                        ticks: {
                            maxRotation: 45
                        }
                    }
                }
            }
        };
        
        this.app.createChart('topIPsChart', config);
    }

    updateRecentLogs(logs) {
        const container = document.getElementById('recentLogsTable');
        if (!container || !logs) return;
        
        if (logs.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">No recent logs found</td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = logs.map(log => {
            const severityClass = this.getSeverityClass(log.severity);
            const timeAgo = this.app.getRelativeTime(log.receive_time);
            
            return `
                <tr>
                    <td>${timeAgo}</td>
                    <td><span class="badge badge-${severityClass}">${log.severity}</span></td>
                    <td>${log.type}</td>
                    <td><code>${log.source_ip}</code></td>
                    <td title="${log.threat}">${this.truncateText(log.threat, 60)}</td>
                </tr>
            `;
        }).join('');
    }

    getSeverityClass(severity) {
        const classes = {
            low: 'success',
            medium: 'warning',
            high: 'warning',
            critical: 'danger'
        };
        return classes[severity] || 'gray';
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    initializeCharts() {
        // Chart containers would be created here
    }

    startAutoRefresh() {
        // Auto refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadData();
        }, 30000);
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Destroy charts
        ['threatTrendChart', 'severityChart', 'topIPsChart'].forEach(chartId => {
            this.app.destroyChart(chartId);
        });
    }
}

// Initialize application
let app;
let currentPage;

document.addEventListener('DOMContentLoaded', () => {
    app = new ModernApp();
    
    // Initialize page-specific functionality
    const path = window.location.pathname;
    
    if (path === '/dashboard/') {
        currentPage = new DashboardPage(app);
    }
    // Add other pages as needed
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (currentPage && typeof currentPage.destroy === 'function') {
        currentPage.destroy();
    }
    if (app) {
        app.cleanup();
    }
});

// Global functions for backwards compatibility
window.showAlert = (type, message, duration) => {
    if (app) {
        app.showAlert(type, message, duration);
    }
};

window.showLoading = (show) => {
    if (app) {
        app.showLoading(show);
    }
};

window.logout = () => {
    if (app) {
        app.logout();
    }
};