// social-tables.js

(function() {
    // 1. Inject UI Elements
    function injectUI() {
        if (document.getElementById('social-tables-fab')) return; // Already injected

        // FAB Button
        const fab = document.createElement('button');
        fab.id = 'social-tables-fab';
        fab.className = 'social-fab';
        fab.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="8" width="20" height="4" rx="1"></rect>
                <path d="M5 12v9"></path>
                <path d="M19 12v9"></path>
            </svg>
        `;
        document.body.appendChild(fab);

        // Modal structure
        const overlay = document.createElement('div');
        overlay.id = 'social-modal-overlay';
        overlay.className = 'social-modal-overlay';
        overlay.innerHTML = `
            <div class="social-modal">
                <div class="social-modal-header">
                    <h2>What's on Others' Tables</h2>
                    <button class="social-modal-close" id="social-modal-close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="social-modal-body" id="social-modal-body">
                    <!-- Populated by JS -->
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Event Listeners
        fab.addEventListener('click', openModal);
        document.getElementById('social-modal-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    function openModal() {
        populateData();
        document.getElementById('social-modal-overlay').classList.add('active');
    }

    function closeModal() {
        document.getElementById('social-modal-overlay').classList.remove('active');
    }

    function populateData() {
        const body = document.getElementById('social-modal-body');
        const myTable = sessionStorage.getItem('mochaTableNumber') || 'Takeaway/Unknown';
        const todayDate = new Date().toDateString();
        
        let orders = [];
        try {
            orders = JSON.parse(localStorage.getItem('mochaKitchenOrders')) || [];
        } catch (e) {
            orders = [];
        }

        // Filter: only today, not my table
        const otherOrders = orders.filter(o => o.date === todayDate && o.tableNumber !== myTable);

        // Group by table
        const tableMap = {};
        otherOrders.forEach(order => {
            if (!tableMap[order.tableNumber]) {
                tableMap[order.tableNumber] = { items: [] };
            }
            // Merge items for this table
            order.items.forEach(item => {
                let existing = tableMap[order.tableNumber].items.find(i => i.name === item.name);
                if (existing) {
                    existing.quantity += item.quantity;
                } else {
                    tableMap[order.tableNumber].items.push({...item});
                }
            });
        });

        const tables = Object.keys(tableMap);
        
        if (tables.length === 0) {
            body.innerHTML = `
                <div class="social-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; opacity: 0.5; margin-bottom: 16px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                    <p>It's quiet right now...</p>
                    <p style="font-size: 0.9rem; opacity: 0.7;">Be the first to order something delicious!</p>
                </div>
            `;
            return;
        }

        // Build HTML
        let html = '';
        tables.forEach(tableName => {
            const itemCount = tableMap[tableName].items.reduce((sum, item) => sum + item.quantity, 0);
            
            let itemsHtml = tableMap[tableName].items.map(item => `
                <li class="social-item">
                    <div class="social-item-qty">${item.quantity}</div>
                    <div class="social-item-name">${item.name}</div>
                </li>
            `).join('');

            html += `
                <div class="social-table-group">
                    <div class="social-table-header" onclick="this.parentElement.classList.toggle('open'); toggleAccordion(this.nextElementSibling);">
                        <div class="social-table-title">
                            Table ${tableName}
                            <span class="social-table-badge">${itemCount} items</span>
                        </div>
                        <svg class="social-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                    <div class="social-table-content">
                        <ul class="social-items-list">
                            ${itemsHtml}
                        </ul>
                    </div>
                </div>
            `;
        });

        body.innerHTML = html;
    }

    // Export toggle accordion function to global scope for inline usage
    window.toggleAccordion = function(contentEl) {
        if (contentEl.style.maxHeight) {
            contentEl.style.maxHeight = null;
        } else {
            contentEl.style.maxHeight = contentEl.scrollHeight + "px";
        }
    };

    // Initialize on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectUI);
    } else {
        injectUI();
    }
})();
