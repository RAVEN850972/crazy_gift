/**
 * CrazyGift - Local Storage Management
 * Управление локальным хранилищем данных
 */

class StorageManager {
    constructor() {
        this.storageKeys = {
            gameState: 'crazyGiftGameState',
            settings: 'crazyGiftSettings',
            stats: 'crazyGiftStats',
            inventory: 'crazyGiftInventory',
            history: 'crazyGiftHistory'
        };
        this.version = '1.0.0';
    }

    /**
     * Game State Management
     */
    saveGameState(data) {
        try {
            const stateToSave = {
                version: this.version,
                timestamp: new Date().toISOString(),
                balance: data.balance || 0,
                inventory: data.inventory || [],
                currentPage: data.currentPage || 'main',
                settings: data.settings || {},
                user: data.user || null
            };

            localStorage.setItem(this.storageKeys.gameState, JSON.stringify(stateToSave));
            console.log('💾 Game state saved successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to save game state:', error);
            return false;
        }
    }

    loadGameState() {
        try {
            const saved = localStorage.getItem(this.storageKeys.gameState);
            if (!saved) {
                return this.getDefaultGameState();
            }

            const data = JSON.parse(saved);
            
            // Version check
            if (data.version !== this.version) {
                console.warn('⚠️ Game state version mismatch, migrating...');
                return this.migrateGameState(data);
            }

            console.log('📱 Game state loaded successfully');
            return data;
        } catch (error) {
            console.error('❌ Failed to load game state:', error);
            return this.getDefaultGameState();
        }
    }

    getDefaultGameState() {
        return {
            version: this.version,
            balance: 1451,
            inventory: [],
            currentPage: 'main',
            settings: {
                soundEnabled: true,
                vibrateEnabled: true,
                animationsEnabled: true,
                language: 'ru'
            },
            user: null,
            firstLaunch: true
        };
    }

    migrateGameState(oldData) {
        // Handle version migrations here
        const newState = this.getDefaultGameState();
        
        // Preserve important data
        if (oldData.balance) newState.balance = oldData.balance;
        if (oldData.inventory) newState.inventory = oldData.inventory;
        if (oldData.settings) newState.settings = { ...newState.settings, ...oldData.settings };
        
        this.saveGameState(newState);
        return newState;
    }

    /**
     * Inventory Management
     */
    saveInventory(inventory) {
        try {
            const inventoryData = {
                version: this.version,
                timestamp: new Date().toISOString(),
                items: inventory,
                totalValue: this.calculateInventoryValue(inventory)
            };

            localStorage.setItem(this.storageKeys.inventory, JSON.stringify(inventoryData));
            return true;
        } catch (error) {
            console.error('❌ Failed to save inventory:', error);
            return false;
        }
    }

    loadInventory() {
        try {
            const saved = localStorage.getItem(this.storageKeys.inventory);
            if (!saved) return [];

            const data = JSON.parse(saved);
            return data.items || [];
        } catch (error) {
            console.error('❌ Failed to load inventory:', error);
            return [];
        }
    }

    calculateInventoryValue(inventory) {
        return inventory.reduce((total, item) => total + (item.value || 0), 0);
    }

    /**
     * Transaction History
     */
    addTransaction(transaction) {
        try {
            const history = this.getTransactionHistory();
            const newTransaction = {
                id: this.generateId(),
                timestamp: new Date().toISOString(),
                type: transaction.type, // 'case_open', 'upgrade', 'sell', 'purchase'
                ...transaction
            };

            history.unshift(newTransaction);
            
            // Keep only last 100 transactions
            if (history.length > 100) {
                history.splice(100);
            }

            localStorage.setItem(this.storageKeys.history, JSON.stringify({
                version: this.version,
                transactions: history
            }));

            return newTransaction;
        } catch (error) {
            console.error('❌ Failed to save transaction:', error);
            return null;
        }
    }

    getTransactionHistory(limit = 50) {
        try {
            const saved = localStorage.getItem(this.storageKeys.history);
            if (!saved) return [];

            const data = JSON.parse(saved);
            const transactions = data.transactions || [];
            
            return limit ? transactions.slice(0, limit) : transactions;
        } catch (error) {
            console.error('❌ Failed to load transaction history:', error);
            return [];
        }
    }

    /**
     * Settings Management
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.storageKeys.settings, JSON.stringify({
                version: this.version,
                timestamp: new Date().toISOString(),
                ...settings
            }));
            return true;
        } catch (error) {
            console.error('❌ Failed to save settings:', error);
            return false;
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem(this.storageKeys.settings);
            if (!saved) {
                return {
                    soundEnabled: true,
                    vibrateEnabled: true,
                    animationsEnabled: true,
                    language: 'ru'
                };
            }

            const data = JSON.parse(saved);
            return data;
        } catch (error) {
            console.error('❌ Failed to load settings:', error);
            return {};
        }
    }

    /**
     * Statistics Management
     */
    saveStats(stats) {
        try {
            localStorage.setItem(this.storageKeys.stats, JSON.stringify({
                version: this.version,
                timestamp: new Date().toISOString(),
                ...stats
            }));
            return true;
        } catch (error) {
            console.error('❌ Failed to save stats:', error);
            return false;
        }
    }

    loadStats() {
        try {
            const saved = localStorage.getItem(this.storageKeys.stats);
            if (!saved) {
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

            const data = JSON.parse(saved);
            return data;
        } catch (error) {
            console.error('❌ Failed to load stats:', error);
            return {};
        }
    }

    /**
     * Utility Functions
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    clearAllData() {
        try {
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            console.log('🗑️ All data cleared');
            return true;
        } catch (error) {
            console.error('❌ Failed to clear data:', error);
            return false;
        }
    }

    exportData() {
        try {
            const exportData = {};
            Object.entries(this.storageKeys).forEach(([name, key]) => {
                const data = localStorage.getItem(key);
                if (data) {
                    exportData[name] = JSON.parse(data);
                }
            });

            exportData.exportTimestamp = new Date().toISOString();
            exportData.version = this.version;

            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('❌ Failed to export data:', error);
            return null;
        }
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.version !== this.version) {
                console.warn('⚠️ Import data version mismatch');
            }

            Object.entries(this.storageKeys).forEach(([name, key]) => {
                if (data[name]) {
                    localStorage.setItem(key, JSON.stringify(data[name]));
                }
            });

            console.log('📥 Data imported successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to import data:', error);
            return false;
        }
    }

    getStorageUsage() {
        try {
            let totalSize = 0;
            const usage = {};

            Object.entries(this.storageKeys).forEach(([name, key]) => {
                const data = localStorage.getItem(key);
                const size = data ? new Blob([data]).size : 0;
                usage[name] = {
                    size: size,
                    sizeFormatted: this.formatBytes(size)
                };
                totalSize += size;
            });

            return {
                total: totalSize,
                totalFormatted: this.formatBytes(totalSize),
                breakdown: usage
            };
        } catch (error) {
            console.error('❌ Failed to calculate storage usage:', error);
            return null;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Check if localStorage is available
    isAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('⚠️ localStorage is not available:', error);
            return false;
        }
    }
}

// Global storage manager instance
window.storageManager = new StorageManager();

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}