// Global Variables
let productsData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentPage = 1;
let itemsPerPage = 12;
let filteredProducts = [];
let filters = {
    category: [],
    brand: [],
    platform: [],
    priceMin: null,
    priceMax: null,
    inStock: false,
    outOfStock: false,
    search: ''
};

// Initialize App
document.addEventListener('DOMContentLoaded', function () {
    loadProductsData();
    initializeNavigation();
    initializeCart();
    initializePage();

    // Update cart count on page load
    updateCartCount();
});

// Load Products Data
async function loadProductsData() {
    try {
        const response = await fetch('data/products.json');
        productsData = await response.json();

        // NOW populate categories after data is loaded
        populateCategoriesDropdown();

        // Initialize page-specific content
        if (document.body.classList.contains('home-page') || window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            initializeHomePage();
        } else if (window.location.pathname.includes('products.html')) {
            initializeProductsPage();
        } else if (window.location.pathname.includes('product-details.html')) {
            initializeProductDetailsPage();
        } else if (window.location.pathname.includes('contact.html')) {
            initializeContactPage();
        }

    } catch (error) {
        console.error('Error loading products data:', error);
    }
}

// Initialize Navigation
function initializeNavigation() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    // Mobile menu toggle
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', function () {
            mobileNav.style.display = mobileNav.style.display === 'block' ? 'none' : 'block';
        });
    }

    // Search functionality
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

}

// Populate Categories Dropdown
function populateCategoriesDropdown() {
    if (!productsData || !productsData.categories) return;

    const categoriesDropdown = document.getElementById('categoriesDropdown');
    const mobileCategoriesContent = document.getElementById('mobileCategoriesContent');
    const footerCategories = document.getElementById('footerCategories');

    // Sort categories by order
    const sortedCategories = productsData.categories.sort((a, b) => a.order - b.order);

    sortedCategories.forEach(category => {
        // Desktop dropdown
        if (categoriesDropdown) {
            const link = document.createElement('a');
            link.href = `products.html?category=${encodeURIComponent(category.slug)}`;
            link.innerHTML = `<i class="${category.icon}"></i> ${category.name}`;
            link.title = category.description;
            categoriesDropdown.appendChild(link);
        }

        // Mobile dropdown
        if (mobileCategoriesContent) {
            const link = document.createElement('a');
            link.href = `products.html?category=${encodeURIComponent(category.slug)}`;
            link.innerHTML = `<i class="${category.icon}"></i> ${category.name}`;
            link.className = 'mobile-nav-link';
            mobileCategoriesContent.appendChild(link);
        }

        // Footer categories (only featured ones)
        if (footerCategories && category.featured) {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = `products.html?category=${encodeURIComponent(category.slug)}`;
            link.textContent = category.name;
            li.appendChild(link);
            footerCategories.appendChild(li);
        }
    });
}


// Perform Search
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();

    if (query) {
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    }
}

// Initialize Cart
function initializeCart() {
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartClose = document.getElementById('cartClose');
    const cartBackdrop = document.getElementById('cartBackdrop');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartBtn) {
        cartBtn.addEventListener('click', openCart);
    }

    if (cartClose) {
        cartClose.addEventListener('click', closeCart);
    }

    if (cartBackdrop) {
        cartBackdrop.addEventListener('click', closeCart);
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', openCheckout);
    }

    // Initialize checkout modal
    initializeCheckout();
}

// Open Cart
function openCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartBackdrop = document.getElementById('cartBackdrop');

    if (cartSidebar && cartBackdrop) {
        cartSidebar.classList.add('active');
        cartBackdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderCartItems();
    }
}

// Close Cart
function closeCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartBackdrop = document.getElementById('cartBackdrop');

    if (cartSidebar && cartBackdrop) {
        cartSidebar.classList.remove('active');
        cartBackdrop.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Add to Cart
function addToCart(productId, quantity = 1) {
    if (!productsData) return;

    const product = productsData.products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.images[0],
            quantity: quantity
        });
    }

    saveCart();
    updateCartCount();
    showCartNotification(`${product.name} added to cart!`);
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    renderCartItems();
}

// Update Cart Quantity
function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(1, quantity);
        saveCart();
        updateCartCount();

        // Only render cart items if cart sidebar exists and is visible
        const cartSidebar = document.getElementById('cartSidebar');
        const cartContent = document.getElementById('cartContent');

        if (cartSidebar && cartContent && cartSidebar.classList.contains('active')) {
            renderCartItems();
        }
    }
}

// Save Cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Update Cart Count
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

// Render Cart Items
// Render Cart Items
function renderCartItems() {
    const cartContent = document.getElementById('cartContent');
    const emptyCart = document.getElementById('emptyCart');
    const cartFooter = document.getElementById('cartFooter');

    // Add null checks to prevent errors on pages without cart elements
    if (!cartContent || !emptyCart || !cartFooter) {
        console.warn('Cart elements not found on this page');
        return;
    }

    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        cartFooter.style.display = 'none';
        return;
    }

    emptyCart.style.display = 'none';
    cartFooter.style.display = 'block';

    const cartItemsHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">DT ${item.price.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <input type="number" value="${item.quantity}" min="1" class="quantity-input" 
                           onchange="updateCartQuantity('${item.id}', parseInt(this.value))">
                    <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    cartContent.innerHTML = cartItemsHTML;

    // Update totals
    updateCartTotals();
}

// Update Cart Totals
// Update Cart Totals
function updateCartTotals() {
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartTotal = document.getElementById('cartTotal');

    // Add null checks
    if (!cartSubtotal || !cartTotal) {
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal; // Free shipping

    cartSubtotal.textContent = `DT ${subtotal.toFixed(2)}`;
    cartTotal.textContent = `DT ${total.toFixed(2)}`;
}


// Show Cart Notification
function showCartNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 4000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);

    // Animate out and remove
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialize Checkout
function initializeCheckout() {
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutClose = document.getElementById('checkoutClose');
    const checkoutForm = document.getElementById('checkoutForm');
    const successModal = document.getElementById('successModal');
    const successClose = document.getElementById('successClose');

    if (checkoutClose) {
        checkoutClose.addEventListener('click', closeCheckout);
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }

    if (successClose) {
        successClose.addEventListener('click', closeSuccess);
    }
}

// Open Checkout
function openCheckout() {
    const checkoutModal = document.getElementById('checkoutModal');

    if (checkoutModal && cart.length > 0) {
        checkoutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderCheckoutItems();
        closeCart();
    }
}

// Close Checkout
function closeCheckout() {
    const checkoutModal = document.getElementById('checkoutModal');

    if (checkoutModal) {
        checkoutModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Render Checkout Items
function renderCheckoutItems() {
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');

    if (!checkoutItems) return;

    const itemsHTML = cart.map(item => `
        <div class="checkout-item">
            <span>${item.name} x ${item.quantity}</span>
            <span>DT ${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    checkoutItems.innerHTML = itemsHTML;

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (checkoutTotal) {
        checkoutTotal.textContent = `DT ${total.toFixed(2)}`;
    }
}

// Handle Checkout
async function handleCheckout(e) {
    e.preventDefault();
    // Gather form data
    const formData = new FormData(e.target);
    const order = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    };

    // Simulate order processing...
    setTimeout(async () => {
        // Send message to Telegram
        const telegramToken = '7633077478:AAGgnq_k0poVq_lFRybvUDZAhnQWS6nvC7o';
        const chatId = '-4916020667';
        const message =
            `🆕 New Order 🆕\n` +
            `Name: ${order.name}\n` +
            `Phone: ${order.phone}\n` +
            `Email: ${order.email}\n` +
            `Address: ${order.address}\n` +
            `Total: DT ${order.total.toFixed(2)}`;

        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: message })
        });

        // Clear cart and show confirmation
        cart = [];
        saveCart();
        updateCartCount();
        closeCheckout();
        showSuccess();
    }, 1000);
}


// Show Success Modal
function showSuccess() {
    const successModal = document.getElementById('successModal');

    if (successModal) {
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close Success Modal
function closeSuccess() {
    const successModal = document.getElementById('successModal');

    if (successModal) {
        successModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Initialize Page
function initializePage() {
    const currentPath = window.location.pathname;

    if (currentPath.includes('index.html') || currentPath === '/' || currentPath === '') {
        document.body.classList.add('home-page');
    } else if (currentPath.includes('products.html')) {
        document.body.classList.add('products-page');
    } else if (currentPath.includes('product-details.html')) {
        document.body.classList.add('product-details-page');
    } else if (currentPath.includes('contact.html')) {
        document.body.classList.add('contact-page');
    }
}

// Initialize Home Page
function initializeHomePage() {
    if (!productsData) return;

    initializeBanner();
    renderFeaturedProducts();
    renderPartners();
}

// Initialize Banner
function initializeBanner() {
    if (!productsData.banners) return;

    const bannerSlider = document.getElementById('bannerSlider');
    const bannerIndicators = document.getElementById('bannerIndicators');
    const prevBtn = document.getElementById('prevBanner');
    const nextBtn = document.getElementById('nextBanner');

    if (!bannerSlider) return;

    let currentSlide = 0;
    const banners = productsData.banners;

    // Create banner slides
    banners.forEach((banner, index) => {
        const slide = document.createElement('div');
        slide.className = 'banner-slide';
        slide.style.backgroundImage = `url('${banner.image}')`;

        const content = document.createElement('div');
        content.className = 'banner-content';
        content.innerHTML = `
        `;

        slide.appendChild(content);
        bannerSlider.appendChild(slide);

        // Create indicator
        if (bannerIndicators) {
            const indicator = document.createElement('div');
            indicator.className = `banner-indicator ${index === 0 ? 'active' : ''}`;
            indicator.addEventListener('click', () => goToSlide(index));
            bannerIndicators.appendChild(indicator);
        }
    });

    // Navigation functions
    function goToSlide(index) {
        currentSlide = index;
        updateSlider();
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % banners.length;
        updateSlider();
    }

    function prevSlide() {
        currentSlide = currentSlide === 0 ? banners.length - 1 : currentSlide - 1;
        updateSlider();
    }

    function updateSlider() {
        bannerSlider.style.transform = `translateX(-${currentSlide * 100}%)`;

        // Update indicators
        if (bannerIndicators) {
            const indicators = bannerIndicators.querySelectorAll('.banner-indicator');
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === currentSlide);
            });
        }
    }

    // Event listeners
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    // Auto-rotate banners
    setInterval(nextSlide, 5000);
}

// Render Featured Products
function renderFeaturedProducts() {
    const featuredProducts = document.getElementById('featuredProducts');
    if (!featuredProducts || !productsData) return;

    const featured = productsData.products.filter(product => product.featured).slice(0, 8);

    featuredProducts.innerHTML = featured.map(product => createProductCard(product)).join('');
}

// Render Partners
function renderPartners() {
    const partnersGrid = document.getElementById('partnersGrid');
    if (!partnersGrid || !productsData || !productsData.partners) return;

    partnersGrid.innerHTML = productsData.partners.map(partner => `
    <div class="partner-item">
        <img src="${partner.logo}" alt="${partner.name} Logo" class="partner-logo">
 
    </div>
`).join('');
}

// Create Product Card
function createProductCard(product) {
    const stockClass = product.stock > 0 ? 'in-stock' : 'out-of-stock';
    const stockText = product.stock > 0 ? 'In Stock' : 'Out of Stock';
    const isDisabled = product.stock === 0;

    return `
        <div class="product-card">
            <div class="product-image-container">
                <img src="${product.images[0]}" alt="${product.name}" class="product-image">
                ${product.badge ? `<div class="product-badge ${product.badge.type}">${product.badge.text}</div>` : ''}
                <div class="product-actions">
                    <button class="product-action-btn" title="Quick View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="product-action-btn" title="Add to Wishlist">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-brand">${product.brand}</div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-rating">
                    <div class="stars">
                        ${generateStarRating(product.rating)}
                    </div>
                    <span class="rating-text">(${product.reviews} reviews)</span>
                </div>
                <div class="product-price-section">
                    <div class="product-price">DT ${product.price.toFixed(2)}</div>
                    <div class="product-stock ${stockClass}">${stockText}</div>
                </div>
                <button class="add-to-cart-btn" ${isDisabled ? 'disabled' : ''} 
                        onclick="addToCart('${product.id}')">
                    <i class="fas fa-shopping-cart"></i>
                    ${isDisabled ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <a href="product-details.html?id=${product.id}" class="view-details-btn">
                    View Details
                </a>
            </div>
        </div>
    `;
}

// Generate Star Rating
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starsHTML = '';

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star star"></i>';
    }

    // Half star
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt star"></i>';
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star star"></i>';
    }

    return starsHTML;
}

// Initialize Products Page
function initializeProductsPage() {
    if (!productsData) return;

    // Parse URL parameters
    parseUrlFilters();

    // Initialize filters
    initializeFilters();

    // Apply filters and render products
    applyFilters();
    renderProducts();

    // Initialize pagination
    initializePagination();

    // Initialize view toggle
    initializeViewToggle();

    // Initialize sort functionality
    initializeSorting();

    // Initialize mobile filters
    initializeMobileFilters();
}

// Parse URL Filters
function parseUrlFilters() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('category')) {
        filters.category = [urlParams.get('category')];
    }

    if (urlParams.has('search')) {
        filters.search = urlParams.get('search');
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = filters.search;
        }
    }
}

// Initialize Filters
function initializeFilters() {
    if (!productsData) return;

    // Populate category filters using the categories array
    const categoryFilters = document.getElementById('categoryFilters');
    if (categoryFilters && productsData.categories) {
        const sortedCategories = productsData.categories.sort((a, b) => a.order - b.order);
        categoryFilters.innerHTML = sortedCategories.map(category => `
            <label class="filter-option">
                <input type="checkbox" name="category" value="${category.slug}" ${filters.category.includes(category.slug) ? 'checked' : ''}>
                <span class="checkmark"></span>
                <i class="${category.icon}"></i> ${category.name}
            </label>
        `).join('');

        // Add event listeners
        categoryFilters.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', handleFilterChange);
        });
    }

    // Populate brand filters
    const brandFilters = document.getElementById('brandFilters');
    if (brandFilters) {
        const brands = [...new Set(productsData.products.map(p => p.brand))];
        brandFilters.innerHTML = brands.map(brand => `
            <label class="filter-option">
                <input type="checkbox" name="brand" value="${brand}">
                <span class="checkmark"></span>
                ${brand}
            </label>
        `).join('');

        // Add event listeners
        brandFilters.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', handleFilterChange);
        });
    }

    // Populate platform filters
    const platformFilters = document.getElementById('platformFilters');
    if (platformFilters) {
        const platforms = [...new Set(productsData.products.flatMap(p => p.platforms || []))];
        platformFilters.innerHTML = platforms.map(platform => `
            <label class="filter-option">
                <input type="checkbox" name="platform" value="${platform}">
                <span class="checkmark"></span>
                ${platform}
            </label>
        `).join('');

        // Add event listeners
        platformFilters.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', handleFilterChange);
        });
    }

    // Initialize price range filter
    const applyPrice = document.getElementById('applyPrice');
    if (applyPrice) {
        applyPrice.addEventListener('click', handlePriceFilter);
    }

    // Initialize stock filters
    const inStockFilter = document.getElementById('inStockFilter');
    const outOfStockFilter = document.getElementById('outOfStockFilter');

    if (inStockFilter) {
        inStockFilter.addEventListener('change', handleFilterChange);
    }

    if (outOfStockFilter) {
        outOfStockFilter.addEventListener('change', handleFilterChange);
    }

    // Clear filters
    const clearFilters = document.getElementById('clearFilters');
    if (clearFilters) {
        clearFilters.addEventListener('click', clearAllFilters);
    }
}

// Handle Filter Change
function handleFilterChange() {
    // Update filters object
    filters.category = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(input => input.value);
    filters.brand = Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(input => input.value);
    filters.platform = Array.from(document.querySelectorAll('input[name="platform"]:checked')).map(input => input.value);
    filters.inStock = document.getElementById('inStockFilter')?.checked || false;
    filters.outOfStock = document.getElementById('outOfStockFilter')?.checked || false;

    // Reset to first page
    currentPage = 1;

    // Apply filters and render
    applyFilters();
    renderProducts();
    updatePagination();
}

// Handle Price Filter
function handlePriceFilter() {
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');

    filters.priceMin = minPrice.value ? parseFloat(minPrice.value) : null;
    filters.priceMax = maxPrice.value ? parseFloat(maxPrice.value) : null;

    // Reset to first page
    currentPage = 1;

    // Apply filters and render
    applyFilters();
    renderProducts();
    updatePagination();
}

// Clear All Filters
function clearAllFilters() {
    // Reset filters object
    filters = {
        category: [],
        brand: [],
        platform: [],
        priceMin: null,
        priceMax: null,
        inStock: false,
        outOfStock: false,
        search: ''
    };

    // Clear form inputs
    document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(input => {
        input.checked = false;
    });

    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';

    // Reset to first page
    currentPage = 1;

    // Apply filters and render
    applyFilters();
    renderProducts();
    updatePagination();
}

// Apply Filters
function applyFilters() {
    if (!productsData) return;

    filteredProducts = productsData.products.filter(product => {
        // Category filter
        if (filters.category.length > 0 && !filters.category.includes(product.category)) {
            return false;
        }

        // Brand filter
        if (filters.brand.length > 0 && !filters.brand.includes(product.brand)) {
            return false;
        }

        // Platform filter
        if (filters.platform.length > 0 && !filters.platform.some(platform => (product.platforms || []).includes(platform))) {
            return false;
        }

        // Price filter
        if (filters.priceMin !== null && product.price < filters.priceMin) {
            return false;
        }

        if (filters.priceMax !== null && product.price > filters.priceMax) {
            return false;
        }

        // Stock filter
        if (filters.inStock && product.stock === 0) {
            return false;
        }

        if (filters.outOfStock && product.stock > 0) {
            return false;
        }

        // Search filter
        if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase()) &&
            !product.description.toLowerCase().includes(filters.search.toLowerCase())) {
            return false;
        }

        return true;
    });
}

// Render Products
function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const loadingState = document.getElementById('loadingState');
    const noResults = document.getElementById('noResults');
    const productsCount = document.getElementById('productsCount');

    if (!productsGrid) return;

    // Hide loading state
    if (loadingState) {
        loadingState.style.display = 'none';
    }

    // Update products count
    if (productsCount) {
        productsCount.textContent = `Showing ${filteredProducts.length} products`;
    }

    // Show no results if needed
    if (filteredProducts.length === 0) {
        productsGrid.style.display = 'none';
        if (noResults) {
            noResults.style.display = 'block';
        }
        return;
    }

    // Hide no results
    if (noResults) {
        noResults.style.display = 'none';
    }

    productsGrid.style.display = 'grid';

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // Render products
    productsGrid.innerHTML = paginatedProducts.map(product => createProductCard(product)).join('');
}

// Initialize Pagination
function initializePagination() {
    updatePagination();
}

// Update Pagination
function updatePagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<span class="pagination-dots">...</span>';
        }
    }

    // Next button
    paginationHTML += `
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.innerHTML = paginationHTML;
}

// Go to Page
function goToPage(page) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderProducts();
        updatePagination();

        // Scroll to top of products
        document.querySelector('.products-main').scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize View Toggle
function initializeViewToggle() {
    const gridView = document.getElementById('gridView');
    const listView = document.getElementById('listView');

    if (gridView) {
        gridView.addEventListener('click', () => setView('grid'));
    }

    if (listView) {
        listView.addEventListener('click', () => setView('list'));
    }
}

// Set View
function setView(viewType) {
    const gridView = document.getElementById('gridView');
    const listView = document.getElementById('listView');
    const productsGrid = document.getElementById('productsGrid');

    if (viewType === 'grid') {
        gridView.classList.add('active');
        listView.classList.remove('active');
        productsGrid.classList.remove('list-view');
    } else {
        listView.classList.add('active');
        gridView.classList.remove('active');
        productsGrid.classList.add('list-view');
    }
}

// Initialize Sorting
function initializeSorting() {
    const sortSelect = document.getElementById('sortSelect');

    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }
}

// Handle Sort
function handleSort() {
    const sortSelect = document.getElementById('sortSelect');
    const sortValue = sortSelect.value;

    switch (sortValue) {
        case 'name-asc':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'rating-desc':
            filteredProducts.sort((a, b) => b.rating - a.rating);
            break;
        case 'newest':
            filteredProducts.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            break;
    }

    // Reset to first page
    currentPage = 1;

    // Re-render products
    renderProducts();
    updatePagination();
}

// Initialize Mobile Filters
function initializeMobileFilters() {
    const mobileFiltersToggle = document.getElementById('mobileFiltersToggle');
    const mobileFiltersOverlay = document.getElementById('mobileFiltersOverlay');
    const mobileFiltersClose = document.getElementById('mobileFiltersClose');
    const applyMobileFilters = document.getElementById('applyMobileFilters');

    if (mobileFiltersToggle) {
        mobileFiltersToggle.addEventListener('click', openMobileFilters);
    }

    if (mobileFiltersClose) {
        mobileFiltersClose.addEventListener('click', closeMobileFilters);
    }

    if (mobileFiltersOverlay) {
        mobileFiltersOverlay.addEventListener('click', function (e) {
            if (e.target === mobileFiltersOverlay) {
                closeMobileFilters();
            }
        });
    }

    if (applyMobileFilters) {
        applyMobileFilters.addEventListener('click', function () {
            handleFilterChange();
            closeMobileFilters();
        });
    }
}

// Open Mobile Filters
function openMobileFilters() {
    const mobileFiltersOverlay = document.getElementById('mobileFiltersOverlay');
    const mobileFiltersBody = document.getElementById('mobileFiltersBody');
    const filtersSidebar = document.querySelector('.filters-sidebar');

    if (mobileFiltersOverlay && mobileFiltersBody && filtersSidebar) {
        // Copy filters to mobile
        mobileFiltersBody.innerHTML = filtersSidebar.innerHTML;

        // Show overlay
        mobileFiltersOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close Mobile Filters
function closeMobileFilters() {
    const mobileFiltersOverlay = document.getElementById('mobileFiltersOverlay');

    if (mobileFiltersOverlay) {
        mobileFiltersOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Initialize Product Details Page
function initializeProductDetailsPage() {
    if (!productsData) return;

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        showProductNotFound();
        return;
    }

    const product = productsData.products.find(p => p.id === productId);

    if (!product) {
        showProductNotFound();
        return;
    }

    renderProductDetails(product);
    renderRelatedProducts(product);
    initializeProductActions(product);
}

// Show Product Not Found
function showProductNotFound() {
    const loadingState = document.getElementById('loadingState');
    const productNotFound = document.getElementById('productNotFound');

    if (loadingState) {
        loadingState.style.display = 'none';
    }

    if (productNotFound) {
        productNotFound.style.display = 'block';
    }
}

// Render Product Details
function renderProductDetails(product) {
    const loadingState = document.getElementById('loadingState');
    const productDetailsContent = document.getElementById('productDetailsContent');

    if (loadingState) {
        loadingState.style.display = 'none';
    }

    if (productDetailsContent) {
        productDetailsContent.style.display = 'block';
    }

    // Update breadcrumb
    const breadcrumbProduct = document.getElementById('breadcrumbProduct');
    if (breadcrumbProduct) {
        breadcrumbProduct.textContent = product.name;
    }

    // Update product images
    const mainProductImage = document.getElementById('mainProductImage');
    const thumbnailImages = document.getElementById('thumbnailImages');

    if (mainProductImage) {
        mainProductImage.src = product.images[0];
        mainProductImage.alt = product.name;
    }

if (thumbnailImages) {
    // Initialize the enhanced thumbnail navigation
    initializeThumbnailNavigation(product);
}

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (!document.getElementById('thumbnailImages')) return;
    
    const thumbnails = document.querySelectorAll('.thumbnail-image');
    const activeThumbnail = document.querySelector('.thumbnail-image.active');
    
    if (!activeThumbnail) return;
    
    let currentIndex = Array.from(thumbnails).indexOf(activeThumbnail);
    
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        thumbnails[currentIndex - 1].click();
    } else if (e.key === 'ArrowRight' && currentIndex < thumbnails.length - 1) {
        e.preventDefault();
        thumbnails[currentIndex + 1].click();
    }
});

    // Update product info
    const productName = document.getElementById('productName');
    const productBrand = document.getElementById('productBrand');
    const productRating = document.getElementById('productRating');
    const productPrice = document.getElementById('productPrice');
    const productStock = document.getElementById('productStock');
    const productDescription = document.getElementById('productDescription');
    const specsList = document.getElementById('specsList');

    if (productName) productName.textContent = product.name;
    if (productBrand) productBrand.textContent = product.brand;
    if (productPrice) productPrice.textContent = `DT ${product.price.toFixed(2)}`;
    if (productDescription) productDescription.textContent = product.description;

    if (productRating) {
        productRating.innerHTML = `
            <div class="stars">
                ${generateStarRating(product.rating)}
            </div>
            <span class="rating-text">(${product.reviews} reviews)</span>
        `;
    }

    if (productStock) {
        const stockClass = product.stock > 0 ? 'in-stock' : 'out-of-stock';
        const stockText = product.stock > 0 ? `${product.stock} in stock` : 'Out of stock';
        productStock.innerHTML = `<span class="product-stock ${stockClass}">${stockText}</span>`;
    }

    if (specsList && product.specifications) {
        specsList.innerHTML = Object.entries(product.specifications).map(([key, value]) => `
            <div class="spec-item">
                <span class="spec-label">${key}:</span>
                <span class="spec-value">${value}</span>
            </div>
        `).join('');
    }
}

// Change Main Image
// Enhanced thumbnail navigation functionality
let currentThumbnailIndex = 0;
let maxVisibleThumbnails = 6;
let totalThumbnails = 0;

// Function to initialize thumbnail navigation
function initializeThumbnailNavigation(product) {
    const thumbnailImages = document.getElementById('thumbnailImages');
    
    if (!thumbnailImages || !product.images) return;
    
    totalThumbnails = product.images.length;
    currentThumbnailIndex = 0;
    
    // Generate thumbnail images (showing only first 6 by default)
    thumbnailImages.innerHTML = product.images.map((image, index) => `
        <img src="${image}" 
             alt="${product.name}" 
             class="thumbnail-image ${index === 0 ? 'active' : ''}" 
             style="${index >= maxVisibleThumbnails ? 'display: none;' : ''}"
             data-index="${index}"
             onclick="changeMainImage('${image}', this, ${index})">
    `).join('');
    
    updateNavigationButtons();
}

// Function to navigate thumbnails
function navigateThumbnails(direction) {
    const thumbnailImages = document.getElementById('thumbnailImages');
    const thumbnails = thumbnailImages.querySelectorAll('.thumbnail-image');
    
    if (direction === 'next' && currentThumbnailIndex + maxVisibleThumbnails < totalThumbnails) {
        currentThumbnailIndex++;
    } else if (direction === 'prev' && currentThumbnailIndex > 0) {
        currentThumbnailIndex--;
    }
    
    // Hide all thumbnails
    thumbnails.forEach(thumb => thumb.style.display = 'none');
    
    // Show current set of thumbnails
    for (let i = currentThumbnailIndex; i < currentThumbnailIndex + maxVisibleThumbnails && i < totalThumbnails; i++) {
        if (thumbnails[i]) {
            thumbnails[i].style.display = 'block';
        }
    }
    
    updateNavigationButtons();
}

// Function to update navigation button visibility
function updateNavigationButtons() {
    const thumbnailPrev = document.getElementById('thumbnailPrev');
    const thumbnailNext = document.getElementById('thumbnailNext');
    
    if (thumbnailPrev && thumbnailNext) {
        // Hide prev button if at the beginning
        thumbnailPrev.classList.toggle('hidden', currentThumbnailIndex === 0);
        
        // Hide next button if at the end
        thumbnailNext.classList.toggle('hidden', currentThumbnailIndex + maxVisibleThumbnails >= totalThumbnails);
        
        // Hide both buttons if total thumbnails <= max visible
        if (totalThumbnails <= maxVisibleThumbnails) {
            thumbnailPrev.classList.add('hidden');
            thumbnailNext.classList.add('hidden');
        }
    }
}

// Enhanced changeMainImage function
function changeMainImage(imageSrc, thumbnail, imageIndex) {
    const mainProductImage = document.getElementById('mainProductImage');
    const thumbnails = document.querySelectorAll('.thumbnail-image');

    if (mainProductImage) {
        mainProductImage.src = imageSrc;
    }

    // Update active thumbnail
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    if (thumbnail) {
        thumbnail.classList.add('active');
    }
    
    // Auto-scroll to show the selected thumbnail if it's not visible
    if (imageIndex !== undefined) {
        ensureThumbnailVisible(imageIndex);
    }
}

// Function to ensure a specific thumbnail is visible
function ensureThumbnailVisible(imageIndex) {
    if (imageIndex < currentThumbnailIndex || imageIndex >= currentThumbnailIndex + maxVisibleThumbnails) {
        currentThumbnailIndex = Math.max(0, Math.min(imageIndex - Math.floor(maxVisibleThumbnails / 2), totalThumbnails - maxVisibleThumbnails));
        
        const thumbnails = document.querySelectorAll('.thumbnail-image');
        
        // Hide all thumbnails
        thumbnails.forEach(thumb => thumb.style.display = 'none');
        
        // Show current set of thumbnails
        for (let i = currentThumbnailIndex; i < currentThumbnailIndex + maxVisibleThumbnails && i < totalThumbnails; i++) {
            if (thumbnails[i]) {
                thumbnails[i].style.display = 'block';
            }
        }
        
        updateNavigationButtons();
    }
}


// Initialize Product Actions
function initializeProductActions(product) {
    const decreaseQuantity = document.getElementById('decreaseQuantity');
    const increaseQuantity = document.getElementById('increaseQuantity');
    const productQuantity = document.getElementById('productQuantity');
    const addToCartBtn = document.getElementById('addToCartBtn');
    const wishlistBtn = document.getElementById('wishlistBtn');

    // Quantity controls
    if (decreaseQuantity && productQuantity) {
        decreaseQuantity.addEventListener('click', function () {
            const currentValue = parseInt(productQuantity.value);
            if (currentValue > 1) {
                productQuantity.value = currentValue - 1;
            }
        });
    }

    if (increaseQuantity && productQuantity) {
        increaseQuantity.addEventListener('click', function () {
            const currentValue = parseInt(productQuantity.value);
            const maxQuantity = Math.min(product.stock, 10);
            if (currentValue < maxQuantity) {
                productQuantity.value = currentValue + 1;
            }
        });
    }

    // Add to cart
    if (addToCartBtn) {
        if (product.stock === 0) {
            addToCartBtn.disabled = true;
            addToCartBtn.innerHTML = '<i class="fas fa-times"></i> Out of Stock';
        } else {
            addToCartBtn.addEventListener('click', function () {
                const quantity = parseInt(productQuantity.value) || 1;
                addToCart(product.id, quantity);
            });
        }
    }

    // Wishlist toggle
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', function () {
            const icon = wishlistBtn.querySelector('i');
            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                wishlistBtn.style.color = 'var(--danger-color)';
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                wishlistBtn.style.color = 'var(--text-secondary)';
            }
        });
    }

    // Image zoom
    const mainProductImage = document.getElementById('mainProductImage');
    const imageZoomOverlay = document.getElementById('imageZoomOverlay');
    const zoomedImage = document.getElementById('zoomedImage');
    const zoomClose = document.getElementById('zoomClose');

    if (mainProductImage && imageZoomOverlay) {
        mainProductImage.addEventListener('click', function () {
            zoomedImage.src = mainProductImage.src;
            imageZoomOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (zoomClose) {
        zoomClose.addEventListener('click', function () {
            imageZoomOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (imageZoomOverlay) {
        imageZoomOverlay.addEventListener('click', function (e) {
            if (e.target === imageZoomOverlay) {
                imageZoomOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Render Related Products
function renderRelatedProducts(product) {
    const relatedProducts = document.getElementById('relatedProducts');
    if (!relatedProducts || !productsData) return;

    // Find related products by category, excluding current product
    const related = productsData.products
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 4);

    relatedProducts.innerHTML = related.map(product => createProductCard(product)).join('');
}

// Initialize Contact Page
function initializeContactPage() {
    const contactForm = document.getElementById('contactForm');
    const contactSuccessModal = document.getElementById('contactSuccessModal');
    const contactSuccessClose = document.getElementById('contactSuccessClose');

    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    if (contactSuccessClose) {
        contactSuccessClose.addEventListener('click', function () {
            contactSuccessModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
}

// Handle Contact Form
function handleContactForm(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const contactData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        newsletter: formData.get('newsletter') === 'on',
        timestamp: new Date().toISOString()
    };

    // Simulate form submission
    setTimeout(() => {
        // Reset form
        e.target.reset();

        // Show success modal
        const contactSuccessModal = document.getElementById('contactSuccessModal');
        if (contactSuccessModal) {
            contactSuccessModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }, 1000);
}
