/**
 * CrazyGift Profile Page - Полная исправленная версия
 * frontend/js/profile/profile.js
 * 
 * Полностью функциональная страница профиля с API интеграцией
 */

// ===================================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И СОСТОЯНИЕ
// ===================================================================

let profileData = {
    user: null,
    inventory: [],
    stats: {},
    isLoading: false
};

let currentFilter = 'all';
let isInitialized = false;

// ===================================================================
// ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ ПРОФИЛЯ
// ===================================================================

/**
 * Основная функция инициализации страницы профиля
 */
async function initializeProfilePage() {
    if (isInitialized) return;
    
    console.log('🚀 Инициализация страницы профиля...');
    
    try {
        // Показываем начальный лоадер
        showPageLoader();
        
        // Инициализируем Telegram WebApp
        initTelegramApp();
        
        // Проверяем доступность API
        await checkAPIAvailability();
        
        // Загружаем данные пользователя
        await loadUserData();
        
        // Загружаем инвентарь
        await loadInventoryData();
        
        // Настраиваем UI
        setupUI();
        
        // Настраиваем обработчики событий
        setupEventListeners();
        
        isInitialized = true;
        console.log('✅ Страница профиля инициализирована успешно');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации страницы профиля:', error);
        showInitializationError(error);
    } finally {
        hidePageLoader();
    }
}

/**
 * Проверка доступности API
 */
async function checkAPIAvailability() {
    try {
        if (window.apiClient) {
            const available = await window.apiClient.checkAvailability();
            console.log(`API ${available ? '✅ доступен' : '⚠️ недоступен'}`);
            return available;
        }
        return false;
    } catch (error) {
        console.warn('⚠️ Проблема с проверкой API:', error);
        return false;
    }
}

// ===================================================================
// ЗАГРУЗКА ДАННЫХ
// ===================================================================

/**
 * Загрузка данных пользователя
 */
async function loadUserData() {
    try {
        console.log('👤 Загружаем данные пользователя...');
        
        // Получаем пользователя из состояния или API
        let user = window.GameState?.user || window.apiClient?.currentUser;
        
        if (!user && window.apiClient && window.GameState?.currentUserId) {
            // Загружаем профиль через API
            user = await window.apiClient.getUserProfile(window.GameState.currentUserId);
        }
        
        if (!user) {
            throw new Error('Пользователь не найден');
        }
        
        profileData.user = user;
        
        // Обновляем UI с данными пользователя
        updateUserInfo(user);
        
        // Обновляем баланс
        await updateUserBalance();
        
        console.log('✅ Данные пользователя загружены:', user);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных пользователя:', error);
        
        // Создаем fallback пользователя
        profileData.user = {
            id: 1,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
            balance_stars: window.GameState?.balance || 0,
            total_cases_opened: 0,
            created_at: new Date().toISOString()
        };
        
        updateUserInfo(profileData.user);
    }
}

/**
 * Обновление баланса пользователя
 */
async function updateUserBalance() {
    try {
        if (window.apiClient && window.GameState?.currentUserId && !window.GameState?.demoMode) {
            const balance = await window.apiClient.getUserBalance(window.GameState.currentUserId);
            
            // Обновляем состояние
            window.GameState.balance = balance.balance_stars;
            if (profileData.user) {
                profileData.user.balance_stars = balance.balance_stars;
            }
            
            // Обновляем отображение
            updateBalanceDisplay(balance.balance_stars);
            
            console.log('✅ Баланс обновлен:', balance.balance_stars);
        } else {
            // В демо режиме используем локальный баланс
            const currentBalance = window.GameState?.balance || 0;
            updateBalanceDisplay(currentBalance);
            console.log('⚠️ Демо режим: баланс', currentBalance);
        }
    } catch (error) {
        console.error('❌ Ошибка обновления баланса:', error);
        
        // Показываем текущий баланс из состояния
        const fallbackBalance = window.GameState?.balance || 0;
        updateBalanceDisplay(fallbackBalance);
    }
}

/**
 * Загрузка данных инвентаря
 */
async function loadInventoryData() {
    try {
        console.log('📦 Загружаем инвентарь...');
        
        if (window.apiClient && window.GameState?.currentUserId && !window.GameState?.demoMode) {
            // Загружаем реальный инвентарь через API
            const inventory = await window.apiClient.getInventory(window.GameState.currentUserId);
            profileData.inventory = inventory || [];
            
            console.log('✅ Инвентарь загружен из API:', inventory.length, 'предметов');
        } else {
            // В демо режиме показываем пустой инвентарь или тестовые данные
            profileData.inventory = createDemoInventory();
            console.log('⚠️ Демо режим: используем тестовый инвентарь');
        }
        
        // Рендерим инвентарь
        renderInventory(profileData.inventory);
        
        // Загружаем статистику инвентаря
        await loadInventoryStats();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки инвентаря:', error);
        
        // Показываем ошибку
        showInventoryError();
        
        // Создаем пустой инвентарь
        profileData.inventory = [];
    }
}

/**
 * Загрузка статистики инвентаря
 */
async function loadInventoryStats() {
    try {
        if (window.apiClient && window.GameState?.currentUserId && !window.GameState?.demoMode) {
            const stats = await window.apiClient.getInventoryStats(window.GameState.currentUserId);
            profileData.stats = stats;
            
            updateInventoryStats(stats);
            console.log('✅ Статистика инвентаря загружена');
        } else {
            // Создаем статистику на основе локальных данных
            const stats = calculateLocalInventoryStats(profileData.inventory);
            profileData.stats = stats;
            updateInventoryStats(stats);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки статистики инвентаря:', error);
    }
}

// ===================================================================
// ОБНОВЛЕНИЕ UI
// ===================================================================

/**
 * Обновление информации о пользователе в UI
 */
function updateUserInfo(user) {
    try {
        // Имя пользователя
        const nameElements = document.querySelectorAll('.username, .user-name, .profile-name');
        nameElements.forEach(el => {
            if (el) {
                const displayName = user.first_name || user.username || 'Пользователь';
                el.textContent = displayName;
            }
        });
        
        // ID пользователя
        const idElements = document.querySelectorAll('.user-id, .profile-id');
        idElements.forEach(el => {
            if (el) {
                el.textContent = `ID: ${user.id || user.telegram_id || 'N/A'}`;
            }
        });
        
        // Количество открытых кейсов
        const casesElements = document.querySelectorAll('.cases-opened, .total-cases');
        casesElements.forEach(el => {
            if (el) {
                el.textContent = user.total_cases_opened || 0;
            }
        });
        
        // Дата регистрации
        const dateElements = document.querySelectorAll('.join-date, .member-since');
        dateElements.forEach(el => {
            if (el && user.created_at) {
                const joinDate = new Date(user.created_at).toLocaleDateString('ru-RU');
                el.textContent = `Участник с ${joinDate}`;
            }
        });
        
        console.log('✅ Информация пользователя обновлена в UI');
        
    } catch (error) {
        console.error('❌ Ошибка обновления информации пользователя:', error);
    }
}

/**
 * Обновление отображения баланса
 */
function updateBalanceDisplay(balance) {
    const balanceElements = document.querySelectorAll('#balance, .balance, .user-balance, .profile-balance');
    balanceElements.forEach(el => {
        if (el) {
            el.textContent = balance.toLocaleString();
        }
    });
}

/**
 * Рендер инвентаря
 */
function renderInventory(items) {
    const inventoryContainer = document.querySelector('.inventory-grid, .items-grid, .inventory-container');
    
    if (!inventoryContainer) {
        console.warn('⚠️ Контейнер инвентаря не найден');
        return;
    }
    
    // Очищаем контейнер
    inventoryContainer.innerHTML = '';
    
    // Применяем фильтр
    const filteredItems = filterItems(items, currentFilter);
    
    if (!filteredItems || filteredItems.length === 0) {
        showEmptyInventory(inventoryContainer);
        return;
    }
    
    // Рендерим предметы
    filteredItems.forEach(item => {
        const itemElement = createInventoryItemElement(item);
        inventoryContainer.appendChild(itemElement);
    });
    
    console.log('✅ Инвентарь отрендерен:', filteredItems.length, 'предметов');
}

/**
 * Создание элемента предмета инвентаря
 */
function createInventoryItemElement(item) {
    const itemElement = document.createElement('div');
    itemElement.className = `inventory-item rarity-${item.rarity || 'common'}`;
    itemElement.dataset.itemId = item.id;
    
    itemElement.innerHTML = `
        <div class="item-image">
            <img src="${item.image_url || 'assets/items/default.png'}" 
                 alt="${item.name}"
                 onerror="this.src='assets/items/default.png'"
                 loading="lazy">
            <div class="item-rarity-badge ${item.rarity || 'common'}">
                ${getRarityDisplayName(item.rarity)}
            </div>
        </div>
        <div class="item-info">
            <div class="item-name">${item.name}</div>
            <div class="item-value">${item.stars || item.value || 0} ⭐</div>
            ${item.case_name ? `<div class="item-source">Из: ${item.case_name}</div>` : ''}
        </div>
        <div class="item-actions">
            <button class="sell-btn" onclick="sellInventoryItem(${item.id})" data-item-id="${item.id}">
                <span class="btn-text">Продать</span>
                <span class="btn-loader" style="display: none;">⏳</span>
            </button>
            ${item.stars >= 1000 ? `
                <button class="withdraw-btn" onclick="requestItemWithdrawal(${item.id})" data-item-id="${item.id}">
                    Вывести
                </button>
            ` : ''}
        </div>
    `;
    
    return itemElement;
}

/**
 * Показ пустого инвентаря
 */
function showEmptyInventory(container) {
    container.innerHTML = `
        <div class="empty-inventory">
            <div class="empty-icon">📦</div>
            <div class="empty-title">Инвентарь пуст</div>
            <div class="empty-subtitle">Откройте кейсы, чтобы получить предметы</div>
            <button class="open-cases-btn" onclick="window.location.href='index.html'">
                Открыть кейсы
            </button>
        </div>
    `;
}

/**
 * Показ ошибки загрузки инвентаря
 */
function showInventoryError() {
    const inventoryContainer = document.querySelector('.inventory-grid, .items-grid, .inventory-container');
    
    if (inventoryContainer) {
        inventoryContainer.innerHTML = `
            <div class="inventory-error">
                <div class="error-icon">⚠️</div>
                <div class="error-title">Ошибка загрузки</div>
                <div class="error-subtitle">Не удалось загрузить инвентарь</div>
                <button class="retry-btn" onclick="loadInventoryData()">
                    Попробовать снова
                </button>
            </div>
        `;
    }
}

/**
 * Обновление статистики инвентаря
 */
function updateInventoryStats(stats) {
    try {
        // Общее количество предметов
        const totalItemsEl = document.querySelector('.total-items, .inventory-count');
        if (totalItemsEl) {
            totalItemsEl.textContent = stats.total_items || profileData.inventory.length || 0;
        }
        
        // Общая стоимость в звездах
        const totalValueEl = document.querySelector('.total-value, .portfolio-value');
        if (totalValueEl) {
            const totalStars = stats.portfolio_stars || 
                              profileData.inventory.reduce((sum, item) => sum + (item.stars || 0), 0);
            totalValueEl.textContent = totalStars.toLocaleString();
        }
        
        // Количество по редкостям
        if (stats.by_rarity) {
            Object.entries(stats.by_rarity).forEach(([rarity, count]) => {
                const rarityEl = document.querySelector(`.rarity-count[data-rarity="${rarity}"]`);
                if (rarityEl) {
                    rarityEl.textContent = count;
                }
            });
        }
        
        console.log('✅ Статистика инвентаря обновлена');
        
    } catch (error) {
        console.error('❌ Ошибка обновления статистики:', error);
    }
}

// ===================================================================
// ФУНКЦИОНАЛ ПРЕДМЕТОВ
// ===================================================================

/**
 * Продажа предмета из инвентаря
 */
window.sellInventoryItem = async function(itemId) {
    if (!itemId) {
        console.error('❌ Item ID не указан');
        return;
    }
    
    try {
        // Находим предмет в локальном инвентаре
        const item = profileData.inventory.find(i => i.id == itemId);
        if (!item) {
            throw new Error('Предмет не найден в инвентаре');
        }
        
        // Показываем подтверждение
        const confirmed = await showSellConfirmation(item);
        if (!confirmed) return;
        
        // Показываем лоадер
        showSellLoader(itemId);
        
        let result;
        
        if (window.apiClient && !window.GameState?.demoMode) {
            // Продаем через API
            result = await window.apiClient.sellItem(itemId, window.GameState.currentUserId);
        } else {
            // Симуляция продажи в демо режиме
            result = {
                success: true,
                earned_stars: item.stars || item.value || 100,
                new_balance: (window.GameState?.balance || 0) + (item.stars || 100)
            };
            
            // Обновляем локальное состояние
            window.GameState.balance = result.new_balance;
        }
        
        if (result.success) {
            // Показываем успешное уведомление
            showNotification(`Предмет "${item.name}" продан за ${result.earned_stars} звёзд!`, 'success');
            
            // Удаляем предмет из локального инвентаря
            profileData.inventory = profileData.inventory.filter(i => i.id != itemId);
            
            // Обновляем UI
            removeItemFromGrid(itemId);
            updateBalanceDisplay(result.new_balance || window.GameState?.balance || 0);
            
            // Перезагружаем статистику
            await loadInventoryStats();
            
        } else {
            throw new Error(result.message || 'Не удалось продать предмет');
        }
        
    } catch (error) {
        console.error('❌ Ошибка продажи предмета:', error);
        showNotification(`Ошибка продажи: ${error.message}`, 'error');
    } finally {
        hideSellLoader(itemId);
    }
};

/**
 * Запрос на вывод предмета
 */
window.requestItemWithdrawal = async function(itemId) {
    try {
        const item = profileData.inventory.find(i => i.id == itemId);
        if (!item) {
            throw new Error('Предмет не найден');
        }
        
        if ((item.stars || 0) < 1000) {
            showNotification('Можно выводить предметы стоимостью от 1000 звёзд', 'warning');
            return;
        }
        
        const confirmed = confirm(`Запросить вывод предмета "${item.name}"?\nАдминистратор свяжется с вами в течение 24 часов.`);
        if (!confirmed) return;
        
        if (window.apiClient && !window.GameState?.demoMode) {
            const result = await window.apiClient.requestItemWithdrawal(itemId, window.GameState.currentUserId);
            
            if (result.success) {
                showNotification('Запрос на вывод отправлен!', 'success');
                
                // Перезагружаем инвентарь
                await loadInventoryData();
            } else {
                throw new Error(result.message);
            }
        } else {
            // Демо режим
            showNotification('Демо режим: запрос на вывод симулирован', 'info');
        }
        
    } catch (error) {
        console.error('❌ Ошибка запроса вывода:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
};

// ===================================================================
// ФИЛЬТРАЦИЯ И СОРТИРОВКА
// ===================================================================

/**
 * Фильтрация предметов по редкости
 */
function filterItems(items, filter) {
    if (!items) return [];
    
    if (filter === 'all') {
        return items;
    }
    
    return items.filter(item => item.rarity === filter);
}

/**
 * Установка фильтра
 */
function setInventoryFilter(filter) {
    currentFilter = filter;
    
    // Обновляем активную кнопку фильтра
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    // Перерендериваем инвентарь
    renderInventory(profileData.inventory);
    
    console.log('🔍 Фильтр установлен:', filter);
}

// ===================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ===================================================================

/**
 * Показ подтверждения продажи
 */
async function showSellConfirmation(item) {
    const message = `Продать "${item.name}" за ${item.stars || item.value || 0} звёзд?`;
    
    if (typeof showConfirmModal === 'function') {
        return await showConfirmModal(message);
    }
    
    return confirm(message);
}

/**
 * Показ/скрытие лоадеров продажи
 */
function showSellLoader(itemId) {
    const button = document.querySelector(`[data-item-id="${itemId}"] .sell-btn`);
    if (button) {
        const text = button.querySelector('.btn-text');
        const loader = button.querySelector('.btn-loader');
        
        if (text) text.style.display = 'none';
        if (loader) loader.style.display = 'inline';
        
        button.disabled = true;
    }
}

function hideSellLoader(itemId) {
    const button = document.querySelector(`[data-item-id="${itemId}"] .sell-btn`);
    if (button) {
        const text = button.querySelector('.btn-text');
        const loader = button.querySelector('.btn-loader');
        
        if (text) text.style.display = 'inline';
        if (loader) loader.style.display = 'none';
        
        button.disabled = false;
    }
}

/**
 * Удаление предмета из сетки
 */
function removeItemFromGrid(itemId) {
    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemElement) {
        itemElement.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            itemElement.remove();
        }, 300);
    }
}

/**
 * Получение отображаемого имени редкости
 */
function getRarityDisplayName(rarity) {
    const rarityNames = {
        'common': 'Обычный',
        'rare': 'Редкий', 
        'epic': 'Эпический',
        'legendary': 'Легендарный',
        'mythic': 'Мифический'
    };
    
    return rarityNames[rarity] || 'Обычный';
}

/**
 * Создание демо инвентаря
 */
function createDemoInventory() {
    return [
        {
            id: 1,
            name: 'Демо предмет',
            rarity: 'common',
            stars: 150,
            image_url: 'assets/items/demo.png',
            case_name: 'Демо кейс'
        }
    ];
}

/**
 * Расчет локальной статистики инвентаря
 */
function calculateLocalInventoryStats(items) {
    if (!items || items.length === 0) {
        return {
            total_items: 0,
            portfolio_stars: 0,
            by_rarity: {}
        };
    }
    
    const stats = {
        total_items: items.length,
        portfolio_stars: items.reduce((sum, item) => sum + (item.stars || 0), 0),
        by_rarity: {}
    };
    
    // Подсчет по редкостям
    items.forEach(item => {
        const rarity = item.rarity || 'common';
        stats.by_rarity[rarity] = (stats.by_rarity[rarity] || 0) + 1;
    });
    
    return stats;
}

/**
 * Показ/скрытие лоадера страницы
 */
function showPageLoader() {
    // Можно добавить глобальный лоадер страницы
    console.log('⏳ Загрузка страницы...');
}

function hidePageLoader() {
    console.log('✅ Загрузка завершена');
}

/**
 * Показ ошибки инициализации
 */
function showInitializationError(error) {
    console.error('❌ Критическая ошибка инициализации:', error);
    
    if (typeof showNotification === 'function') {
        showNotification('Ошибка загрузки страницы', 'error');
    }
}

// ===================================================================
// НАСТРОЙКА UI И СОБЫТИЙ
// ===================================================================

/**
 * Настройка пользовательского интерфейса
 */
function setupUI() {
    // Добавляем обработчики для фильтров
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter || 'all';
            setInventoryFilter(filter);
        });
    });
    
    // Добавляем обработчики для кнопок обновления
    const refreshButtons = document.querySelectorAll('.refresh-btn, .reload-btn');
    refreshButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            loadInventoryData();
        });
    });
}

/**
 * Настройка обработчиков событий
 */
function setupEventListeners() {
    // Обработчик для кнопки назад (если есть)
    const backButton = document.querySelector('.back-btn');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.history.back();
        });
    }
    
    // Обработчик для pull-to-refresh (если нужен)
    let startY = 0;
    let currentY = 0;
    let pullDistance = 0;
    
    document.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchmove', (e) => {
        currentY = e.touches[0].clientY;
        pullDistance = currentY - startY;
        
        if (pullDistance > 100 && window.scrollY === 0) {
            // Pull to refresh логика
            e.preventDefault();
        }
    });
    
    document.addEventListener('touchend', () => {
        if (pullDistance > 150 && window.scrollY === 0) {
            // Обновляем данные
            loadInventoryData();
        }
        
        pullDistance = 0;
    });
}

// ===================================================================
// TELEGRAM WEBAPP ИНТЕГРАЦИЯ
// ===================================================================

/**
 * Инициализация Telegram WebApp
 */
function initTelegramApp() {
    if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Настраиваем внешний вид
        tg.setHeaderColor('#1a1a1a');
        tg.setBottomBarColor('#ffffff');
        
        // Разворачиваем приложение
        tg.expand();
        
        // Настраиваем кнопку назад
        if (tg.BackButton) {
            tg.BackButton.show();
            tg.BackButton.onClick(() => {
                window.history.back();
            });
        }
        
        // Готовность приложения
        tg.ready();
        
        console.log('✅ Telegram WebApp инициализирован');
    }
}

// ===================================================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ СОВМЕСТИМОСТИ
// ===================================================================

/**
 * Глобальная функция обновления баланса (для совместимости)
 */
window.updateBalanceFromAPI = updateUserBalance;

/**
 * Глобальная функция загрузки инвентаря (для совместимости) 
 */
window.loadInventoryFromAPI = loadInventoryData;

/**
 * Глобальная функция обновления статистики (для совместимости)
 */
window.updateStats = function() {
    if (profileData.user) {
        updateUserInfo(profileData.user);
    }
    
    if (profileData.stats) {
        updateInventoryStats(profileData.stats);
    }
};

/**
 * Показ уведомлений (fallback если нет глобальной функции)
 */
function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        // Простой fallback
        console.log(`${type.toUpperCase()}: ${message}`);
        alert(message);
    }
}

// ===================================================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ===================================================================

// Инициализируем страницу при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProfilePage);
} else {
    // DOM уже загружен
    initializeProfilePage();
}

// Экспорт функций для отладки
window.profileDebug = {
    loadInventory: loadInventoryData,
    loadUser: loadUserData,
    updateBalance: updateUserBalance,
    updateStats: window.updateStats,
    sellItem: window.sellInventoryItem,
    setFilter: setInventoryFilter,
    data: profileData
};

console.log('✅ Profile.js загружен и готов к работе');
console.log('🔧 Используйте window.profileDebug для отладки');