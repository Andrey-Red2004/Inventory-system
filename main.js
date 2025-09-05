// Variables globales
var products = JSON.parse(localStorage.getItem('products') || '[]');

// Referencias DOM
var productForm = document.getElementById('product-form');
var modalElement = document.getElementById('productModal');
var messageDiv = document.getElementById('message');
var productTableBody = document.getElementById('product-table-body');
var searchInput = document.getElementById('search-input');
var productCount = document.getElementById('product-count');
var inventoryTotal = document.getElementById('inventory-total');
var exportCSVBtn = document.getElementById('exportCSVBtn');
var toggleThemeBtn = document.getElementById('toggleThemeBtn');

// Bootstrap Modal
var bootstrapModal = modalElement ? new window.bootstrap.Modal(modalElement) : null;

var isEditing = false;
var editingIndex = null;
// Función para leer imagen
function readImage(file, callback) {
    var reader = new FileReader();
    reader.onload = function() { 
        callback(reader.result); 
    };
    reader.readAsDataURL(file);
}

// Mostrar mensajes
function showMessage(text, type) {
    if (!type) type = 'success';
    if (!messageDiv) return;
    
    messageDiv.textContent = text;
    messageDiv.className = 'alert alert-' + type + ' animate__animated animate__fadeInDown';
    
    setTimeout(function() {
        if (messageDiv) {
            messageDiv.className = '';
            messageDiv.textContent = '';
        }
    }, 3500);
}
// Renderizar tabla de productos
function renderTable(filter) {
    if (!filter) filter = '';
    if (!productTableBody || !productCount || !inventoryTotal) return;
    
    productTableBody.innerHTML = '';
    var totalInventory = 0;
    var totalProducts = 0;
    var filterLower = filter.toLowerCase();

    products.forEach(function(product, index) {
        // Filtrar productos
        if (!product.name.toLowerCase().includes(filterLower) && 
            !product.category.toLowerCase().includes(filterLower)) {
            return;
        }

        totalProducts++;
        var totalPrice = product.quantity * product.price;
        totalInventory += totalPrice;

        var lowStockClass = product.quantity <= product.minStock ? 'text-danger fw-bold' : '';
        
        var imgHTML = product.image
            ? '<img src="' + product.image + '" alt="' + product.name + '" class="product-img rounded" />'
            : '<i class="fas fa-box fa-2x text-secondary"></i>';

        var row = document.createElement('tr');
        row.innerHTML = 
            '<td>' + imgHTML + '</td>' +
            '<td>' + product.name + '</td>' +
            '<td>' + product.category + '</td>' +
            '<td class="' + lowStockClass + '">' + product.quantity + '</td>' +
            '<td>' + product.minStock + '</td>' +
            '<td>₡' + product.price.toFixed(2) + '</td>' +
            '<td>₡' + totalPrice.toFixed(2) + '</td>' +
            '<td>' + product.dateAdded + '</td>' +
            '<td>' + (product.dateModified || '-') + '</td>' +
            '<td>' +
                '<button class="btn btn-sm btn-warning me-1" title="Editar" data-index="' + index + '">' +
                    '<i class="fas fa-edit"></i>' +
                '</button>' +
                '<button class="btn btn-sm btn-danger" title="Eliminar" data-index="' + index + '">' +
                    '<i class="fas fa-trash"></i>' +
                '</button>' +
            '</td>';
        
        productTableBody.appendChild(row);
    });

    productCount.textContent = totalProducts.toString();
    inventoryTotal.textContent = totalInventory.toFixed(2);
}
// Guardar en localStorage
function saveToStorage() {
    localStorage.setItem('products', JSON.stringify(products));
}

// Limpiar formulario
function resetForm() {
    if (!productForm) return;
    
    productForm.reset();
    isEditing = false;
    editingIndex = null;
    productForm.classList.remove('was-validated');
    
    if (bootstrapModal) {
        bootstrapModal.hide();
    }
}
// Event listener para el formulario
if (productForm) {
    productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (!productForm.checkValidity()) {
            productForm.classList.add('was-validated');
            return;
        }

        // Obtener datos del formulario
        var name = document.getElementById('product-name').value.trim();
        var category = document.getElementById('product-category').value;
        var quantity = parseInt(document.getElementById('product-quantity').value);
        var minStock = parseInt(document.getElementById('product-minstock').value);
        var price = parseFloat(document.getElementById('product-price').value);
        var imageInput = document.getElementById('product-image');
        var imageFile = imageInput.files[0];

        // Función para guardar el producto
        function saveProduct(imageBase64) {
            var dateNow = new Date().toLocaleString();
            
            var productData = {
                name: name,
                category: category,
                quantity: quantity,
                minStock: minStock,
                price: price,
                image: imageBase64 || null,
                dateAdded: dateNow,
                dateModified: null
            };

            if (isEditing && editingIndex !== null) {
                // Actualizar producto existente
                productData.dateAdded = products[editingIndex].dateAdded;
                productData.dateModified = dateNow;
                products[editingIndex] = productData;
                showMessage('Producto actualizado correctamente.', 'success');
            } else {
                // Agregar nuevo producto
                products.push(productData);
                showMessage('Producto agregado correctamente.', 'success');
            }

            // Guardar y actualizar vista
            saveToStorage();
            renderTable(searchInput ? searchInput.value : '');
            resetForm();
        }

        // Procesar imagen si existe
        if (imageFile) {
            readImage(imageFile, function(base64) {
                saveProduct(base64);
            });
        } else {
            saveProduct(null);
        }
    });
}
// Eventos para editar y eliminar productos
if (productTableBody) {
    productTableBody.addEventListener('click', function(e) {
        var target = e.target;
        var btn = target.closest('button');
        if (!btn) return;
        
        var index = Number(btn.getAttribute('data-index'));
        
        if (btn.classList.contains('btn-warning')) {
            // Editar producto
            var product = products[index];
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-quantity').value = product.quantity;
            document.getElementById('product-minstock').value = product.minStock;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-image').value = '';
            
            isEditing = true;
            editingIndex = index;
            
            if (bootstrapModal) {
                bootstrapModal.show();
            }
        }
        
        if (btn.classList.contains('btn-danger')) {
            // Eliminar producto
            if (confirm('¿Estás seguro de eliminar este producto?')) {
                products.splice(index, 1);
                saveToStorage();
                renderTable(searchInput ? searchInput.value : '');
                showMessage('Producto eliminado.', 'danger');
            }
        }
    });
}
// Búsqueda en tiempo real
if (searchInput) {
    searchInput.addEventListener('input', function() {
        renderTable(searchInput.value);
    });
}

// Exportar a CSV
if (exportCSVBtn) {
    exportCSVBtn.addEventListener('click', function() {
        if (products.length === 0) {
            showMessage('No hay productos para exportar.', 'warning');
            return;
        }
        
        var csv = 'Nombre,Categoría,Cantidad,Stock Mínimo,Precio Individual,Precio Total,Fecha Ingreso,Última Modificación\n';
        products.forEach(function(p) {
            csv += '"' + p.name + '","' + p.category + '",' + p.quantity + ',' + p.minStock + ',' + 
                   p.price + ',' + (p.price * p.quantity).toFixed(2) + ',"' + p.dateAdded + '","' + 
                   (p.dateModified || '-') + '"\n';
        });
        
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'inventario_completo.csv';
        a.click();
        URL.revokeObjectURL(url);
    });
}

// Toggle tema claro/oscuro
if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', function() {
        var body = document.body;
        if (body.classList.contains('bg-dark')) {
            body.classList.replace('bg-dark', 'bg-light');
            body.classList.replace('text-light', 'text-dark');
            toggleThemeBtn.textContent = 'Modo Oscuro';
            toggleThemeBtn.classList.remove('btn-outline-light');
            toggleThemeBtn.classList.add('btn-outline-dark');
        } else {
            body.classList.replace('bg-light', 'bg-dark');
            body.classList.replace('text-dark', 'text-light');
            toggleThemeBtn.textContent = 'Modo Claro';
            toggleThemeBtn.classList.remove('btn-outline-dark');
            toggleThemeBtn.classList.add('btn-outline-light');
        }
    });
}

// Inicializar la aplicación
renderTable();
