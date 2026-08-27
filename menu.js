document.addEventListener('DOMContentLoaded', () => {
    // 0. Device ID Setup
    if (!localStorage.getItem('mochaDeviceId')) {
        const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        localStorage.setItem('mochaDeviceId', randomId);
    }

    // 1. Table Context Setup & QR Loader
    const urlParams = new URLSearchParams(window.location.search);
    const tableFromUrl = urlParams.get('table');
    const qrLoader = document.getElementById('qr-loader');
    
    if (tableFromUrl) {
        sessionStorage.setItem('mochaTableNumber', tableFromUrl);
        // Clean URL to not show query params if desired
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Hide loader after 2 seconds to simulate loading
        setTimeout(() => {
            if (qrLoader) qrLoader.classList.add('hidden');
        }, 2000);
    } else {
        // If not loaded via QR, hide immediately
        if (qrLoader) qrLoader.classList.add('hidden');
    }
    
    const currentTable = sessionStorage.getItem('mochaTableNumber');
    const tableBadges = document.querySelectorAll('.table-badge');
    const tableNumbers = document.querySelectorAll('.table-number-display');
    
    if (currentTable) {
        tableBadges.forEach(badge => badge.style.display = 'inline-block');
        tableNumbers.forEach(num => num.textContent = currentTable);
    }

    const sections = document.querySelectorAll('.category-section');
    const desktopLinks = document.querySelectorAll('.sidebar-categories a');
    const mobileLinks = document.querySelectorAll('.mobile-category-scroll a');

    function activateSection(sectionId) {
        // Remove active class from all links and sections
        desktopLinks.forEach(link => link.classList.remove('active'));
        mobileLinks.forEach(link => link.classList.remove('active'));
        sections.forEach(sec => sec.classList.remove('active-section'));
        
        // Find target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active-section');
            
            // Add active to corresponding links
            const targetHref = `#${sectionId}`;
            desktopLinks.forEach(link => {
                if (link.getAttribute('href') === targetHref) {
                    link.classList.add('active');
                }
            });
            
            mobileLinks.forEach(link => {
                if (link.getAttribute('href') === targetHref) {
                    link.classList.add('active');
                    
                    // Scroll mobile pill container
                    const container = document.querySelector('.mobile-category-scroll');
                    if (container) {
                        const scrollLeft = link.offsetLeft - (container.offsetWidth / 2) + (link.offsetWidth / 2);
                        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                    }
                }
            });
            
            // Scroll to top of page (or near top) when changing tabs
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Handle clicks
    [...desktopLinks, ...mobileLinks].forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // If the link is an anchor on the same page
            if (href.startsWith('#')) {
                e.preventDefault(); // Stop normal anchor link jump behavior
                const sectionId = href.substring(1);
                
                // Update URL without jumping
                window.history.pushState(null, '', href);
                activateSection(sectionId);
            }
        });
    });

    // Check URL hash on load
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
        activateSection(hash.substring(1));
    } else if (sections.length > 0) {
        // Default to first section
        activateSection(sections[0].getAttribute('id'));
    }

    // Filter Functionality
    const toggles = document.querySelectorAll('.toggle-switch input');
    const showAllBtns = document.querySelectorAll('.diet-icon.all');
    const searchInputs = document.querySelectorAll('.search-input');
    
    function applyFilters() {
        const savedPref = localStorage.getItem('dietPreference') || 'all';
        const searchQuery = (searchInputs[0] ? searchInputs[0].value : '').toLowerCase().trim();
        
        const items = document.querySelectorAll('.menu-item');
        items.forEach(item => {
            const hasVeg = item.querySelector('.diet-icon.veg') !== null;
            const hasNonVeg = item.querySelector('.diet-icon.non-veg') !== null;
            const title = item.querySelector('.item-name')?.textContent.toLowerCase() || '';
            const desc = item.querySelector('.item-desc')?.textContent.toLowerCase() || '';
            
            // Diet check
            let dietMatch = true;
            if (savedPref === 'non-veg') {
                dietMatch = hasNonVeg || (!hasVeg && !hasNonVeg);
            } else if (savedPref === 'veg') {
                dietMatch = hasVeg || (!hasVeg && !hasNonVeg);
            }
            
            // Search check
            let searchMatch = true;
            if (searchQuery) {
                searchMatch = title.includes(searchQuery) || desc.includes(searchQuery);
            }
            
            if (dietMatch && searchMatch) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
        
        // Hide empty sections
        sections.forEach(section => {
            const visibleItems = section.querySelectorAll('.menu-item[style="display: flex;"], .menu-item:not([style*="display: none"])');
            if (visibleItems.length === 0) {
                section.style.display = 'none';
            } else {
                section.style.display = ''; 
            }
        });
    }

    function updateToggleUI(state) {
        toggles.forEach(t => {
            if (state === 'all') {
                t.indeterminate = true;
                t.checked = false;
            } else if (state === 'non-veg') {
                t.indeterminate = false;
                t.checked = true;
            } else {
                t.indeterminate = false;
                t.checked = false;
            }
        });
        
        showAllBtns.forEach(btn => {
            btn.style.opacity = state === 'all' ? '1' : '0.5';
        });
    }

    function setDietPreference(state) {
        localStorage.setItem('dietPreference', state);
        updateToggleUI(state);
        applyFilters();
    }

    if (toggles.length > 0 || searchInputs.length > 0) {
        toggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const state = e.target.checked ? 'non-veg' : 'veg';
                setDietPreference(state);
            });
        });
        
        showAllBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                setDietPreference('all');
            });
        });
        
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const val = e.target.value;
                searchInputs.forEach(i => { if (i !== e.target) i.value = val; });
                applyFilters();
            });
        });
        
        const mobileSearchBtn = document.querySelector('.mobile-search-btn');
        const mobileSearchContainer = document.querySelector('.mobile-search-container');
        if (mobileSearchBtn && mobileSearchContainer) {
            mobileSearchBtn.addEventListener('click', () => {
                if (mobileSearchContainer.style.display === 'none') {
                    mobileSearchContainer.style.display = 'block';
                    mobileSearchContainer.querySelector('input').focus();
                } else {
                    mobileSearchContainer.style.display = 'none';
                    // clear search on close
                    searchInputs.forEach(i => i.value = '');
                    applyFilters();
                }
            });
        }
        
        const savedPref = localStorage.getItem('dietPreference') || 'all';
        updateToggleUI(savedPref);
        applyFilters();
    }

    // Global Order Cancellation Timer
    function initCancellationTimer() {
        // Inject CSS if not exists
        if (!document.getElementById('cancellation-timer-styles')) {
            const style = document.createElement('style');
            style.id = 'cancellation-timer-styles';
            style.textContent = `
                #cancel-timer-banner {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    background-color: var(--brand-color, #78350f);
                    color: white;
                    padding: 12px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 -4px 12px rgba(0,0,0,0.15);
                    z-index: 9999;
                    font-family: 'Outfit', sans-serif;
                    box-sizing: border-box;
                    transform: translateY(100%);
                    transition: transform 0.3s ease-out;
                }
                #cancel-timer-banner.visible {
                    transform: translateY(0);
                }
                .cancel-timer-text {
                    font-size: 1rem;
                    font-weight: 500;
                }
                .cancel-btn {
                    background: var(--bg-main, #fdfbf7);
                    color: var(--brand-color, #78350f);
                    border: none;
                    padding: 6px 16px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }
                .cancel-btn:hover {
                    opacity: 0.9;
                }
                body.timer-active .floating-cart-btn,
                body.timer-active .social-fab {
                    bottom: 70px !important;
                }
            `;
            document.head.appendChild(style);
        }

        let banner = document.getElementById('cancel-timer-banner');
        let timerInterval;

        function updateBanner() {
            const endTime = localStorage.getItem('mochaOrderCancelEndTime');
            if (!endTime) {
                hideBanner();
                return;
            }

            const remaining = Math.max(0, Math.ceil((parseInt(endTime, 10) - Date.now()) / 1000));
            
            if (remaining <= 0) {
                localStorage.removeItem('mochaOrderCancelEndTime');
                hideBanner();
                return;
            }

            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'cancel-timer-banner';
                banner.innerHTML = `
                    <span class="cancel-timer-text">Order placed. You have <strong id="cancel-countdown">${remaining}</strong>s to cancel.</span>
                    <button class="cancel-btn" id="cancel-order-btn">Cancel Order</button>
                `;
                document.body.appendChild(banner);
                
                // Add padding to body so footer is not hidden
                document.body.style.paddingBottom = '60px';
                document.body.classList.add('timer-active');
                
                // Trigger animation
                requestAnimationFrame(() => {
                    banner.classList.add('visible');
                });

                document.getElementById('cancel-order-btn').addEventListener('click', () => {
                    localStorage.removeItem('mochaOrderCancelEndTime');
                    hideBanner();
                    
                    // --- Manager Analytics Logic ---
                    if (typeof Analytics !== 'undefined') {
                        const lastOrderId = sessionStorage.getItem('mochaLastOrderId');
                        if (lastOrderId) {
                            Analytics.logCancellation(lastOrderId);
                        }
                    }
                    // ---
                    
                    alert("Your order has been cancelled successfully.");
                });
            } else {
                const countdownEl = document.getElementById('cancel-countdown');
                if (countdownEl) countdownEl.textContent = remaining;
                if (!banner.classList.contains('visible')) {
                    banner.classList.add('visible');
                    document.body.style.paddingBottom = '60px';
                    document.body.classList.add('timer-active');
                }
            }
        }

        function hideBanner() {
            if (banner) {
                banner.classList.remove('visible');
                document.body.style.paddingBottom = '';
                document.body.classList.remove('timer-active');
                setTimeout(() => {
                    if (banner && banner.parentNode) {
                        banner.parentNode.removeChild(banner);
                        banner = null;
                    }
                    if (typeof window.updateCartUI === 'function') {
                        window.updateCartUI();
                    }
                }, 300);
            }
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        }

        updateBanner();
        timerInterval = setInterval(updateBanner, 1000);
        
        window.addEventListener('storage', (e) => {
            if (e.key === 'mochaOrderCancelEndTime') {
                if (!timerInterval) timerInterval = setInterval(updateBanner, 1000);
                updateBanner();
            }
        });
        
        window.addEventListener('orderPlaced', () => {
            if (!timerInterval) timerInterval = setInterval(updateBanner, 1000);
            updateBanner();
        });
    }

    initCancellationTimer();
});
