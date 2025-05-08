document.addEventListener('DOMContentLoaded', function() {
    // Общие элементы
    const searchBtn = document.getElementById('search-btn');
    const searchContainer = document.querySelector('.search-container');
    const cartCount = document.getElementById('cart-count');
    const searchInput = document.getElementById('search-input');
    const searchSubmit = document.getElementById('search-submit');

    // Элементы главной страницы
    let productsContainer, animalFilter, categoryFilter, priceFilter, resetFiltersBtn, categoryCards;
    let products = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Инициализация
    updateCartCount();

    // Если это главная страница - инициализируем специфичные элементы
    if (isHomePage()) {
        productsContainer = document.getElementById('products-container');
        animalFilter = document.getElementById('animal-filter');
        categoryFilter = document.getElementById('category-filter');
        priceFilter = document.getElementById('price-filter');
        resetFiltersBtn = document.getElementById('reset-filters');
        categoryCards = document.querySelectorAll('.category-card');

        loadProducts();
        initFilters();
    }

    // Общие обработчики событий
    searchBtn.addEventListener('click', toggleSearch);
    searchSubmit.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleSearch();
    });

    // Функции
    function isHomePage() {
        return window.location.pathname.endsWith('index.html') || 
               window.location.pathname.endsWith('/');
    }

    function toggleSearch() {
        searchContainer.classList.toggle('active');
        if (searchContainer.classList.contains('active')) {
            searchInput.focus();
        }
    }

    function initFilters() {
        animalFilter.addEventListener('change', filterProducts);
        categoryFilter.addEventListener('change', filterProducts);
        priceFilter.addEventListener('change', filterProducts);
        resetFiltersBtn.addEventListener('click', resetFilters);
        categoryCards.forEach(card => card.addEventListener('click', filterByCategory));
        
        // Проверяем параметры URL
        checkUrlParams();
    }
    
    function loadProducts() {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'products.xml', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                const xmlDoc = xhr.responseXML;
                const productNodes = xmlDoc.getElementsByTagName('product');
                
                products = Array.from(productNodes).map(node => ({
                    id: node.getAttribute('id'),
                    name: node.getElementsByTagName('name')[0].textContent,
                    price: parseFloat(node.getElementsByTagName('price')[0].textContent),
                    image: node.getElementsByTagName('image')[0].textContent,
                    category: node.getElementsByTagName('category')[0].textContent,
                    animal: node.getElementsByTagName('animal')[0].textContent,
                    rating: parseInt(node.getElementsByTagName('rating')[0].textContent),
                    description: node.getElementsByTagName('description')[0].textContent,
                    isNew: node.getElementsByTagName('isNew')[0].textContent === 'true',
                    inStock: node.getElementsByTagName('inStock')[0].textContent === 'true'
                }));
                
                displayProducts(products);
            }
        };
        xhr.send();
    }
    
    function checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const animalParam = urlParams.get('animal');
        
        if (animalParam) {
            applyCategoryFilter(animalParam);
        }
    }
    
    function applyCategoryFilter(category) {
        animalFilter.value = category;
        categoryFilter.value = 'all';
        priceFilter.value = 'all';
        filterProducts();
        scrollToProducts();
    }
    
    function displayProducts(productsToDisplay) {
        productsContainer.innerHTML = '';
        
        if (productsToDisplay.length === 0) {
            productsContainer.innerHTML = '<p class="no-products">Товары не найдены. Попробуйте изменить параметры фильтрации.</p>';
            return;
        }
        
        productsToDisplay.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                ${product.isNew ? '<span class="product-badge">Новинка</span>' : ''}
                <img src="images/products/${product.image}" alt="${product.name}">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-rating">
                        ${'★'.repeat(product.rating)}${'☆'.repeat(5 - product.rating)}
                    </div>
                    <div class="product-price">${product.price.toFixed(2)} Br</div>
                    <div class="product-actions">
                        <button class="add-to-cart" data-id="${product.id}">В корзину</button>
                    </div>
                </div>
            `;
            
            productsContainer.appendChild(productCard);
        });
        
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', addToCart);
        });
    }
    
    function filterProducts() {
        const animalValue = animalFilter.value;
        const categoryValue = categoryFilter.value;
        const priceValue = priceFilter.value;
        
        let filteredProducts = products.filter(p => 
            (animalValue === 'all' || p.animal === animalValue) &&
            (categoryValue === 'all' || p.category === categoryValue) &&
            (priceValue === 'all' || checkPriceRange(p.price, priceValue))
        );
        
        displayProducts(filteredProducts);
    }
    
    function checkPriceRange(price, range) {
        if (range === 'all') return true;
        
        const [min, max] = range.split('-').map(str => {
            // Обрабатываем случай, когда нет верхней границы (например "80-")
            if (str === '') return Infinity;
            return parseFloat(str);
        });
        
        // Для диапазона "80-" (от 80)
        if (isFinite(min) && !isFinite(max)) {
            return price >= min;
        }
        // Для обычных диапазонов "0-20", "20-40" и т.д.
        return price >= min && price <= max;
    }
    
    function resetFilters() {
        animalFilter.value = 'all';
        categoryFilter.value = 'all';
        priceFilter.value = 'all';
        displayProducts(products);
    }
    
    function filterByCategory(e) {
        const category = this.getAttribute('data-category');
        applyCategoryFilter(category);
    }
    
    function handleSearch(e) {
        if (e) e.preventDefault();
        const searchTerm = searchInput.value.toLowerCase();
        
        if (searchTerm.trim() === '') {
            if (isHomePage()) displayProducts(products);
            return;
        }
        
        if (!isHomePage()) {
            window.location.href = `index.html?search=${encodeURIComponent(searchTerm)}`;
            return;
        }
        
        const filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) || 
            product.description.toLowerCase().includes(searchTerm)
        );
        
        displayProducts(filteredProducts);
        scrollToProducts();
    }
    
    function scrollToProducts() {
        const productsSection = document.querySelector('.popular-products');
        if (productsSection) {
            productsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    
    function addToCart(e) {
        const productId = this.getAttribute('data-id');
        const product = products.find(p => p.id === productId);
        
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }
        
        updateCart();
        
        this.textContent = 'Добавлено!';
        setTimeout(() => {
            this.textContent = 'В корзину';
        }, 1000);
    }
    
    function updateCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
    }
    
    function updateCartCount() {
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = count;
    }

    // Функции для страницы корзины
    if (window.location.pathname.endsWith('cart.html')) {
        loadCart();
        
        // Обновление корзины
        document.querySelector('.update-cart')?.addEventListener('click', updateCartItems);
        
        // Изменение способа доставки
        document.querySelectorAll('input[name="shipping"]')?.forEach(radio => {
            radio.addEventListener('change', updateShipping);
        });
        
        // Оформление заказа
        document.querySelector('.checkout-btn')?.addEventListener('click', checkout);
    }

    function loadCart() {
        const cartItemsList = document.getElementById('cart-items-list');
        
        if (cart.length === 0) {
            cartItemsList.innerHTML = `
                <div class="empty-cart">
                    <p>Ваша корзина пуста</p>
                    <a href="index.html" class="btn">Вернуться в магазин</a>
                </div>
            `;
            document.querySelector('.update-cart').style.display = 'none';
            document.querySelector('.checkout-btn').disabled = true;
            updateTotals(cart);
            return;
        }
        
        cartItemsList.innerHTML = '';
        
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.dataset.id = item.id;
            cartItem.innerHTML = `
                <div class="item-product">
                    <img src="images/products/${item.image}" alt="${item.name}">
                    <div class="product-info">
                        <h4>${item.name}</h4>
                        <a href="#" class="remove-item" data-id="${item.id}">Удалить</a>
                    </div>
                </div>
                <div class="item-price">${item.price.toFixed(2)} Br</div>
                <div class="item-quantity">
                    <input type="number" value="${item.quantity}" min="1">
                </div>
                <div class="item-total">${(item.price * item.quantity).toFixed(2)} Br</div>
                <div class="item-remove">
                    <button class="remove-btn" data-id="${item.id}"><i class="fas fa-times"></i></button>
                </div>
            `;
            
            cartItemsList.appendChild(cartItem);
        });
        
        // Добавляем обработчики для кнопок удаления
        document.querySelectorAll('.remove-btn, .remove-item').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                removeFromCart(this.dataset.id);
            });
        });
        
        updateTotals(cart);
        updateCartCount();
    }
    
    function updateCartItems() {
        const cartItems = document.querySelectorAll('.cart-item');
        let updatedCart = [];
        
        cartItems.forEach(item => {
            const id = item.dataset.id;
            const quantity = parseInt(item.querySelector('input').value);
            
            if (quantity > 0) {
                const price = parseFloat(item.querySelector('.item-price').textContent);
                const name = item.querySelector('h4').textContent;
                const image = item.querySelector('img').src.split('/').pop();
                
                updatedCart.push({
                    id,
                    name,
                    price,
                    image,
                    quantity
                });
            }
        });
        
        cart = updatedCart;
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
        
        showNotification('Корзина обновлена');
    }
    
    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
        
        showNotification('Товар удален из корзины');
    }
    
    function updateTotals() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('subtotal').textContent = subtotal.toFixed(2) + ' Br';
        
        // Расчет доставки
        let shipping = 0;
        const shippingMethod = document.querySelector('input[name="shipping"]:checked')?.value;
        
        if (shippingMethod === 'standard') {
            shipping = subtotal >= 120 ? 0 : 10;
        } else if (shippingMethod === 'express') {
            shipping = 20;
        }
        
        document.getElementById('shipping').textContent = shipping.toFixed(2) + ' Br';
        document.getElementById('total').textContent = (subtotal + shipping).toFixed(2) + ' Br';
    }
    
    function updateShipping() {
        updateTotals();
    }
    
    function checkout() {
        if (cart.length === 0) {
            alert('Ваша корзина пуста');
            return;
        }
        
        alert('Заказ оформлен! Спасибо за покупку!');
        localStorage.removeItem('cart');
        cart = [];
        loadCart();
        updateCartCount();
    }
    
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
});