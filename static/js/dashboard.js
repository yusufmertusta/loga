// Modern Dashboard JavaScript
class Dashboard {
    constructor() {
        this.charts = {};
        this.data = {
            stats: {
                totalThreats: 24847,
                blockedThreats: 1247,
                activeThreats: 47,
                uniqueIps: 8924
            },
            threatAnalysis: [],
            severityData: {
                critical: 127,
                high: 453,
                medium: 832,
                low: 1247
            },
            recentThreats: []
        };
        
        this.init();
    }

    init() {
        this.initSidebar();
        this.initSearch();
        this.initNotifications();
        this.loadData();
        this.initCharts();
        this.startRealTimeUpdates();
        this.initAnimations();
    }

    // Sidebar Management
    initSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            });

            // Restore sidebar state
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
            }
        }

        // Mobile sidebar toggle
        this.initMobileSidebar();
    }

    initMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        
        // Add overlay to body
        document.body.appendChild(overlay);
        
        // Toggle sidebar on mobile
        const toggleMobileSidebar = () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        };

        // Close sidebar when clicking overlay
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        });
    }

    // Search Functionality
    initSearch() {
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
    }

    handleSearch(query) {
        if (query.length < 2) return;
        
        console.log('Searching for:', query);
        // Implement search logic here
        this.showNotification('Search results will appear here', 'info');
    }

    // Notifications
    initNotifications() {
        const notificationBtn = document.querySelector('.notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.showNotificationPanel();
            });
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-triangle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    showNotificationPanel() {
        // Mock notification panel
        this.showNotification('3 new security alerts', 'warning');
    }

    // Data Loading
    async loadData() {
        try {
            this.showLoading(true);
            
            // Simulate API calls
            await this.loadStats();
            await this.loadThreatAnalysis();
            await this.loadRecentThreats();
            
            this.updateUI();
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showNotification('Error loading dashboard data', 'error');
            this.showLoading(false);
        }
    }

    async loadStats() {
        // Simulate API delay
        await this.delay(500);
        
        // Generate some realistic data
        this.data.stats = {
            totalThreats: this.generateRandomStat(20000, 30000),
            blockedThreats: this.generateRandomStat(1000, 2000),
            activeThreats: this.generateRandomStat(30, 80),
            uniqueIps: this.generateRandomStat(8000, 12000)
        };
    }

    async loadThreatAnalysis() {
        await this.delay(300);
        
        // Generate 7 days of data
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        this.data.threatAnalysis = days.map(day => ({
            day,
            threats: this.generateRandomStat(50, 200),
            blocked: this.generateRandomStat(30, 150)
        }));
    }

    async loadRecentThreats() {
        await this.delay(200);
        
        const threatTypes = [
            { name: 'SQL Injection Attempt', type: 'Web Attack', severity: 'critical' },
            { name: 'Malware Detection', type: 'Malware', severity: 'high' },
            { name: 'Brute Force Attack', type: 'Authentication', severity: 'medium' },
            { name: 'DDoS Attack', type: 'Network', severity: 'high' },
            { name: 'Phishing Email', type: 'Email', severity: 'medium' },
            { name: 'Ransomware Detected', type: 'Malware', severity: 'critical' }
        ];

        this.data.recentThreats = Array.from({ length: 5 }, (_, i) => {
            const threat = threatTypes[Math.floor(Math.random() * threatTypes.length)];
            return {
                ...threat,
                time: this.generateRecentTime(i),
                ip: this.generateRandomIP(),
                status: Math.random() > 0.3 ? 'blocked' : 'investigating'
            };
        });
    }

    // Chart Initialization
    initCharts() {
        this.initThreatAnalysisChart();
        this.initSeverityChart();
    }

    initThreatAnalysisChart() {
        const ctx = document.getElementById('threatAnalysisChart');
        if (!ctx) return;

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(14, 165, 233, 0.3)');
        gradient.addColorStop(1, 'rgba(14, 165, 233, 0.05)');

        this.charts.threatAnalysis = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.data.threatAnalysis.map(d => d.day),
                datasets: [{
                    label: 'Threats Detected',
                    data: this.data.threatAnalysis.map(d => d.threats),
                    borderColor: '#0ea5e9',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#0ea5e9',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: 'rgba(14, 165, 233, 0.3)',
                        borderWidth: 1,
                        cornerRadius: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `Threats: ${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                size: 12,
                                family: 'Inter'
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                size: 12,
                                family: 'Inter'
                            }
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutCubic'
                }
            }
        });
    }

    initSeverityChart() {
        const ctx = document.getElementById('severityChart');
        if (!ctx) return;

        const data = [
            this.data.severityData.critical,
            this.data.severityData.high,
            this.data.severityData.medium,
            this.data.severityData.low
        ];

        const colors = ['#ef4444', '#f59e0b', '#06b6d4', '#22c55e'];

        this.charts.severity = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Critical', 'High', 'Medium', 'Low'],
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    cutout: '75%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: 'rgba(14, 165, 233, 0.3)',
                        borderWidth: 1,
                        cornerRadius: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed * 100) / total).toFixed(1);
                                return `${context.label}: ${context.parsed.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutCubic'
                }
            }
        });
    }

    // UI Updates
    updateUI() {
        this.updateStats();
        this.updateCharts();
        this.updateRecentThreats();
        this.updateSystemStatus();
    }

    updateStats() {
        this.animateCounter('totalThreats', this.data.stats.totalThreats);
        this.animateCounter('blockedThreats', this.data.stats.blockedThreats);
        this.animateCounter('activeThreats', this.data.stats.activeThreats);
        this.animateCounter('uniqueIps', this.data.stats.uniqueIps);

        // Update severity counts
        document.getElementById('criticalCount').textContent = this.data.severityData.critical.toLocaleString();
        document.getElementById('highCount').textContent = this.data.severityData.high.toLocaleString();
        document.getElementById('mediumCount').textContent = this.data.severityData.medium.toLocaleString();
        document.getElementById('lowCount').textContent = this.data.severityData.low.toLocaleString();
    }

    updateCharts() {
        if (this.charts.threatAnalysis) {
            this.charts.threatAnalysis.data.labels = this.data.threatAnalysis.map(d => d.day);
            this.charts.threatAnalysis.data.datasets[0].data = this.data.threatAnalysis.map(d => d.threats);
            this.charts.threatAnalysis.update('active');
        }

        if (this.charts.severity) {
            const data = [
                this.data.severityData.critical,
                this.data.severityData.high,
                this.data.severityData.medium,
                this.data.severityData.low
            ];
            this.charts.severity.data.datasets[0].data = data;
            this.charts.severity.update('active');
        }
    }

    updateRecentThreats() {
        const tableBody = document.getElementById('recentThreatsTable');
        if (!tableBody) return;

        tableBody.innerHTML = this.data.recentThreats.map(threat => `
            <tr class="threat-row" onclick="dashboard.showThreatDetails('${threat.name}')">
                <td>
                    <div class="time-info">
                        <div class="time">${threat.time.time}</div>
                        <div class="date">${threat.time.date}</div>
                    </div>
                </td>
                <td>
                    <div class="threat-info">
                        <div class="threat-name">${threat.name}</div>
                        <div class="threat-type">${threat.type}</div>
                    </div>
                </td>
                <td>
                    <code class="ip-address">${threat.ip}</code>
                </td>
                <td>
                    <span class="severity-badge ${threat.severity}">${this.capitalizeFirst(threat.severity)}</span>
                </td>
                <td>
                    <span class="status-badge ${threat.status}">${this.capitalizeFirst(threat.status)}</span>
                </td>
            </tr>
        `).join('');
    }

    updateSystemStatus() {
        // Simulate real-time system metrics
        const metrics = [
            { id: 'cpu', value: this.generateRandomStat(50, 90) },
            { id: 'memory', value: this.generateRandomStat(60, 95) },
            { id: 'network', value: this.generateRandomStat(20, 80) },
            { id: 'storage', value: this.generateRandomStat(15, 60) }
        ];

        metrics.forEach(metric => {
            const progressBar = document.querySelector(`.status-progress[style*="width: ${metric.value}%"]`);
            if (progressBar) {
                progressBar.style.width = `${metric.value}%`;
                
                // Update warning state
                if (metric.value > 80) {
                    progressBar.classList.add('warning');
                } else {
                    progressBar.classList.remove('warning');
                }
            }
        });
    }

    // Real-time Updates
    startRealTimeUpdates() {
        // Update stats every 30 seconds
        setInterval(() => {
            this.loadStats().then(() => {
                this.updateStats();
            });
        }, 30000);

        // Update charts every 2 minutes
        setInterval(() => {
            this.loadThreatAnalysis().then(() => {
                this.updateCharts();
            });
        }, 120000);

        // Update threats every minute
        setInterval(() => {
            this.loadRecentThreats().then(() => {
                this.updateRecentThreats();
            });
        }, 60000);

        // Update system status every 5 seconds
        setInterval(() => {
            this.updateSystemStatus();
        }, 5000);
    }

    // Animations
    initAnimations() {
        // Intersection Observer for fade-in animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, { threshold: 0.1 });

        // Observe all cards
        document.querySelectorAll('.stat-card, .chart-card, .table-card, .status-card').forEach(card => {
            observer.observe(card);
        });
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const currentValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
        const increment = (targetValue - currentValue) / 60;
        let current = currentValue;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
                current = targetValue;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, 16);
    }

    // Event Handlers
    showThreatDetails(threatName) {
        this.showNotification(`Viewing details for: ${threatName}`, 'info');
        // Implement threat details modal/page here
    }

    // Loading State
    showLoading(show) {
        const dashboard = document.querySelector('.dashboard-content');
        if (dashboard) {
            if (show) {
                dashboard.classList.add('loading');
            } else {
                dashboard.classList.remove('loading');
            }
        }
    }

    // Utility Functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateRandomStat(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generateRandomIP() {
        return `${this.generateRandomStat(1, 255)}.${this.generateRandomStat(0, 255)}.${this.generateRandomStat(0, 255)}.${this.generateRandomStat(1, 255)}`;
    }

    generateRecentTime(index) {
        const now = new Date();
        const time = new Date(now.getTime() - (index * 5 * 60 * 1000)); // 5 minutes apart
        
        return {
            time: time.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            }),
            date: time.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            })
        };
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Filter Management
    handleTimeFilter(period) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Update chart data based on period
        this.loadThreatAnalysis(period).then(() => {
            this.updateCharts();
        });

        this.showNotification(`Switched to ${period} view`, 'info', 2000);
    }

    // Export Functions
    exportData(format = 'csv') {
        const data = {
            stats: this.data.stats,
            threatAnalysis: this.data.threatAnalysis,
            recentThreats: this.data.recentThreats
        };

        let content = '';
        let filename = `dashboard-export-${new Date().toISOString().split('T')[0]}`;

        if (format === 'csv') {
            content = this.convertToCSV(data);
            filename += '.csv';
        } else if (format === 'json') {
            content = JSON.stringify(data, null, 2);
            filename += '.json';
        }

        this.downloadFile(content, filename, format === 'csv' ? 'text/csv' : 'application/json');
        this.showNotification(`Data exported as ${format.toUpperCase()}`, 'success');
    }

    convertToCSV(data) {
        let csv = 'Category,Metric,Value\n';
        
        // Add stats
        Object.entries(data.stats).forEach(([key, value]) => {
            csv += `Stats,${key},${value}\n`;
        });

        // Add threat analysis
        data.threatAnalysis.forEach(item => {
            csv += `ThreatAnalysis,${item.day},${item.threats}\n`;
        });

        return csv;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Refresh Data
    async refreshData() {
        this.showNotification('Refreshing dashboard data...', 'info', 2000);
        await this.loadData();
        this.showNotification('Dashboard data refreshed', 'success');
    }

    // Theme Management
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('darkTheme', document.body.classList.contains('dark-theme'));
        this.showNotification('Theme switched', 'info', 2000);
    }

    // Keyboard Shortcuts
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only trigger if not in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case 'r':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.refreshData();
                    }
                    break;
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        document.querySelector('.search-input').focus();
                    }
                    break;
                case 'Escape':
                    // Close any open modals or panels
                    document.querySelectorAll('.modal, .panel').forEach(el => {
                        el.classList.remove('show');
                    });
                    break;
            }
        });
    }
}

// Additional CSS for notifications and loading states
const additionalStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        border-left: 4px solid;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 10000;
        min-width: 300px;
        max-width: 400px;
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification-success {
        border-left-color: #22c55e;
    }

    .notification-error {
        border-left-color: #ef4444;
    }

    .notification-warning {
        border-left-color: #f59e0b;
    }

    .notification-info {
        border-left-color: #06b6d4;
    }

    .notification-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
    }

    .notification-close {
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.15s ease;
    }

    .notification-close:hover {
        background: #f3f4f6;
        color: #374151;
    }

    .loading {
        opacity: 0.6;
        pointer-events: none;
        position: relative;
    }

    .loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 32px;
        height: 32px;
        border: 3px solid #f3f4f6;
        border-top: 3px solid #0ea5e9;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        transform: translate(-50%, -50%);
        z-index: 1000;
    }

    @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
    }

    .threat-row {
        cursor: pointer;
        transition: background-color 0.15s ease;
    }

    .threat-row:hover {
        background-color: #f8fafc;
    }

    .sidebar-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }

    .sidebar-overlay.active {
        opacity: 1;
        visibility: visible;
    }

    @media (max-width: 768px) {
        .notification {
            left: 20px;
            right: 20px;
            min-width: auto;
            max-width: none;
            transform: translateY(-100px);
        }

        .notification.show {
            transform: translateY(0);
        }
    }

    /* Dark theme styles */
    .dark-theme {
        --bg-primary: #1e293b;
        --bg-secondary: #0f172a;
        --bg-tertiary: #334155;
        --text-primary: #f8fafc;
        --text-secondary: #cbd5e1;
        --text-tertiary: #94a3b8;
        --border-color: #334155;
        --border-color-light: #475569;
    }

    .dark-theme .notification {
        background: #1e293b;
        color: #f8fafc;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
    
    // Add event listeners for time filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const period = e.target.textContent;
            dashboard.handleTimeFilter(period);
        });
    });

    // Add event listeners for action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon.classList.contains('fa-sync-alt')) {
            btn.addEventListener('click', () => dashboard.refreshData());
        } else if (icon.classList.contains('fa-download')) {
            btn.addEventListener('click', () => dashboard.exportData('csv'));
        }
    });

    // Initialize keyboard shortcuts
    dashboard.initKeyboardShortcuts();
});

// Global function for time filter (if needed)
window.filterTime = (period) => {
    if (dashboard) {
        dashboard.handleTimeFilter(period);
    }
};