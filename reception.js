// reception.js

function updateTime() {
    document.getElementById('live-time').textContent = new Date().toLocaleTimeString();
}
setInterval(updateTime, 1000);
updateTime();

let currentBillTable = null;
let currentBillAmount = 0;

function fetchOrders() {
    const ordersData = localStorage.getItem('mochaKitchenOrders');
    return ordersData ? JSON.parse(ordersData) : [];
}

function saveOrders(orders) {
    localStorage.setItem('mochaKitchenOrders', JSON.stringify(orders));
}

function renderDashboard() {
    const orders = fetchOrders();
    const today = new Date().toDateString();
    
    // Filter for today's orders that are NOT paid
    const activeOrders = orders.filter(o => o.date === today && o.status !== 'paid');
    
    // Metrics
    const tablesSet = new Set(activeOrders.map(o => o.tableNumber));
    document.getElementById('metric-active-tables').textContent = tablesSet.size;
    
    const pendingCount = activeOrders.filter(o => o.status === 'pending').length;
    document.getElementById('metric-pending-orders').textContent = pendingCount;
    
    const readyCount = activeOrders.filter(o => o.status === 'completed').length;
    document.getElementById('metric-ready-orders').textContent = readyCount;

    // Group by table
    const tablesMap = {};
    activeOrders.forEach(order => {
        if (!tablesMap[order.tableNumber]) tablesMap[order.tableNumber] = [];
        tablesMap[order.tableNumber].push(order);
    });

    const container = document.getElementById('tables-container');
    container.innerHTML = '';

    if (Object.keys(tablesMap).length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No active tables at the moment.</div>';
        return;
    }

    // Render each table card
    Object.keys(tablesMap).sort().forEach(tableNumber => {
        const tableOrders = tablesMap[tableNumber];
        
        // Group by deviceId
        const devicesMap = {};
        tableOrders.forEach(o => {
            if (!devicesMap[o.deviceId]) devicesMap[o.deviceId] = [];
            devicesMap[o.deviceId].push(o);
        });

        let tableTotal = 0;
        let devicesHtml = '';

        Object.keys(devicesMap).forEach((deviceId, index) => {
            const deviceOrders = devicesMap[deviceId];
            let ordersHtml = '';

            deviceOrders.forEach(order => {
                order.items.forEach(item => {
                    const itemTotal = item.unitPrice * item.quantity;
                    tableTotal += itemTotal;
                    
                    let statusLabel = '';
                    let statusClass = '';
                    let actionHtml = '';

                    if (order.status === 'pending') {
                        statusLabel = 'Cooking';
                        statusClass = 'status-pending';
                    } else if (order.status === 'completed') {
                        statusLabel = 'Ready to Serve';
                        statusClass = 'status-completed';
                        // Add "Mark Served" button
                        actionHtml = `<button class="serve-btn" onclick="markServed('${order.id}')">Serve</button>`;
                    } else if (order.status === 'served') {
                        statusLabel = 'Served';
                        statusClass = 'status-served';
                    }

                    ordersHtml += `
                        <div class="order-item">
                            <div class="order-info">
                                <span class="order-name">${item.quantity}x ${item.name}</span>
                                <span class="order-status ${statusClass}">${statusLabel}</span>
                            </div>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <span>₹${itemTotal}</span>
                                ${actionHtml}
                            </div>
                        </div>
                    `;
                });
            });

            devicesHtml += `
                <div class="device-group">
                    <div class="device-header">Device ${index + 1} ${deviceId.substring(0,4)}</div>
                    ${ordersHtml}
                </div>
            `;
        });

        const cardHtml = `
            <div class="table-card">
                <div class="table-card-header">
                    <h3>Table ${tableNumber}</h3>
                </div>
                <div class="table-card-body">
                    ${devicesHtml}
                </div>
                <div class="table-card-footer">
                    <div class="table-total">Total: ₹${tableTotal}</div>
                    <button class="btn" onclick="openBillModal('${tableNumber}', ${tableTotal})">Generate Bill</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
}

window.markServed = function(orderId) {
    const orders = fetchOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = 'served';
        saveOrders(orders);
        renderDashboard();
    }
};

window.openBillModal = function(tableNumber, total) {
    currentBillTable = tableNumber;
    currentBillAmount = total;
    
    document.getElementById('bill-table-number').textContent = `Table ${tableNumber} Bill`;
    
    // Get all unpaid items for this table
    const orders = fetchOrders();
    const today = new Date().toDateString();
    const tableOrders = orders.filter(o => o.date === today && o.status !== 'paid' && o.tableNumber === tableNumber);
    
    let html = '';
    tableOrders.forEach(order => {
        order.items.forEach(item => {
            html += `
                <div class="bill-item">
                    <span>${item.quantity}x ${item.name}</span>
                    <span>₹${item.unitPrice * item.quantity}</span>
                </div>
            `;
        });
    });
    
    html += `
        <div class="bill-total-row">
            <span>Total Due:</span>
            <span>₹${total}</span>
        </div>
    `;
    
    document.getElementById('bill-details').innerHTML = html;
    document.getElementById('bill-modal').classList.add('active');
};

window.closeBillModal = function() {
    document.getElementById('bill-modal').classList.remove('active');
    currentBillTable = null;
    currentBillAmount = 0;
};

document.getElementById('btn-mark-paid').addEventListener('click', () => {
    if (!currentBillTable) return;
    
    const orders = fetchOrders();
    const today = new Date().toDateString();
    
    // Mark all active orders for this table as paid
    orders.forEach(o => {
        if (o.date === today && o.tableNumber === currentBillTable && o.status !== 'paid') {
            o.status = 'paid';
        }
    });
    
    saveOrders(orders);
    
    // Dispatch event so kitchen and user devices know
    window.dispatchEvent(new Event('storage'));
    
    closeBillModal();
    renderDashboard();
});

// Auto-refresh when localStorage changes (e.g., kitchen completes order, or user pays)
window.addEventListener('storage', (e) => {
    if (e.key === 'mochaKitchenOrders' || !e.key) {
        renderDashboard();
    }
});

// Initial render
renderDashboard();
