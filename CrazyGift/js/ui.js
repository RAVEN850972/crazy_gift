/**
 * CrazyGift - UI Components & Modal System
 * Компоненты интерфейса и система модальных окон
 */

/**
 * Modal System
 */
class ModalManager {
    constructor() {
        this.currentModal = null;
        this.setupModalContainer();
    }

    setupModalContainer() {
        // Create modal container if it doesn't exist
        if (!document.getElementById('modalContainer')) {
            const container = document.createElement('div');
            container.id = 'modalContainer';
            document.body.appendChild(container);
        }
    }

    show(title, content, options = {}) {
        this.close(); // Close any existing modal

        const modal = this.createModal(title, content, options);
        document.getElementById('modalContainer').appendChild(modal);
        
        // Show with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        this.currentModal = modal;
        return modal;
    }

    createModal(title, content, options) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // Title
        if (title) {
            const titleEl = document.createElement('h3');
            titleEl.innerHTML = title;
            modal.appendChild(titleEl);
        }
        
        // Content
        if (content) {
            const contentEl = document.createElement('div');
            contentEl.className = 'modal-content';
            contentEl.innerHTML = content;
            modal.appendChild(contentEl);
        }
        
        // Buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'modal-buttons';
        buttonsContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 20px;';
        
        // Primary button
        const primaryBtn = document.createElement('button');
        primaryBtn.className = 'btn btn-primary btn-full';
        primaryBtn.textContent = options.primaryText || 'Понятно';
        primaryBtn.onclick = () => {
            if (options.onPrimary) options.onPrimary();
            this.close();
        };
        buttonsContainer.appendChild(primaryBtn);
        
        // Secondary button (if provided)
        if (options.secondaryText) {
            const secondaryBtn = document.createElement('button');
            secondaryBtn.className = 'btn btn-secondary btn-full';
            secondaryBtn.textContent = options.secondaryText;
            secondaryBtn.onclick = () => {
                if (options.onSecondary) options.onSecondary();
                this.close();
            };
            buttonsContainer.appendChild(secondaryBtn);
        }
        
        modal.appendChild(buttonsContainer);
        overlay.appendChild(modal);
        
        return overlay;
    }

    close() {
        if (this.currentModal) {
            this.currentModal.classList.remove('show');
            setTimeout(() => {
                if (this.currentModal && this.currentModal.parentNode) {
                    this.currentModal.parentNode.removeChild(this.currentModal);
                }
                this.currentModal = null;
            }, 300);
        }
    }

    confirm(title, message, onConfirm, onCancel) {
        return this.show(title, message, {
            primaryText: 'Да',
            secondaryText: 'Отмена',
            onPrimary: onConfirm,
            onSecondary: onCancel
        });
    }
}

// Global modal manager
window.modalManager = new ModalManager();

/**
 * Notification System
 */
class NotificationManager {
    constructor() {
        this.setupContainer();
    }

    setupContainer() {
        if (!document.getElementById('notificationContainer')) {
            const container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
    }

    show(message, type = 'info', duration = 3000) {
        const notification = this.createNotification(message, type);
        const container = document.getElementById('notificationContainer');
        
        container.appendChild(notification);
        
        // Show animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            this.remove(notification);
        }, duration);
        
        return notification;
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: var(--bg-card);
            color: var(--text-primary);
            padding: 12px 16px;
            border-radius: var(--border-radius-small);
            box-shadow: var(--shadow-card);
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            pointer-events: auto;
            cursor: pointer;
            border-left: 4px solid ${this.getTypeColor(type)};
        `;
        
        notification.innerHTML = message;
        notification.onclick = () => this.remove(notification);
        
        return notification;
    }

    getTypeColor(type) {
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        return colors[type] || colors.info;
    }

    remove(notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// Global notification manager
window.notificationManager = new NotificationManager();

/**
 * Loading System
 */
class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
        this.setupLoadingOverlay();
    }

    setupLoadingOverlay() {
        if (!document.getElementById('loadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 9999;
                display: none;
                align-items: center;
                justify-content: center;
            `;
            
            const spinner = document.createElement('div');
            spinner.style.cssText = `
                width: 40px;
                height: 40px;
                border: 4px solid var(--bg-secondary);
                border-top: 4px solid var(--accent-yellow);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            `;
            
            // Add spin animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            
            overlay.appendChild(spinner);
            document.body.appendChild(overlay);
        }
    }

    show(id = 'default') {
        this.activeLoaders.add(id);
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hide(id = 'default') {
        this.activeLoaders.delete(id);
        if (this.activeLoaders.size === 0) {
            document.getElementById('loadingOverlay').style.display = 'none';
        }
    }

    hideAll() {
        this.activeLoaders.clear();
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// Global loading manager
window.loadingManager = new LoadingManager();

/**
 * Item Component Creator
 */
function createItemCard(item, options = {}) {
    const card = document.createElement('div');
    card.className = `item-card ${options.className || ''}`;
    card.style.cssText = `
        background: var(--bg-card);
        border-radius: var(--border-radius-small);
        padding: 12px;
        text-align: center;
        cursor: pointer;
        transition: transform 0.2s;
        border: 2px solid transparent;
    `;
    
    // Image
    const image = document.createElement('div');
    image.style.cssText = `
        width: 100%;
        height: 60px;
        background: var(--bg-secondary);
        border-radius: var(--border-radius-small);
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    `;
    
    if (item.image) {
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.name;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
        image.appendChild(img);
    } else {
        image.innerHTML = '🎁';
        image.style.fontSize = '24px';
    }
    
    // Value badge
    if (item.value || item.stars) {
        const valueBadge = document.createElement('div');
        valueBadge.className = 'badge badge-primary';
        valueBadge.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            font-size: 10px;
        `;
        valueBadge.innerHTML = `
            <img src="assets/star_icon.png" style="width: 10px; height: 10px;">
            ${item.value || item.stars}
        `;
        
        card.style.position = 'relative';
        card.appendChild(valueBadge);
    }
    
    // Name
    const name = document.createElement('div');
    name.textContent = item.name || 'Unknown Item';
    name.style.cssText = `
        font-size: 12px;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 4px;
    `;
    
    // Rarity
    if (item.rarity) {
        const rarity = document.createElement('div');
        rarity.textContent = item.rarity;
        rarity.style.cssText = `
            font-size: 10px;
            color: var(--text-muted);
        `;
        card.appendChild(rarity);
    }
    
    card.appendChild(image);
    card.appendChild(name);
    
    // Hover effect
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px)';
        card.style.borderColor = 'var(--accent-yellow)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.borderColor = 'transparent';
    });
    
    // Click handler
    if (options.onClick) {
        card.addEventListener('click', () => options.onClick(item));
    }
    
    return card;
}

/**
 * Progress Circle Component
 */
function createProgressCircle(percentage, options = {}) {
    const size = options.size || 120;
    const strokeWidth = options.strokeWidth || 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    const container = document.createElement('div');
    container.style.cssText = `
        position: relative;
        width: ${size}px;
        height: ${size}px;
        margin: 0 auto;
    `;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.style.cssText = `
        transform: rotate(-90deg);
    `;
    
    // Background circle
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', size / 2);
    bgCircle.setAttribute('cy', size / 2);
    bgCircle.setAttribute('r', radius);
    bgCircle.setAttribute('fill', 'none');
    bgCircle.setAttribute('stroke', 'var(--bg-secondary)');
    bgCircle.setAttribute('stroke-width', strokeWidth);
    
    // Progress circle
    const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    progressCircle.setAttribute('cx', size / 2);
    progressCircle.setAttribute('cy', size / 2);
    progressCircle.setAttribute('r', radius);
    progressCircle.setAttribute('fill', 'none');
    progressCircle.setAttribute('stroke', 'url(#gradient)');
    progressCircle.setAttribute('stroke-width', strokeWidth);
    progressCircle.setAttribute('stroke-dasharray', circumference);
    progressCircle.setAttribute('stroke-dashoffset', offset);
    progressCircle.setAttribute('stroke-linecap', 'round');
    progressCircle.style.transition = 'stroke-dashoffset 0.5s ease';
    
    // Gradient definition
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'gradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '0%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', 'var(--accent-yellow)');
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', 'var(--accent-orange)');
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);
    svg.appendChild(bgCircle);
    svg.appendChild(progressCircle);
    
    // Text overlay
    const textOverlay = document.createElement('div');
    textOverlay.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: var(--text-primary);
    `;
    
    const percentText = document.createElement('div');
    percentText.style.cssText = `
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 4px;
    `;
    percentText.textContent = `${percentage.toFixed(2)}%`;
    
    const label = document.createElement('div');
    label.style.cssText = `
        font-size: 12px;
        color: var(--text-muted);
    `;
    label.textContent = options.label || 'Upgrade chance';
    
    textOverlay.appendChild(percentText);
    textOverlay.appendChild(label);
    
    container.appendChild(svg);
    container.appendChild(textOverlay);
    
    return container;
}

/**
 * Global UI Helper Functions
 */
function showModal(title, content, options = {}) {
    return window.modalManager.show(title, content, options);
}

function closeModal() {
    window.modalManager.close();
}

function showNotification(message, type = 'info', duration = 3000) {
    return window.notificationManager.show(message, type, duration);
}

function showLoading(id) {
    window.loadingManager.show(id);
}

function hideLoading(id) {
    window.loadingManager.hide(id);
}

function confirmAction(title, message, onConfirm, onCancel) {
    return window.modalManager.confirm(title, message, onConfirm, onCancel);
}

/**
 * Animation Helpers
 */
function animateValue(element, start, end, duration = 1000) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = start + (end - start) * progress;
        element.textContent = Math.floor(current).toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function slideIn(element, direction = 'up') {
    const directions = {
        up: 'translateY(20px)',
        down: 'translateY(-20px)',
        left: 'translateX(20px)',
        right: 'translateX(-20px)'
    };
    
    element.style.transform = directions[direction];
    element.style.opacity = '0';
    element.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
        element.style.transform = 'translate(0)';
        element.style.opacity = '1';
    }, 10);
}

function fadeOut(element, callback) {
    element.style.transition = 'opacity 0.3s ease';
    element.style.opacity = '0';
    
    setTimeout(() => {
        if (callback) callback();
    }, 300);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ModalManager,
        NotificationManager,
        LoadingManager,
        showModal,
        closeModal,
        showNotification,
        showLoading,
        hideLoading,
        confirmAction,
        createItemCard,
        createProgressCircle,
        animateValue,
        slideIn,
        fadeOut
    };
}