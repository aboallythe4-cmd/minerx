// دالة لتحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// تهيئة التطبيق
function initializeApp() {
    startLiveClock();
    updateTimezoneInfo();
    setupEventListeners();
    startLivePrices();
    loadUserData();
    addManualRefreshButton();
    
    // إعداد المستخدم الافتراضي للتجربة
    setupDefaultUser();
    
    // تحديث معلومات التوقيت كل دقيقة
    setInterval(updateTimezoneInfo, 60000);
}

// ==================== نظام إدارة المستخدمين المحسن ====================

// تحميل بيانات المستخدمين من localStorage
function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

// حفظ بيانات المستخدمين في localStorage
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// التحقق من صحة كلمة المرور
function validatePassword(password) {
    const errors = [];
    
    if (password.length < 8) {
        errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
    }
    
    if (!/(?=.*[0-9])/.test(password)) {
        errors.push('يجب أن تحتوي على رقم واحد على الأقل');
    }
    
    if (!/(?=.*[!@#$%^&*])/.test(password)) {
        errors.push('يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%^&*)');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// التحقق من صحة البريد الإلكتروني
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// تسجيل مستخدم جديد
function registerUser(userData) {
    const users = getUsers();
    
    // التحقق إذا البريد الإلكتروني مسجل مسبقاً
    if (users.find(user => user.email === userData.email)) {
        return {
            success: false,
            message: 'هذا البريد الإلكتروني مسجل مسبقاً'
        };
    }
    
    // التحقق من صحة كلمة المرور
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
        return {
            success: false,
            message: passwordValidation.errors.join(', ')
        };
    }
    
    // التحقق من صحة البريد الإلكتروني
    if (!validateEmail(userData.email)) {
        return {
            success: false,
            message: 'البريد الإلكتروني غير صحيح'
        };
    }
    
    // إضافة المستخدم الجديد
    const newUser = {
        id: generateUserId(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        country: userData.country,
        password: userData.password,
        balance: 0,
        membership: 'Standard',
        joinDate: new Date().toISOString(),
        verified: true,
        lastLogin: null
    };
    
    users.push(newUser);
    saveUsers(users);
    
    return {
        success: true,
        message: 'تم إنشاء الحساب بنجاح',
        user: newUser
    };
}

// تسجيل الدخول
function loginUser(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return {
            success: false,
            message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        };
    }
    
    // تحديث آخر وقت تسجيل دخول
    user.lastLogin = new Date().toISOString();
    saveUsers(users);
    
    return {
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        user: user
    };
}

// توليد معرف فريد للمستخدم
function generateUserId() {
    return 'USER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// إعداد مستخدم افتراضي للتجربة
function setupDefaultUser() {
    const users = getUsers();
    if (users.length === 0) {
        const defaultUser = {
            id: 'default_user',
            firstName: 'مستخدم',
            lastName: 'تجريبي',
            email: 'demo@investogold.com',
            phone: '+966500000000',
            country: 'sa',
            password: 'Test123!',
            balance: 1000,
            membership: 'VIP',
            joinDate: new Date().toISOString(),
            verified: true,
            lastLogin: new Date().toISOString()
        };
        users.push(defaultUser);
        saveUsers(users);
    }
}

// ==================== تحديث دوال التسجيل والدخول ====================

// معالجة إنشاء حساب جديد
function handleRegister(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const country = document.getElementById('country').value;
    
    // التحقق من ملء جميع الحقول
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !country) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // التحقق من تطابق كلمتي المرور
    if (password !== confirmPassword) {
        showNotification('كلمتا المرور غير متطابقتين', 'error');
        return;
    }
    
    // إنشاء بيانات المستخدم
    const userData = {
        firstName,
        lastName,
        email,
        phone,
        password,
        country
    };
    
    // محاولة تسجيل المستخدم
    const result = registerUser(userData);
    
    if (result.success) {
        showNotification(result.message, 'success');
        
        // حفظ بيانات المستخدم الحالي
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        localStorage.setItem('userEmail', result.user.email);
        localStorage.setItem('isLoggedIn', 'true');
        
        // الانتقال إلى لوحة التحكم بعد تأخير بسيط
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    } else {
        showNotification(result.message, 'error');
    }
}

// معالجة تسجيل الدخول
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showNotification('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
        return;
    }
    
    // محاولة تسجيل الدخول
    const result = loginUser(email, password);
    
    if (result.success) {
        showNotification(result.message, 'success');
        
        // حفظ بيانات المستخدم الحالي
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        localStorage.setItem('userEmail', result.user.email);
        localStorage.setItem('isLoggedIn', 'true');
        
        // الانتقال إلى لوحة التحكم
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } else {
        showNotification(result.message, 'error');
    }
}


// ==================== نظام الباقات الاستثمارية ====================

let activeInvestments = JSON.parse(localStorage.getItem('activeInvestments')) || [];

// التحقق من الرصيد قبل الاستثمار
function checkBalanceAndInvest(amount) {
    const userData = JSON.parse(localStorage.getItem('currentUser')) || {};
    const currentBalance = userData.balance || 0;
    
    if (currentBalance < amount) {
        showBalanceWarning(amount, currentBalance);
        return false;
    }
    
    openInvestmentModal(amount);
    return true;
}

// عرض تحذير عدم كفاية الرصيد
function showBalanceWarning(requiredAmount, currentBalance) {
    const messageElement = document.getElementById('deposit-required-message');
    if (messageElement) {
        messageElement.style.display = 'block';
        messageElement.innerHTML = `
            <h3>💡 رصيد غير كافي</h3>
            <p>تحتاج إلى $${requiredAmount} لبدء هذا الاستثمار، بينما رصيدك الحالي هو $${currentBalance}.</p>
            <p><a href="deposit.html" style="color: #3498db; text-decoration: underline; font-weight: bold;">انقر هنا للإيداع</a></p>
        `;
        
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 10000);
    }
    
    showNotification(`رصيدك غير كافي! تحتاج إلى $${requiredAmount} بينما رصيدك $${currentBalance}`, 'error');
}

// فتح نموذج الاستثمار
function openInvestmentModal(amount) {
    const modal = document.getElementById('investmentModal');
    const cumulativeProfit = amount * 0.06;
    const monthlyProfit = amount * 1.5;
    const totalProfit = cumulativeProfit + monthlyProfit;
    
    document.getElementById('modal-invest-amount').textContent = `$${amount.toLocaleString()}`;
    document.getElementById('modal-cumulative-profit').textContent = `$${cumulativeProfit.toLocaleString()}`;
    document.getElementById('modal-monthly-profit').textContent = `$${monthlyProfit.toLocaleString()}`;
    document.getElementById('modal-total-profit').textContent = `$${totalProfit.toLocaleString()}`;
    
    modal.style.display = 'flex';
}

// إغلاق النموذج
function closeInvestmentModal() {
    document.getElementById('investmentModal').style.display = 'none';
}

// تأكيد الاستثمار
function confirmInvestment() {
    const amount = parseFloat(document.getElementById('modal-invest-amount').textContent.replace('$', '').replace(',', ''));
    const userData = JSON.parse(localStorage.getItem('currentUser')) || {};
    
    if ((userData.balance || 0) < amount) {
        showNotification('رصيدك غير كافي للاستثمار. يرجى إيداع الأموال أولاً.', 'error');
        closeInvestmentModal();
        showBalanceWarning(amount, userData.balance || 0);
        return;
    }
    
    userData.balance = (userData.balance || 0) - amount;
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    const investment = {
        id: generateInvestmentId(),
        amount: amount,
        startDate: new Date().toISOString(),
        nextCumulativeProfit: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        nextMonthlyProfit: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        totalCumulativeProfit: 0,
        totalMonthlyProfit: 0,
        status: 'active'
    };
    
    activeInvestments.push(investment);
    localStorage.setItem('activeInvestments', JSON.stringify(activeInvestments));
    
    closeInvestmentModal();
    updateActiveInvestmentsDisplay();
    updatePortfolioData();
    showNotification(`تم استثمار $${amount.toLocaleString()} بنجاح!`, 'success');
}

// توليد معرف فريد للاستثمار
function generateInvestmentId() {
    return 'INV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// تحديث عرض الاستثمارات النشطة
function updateActiveInvestmentsDisplay() {
    const tbody = document.getElementById('active-investments-body');
    
    if (activeInvestments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--gray-500); padding: 40px;">
                    لا توجد استثمارات نشطة حالياً
                </td>
            </tr>
        `;
        updatePortfolioData();
        return;
    }
    
    tbody.innerHTML = activeInvestments.map(investment => {
        const startDate = new Date(investment.startDate);
        const nextCumulative = new Date(investment.nextCumulativeProfit);
        const nextMonthly = new Date(investment.nextMonthlyProfit);
        const now = new Date();
        
        const cumulativeProgress = calculateProgress(startDate, nextCumulative, now);
        const monthlyProgress = calculateProgress(startDate, nextMonthly, now);
        
        return `
            <tr>
                <td>باقة $${investment.amount.toLocaleString()}</td>
                <td>$${investment.amount.toLocaleString()}</td>
                <td>${formatGregorianDate(startDate)}</td>
                <td>
                    <div>$${(investment.amount * 0.06).toLocaleString()}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${cumulativeProgress}%"></div>
                    </div>
                    <small>${formatTimeRemaining(nextCumulative - now)}</small>
                </td>
                <td>
                    <div>$${(investment.amount * 1.5).toLocaleString()}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${monthlyProgress}%"></div>
                    </div>
                    <small>${formatTimeRemaining(nextMonthly - now)}</small>
                </td>
                <td>
                    <span class="status-badge status-active">نشط</span>
                </td>
                <td>
                    <button onclick="withdrawProfit('${investment.id}')" class="btn-primary" style="padding: 6px 12px; font-size: 12px;">
                        سحب الأرباح
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    updatePortfolioData();
}

// ==================== نظام المحفظة الاستثمارية ====================

// تحديث بيانات المحفظة
function updatePortfolioData() {
    const userData = JSON.parse(localStorage.getItem('currentUser')) || { balance: 0 };
    const activeInvestments = JSON.parse(localStorage.getItem('activeInvestments')) || [];
    
    const availableBalance = userData.balance || 0;
    const totalInvestment = calculateTotalInvestment(activeInvestments);
    const totalProfits = calculateTotalProfits(activeInvestments);
    const nextCumulative = calculateNextCumulativeProfit(activeInvestments);
    const nextMonthly = calculateNextMonthlyProfit(activeInvestments);
    const totalPortfolio = availableBalance + totalInvestment + totalProfits;
    
    document.getElementById('available-balance').textContent = `$${availableBalance.toFixed(2)}`;
    document.getElementById('total-investment').textContent = `$${totalInvestment.toFixed(2)}`;
    document.getElementById('total-profits').textContent = `+$${totalProfits.toFixed(2)}`;
    document.getElementById('next-cumulative').textContent = `+$${nextCumulative.toFixed(2)}`;
    document.getElementById('next-monthly').textContent = `+$${nextMonthly.toFixed(2)}`;
    document.getElementById('total-portfolio').textContent = `$${totalPortfolio.toFixed(2)}`;
    
    const emptyMessage = document.getElementById('empty-portfolio-message');
    const portfolioItems = document.querySelector('.portfolio');
    
    if (activeInvestments.length === 0 && availableBalance === 0) {
        emptyMessage.style.display = 'block';
        portfolioItems.style.display = 'none';
    } else {
        emptyMessage.style.display = 'none';
        portfolioItems.style.display = 'grid';
    }
}

// حساب إجمالي الاستثمارات
function calculateTotalInvestment(investments) {
    return investments.reduce((total, investment) => {
        return total + investment.amount;
    }, 0);
}

// حساب إجمالي الأرباح المستحقة
function calculateTotalProfits(investments) {
    const now = new Date();
    let totalProfits = 0;
    
    investments.forEach(investment => {
        const nextCumulative = new Date(investment.nextCumulativeProfit);
        const nextMonthly = new Date(investment.nextMonthlyProfit);
        
        if (now >= nextCumulative) {
            totalProfits += investment.amount * 0.06;
        }
        
        if (now >= nextMonthly) {
            totalProfits += investment.amount * 1.5;
        }
    });
    
    return totalProfits;
}

// حساب الربح التراكمي القادم
function calculateNextCumulativeProfit(investments) {
    let total = 0;
    investments.forEach(investment => {
        total += investment.amount * 0.06;
    });
    return total;
}

// حساب الربح الشهري القادم
function calculateNextMonthlyProfit(investments) {
    let total = 0;
    investments.forEach(investment => {
        total += investment.amount * 1.5;
    });
    return total;
}

// التمرير إلى قسم الباقات
function scrollToPackages() {
    const packagesSection = document.querySelector('.packages-grid');
    if (packagesSection) {
        packagesSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// تنسيق التاريخ الميلادي
function formatGregorianDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// حساب التقدم
function calculateProgress(startDate, targetDate, currentDate) {
    const totalTime = targetDate - startDate;
    const elapsedTime = currentDate - startDate;
    
    if (totalTime <= 0) return 100;
    if (elapsedTime <= 0) return 0;
    
    return Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
}

// تنسيق الوقت المتبقي
function formatTimeRemaining(ms) {
    if (ms <= 0) return 'مستحق الآن';
    
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
        return `${days} يوم ${hours} ساعة`;
    } else if (hours > 0) {
        return `${hours} ساعة ${minutes} دقيقة`;
    } else {
        return `${minutes} دقيقة`;
    }
}

// سحب الأرباح
function withdrawProfit(investmentId) {
    const investment = activeInvestments.find(inv => inv.id === investmentId);
    if (!investment) return;
    
    const now = new Date();
    const nextCumulative = new Date(investment.nextCumulativeProfit);
    const nextMonthly = new Date(investment.nextMonthlyProfit);
    
    let profit = 0;
    let message = '';
    
    if (now >= nextCumulative) {
        profit += investment.amount * 0.06;
        investment.nextCumulativeProfit = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();
        investment.totalCumulativeProfit += investment.amount * 0.06;
        message += 'تم سحب الربح التراكمي ($' + (investment.amount * 0.06).toLocaleString() + ')';
    }
    
    if (now >= nextMonthly) {
        profit += investment.amount * 1.5;
        investment.nextMonthlyProfit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        investment.totalMonthlyProfit += investment.amount * 1.5;
        if (message) message += ' و ';
        message += 'الربح الشهري ($' + (investment.amount * 1.5).toLocaleString() + ')';
    }
    
    if (profit > 0) {
        updateUserBalance(profit);
        localStorage.setItem('activeInvestments', JSON.stringify(activeInvestments));
        updateActiveInvestmentsDisplay();
        updatePortfolioData();
        showNotification(`${message} - تم إضافة $${profit.toLocaleString()} إلى رصيدك`, 'success');
    } else {
        showNotification('لا توجد أرباح متاحة للسحب حالياً', 'info');
    }
}

// تحديث رصيد المستخدم
function updateUserBalance(amount) {
    const userData = JSON.parse(localStorage.getItem('currentUser')) || {};
    userData.balance = (userData.balance || 0) + amount;
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    updatePortfolioData();
    
    const balanceElements = document.querySelectorAll('.balance');
    balanceElements.forEach(element => {
        element.textContent = `$${(userData.balance || 0).toFixed(2)}`;
    });
}

// ==================== نظام المستخدم والأحداث ====================

// تحميل بيانات المستخدم
function loadUserData() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        const user = JSON.parse(userData);
        updateUserInterface(user);
    }
}

// تحديث واجهة المستخدم
function updateUserInterface(user) {
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(element => {
        element.textContent = `${user.firstName} ${user.lastName}`;
    });
    
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(element => {
        element.textContent = user.email;
    });

    updateProfilePage(user);
    
    const balanceElements = document.querySelectorAll('.balance');
    balanceElements.forEach(element => {
        element.textContent = `$${(user.balance || 0).toFixed(2)}`;
    });
}

// تحديث صفحة الملف الشخصي
function updateProfilePage(user) {
    if (document.getElementById('firstName')) {
        document.getElementById('firstName').value = user.firstName || '';
        document.getElementById('lastName').value = user.lastName || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('country').value = user.country || '';
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    const verifyForm = document.getElementById('verifyForm');
    if (verifyForm) {
        verifyForm.addEventListener('submit', handleVerification);
        loadVerificationEmail();
    }
    
    const depositForm = document.getElementById('depositForm');
    if (depositForm) {
        depositForm.addEventListener('submit', handleDeposit);
    }
    
    const withdrawForm = document.getElementById('withdrawForm');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', handleWithdraw);
    }
    
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    const paymentMethod = document.getElementById('paymentMethod');
    if (paymentMethod) {
        paymentMethod.addEventListener('change', togglePaymentDetails);
    }
    
    const withdrawMethod = document.getElementById('withdrawMethod');
    if (withdrawMethod) {
        withdrawMethod.addEventListener('change', toggleWithdrawDetails);
    }
    
    setupLogoutListeners();
}

// إعداد مستمعي تسجيل الخروج
function setupLogoutListeners() {
    const logoutLinks = document.querySelectorAll('a[href="index.html"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (!link.classList.contains('no-logout')) {
                e.preventDefault();
                handleLogout();
            }
        });
    });
}

// ==================== الدوال الأساسية من الملف الأصلي ====================

// بدء الساعة الحيَّة
function startLiveClock() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
}

// تحديث الوقت والتاريخ
function updateCurrentTime() {
    const now = new Date();
    
    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    
    const dateString = now.toLocaleDateString('en-US', dateOptions);
    const timeString = now.toLocaleTimeString('ar-SA', timeOptions);
    
    const timeElements = document.querySelectorAll('#current-time');
    timeElements.forEach(element => {
        element.textContent = `${dateString} - ${timeString}`;
    });
    
    updateDashboardDateTime(now);
}

// تحديث التاريخ والوقت في لوحة التحكم
function updateDashboardDateTime(now) {
    const dayElements = document.querySelectorAll('.current-day');
    dayElements.forEach(element => {
        element.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long'
        });
    });
    
    const dateElements = document.querySelectorAll('.current-date');
    dateElements.forEach(element => {
        element.textContent = now.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    });
    
    const timeOnlyElements = document.querySelectorAll('.current-time');
    timeOnlyElements.forEach(element => {
        element.textContent = now.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    });
}

// تحديث معلومات التوقيت
function updateTimezoneInfo() {
    const now = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneOffset = -now.getTimezoneOffset() / 60;
    const offsetSign = timezoneOffset >= 0 ? '+' : '';
    
    const timezoneElements = document.querySelectorAll('#timezone-info');
    timezoneElements.forEach(element => {
        element.textContent = `⏰ UTC ${offsetSign}${timezoneOffset} - ${getEnglishCityName(timezone)}`;
    });
}

// تحويل اسم المنطقة إلى الإنجليزية
function getEnglishCityName(timezone) {
    const cityMap = {
        'Asia/Riyadh': 'Riyadh',
        'Asia/Dubai': 'Dubai',
        'Asia/Kuwait': 'Kuwait',
        'Asia/Qatar': 'Doha',
        'Asia/Bahrain': 'Manama',
        'Asia/Muscat': 'Muscat',
        'Asia/Amman': 'Amman',
        'Asia/Beirut': 'Beirut',
        'Asia/Damascus': 'Damascus',
        'Asia/Baghdad': 'Baghdad',
        'Africa/Cairo': 'Cairo',
        'Europe/Istanbul': 'Istanbul',
        'Asia/Tehran': 'Tehran'
    };
    
    return cityMap[timezone] || timezone;
}

// ==================== دوال الإشعارات والرسائل ====================

// عرض الإشعارات
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 15px;
        min-width: 300px;
        max-width: 90%;
    `;
    
    notification.querySelector('button').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// ==================== دوال النظام الأخرى (من الملف الأصلي) ====================

function handleVerification(event) {
    event.preventDefault();
    
    const enteredCode = document.getElementById('verificationCode').value;
    
    if (!enteredCode || enteredCode.length !== 6) {
        showNotification('يرجى إدخال رمز التحقق المكون من 6 أرقام', 'error');
        return;
    }
    
    showNotification('تم التحقق من البريد الإلكتروني بنجاح!', 'success');
    
    const pendingUser = JSON.parse(localStorage.getItem('pendingUser'));
    if (pendingUser) {
        pendingUser.verified = true;
        localStorage.setItem('currentUser', JSON.stringify(pendingUser));
        localStorage.setItem('userEmail', pendingUser.email);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.removeItem('pendingUser');
    }
    
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 2000);
}

function resendVerificationCode() {
    const email = localStorage.getItem('verificationEmail');
    if (email) {
        showNotification('تم إعادة إرسال رمز التحقق', 'info');
    } else {
        showNotification('لم يتم العثور على بريد إلكتروني للتحقق', 'error');
    }
}

function loadVerificationEmail() {
    const email = localStorage.getItem('verificationEmail');
    const emailElement = document.getElementById('userEmail');
    if (emailElement && email) {
        emailElement.textContent = email;
    }
}

function handleDeposit(event) {
    event.preventDefault();
    
    const amount = parseFloat(document.getElementById('amount').value);
    const method = document.getElementById('paymentMethod').value;
    
    if (!amount || !method) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (amount < 10) {
        showNotification('الحد الأدنى للإيداع هو $10', 'error');
        return;
    }
    
    if (amount > 10000) {
        showNotification('الحد الأقصى للإيداع هو $10,000', 'error');
        return;
    }
    
    showNotification(`جاري معالجة إيداع بقيمة $${amount}...`, 'info');
    
    setTimeout(() => {
        updateUserBalance(amount);
        showNotification(`تم إيداع $${amount} بنجاح!`, 'success');
        document.getElementById('depositForm').reset();
        hideAllPaymentDetails();
    }, 3000);
}

function handleWithdraw(event) {
    event.preventDefault();
    
    const amount = document.getElementById('withdrawAmount').value;
    const method = document.getElementById('withdrawMethod').value;
    
    if (!amount || !method) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (amount < 50) {
        showNotification('الحد الأدنى للسحب هو $50', 'error');
        return;
    }
    
    showNotification(`جاري معالجة طلب السحب بقيمة $${amount}...`, 'info');
    
    setTimeout(() => {
        showNotification(`تم تقديم طلب سحب بقيمة $${amount} بنجاح! سيتم المعالجة خلال 1-3 أيام عمل.`, 'success');
        document.getElementById('withdrawForm').reset();
        hideAllWithdrawDetails();
    }, 3000);
}

function handleProfileUpdate(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const country = document.getElementById('country').value;
    
    const userData = {
        firstName,
        lastName,
        email,
        phone,
        country,
        joinDate: new Date().toISOString(),
        balance: 0,
        membership: 'Standard'
    };
    
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    showNotification('جاري حفظ التغييرات...', 'info');
    
    setTimeout(() => {
        showNotification('تم تحديث الملف الشخصي بنجاح!', 'success');
    }, 1500);
}

function togglePaymentDetails() {
    const method = document.getElementById('paymentMethod').value;
    hideAllPaymentDetails();
    
    if (method === 'creditcard') {
        document.getElementById('cardDetails').style.display = 'block';
    } else if (method === 'crypto') {
        document.getElementById('cryptoDetails').style.display = 'block';
    }
}

function hideAllPaymentDetails() {
    document.getElementById('cardDetails').style.display = 'none';
    document.getElementById('cryptoDetails').style.display = 'none';
}

function toggleWithdrawDetails() {
    const method = document.getElementById('withdrawMethod').value;
    hideAllWithdrawDetails();
    
    if (method === 'bank') {
        document.getElementById('bankDetails').style.display = 'block';
    } else if (method === 'paypal') {
        document.getElementById('paypalDetails').style.display = 'block';
    } else if (method === 'crypto') {
        document.getElementById('cryptoWithdrawDetails').style.display = 'block';
    }
}

function hideAllWithdrawDetails() {
    document.getElementById('bankDetails').style.display = 'none';
    document.getElementById('paypalDetails').style.display = 'none';
    document.getElementById('cryptoWithdrawDetails').style.display = 'none';
}

function changePassword() {
    const newPassword = prompt('أدخل كلمة المرور الجديدة:');
    if (newPassword) {
        if (newPassword.length < 8) {
            showNotification('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error');
            return;
        }
        
        showNotification('جاري تغيير كلمة المرور...', 'info');
        setTimeout(() => {
            showNotification('تم تغيير كلمة المرور بنجاح!', 'success');
        }, 1500);
    }
}

function viewLoginHistory() {
    showNotification('جاري تحميل سجل الدخول...', 'info');
    setTimeout(() => {
        showNotification('تم فتح سجل الدخول', 'success');
    }, 1000);
}

function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    showNotification('تم تسجيل الخروج بنجاح', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// ==================== التهيئة النهائية ====================

// التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    updateActiveInvestmentsDisplay();
    updatePortfolioData();
});

// جعل الأسعار متاحة globally للصفحات الأخرى
window.currentPrices = currentPrices;
window.fetchRealMarketPrices = fetchRealMarketPrices;