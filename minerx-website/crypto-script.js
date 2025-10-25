// العملات التي نريد عرضها
const cryptoIds = [
    'bitcoin', 'ethereum', 'binancecoin', 'ripple', 'cardano',
    'solana', 'dogecoin', 'polkadot', 'litecoin', 'chainlink'
];

// حالة التصفية والبحث
let currentFilter = 'all';
let searchQuery = '';
let cryptoData = [];

// تحميل البيانات من API
async function fetchCryptoData() {
    try {
        const ids = cryptoIds.join(',');
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
        );
        
        if (!response.ok) {
            throw new Error('فشل في جلب البيانات');
        }
        
        const data = await response.json();
        cryptoData = data;
        displayCryptoData(data);
        updateStats(data);
        updateLastUpdated();
        
    } catch (error) {
        console.error('Error:', error);
        const cryptoGrid = document.getElementById('crypto-grid');
        if (cryptoGrid) {
            cryptoGrid.innerHTML = `
                <div class="crypto-loading">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>حدث خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى لاحقاً.</p>
                    <button onclick="fetchCryptoData()" style="margin-top: 15px; padding: 10px 20px; background: #f7931a; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        إعادة المحاولة
                    </button>
                </div>
            `;
        }
    }
}

// عرض بيانات العملات
function displayCryptoData(data) {
    const cryptoGrid = document.getElementById('crypto-grid');
    if (!cryptoGrid) return;
    
    // تصفية البيانات حسب البحث والتصفية
    let filteredData = data.filter(crypto => {
        const matchesSearch = crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesFilter = true;
        if (currentFilter === 'gainers') {
            matchesFilter = crypto.price_change_percentage_24h > 0;
        } else if (currentFilter === 'losers') {
            matchesFilter = crypto.price_change_percentage_24h < 0;
        }
        
        return matchesSearch && matchesFilter;
    });
    
    // إذا لم توجد نتائج
    if (filteredData.length === 0) {
        cryptoGrid.innerHTML = `
            <div class="crypto-loading">
                <i class="fas fa-search"></i>
                <p>لم يتم العثور على عملات تطابق معايير البحث.</p>
                <button onclick="resetFilters()" style="margin-top: 15px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    إعادة تعيين الفلتر
                </button>
            </div>
        `;
        return;
    }
    
    // إنشاء البطاقات
    cryptoGrid.innerHTML = filteredData.map(crypto => {
        const changeClass = crypto.price_change_percentage_24h >= 0 ? 'crypto-positive' : 'crypto-negative';
        const changeIcon = crypto.price_change_percentage_24h >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        const changeValue = crypto.price_change_percentage_24h ? 
            crypto.price_change_percentage_24h.toFixed(2) : '0.00';
        
        return `
            <div class="crypto-card ${crypto.id}">
                <div class="crypto-header-card">
                    <img src="${crypto.image}" alt="${crypto.name}" class="crypto-icon">
                    <div>
                        <div class="crypto-name">${crypto.name}</div>
                        <span class="crypto-symbol">${crypto.symbol.toUpperCase()}</span>
                        <span style="color: #6c757d; font-size: 0.8rem;">#${crypto.market_cap_rank}</span>
                    </div>
                </div>
                
                <div class="crypto-price">$${formatCryptoPrice(crypto.current_price, crypto.symbol)}</div>
                
                <div class="crypto-price-change ${changeClass}">
                    <i class="fas ${changeIcon}"></i> ${changeValue}%
                </div>
                
                <div class="crypto-details">
                    <div class="crypto-detail-item">
                        <span class="crypto-detail-label">القيمة السوقية</span>
                        <span class="crypto-detail-value">$${formatMarketCap(crypto.market_cap)}</span>
                    </div>
                    <div class="crypto-detail-item">
                        <span class="crypto-detail-label">حجم التداول (24س)</span>
                        <span class="crypto-detail-value">$${formatVolume(crypto.total_volume)}</span>
                    </div>
                    <div class="crypto-detail-item">
                        <span class="crypto-detail-label">أعلى سعر (24س)</span>
                        <span class="crypto-detail-value">$${formatCryptoPrice(crypto.high_24h, crypto.symbol)}</span>
                    </div>
                    <div class="crypto-detail-item">
                        <span class="crypto-detail-label">أقل سعر (24س)</span>
                        <span class="crypto-detail-value">$${formatCryptoPrice(crypto.low_24h, crypto.symbol)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// تحديث الإحصائيات
function updateStats(data) {
    const totalMarketCap = document.getElementById('crypto-total-market-cap');
    const totalVolume = document.getElementById('crypto-total-volume');
    const btcDominance = document.getElementById('crypto-btc-dominance');
    
    if (!totalMarketCap || !totalVolume || !btcDominance) return;
    
    // حساب الإحصائيات
    const totalMCap = data.reduce((sum, crypto) => sum + crypto.market_cap, 0);
    const totalVol = data.reduce((sum, crypto) => sum + crypto.total_volume, 0);
    
    totalMarketCap.textContent = `$${(totalMCap / 1e12).toFixed(2)} تريليون`;
    totalVolume.textContent = `$${(totalVol / 1e9).toFixed(2)} مليار`;
    
    // هيمنة البيتكوين
    const btc = data.find(crypto => crypto.id === 'bitcoin');
    if (btc) {
        const dominance = ((btc.market_cap / totalMCap) * 100).toFixed(1);
        btcDominance.textContent = `${dominance}%`;
    }
}

// تحديث وقت آخر تحديث
function updateLastUpdated() {
    const lastUpdated = document.getElementById('crypto-update-time');
    if (lastUpdated) {
        const now = new Date();
        lastUpdated.textContent = now.toLocaleTimeString('ar-SA');
    }
}

// تنسيق القيمة السوقية
function formatMarketCap(marketCap) {
    if (marketCap >= 1e12) {
        return (marketCap / 1e12).toFixed(2) + 'T';
    } else if (marketCap >= 1e9) {
        return (marketCap / 1e9).toFixed(2) + 'B';
    } else if (marketCap >= 1e6) {
        return (marketCap / 1e6).toFixed(2) + 'M';
    } else {
        return marketCap.toLocaleString();
    }
}

// تنسيق حجم التداول
function formatVolume(volume) {
    if (volume >= 1e9) {
        return (volume / 1e9).toFixed(2) + 'B';
    } else if (volume >= 1e6) {
        return (volume / 1e6).toFixed(2) + 'M';
    } else if (volume >= 1e3) {
        return (volume / 1e3).toFixed(2) + 'K';
    } else {
        return volume.toLocaleString();
    }
}

// تنسيق سعر العملة بناء على قيمتها
function formatCryptoPrice(price, symbol) {
    if (price < 0.01) {
        return price.toFixed(6);
    } else if (price < 1) {
        return price.toFixed(4);
    } else if (price < 1000) {
        return price.toFixed(2);
    } else {
        return price.toLocaleString(undefined, {maximumFractionDigits: 0});
    }
}

// إعادة تعيين الفلاتر
function resetFilters() {
    searchQuery = '';
    currentFilter = 'all';
    
    const searchInput = document.getElementById('crypto-search-input');
    const filterButtons = document.querySelectorAll('.crypto-filter-btn');
    
    if (searchInput) searchInput.value = '';
    
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'all') {
            btn.classList.add('active');
        }
    });
    
    if (cryptoData.length > 0) {
        displayCryptoData(cryptoData);
    }
}

// إعداد معالجات الأحداث
function setupCryptoEventListeners() {
    // البحث
    const searchInput = document.getElementById('crypto-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            if (cryptoData.length > 0) {
                displayCryptoData(cryptoData);
            }
        });
    }
    
    // أزرار التصفية
    const filterButtons = document.querySelectorAll('.crypto-filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            if (cryptoData.length > 0) {
                displayCryptoData(cryptoData);
            }
        });
    });
}

// التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تحميل البيانات إذا كان القسم موجوداً في الصفحة
    if (document.getElementById('crypto-grid')) {
        fetchCryptoData();
        setupCryptoEventListeners();
        
        // تحديث البيانات كل دقيقة
        setInterval(fetchCryptoData, 60000);
    }
});

// جعل الدوال متاحة globally
window.fetchCryptoData = fetchCryptoData;
window.resetFilters = resetFilters;