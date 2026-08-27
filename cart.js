// cart.js

let cart = [];
let currentItemForModal = null;
let currentModalQty = 1;
const taxRate = 0.05;

document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    
    // Modal Elements
    const modal = document.getElementById('customization-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalItemName = document.getElementById('modal-item-name');
    const modalItemImg = document.getElementById('modal-item-img');
    const modalItemIngredients = document.getElementById('modal-item-ingredients');
    const modalQty = document.getElementById('modal-qty');
    const modalQtyMinus = document.getElementById('modal-qty-minus');
    const modalQtyPlus = document.getElementById('modal-qty-plus');
    const modalAddToCartBtn = document.getElementById('modal-add-to-cart-btn');
    const modalTotalPrice = document.getElementById('modal-total-price');
    const addonCheckboxes = document.querySelectorAll('.addon-checkbox');
    const specialInstructions = document.getElementById('special-instructions');

    // Cart Elements
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const floatingCartBtn = document.getElementById('floating-cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartBadge = document.getElementById('cart-badge');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const slideToOrderContainer = document.getElementById('slide-to-order-container');
    const slideBg = document.getElementById('slide-bg');
    const slideText = document.getElementById('slide-text');
    const slideThumb = document.getElementById('slide-thumb');
    
    // Freq Bought Elements
    const freqBoughtSection = document.getElementById('cart-freq-bought-section');
    const freqBoughtItemsContainer = document.getElementById('freq-bought-items-container');

    // Setup Menu Item Click to Open Modal
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const menuItem = e.currentTarget;
            const name = menuItem.querySelector('.item-name').textContent;
            const priceText = menuItem.querySelector('.price').textContent;
            const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
            const imgSrc = menuItem.querySelector('.item-img').src;
            const ingredients = menuItem.getAttribute('data-ingredients') || 'Ingredients not available';
            const nutritionEl = menuItem.querySelector('.nutritional-overlay');
            const nutritionHtml = nutritionEl ? nutritionEl.innerHTML : '';
            
            openModal({ name, basePrice: price, image: imgSrc, ingredients: ingredients, nutritionHtml: nutritionHtml });
        });
    });

    // Modal Logic
    function openModal(item) {
        currentItemForModal = item;
        currentModalQty = 1;
        modalItemName.textContent = item.name;
        if (modalItemImg) modalItemImg.src = item.image;
        if (modalItemIngredients) modalItemIngredients.textContent = item.ingredients;
        
        const nutritionContainer = document.getElementById('modal-nutrition-container');
        if (nutritionContainer) {
            nutritionContainer.innerHTML = item.nutritionHtml || '';
        }

        modalQty.textContent = currentModalQty;
        specialInstructions.value = '';
        addonCheckboxes.forEach(cb => cb.checked = false);
        updateModalPrice();
        
        modal.classList.add('open');
        modalOverlay.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('open');
        modalOverlay.classList.remove('active');
        currentItemForModal = null;
    }

    function updateModalPrice() {
        if (!currentItemForModal) return;
        let addonsTotal = 0;
        addonCheckboxes.forEach(cb => {
            if (cb.checked) addonsTotal += parseInt(cb.dataset.price, 10);
        });
        const total = (currentItemForModal.basePrice + addonsTotal) * currentModalQty;
        modalTotalPrice.textContent = `₹${total}`;
    }

    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    modalQtyMinus.addEventListener('click', () => {
        if (currentModalQty > 1) {
            currentModalQty--;
            modalQty.textContent = currentModalQty;
            updateModalPrice();
        }
    });

    modalQtyPlus.addEventListener('click', () => {
        currentModalQty++;
        modalQty.textContent = currentModalQty;
        updateModalPrice();
    });

    addonCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateModalPrice);
    });

    modalAddToCartBtn.addEventListener('click', () => {
        if (!currentItemForModal) return;
        
        const addons = [];
        let addonsTotal = 0;
        addonCheckboxes.forEach(cb => {
            if (cb.checked) {
                addons.push(cb.value);
                addonsTotal += parseInt(cb.dataset.price, 10);
            }
        });
        
        const instructions = specialInstructions.value.trim();
        
        const cartItem = {
            id: Date.now().toString(), // unique ID for this cart entry
            name: currentItemForModal.name,
            image: currentItemForModal.image,
            basePrice: currentItemForModal.basePrice,
            addons: addons,
            addonsTotal: addonsTotal,
            instructions: instructions,
            quantity: currentModalQty,
            unitPrice: currentItemForModal.basePrice + addonsTotal
        };
        
        cart.push(cartItem);
        updateCartUI();
        closeModal();
        
        // Slight animation on cart button
        floatingCartBtn.style.transform = 'scale(1.2)';
        setTimeout(() => floatingCartBtn.style.transform = '', 200);
    });

    // Cart Logic
    function populateFreqBoughtItems() {
        const allItems = Array.from(document.querySelectorAll('.menu-item'));
        if (allItems.length === 0) return;
        
        let selected = [];
        
        if (typeof Analytics !== 'undefined') {
            const cartItemNames = cart.map(i => i.name);
            const suggestions = Analytics.getSuggestionsForCart(cartItemNames);
            
            // Find HTML elements for suggestions
            suggestions.forEach(suggestedName => {
                if (selected.length < 3) {
                    const itemEl = allItems.find(el => el.querySelector('.item-name').textContent === suggestedName);
                    if (itemEl && !cartItemNames.includes(suggestedName)) {
                        selected.push(itemEl);
                    }
                }
            });
        }
        
        // Fill remaining with random (not in cart, not already selected)
        if (selected.length < 3) {
            const cartNames = cart.map(i => i.name);
            const availableForRandom = allItems.filter(el => {
                const n = el.querySelector('.item-name').textContent;
                return !cartNames.includes(n) && !selected.includes(el);
            });
            const shuffled = availableForRandom.sort(() => 0.5 - Math.random());
            selected = [...selected, ...shuffled.slice(0, 3 - selected.length)];
        }
        
        freqBoughtItemsContainer.innerHTML = '';
        selected.forEach(item => {
            const name = item.querySelector('.item-name').textContent;
            const priceText = item.querySelector('.price').textContent;
            const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
            const imgSrc = item.querySelector('.item-img').src;
            const ingredients = item.getAttribute('data-ingredients') || 'Ingredients not available';
            
            const isVeg = !name.toLowerCase().includes('chicken'); // Mock logic
            const iconColor = isVeg ? '#22c55e' : '#b91c1c';
            const iconShape = isVeg ? '<circle cx="12" cy="12" r="4" fill="currentColor"/>' : '<polygon points="12,8 16,16 8,16" fill="currentColor"/>';

            const html = `
                <div class="freq-item">
                    <div style="position: relative; width: 100px; height: 100%; flex-shrink: 0;">
                        <img src="${imgSrc}" class="freq-item-img" alt="${name}">
                        <div style="position: absolute; top: 4px; right: 4px; background: white; border-radius: 4px; padding: 2px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" style="color: ${iconColor};">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                ${iconShape}
                            </svg>
                        </div>
                    </div>
                    <div class="freq-item-info">
                        <h5 class="freq-item-name" style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #1e293b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${name}</h5>
                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px;">
                            <span class="freq-item-price" style="font-size: 0.9rem; color: #64748b;">₹${price}</span>
                            <button class="freq-item-add-btn" onclick="window.addFreqItemToCart('${name.replace(/'/g, "\\'")}', ${price}, '${imgSrc}', '${ingredients.replace(/'/g, "\\'")}')">
                                <span style="font-size: 1.1rem; line-height: 1;">+</span> ADD
                            </button>
                        </div>
                    </div>
                </div>
            `;
            freqBoughtItemsContainer.insertAdjacentHTML('beforeend', html);
        });
        freqBoughtSection.style.display = 'block';
    }

    window.addFreqItemToCart = function(name, price, image, ingredients) {
        openModal({ name, basePrice: price, image, ingredients });
    };

    function openCart() {
        if (cart.length > 0) {
            populateFreqBoughtItems();
        } else {
            freqBoughtSection.style.display = 'none';
        }
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('active');
    }

    function closeCart() {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('active');
    }

    floatingCartBtn.addEventListener('click', openCart);
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    window.updateCartUI = function() {
        // Render logic
        cartItemsContainer.innerHTML = '';
        
        // 1. Fetch active (placed) orders
        const myTable = sessionStorage.getItem('mochaTableNumber') || 'Takeaway/Unknown';
        const myDevice = localStorage.getItem('mochaDeviceId');
        let kitchenOrders = [];
        try {
            kitchenOrders = JSON.parse(localStorage.getItem('mochaKitchenOrders')) || [];
        } catch (e) {}
        
        // Find ALL active orders for this device and table
        const activeOrders = kitchenOrders.filter(o => o.tableNumber === myTable && o.deviceId === myDevice && (o.status === 'pending' || o.status === 'completed' || o.status === 'served'));
        
        let hasActiveOrders = activeOrders.length > 0;
        let billTotal = 0;

        // Update badge and button visibility
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartItemCount = document.getElementById('cart-item-count');
        if (cartItemCount) {
            cartItemCount.textContent = totalItems + (hasActiveOrders ? activeOrders.reduce((sum, o) => sum + o.items.length, 0) : 0);
        }
        
        if (totalItems > 0 || hasActiveOrders) {
            floatingCartBtn.style.display = 'flex';
        } else {
            floatingCartBtn.style.display = 'none';
        }


        
        // 2. Render active orders if any
        if (hasActiveOrders) {
            let allItemsHtml = '';
            
            activeOrders.forEach(order => {
                let statusText = 'Cooking...';
                if (order.status === 'completed') statusText = 'Ready to Serve';
                if (order.status === 'served') statusText = 'Served';

                let orderItemsHtml = order.items.map(item => {
                    const itemTotal = item.unitPrice * item.quantity;
                    billTotal += itemTotal;
                    return `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
                            <span>${item.quantity}x ${item.name}</span>
                            <span>₹${itemTotal}</span>
                        </div>
                    `;
                }).join('');

                allItemsHtml += `
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 0.85rem; color: var(--text-muted, #64748b);">Order #${order.id.substring(4, 9)}</span>
                            <span style="font-size: 0.75rem; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${statusText}</span>
                        </div>
                        ${orderItemsHtml}
                    </div>
                    <hr style="border: 0; border-top: 1px dashed #e2e8f0; margin: 12px 0;">
                `;
            });

            const html = `
                <div style="padding: 16px; border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; margin-bottom: 24px; background: var(--bg-panel, #ffffff);">
                    <h4 style="margin: 0 0 16px 0; color: var(--brand-color);">Confirmed Orders</h4>
                    ${allItemsHtml}
                    <div style="display: flex; justify-content: space-between; margin-top: 12px; font-weight: bold; font-size: 1.1rem;">
                        <span>Total Bill:</span>
                        <span>₹${billTotal}</span>
                    </div>
                </div>
            `;
            cartItemsContainer.insertAdjacentHTML('beforeend', html);
        }
        
        // 3. Render unplaced cart items
        if (cart.length > 0) {
            let cartHeader = document.createElement('h4');
            cartHeader.textContent = "New Items to Order";
            cartHeader.style.margin = "0 0 16px 0";
            cartHeader.style.color = "var(--text-dark)";
            cartItemsContainer.appendChild(cartHeader);
            
            cart.forEach((item) => {
                const itemTotal = item.unitPrice * item.quantity;
                const addonsText = item.addons.length > 0 ? `Add-ons: ${item.addons.join(', ')}` : '';
                const instText = item.instructions ? `Note: ${item.instructions}` : '';
                
                const isVeg = !item.name.toLowerCase().includes('chicken'); // Mock veg/non-veg logic
                const iconColor = isVeg ? '#22c55e' : '#b91c1c';
                const iconShape = isVeg ? '<circle cx="12" cy="12" r="4" fill="currentColor"/>' : '<polygon points="12,8 16,16 8,16" fill="currentColor"/>';
                
                const html = `
                    <div class="cart-item" style="display: flex; flex-direction: column; padding: 16px 0; border-bottom: 1px solid #f1f5f9; gap: 12px; margin-bottom: 0; border-radius: 0; box-shadow: none;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                            <div style="display: flex; gap: 8px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" style="color: ${iconColor}; margin-top: 2px;">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    ${iconShape}
                                </svg>
                                <div style="display: flex; flex-direction: column; gap: 4px;">
                                    <h4 class="cart-item-title" style="margin: 0; font-size: 1rem; color: #1e293b; font-weight: 600;">${item.name}</h4>
                                    <span class="cart-item-price" style="font-size: 0.9rem; color: #64748b;">₹${itemTotal}</span>
                                </div>
                            </div>
                            
                            <div class="quantity-controls small" style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); background: white;">
                                <button style="color: #1e293b; font-size: 1rem; padding: 0 8px;" onclick="window.updateCartItemQty('${item.id}', -1)">−</button>
                                <span style="font-weight: 600; font-size: 0.9rem; min-width: 20px; text-align: center;">${item.quantity}</span>
                                <button style="color: #1e293b; font-size: 1rem; padding: 0 8px;" onclick="window.updateCartItemQty('${item.id}', 1)">+</button>
                            </div>
                        </div>
                        
                        ${addonsText ? `<div class="cart-item-addons" style="font-size: 0.85rem; color: #64748b; margin-left: 24px;">${addonsText}</div>` : ''}
                        
                        <div style="margin-top: 4px;">
                            <div style="display: flex; align-items: center; gap: 8px; border: 1px solid #f1f5f9; border-radius: 6px; padding: 8px 12px; background: white;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <input type="text" placeholder="Add cooking instructions" value="${item.instructions || ''}" style="border: none; outline: none; width: 100%; font-size: 0.85rem; color: #64748b; font-family: 'Outfit', sans-serif;" onblur="window.updateCartItemInstructions('${item.id}', this.value)" />
                            </div>
                        </div>
                    </div>
                `;
                cartItemsContainer.insertAdjacentHTML('beforeend', html);
            });
            
            // Add Offers Section
            const offersHtml = `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; margin-top: 16px; cursor: pointer;">
                    <div style="display: flex; align-items: center; gap: 12px; color: #16a34a; font-weight: 600;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        <span>Apply Store offers/coupons</span>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
            `;
            cartItemsContainer.insertAdjacentHTML('beforeend', offersHtml);
            
            if (slideToOrderContainer) slideToOrderContainer.classList.remove('disabled');
            freqBoughtSection.style.display = 'block';
        } else {
            if (slideToOrderContainer) slideToOrderContainer.classList.add('disabled');
            freqBoughtSection.style.display = 'none';
            if (!hasActiveOrders) {
                cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty</div>';
            }
        }
        
        // Pay Button Logic
        const payBtn = document.getElementById('cart-pay-now-btn');
        if (payBtn) {
            const cancelTime = localStorage.getItem('mochaOrderCancelEndTime');
            const isCancelWindowOpen = cancelTime && Date.now() < parseInt(cancelTime, 10);
            
            if (cart.length > 0) {
                // Currently ordering new items
                payBtn.classList.add('disabled');
                payBtn.disabled = true;
                payBtn.textContent = 'Pay Bill Now';
                payBtn.onclick = null;
            } else if (isCancelWindowOpen) {
                // Order placed but can still cancel
                payBtn.classList.add('disabled');
                payBtn.disabled = true;
                payBtn.textContent = 'Order Confirming...';
                payBtn.onclick = null;
            } else if (hasActiveOrders) {
                // Order is confirmed and ready to be paid
                payBtn.classList.remove('disabled');
                payBtn.disabled = false;
                payBtn.textContent = `Pay Bill (₹${billTotal})`;
                // Use the first active order's ID for the mock payment reference
                const refOrderId = activeOrders.length > 0 ? activeOrders[0].id : '';
                payBtn.onclick = () => window.payBill(refOrderId, billTotal);
            } else {
                // Nothing to pay
                payBtn.classList.add('disabled');
                payBtn.disabled = true;
                payBtn.textContent = 'Pay Bill Now';
                payBtn.onclick = null;
            }
        }
    };

    // Global functions for inline HTML event handlers
    window.payBill = function(orderId, amount) {
        // Mock payment flow
        alert(`Redirecting to payment gateway for ₹${amount}...`);
        
        let kitchenOrders = [];
        try {
            kitchenOrders = JSON.parse(localStorage.getItem('mochaKitchenOrders')) || [];
        } catch (e) {}
        
        const myTable = sessionStorage.getItem('mochaTableNumber') || 'Takeaway/Unknown';
        const myDevice = localStorage.getItem('mochaDeviceId');
        
        // Mark all active orders for this device as paid
        let paidAny = false;
        kitchenOrders.forEach(o => {
            if (o.tableNumber === myTable && o.deviceId === myDevice && (o.status === 'pending' || o.status === 'completed' || o.status === 'served')) {
                o.status = 'paid';
                paidAny = true;
            }
        });
        
        if (paidAny) {
            localStorage.setItem('mochaKitchenOrders', JSON.stringify(kitchenOrders));
            
            // Dispatch event so kitchen dash updates
            window.dispatchEvent(new Event('storage'));
            
            alert('Payment Successful! Thank you for dining with Dhunki.');
            if (typeof window.updateCartUI === 'function') {
                window.updateCartUI(); // refresh UI
            }
        }
    };

    window.updateCartItemQty = function(id, change) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                window.removeCartItem(id);
            } else {
                if (typeof window.updateCartUI === 'function') {
                    window.updateCartUI();
                }
            }
        }
    };

    window.updateCartItemInstructions = function(id, instructions) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.instructions = instructions;
            // No need to refresh UI since the input already has the value
        }
    };

    window.removeCartItem = function(id) {
        cart = cart.filter(i => i.id !== id);
        updateCartUI();
    };

    // Slide to Order Mechanics
    let isDragging = false;
    let startX = 0;
    
    if (slideThumb) {
        slideThumb.addEventListener('mousedown', startDrag);
        slideThumb.addEventListener('touchstart', startDrag, {passive: true});
        
        document.addEventListener('mousemove', drag, {passive: false});
        document.addEventListener('touchmove', drag, {passive: false});
        
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }

    function startDrag(e) {
        if (slideToOrderContainer.classList.contains('disabled')) return;
        isDragging = true;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        slideThumb.style.transition = 'none';
        slideBg.style.transition = 'none';
        slideToOrderContainer.classList.add('active');
    }

    function drag(e) {
        if (!isDragging) return;
        
        // Only prevent default on touchmove to avoid scroll blocking on mousedown
        if (e.type === 'touchmove' && e.cancelable) {
            e.preventDefault(); 
        }

        const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const diffX = currentX - startX;
        
        const containerWidth = slideToOrderContainer.offsetWidth;
        const thumbWidth = slideThumb.offsetWidth;
        const maxSlide = containerWidth - thumbWidth - 10; // 5px padding on each side
        
        let newLeft = Math.max(0, Math.min(diffX, maxSlide));
        slideThumb.style.transform = `translateX(${newLeft}px)`;
        slideBg.style.width = `${newLeft + thumbWidth / 2}px`;
        
        if (newLeft >= maxSlide) {
            isDragging = false;
            
            // Revert UI slightly before alert
            slideThumb.style.transition = 'transform 0.3s';
            slideBg.style.transition = 'width 0.3s';
            slideThumb.style.transform = 'translateX(0)';
            slideBg.style.width = '0';
            slideToOrderContainer.classList.remove('active');
            
            placeOrder();
        }
    }

    function endDrag(e) {
        if (!isDragging) return;
        isDragging = false;
        slideThumb.style.transition = 'transform 0.3s ease-out';
        slideBg.style.transition = 'width 0.3s ease-out';
        slideThumb.style.transform = 'translateX(0)';
        slideBg.style.width = '0';
        slideToOrderContainer.classList.remove('active');
    }

    function placeOrder() {
        const tableNumber = sessionStorage.getItem('mochaTableNumber') || 'Takeaway/Unknown';
        
        let subtotal = 0;
        cart.forEach(item => subtotal += item.unitPrice * item.quantity);
        const taxes = Math.round(subtotal * taxRate);
        const grandTotal = `₹${subtotal + taxes}`;
        
        const orderSummary = cart.map(i => `${i.quantity}x ${i.name}`).join('\n');
        
        alert(`Order Placed for Table: ${tableNumber}!\n\nItems:\n${orderSummary}\n\nOur chef is preparing your meal.`);
        
        // --- Kitchen Dashboard Logic ---
        const deviceId = localStorage.getItem('mochaDeviceId') || 'UnknownDevice';
        const todayDate = new Date().toDateString();
        
        let kitchenOrders = [];
        try {
            kitchenOrders = JSON.parse(localStorage.getItem('mochaKitchenOrders')) || [];
        } catch (e) {
            kitchenOrders = [];
        }

        // Purge old orders (different day)
        kitchenOrders = kitchenOrders.filter(order => order.date === todayDate);

        // Find existing order for same table and device today
        let existingOrder = kitchenOrders.find(o => o.tableNumber === tableNumber && o.deviceId === deviceId && o.status === 'pending');

        let orderId = '';
        if (existingOrder) {
            // Merge items
            orderId = existingOrder.id;
            cart.forEach(cartItem => {
                let existingItem = existingOrder.items.find(i => i.name === cartItem.name);
                if (existingItem) {
                    existingItem.quantity += cartItem.quantity;
                } else {
                    existingOrder.items.push({...cartItem});
                }
            });
            existingOrder.timestamp = Date.now(); // update time to latest
        } else {
            // Create new order
            orderId = 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase();
            kitchenOrders.push({
                id: orderId,
                tableNumber: tableNumber,
                deviceId: deviceId,
                date: todayDate,
                timestamp: Date.now(),
                items: JSON.parse(JSON.stringify(cart)),
                status: 'pending'
            });
        }

        localStorage.setItem('mochaKitchenOrders', JSON.stringify(kitchenOrders));
        
        // --- Manager Analytics Logic ---
        if (typeof Analytics !== 'undefined') {
            // We store the current order id in session storage to cancel it later if needed
            sessionStorage.setItem('mochaLastOrderId', orderId);
            Analytics.logOrder(cart, grandTotal, orderId);
        }
        // --- End Kitchen Logic ---

        
        // Set 1 minute cancellation timer
        localStorage.setItem('mochaOrderCancelEndTime', Date.now() + 60000);
        window.dispatchEvent(new Event('orderPlaced'));
        
        // Reset Cart
        cart = [];
        updateCartUI();
        closeCart();
    }
});
