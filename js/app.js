// Simple data store
const ProductManager = {
    products: [],
    
    init() {
        try {
            const stored = localStorage.getItem('products');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    this.products = parsed;
                } else {
                    this.products = [];
                }
            } else {
                this.products = [];
            }
            console.log('Loaded products:', this.products);
        } catch (error) {
            console.error('Failed to load products:', error);
            this.products = [];
            localStorage.removeItem('products'); // Clear invalid data
        }
    },
      save() {
        try {
            // Validate products array
            if (!Array.isArray(this.products)) {
                console.error('Products is not an array:', this.products);
                return false;
            }

            // Convert to string and validate
            const productsString = JSON.stringify(this.products);
            if (!productsString) {
                console.error('Failed to stringify products');
                return false;
            }

            // Save to localStorage
            localStorage.setItem('products', productsString);
            console.log('Saved products successfully:', this.products.length, 'items');
            return true;
        } catch (error) {
            console.error('Failed to save products:', error);
            return false;
        }
    },

    generateId() {
        const date = new Date();
        const year = date.getFullYear();
        const nextNum = (this.products.length + 1).toString().padStart(5, '0');
        return `PRD-${year}-${nextNum}`;
    }
};

// Initialize the product manager
ProductManager.init();

// Create a new product
window.addProduct = function(name, type, priority) {
    if (!name || !type || !priority) {
        throw new Error('Missing required fields');
    }

    const product = {
        id: ProductManager.generateId(),
        name: name,
        type: type,
        status: 'Pending',
        priority: priority,
        orderDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        completion: '',
        timeline: [{
            stage: 'Order Created',
            status: 'Completed',
            date: new Date().toLocaleDateString('en-US'),
            assignee: 'System'
        }]
    };

    ProductManager.products.push(product);
      if (ProductManager.save()) {
        console.log('Product added successfully:', product);
        // Update the stats if we're on the main page
        if (typeof updateStats === 'function') {
            updateStats();
        }
        return product;
    } else {
        throw new Error('Failed to save product');
    }
};

// Update product status
window.updateProductStatus = function(id, newStatus, assignee) {
    const product = ProductManager.products.find(p => p.id === id);
    if (!product) {
        throw new Error('Product not found');
    }
    
    product.status = newStatus;
    product.timeline.push({
        stage: newStatus,
        status: 'Completed',
        date: new Date().toLocaleDateString('en-US'),
        assignee: assignee
    });
    
    if (ProductManager.save()) {
        return product;
    } else {
        throw new Error('Failed to save product update');
    }
};

// Get product by ID
window.getProduct = function(id) {
    return ProductManager.products.find(p => p.id === id);
};

// Search products by partial ID
window.searchProducts = function(partialId) {
    if (!partialId) return [];
    const searchTerm = partialId.toLowerCase();
    return ProductManager.products.filter(p => 
        p.id.toLowerCase().includes(searchTerm)
    );
};

// Get filtered products by status
window.getProductsByStatus = function(status) {
    return ProductManager.products.filter(p => p.status === status);
};

// Display products in a table
window.displayProducts = function(products) {
    const tableBody = document.querySelector('#productsTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.type}</td>
            <td>${product.status}</td>
            <td>${product.priority}</td>
            <td>${product.orderDate}</td>
            <td>
                <button onclick="showProductDetails('${product.id}')" class="btn btn-info btn-sm">
                    Details
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
};

// Initialize clickable stats
window.initializeClickableStats = function() {
    // Set up click handlers for stat boxes
    const statElements = {
        total: document.querySelector('[data-stat="total"]')?.closest('.info-box'),
        completed: document.querySelector('[data-stat="completed"]')?.closest('.info-box'),
        inProgress: document.querySelector('[data-stat="in-progress"]')?.closest('.info-box'),
        pending: document.querySelector('[data-stat="pending"]')?.closest('.info-box'),
        delayed: document.querySelector('[data-stat="delayed"]')?.closest('.info-box')
    };

    // Add click handlers
    if (statElements.total) {
        statElements.total.style.cursor = 'pointer';
        statElements.total.addEventListener('click', () => displayProducts(ProductManager.products));
    }
    
    if (statElements.completed) {
        statElements.completed.style.cursor = 'pointer';
        statElements.completed.addEventListener('click', () => displayProducts(getProductsByStatus('Completed')));
    }
    
    if (statElements.inProgress) {
        statElements.inProgress.style.cursor = 'pointer';
        statElements.inProgress.addEventListener('click', () => displayProducts(getProductsByStatus('In Progress')));
    }
    
    if (statElements.pending) {
        statElements.pending.style.cursor = 'pointer';
        statElements.pending.addEventListener('click', () => displayProducts(getProductsByStatus('Pending')));
    }
    
    if (statElements.delayed) {
        statElements.delayed.style.cursor = 'pointer';
        statElements.delayed.addEventListener('click', () => displayProducts(getProductsByStatus('Delayed')));
    }
};

// Update stats
window.updateStats = function() {
    console.log('Updating stats...');
    try {
        // Reset the title back to Production Overview
        const titleElement = document.querySelector('.text-xl.font-bold.text-gray-800.mb-6');
        if (titleElement) titleElement.textContent = 'Production Overview';

        // Calculate all stats
        const stats = {
            total: ProductManager.products.length,
            completed: ProductManager.products.filter(p => p.status === 'Completed').length,
            inProgress: ProductManager.products.filter(p => p.status === 'In Progress').length,
            pending: ProductManager.products.filter(p => p.status === 'Pending').length,
            delayed: ProductManager.products.filter(p => p.status === 'Delayed').length
        };        console.log('Current stats:', stats);

        // Get all UI elements we need to update
        const elements = {
            total: document.querySelector('[data-stat="total"]'),
            completed: document.querySelector('[data-stat="completed"]'),
            inProgress: document.querySelector('[data-stat="in-progress"]'),
            pending: document.querySelector('[data-stat="pending"]'),
            delayed: document.querySelector('[data-stat="delayed"]'),
            progressBar: document.querySelector('.progress-bar'),
            progressText: document.querySelector('.progress-text'),
            progressCount: document.querySelector('.progress-count')
        };

        // Update all stat boxes
        if (elements.total) elements.total.textContent = stats.total;
        if (elements.completed) elements.completed.textContent = stats.completed;
        if (elements.inProgress) elements.inProgress.textContent = stats.inProgress;
        if (elements.pending) elements.pending.textContent = stats.pending;
        if (elements.delayed) elements.delayed.textContent = stats.delayed;

        // Update progress bar
        if (elements.progressBar && elements.progressText && elements.progressCount) {
            const target = 200; // Daily target
            const progress = (stats.completed / target) * 100;
            elements.progressBar.style.width = `${Math.min(progress, 100)}%`;
            elements.progressText.textContent = `${Math.round(progress)}% Complete`;
            elements.progressCount.textContent = `${stats.completed}/${target} items`;
        }

        // Initialize clickable stats after updating
        initializeClickableStats();

        return stats;
    } catch (error) {
        console.error('Error updating stats:', error);
        return null;
    }
}
