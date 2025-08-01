/**
 * CrazyGift - Main Application Controller
 * Основной контроллер приложения
 */

// Global Game State
window.GameState = {
    balance: 1451,
    inventory: [],
    currentPage: 'main',
    user: null,
    settings: {
        soundEnabled: true,
        animationsEnabled: true
    }
};

// App Configuration
window.AppConfig = {
    version: '1.0.0',
    apiUrl: '', // Будет добавлено позже
    casePrices: {
        1: 150,
        2: 250,
        3: 500,
        4: 1000
    },
    demoMode: true
};

/**
 * Initialize Application
 */
function initApp() {
    console.log('🚀 CrazyGift App Starting...');
    
    // Initialize Telegram WebApp
    initTelegramApp();
    
    // Load saved data
    loadGameState();
    
    // Update UI
    updateBalance();
    updateInventoryCount();
    
    // Set current page
    setActivePage(GameState.currentPage);
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ App initialized successfully');
}

/**
 * Initialize Telegram WebApp
 */
function initTelegramApp() {
    if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        
        try {
            tg.ready();
            tg.expand();
            
            // Set theme colors
            if (tg.themeParams.bg_color) {
                document.documentElement.style.setProperty('--bg-primary', tg.themeParams.bg_color);
            }
            
            // Get user info
            if (tg.initDataUnsafe?.user) {
                GameState.user = tg.initDataUnsafe.user;
                console.log('👤 User:', GameState.user.first_name);
            }
            
            // Setup close confirmation
            tg.onEvent('mainButtonClicked', () => {
                tg.close();
            });
            
        } catch (error) {
            console.warn('⚠️ Telegram WebApp not available:', error);
        }
    } else {
        console.log('🔧 Running in development mode');
    }
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
    // Handle clicks outside modals
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });
    
    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Handle balance widget click
    const balanceWidget = document.querySelector('.balance-widget');
    if (balanceWidget) {
        balanceWidget.addEventListener('click', openTopUp);
    }
    
    // Handle logo click
    const appLogo = document.querySelector('.app-logo');
    if (appLogo) {
        appLogo.addEventListener('click', openProfile);
    }
}

/**
 * Navigation Functions
 */
function navigateTo(page) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to current page
    const currentNavItem = document.querySelector(`[onclick="navigateTo('${page}')"]`);
    if (currentNavItem) {
        currentNavItem.classList.add('active');
    }
    
    // Update state
    GameState.currentPage = page;
    
    // Save state
    saveGameState();
    
    console.log('📱 Navigating to:', page);
    
    // Route to different pages
    switch(page) {
        case 'main':
            showMainPage();
            break;
        case 'upgrade':
            showUpgradePage();
            break;
        case 'partner':
            showPartnerPage();
            break;
        default:
            console.error('Unknown page:', page);
    }
}

function setActivePage(page) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        
        // Check if this nav item corresponds to the page
        const onclick = item.getAttribute('onclick');
        if (onclick && onclick.includes(page)) {
            item.classList.add('active');
        }
    });
}

/**
 * Page Display Functions
 */
function showMainPage() {
    // Main page is default - no special handling needed
    console.log('📋 Showing main page');
}

function showUpgradePage() {
    showModal('🔧 Апгрейд', 'Страница апгрейда будет реализована на следующем этапе разработки.');
}

function showPartnerPage() {
    showModal('👥 Партнёрская программа', 'Реферальная система будет добавлена в ближайшее время.');
}

function openProfile() {
    const userInfo = GameState.user ? 
        `Привет, ${GameState.user.first_name}!<br>ID: ${GameState.user.id}` : 
        'Профиль пользователя';
    
    showModal('👤 Профиль', userInfo);
}

function openTopUp() {
    showModal('💰 Пополнение баланса', 'Функция пополнения звёзд будет доступна в следующем обновлении.');
}

/**
 * Balance Management
 */
function updateBalance() {
    const balanceElements = document.querySelectorAll('#balance, .balance-amount');
    balanceElements.forEach(element => {
        if (element) {
            element.textContent = GameState.balance.toLocaleString();
        }
    });
}

function addBalance(amount) {
    GameState.balance += amount;
    updateBalance();
    saveGameState();
    
    // Show notification
    showNotification(`+${amount} ⭐`, 'success');
}

function deductBalance(amount) {
    if (GameState.balance >= amount) {
        GameState.balance -= amount;
        updateBalance();
        saveGameState();
        return true;
    }
    return false;
}

/**
 * Inventory Management
 */
function addToInventory(item) {
    GameState.inventory.push({
        ...item,
        id: Date.now(),
        timestamp: new Date().toISOString()
    });
    
    updateInventoryCount();
    saveGameState();
}

function updateInventoryCount() {
    const inventoryCounters = document.querySelectorAll('.inventory-count');
    inventoryCounters.forEach(counter => {
        counter.textContent = GameState.inventory.length;
    });
}

/**
 * Local Storage Functions
 */
function saveGameState() {
    try {
        const dataToSave = {
            balance: GameState.balance,
            inventory: GameState.inventory,
            currentPage: GameState.currentPage,
            settings: GameState.settings,
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('crazyGiftGameState', JSON.stringify(dataToSave));
    } catch (error) {
        console.error('❌ Failed to save game state:', error);
    }
}

function loadGameState() {
    try {
        const saved = localStorage.getItem('crazyGiftGameState');
        if (saved) {
            const data = JSON.parse(saved);
            
            GameState.balance = data.balance || 1451;
            GameState.inventory = data.inventory || [];
            GameState.currentPage = data.currentPage || 'main';
            GameState.settings = { ...GameState.settings, ...data.settings };
            
            console.log('💾 Game state loaded');
        }
    } catch (error) {
        console.error('❌ Failed to load game state:', error);
    }
}

function clearGameState() {
    localStorage.removeItem('crazyGiftGameState');
    location.reload();
}

/**
 * Utility Functions
 */
function closeApp() {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.close();
    } else {
        // For development
        if (confirm('Закрыть приложение?')) {
            window.close();
        }
    }
}

function formatNumber(num) {
    return num.toLocaleString();
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function vibrate(pattern = [100]) {
    if (navigator.vibrate && GameState.settings.vibrateEnabled) {
        navigator.vibrate(pattern);
    }
}

/**
 * Error Handling
 */
window.addEventListener('error', (e) => {
    console.error('💥 Global error:', e.error);
    showNotification('Произошла ошибка', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('💥 Unhandled promise rejection:', e.reason);
    showNotification('Произошла ошибка', 'error');
});

/**
 * Initialize when DOM is ready
 */
document.addEventListener('DOMContentLoaded', initApp);

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GameState,
        AppConfig,
        navigateTo,
        updateBalance,
        addBalance,
        deductBalance,
        addToInventory,
        saveGameState,
        loadGameState
    };
}