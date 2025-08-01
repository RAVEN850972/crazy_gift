/**
 * CrazyGift - Game Logic & Case System
 * Игровая логика и система кейсов
 */

/**
 * Case System
 */
class CaseManager {
    constructor() {
        this.cases = this.initializeCases();
        this.items = this.initializeItems();
    }

    initializeCases() {
        return {
            1: {
                id: 1,
                name: 'Telegram Case #1',
                price: 150,
                image: 'assets/cases/case1.png',
                rarity: 'common',
                items: [
                    { id: 1, weight: 40 },
                    { id: 2, weight: 30 },
                    { id: 3, weight: 20 },
                    { id: 4, weight: 10 }
                ]
            },
            2: {
                id: 2,
                name: 'Telegram Case #2',
                price: 250,
                image: 'assets/cases/case2.png',
                rarity: 'rare',
                items: [
                    { id: 3, weight: 35 },
                    { id: 4, weight: 30 },
                    { id: 5, weight: 25 },
                    { id: 6, weight: 10 }
                ]
            },
            3: {
                id: 3,
                name: 'Premium Case',
                price: 500,
                image: 'assets/cases/case3.png',
                rarity: 'epic',
                items: [
                    { id: 5, weight: 30 },
                    { id: 6, weight: 25 },
                    { id: 7, weight: 25 },
                    { id: 8, weight: 15 },
                    { id: 9, weight: 5 }
                ]
            },
            4: {
                id: 4,
                name: 'Elite Case',
                price: 1000,
                image: 'assets/cases/case4.png',
                rarity: 'legendary',
                items: [
                    { id: 7, weight: 25 },
                    { id: 8, weight: 25 },
                    { id: 9, weight: 20 },
                    { id: 10, weight: 15 },
                    { id: 11, weight: 10 },
                    { id: 12, weight: 5 }
                ]
            }
        };
    }

    initializeItems() {
        return {
            1: { id: 1, name: 'Telegram Sticker', value: 25.6, stars: 2556, rarity: 'Common', image: 'assets/items/sticker.png' },
            2: { id: 2, name: 'Blue Bow Tie', value: 35.0, stars: 3500, rarity: 'Common', image: 'assets/items/bowtie.png' },
            3: { id: 3, name: 'Pink Teddy Bear', value: 45.5, stars: 4550, rarity: 'Common', image: 'assets/items/teddy.png' },
            4: { id: 4, name: 'Telegram Cap', value: 65.0, stars: 6500, rarity: 'Rare', image: 'assets/items/cap.png' },
            5: { id: 5, name: 'Golden Star', value: 125.0, stars: 12500, rarity: 'Rare', image: 'assets/items/star.png' },
            6: { id: 6, name: 'Black Cat', value: 180.5, stars: 18050, rarity: 'Rare', image: 'assets/items/cat.png' },
            7: { id: 7, name: 'Ancient Scroll', value: 250.0, stars: 25000, rarity: 'Epic', image: 'assets/items/scroll.png' },
            8: { id: 8, name: 'Golden Ring', value: 450.0, stars: 45000, rarity: 'Epic', image: 'assets/items/ring.png' },
            9: { id: 9, name: 'Magic Hat', value: 750.0, stars: 75000, rarity: 'Epic', image: 'assets/items/hat.png' },
            10: { id: 10, name: 'Golden Gift Box', value: 1250.0, stars: 125000, rarity: 'Legendary', image: 'assets/items/giftbox.png' },
            11: { id: 11, name: 'Roman Helmet', value: 2000.0, stars: 200000, rarity: 'Legendary', image: 'assets/items/helmet.png' },
            12: { id: 12, name: 'Diamond Crown', value: 5000.0, stars: 500000, rarity: 'Mythic', image: 'assets/items/crown.png' }
        };
    }

    openCase(caseId) {
        const caseData = this.cases[caseId];
        if (!caseData) {
            throw new Error('Case not found');
        }

        // Check balance
        if (!deductBalance(caseData.price)) {
            throw new Error('Insufficient balance');
        }

        // Generate random item
        const wonItem = this.rollItem(caseData.items);
        const item = { ...this.items[wonItem.id] };

        // Add to inventory
        addToInventory(item);

        // Log the win
        console.log('🎁 Case opened:', caseData.name, '→ Won:', item.name);

        return {
            case: caseData,
            item: item,
            success: true
        };
    }

    rollItem(items) {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of items) {
            random -= item.weight;
            if (random <= 0) {
                return item;
            }
        }

        // Fallback to first item
        return items[0];
    }

    getCaseById(id) {
        return this.cases[id];
    }

    getItemById(id) {
        return this.items[id];
    }

    getCaseContents(caseId) {
        const caseData = this.cases[caseId];
        if (!caseData) return [];

        return caseData.items.map(item => ({
            ...this.items[item.id],
            weight: item.weight,
            chance: (item.weight / caseData.items.reduce((sum, i) => sum + i.weight, 0) * 100).toFixed(2)
        }));
    }
}

/**
 * Upgrade System
 */
class UpgradeManager {
    constructor() {
        this.upgradeRates = {
            'Common': { multiplier: 2, successChance: 75 },
            'Rare': { multiplier: 3, successChance: 50 },
            'Epic': { multiplier: 5, successChance: 25 },
            'Legendary': { multiplier: 10, successChance: 15 },
            'Mythic': { multiplier: 20, successChance: 5 }
        };
    }

    calculateUpgradeChance(fromItem, toItem) {
        const valueRatio = toItem.value / fromItem.value;
        const baseChance = this.upgradeRates[fromItem.rarity]?.successChance || 50;
        
        // Adjust chance based on value difference
        let adjustedChance = baseChance / Math.max(1, valueRatio / 2);
        
        // Cap between 1% and 95%
        return Math.max(1, Math.min(95, adjustedChance));
    }

    attemptUpgrade(fromItemId, toItemId) {
        const fromItem = GameState.inventory.find(item => item.id === fromItemId);
        if (!fromItem) {
            throw new Error('Item not found in inventory');
        }

        const toItem = window.gameManager.caseManager.getItemById(toItemId);
        if (!toItem) {
            throw new Error('Target item not found');
        }

        const successChance = this.calculateUpgradeChance(fromItem, toItem);
        const isSuccess = Math.random() * 100 < successChance;

        // Remove the original item
        const itemIndex = GameState.inventory.findIndex(item => item.id === fromItemId);
        GameState.inventory.splice(itemIndex, 1);

        if (isSuccess) {
            // Add upgraded item
            const upgradedItem = { 
                ...toItem, 
                id: generateId(),
                timestamp: new Date().toISOString(),
                isUpgraded: true
            };
            addToInventory(upgradedItem);

            console.log('✅ Upgrade successful:', fromItem.name, '→', toItem.name);
            return {
                success: true,
                item: upgradedItem,
                chance: successChance
            };
        } else {
            console.log('❌ Upgrade failed:', fromItem.name, '→', toItem.name);
            return {
                success: false,
                lostItem: fromItem,
                chance: successChance
            };
        }
    }

    getUpgradeOptions(itemId) {
        const item = GameState.inventory.find(i => i.id === itemId);
        if (!item) return [];

        const allItems = Object.values(window.gameManager.caseManager.items);
        
        // Find items with higher value
        return allItems
            .filter(targetItem => targetItem.value > item.value)
            .map(targetItem => ({
                ...targetItem,
                chance: this.calculateUpgradeChance(item, targetItem)
            }))
            .sort((a, b) => a.value - b.value)
            .slice(0, 5); // Show top 5 upgrade options
    }
}

/**
 * Statistics Manager
 */
class StatsManager {
    constructor() {
        this.stats = this.loadStats();
    }

    loadStats() {
        try {
            const saved = localStorage.getItem('crazyGiftStats');
            return saved ? JSON.parse(saved) : this.getDefaultStats();
        } catch (error) {
            return this.getDefaultStats();
        }
    }

    getDefaultStats() {
        return {
            casesOpened: 0,
            totalSpent: 0,
            totalWon: 0,
            upgradesAttempted: 0,
            upgradesSuccessful: 0,
            rareItemsWon: 0,
            bestItem: null,
            firstPlay: new Date().toISOString()
        };
    }

    recordCaseOpen(casePrice, itemValue) {
        this.stats.casesOpened++;
        this.stats.totalSpent += casePrice;
        this.stats.totalWon += itemValue;
        
        if (itemValue > 1000) {
            this.stats.rareItemsWon++;
        }

        this.saveStats();
    }

    recordUpgrade(success, fromValue, toValue) {
        this.stats.upgradesAttempted++;
        
        if (success) {
            this.stats.upgradesSuccessful++;
            this.stats.totalWon += (toValue - fromValue);
        }

        this.saveStats();
    }

    saveStats() {
        try {
            localStorage.setItem('crazyGiftStats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Failed to save stats:', error);
        }
    }

    getStats() {
        return {
            ...this.stats,
            profitLoss: this.stats.totalWon - this.stats.totalSpent,
            upgradeSuccessRate: this.stats.upgradesAttempted > 0 
                ? (this.stats.upgradesSuccessful / this.stats.upgradesAttempted * 100).toFixed(1)
                : 0
        };
    }

    resetStats() {
        this.stats = this.getDefaultStats();
        this.saveStats();
    }
}

/**
 * Game Manager - Main controller
 */
class GameManager {
    constructor() {
        this.caseManager = new CaseManager();
        this.upgradeManager = new UpgradeManager();
        this.statsManager = new StatsManager();
    }

    async openCase(caseId) {
        try {
            showLoading('caseOpening');
            
            // Simulate opening animation delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const result = this.caseManager.openCase(caseId);
            
            // Record stats
            this.statsManager.recordCaseOpen(result.case.price, result.item.value);
            
            hideLoading('caseOpening');
            return result;
            
        } catch (error) {
            hideLoading('caseOpening');
            throw error;
        }
    }

    async upgradeItem(fromItemId, toItemId) {
        try {
            showLoading('upgrading');
            
            // Simulate upgrade process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const result = this.upgradeManager.attemptUpgrade(fromItemId, toItemId);
            
            // Record stats
            const fromItem = this.caseManager.getItemById(fromItemId);
            const toItem = this.caseManager.getItemById(toItemId);
            this.statsManager.recordUpgrade(result.success, fromItem.value, toItem.value);
            
            hideLoading('upgrading');
            return result;
            
        } catch (error) {
            hideLoading('upgrading');
            throw error;
        }
    }

    sellItem(itemId, sellPrice) {
        const itemIndex = GameState.inventory.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            throw new Error('Item not found');
        }

        const item = GameState.inventory[itemIndex];
        GameState.inventory.splice(itemIndex, 1);
        
        addBalance(sellPrice);
        saveGameState();

        console.log('💰 Item sold:', item.name, 'for', sellPrice, 'stars');

        return {
            success: true,
            item: item,
            amount: sellPrice
        };
    }

    getInventoryValue() {
        return GameState.inventory.reduce((total, item) => total + (item.value || 0), 0);
    }
}

// Initialize global game manager
window.gameManager = new GameManager();

// Global functions for backward compatibility
function openCase(caseId) {
    window.gameManager.openCase(caseId)
        .then(result => {
            showCaseResult(result);
        })
        .catch(error => {
            console.error('Case opening failed:', error);
            if (error.message === 'Insufficient balance') {
                showModal('💸 Недостаточно звёзд', 'Пополните баланс для открытия кейса');
            } else {
                showNotification('Ошибка при открытии кейса', 'error');
            }
        });
}

function showCaseResult(result) {
    const { case: caseData, item } = result;
    
    const content = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin: 20px 0;">🎉</div>
            <h4>Поздравляем!</h4>
            <p>Вы выиграли: <strong>${item.name}</strong></p>
            <p>Редкость: <span style="color: var(--accent-yellow)">${item.rarity}</span></p>
            <p>Стоимость: <strong>${item.value} ⭐ ${item.stars.toLocaleString()}</strong></p>
        </div>
    `;

    showModal('', content, {
        primaryText: 'Забрать в инвентарь',
        onPrimary: () => {
            showNotification(`${item.name} добавлен в инвентарь!`, 'success');
            updateInventoryCount();
        }
    });

    // Vibrate on mobile
    vibrate([100, 50, 100]);
}

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GameManager,
        CaseManager,
        UpgradeManager,
        StatsManager
    };
}