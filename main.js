var products = JSON.parse(localStorage.getItem('products') || '[]');
// Referencias DOM con tipos y comprobación
var productForm = document.getElementById('product-form');
var modalElement = document.getElementById('productModal');
var messageDiv = document.getElementById('message');
var productTableBody = document.getElementById('product-table-body');
var searchInput = document.getElementById('search-input');
var productCount = document.getElementById('product-count');
var inventoryTotal = document.getElementById('inventory-total');
var exportCSVBtn = document.getElementById('exportCSVBtn');
var toggleThemeBtn = document.getElementById('toggleThemeBtn');
// Bootstrap Modal solo si existe el modalElement y Bootstrap está disponible
var bootstrapModal = modalElement && window.bootstrap
    ? new window.bootstrap.Modal(modalElement)
    : null;
var isEditing = false;
var editingIndex = null;
// Guardar imagen en base64 temporalmente
function readImage(file, callback) {
    var reader = new FileReader();
    reader.onload = function () { return callback(reader.result); };
    reader.readAsDataURL(file);
}
// Mostrar mensajes
function showMessage(text, type) {
    if (type === void 0) { type = 'success'; }
    if (!messageDiv)
        return;
    messageDiv.textContent = text;
    messageDiv.className = "alert alert-".concat(type, " animate__animated animate__fadeInDown");
    setTimeout(function () {
        if (!messageDiv)
            return;
        messageDiv.className = '';
        messageDiv.textContent = '';
    }, 3500);
}
// Renderizar tabla de productos
function renderTable(filter) {
    if (filter === void 0) { filter = ''; }
    if (!productTableBody || !productCount || !inventoryTotal)
        return;
    productTableBody.innerHTML = '';
    var totalInventory = 0;
    var totalProducts = 0;
    var filterLower = filter.toLowerCase();
    products.forEach(function (product, index) {
        if (!product.name.toLowerCase().includes(filterLower) &&
            !product.category.toLowerCase().includes(filterLower))
            return;
        totalProducts++;
        var totalPrice = product.quantity * product.price;
        totalInventory += totalPrice;
        var lowStockClass = product.quantity <= product.minStock ? 'text-danger fw-bold' : '';
        var imgHTML = product.image
            ? "<img src=\"".concat(product.image, "\" alt=\"").concat(product.name, "\" class=\"product-img rounded\" />")
            : "<i class=\"fas fa-box fa-2x text-secondary\"></i>";
        var row = document.createElement('tr');
        row.innerHTML = "\n      <td>".concat(imgHTML, "</td>\n      <td>").concat(product.name, "</td>\n      <td>").concat(product.category, "</td>\n      <td class=\"").concat(lowStockClass, "\">").concat(product.quantity, "</td>\n      <td>").concat(product.minStock, "</td>\n      <td>\u20A1").concat(product.price.toFixed(2), "</td>\n      <td>\u20A1").concat(totalPrice.toFixed(2), "</td>\n      <td>").concat(product.dateAdded, "</td>\n      <td>").concat(product.dateModified || '-', "</td>\n      <td>\n        <button class=\"btn btn-sm btn-warning me-1\" title=\"Editar\" data-index=\"").concat(index, "\">\n          <i class=\"fas fa-edit\"></i>\n        </button>\n        <button class=\"btn btn-sm btn-danger\" title=\"Eliminar\" data-index=\"").concat(index, "\">\n          <i class=\"fas fa-trash\"></i>\n        </button>\n      </td>\n    ");
        productTableBody.appendChild(row);
    });
    productCount.textContent = totalProducts.toString();
    inventoryTotal.textContent = totalInventory.toFixed(2);
}
// Guardar productos en localStorage
function saveToStorage() {
    localStorage.setItem('products', JSON.stringify(products));
}
// Limpiar formulario y estados
function resetForm() {
    if (!productForm)
        return;
    productForm.reset();
    isEditing = false;
    editingIndex = null;
    productForm.classList.remove('was-validated');
    if (bootstrapModal)
        bootstrapModal.hide();
}
// Validar formulario Bootstrap
if (productForm) {
    productForm.addEventListener('submit', function (e) {
        var _a, _b, _c, _d, _e, _f, _g;
        e.preventDefault();
        e.stopPropagation();
        if (!productForm.checkValidity()) {
            productForm.classList.add('was-validated');
            return;
        }
        var name = ((_a = document.getElementById('product-name')) === null || _a === void 0 ? void 0 : _a.value.trim()) || '';
        var category = ((_b = document.getElementById('product-category')) === null || _b === void 0 ? void 0 : _b.value) || '';
        var quantity = parseInt(((_c = document.getElementById('product-quantity')) === null || _c === void 0 ? void 0 : _c.value) || '0');
        var minStock = parseInt(((_d = document.getElementById('product-minstock')) === null || _d === void 0 ? void 0 : _d.value) || '0');
        var price = parseFloat(((_e = document.getElementById('product-price')) === null || _e === void 0 ? void 0 : _e.value) || '0');
        var imageFile = (_g = (_f = document.getElementById('product-image')) === null || _f === void 0 ? void 0 : _f.files) === null || _g === void 0 ? void 0 : _g[0];
        function saveProduct(imageBase64) {
            if (imageBase64 === void 0) { imageBase64 = null; }
            var dateNow = new Date().toLocaleString();
            if (isEditing && editingIndex !== null) {
                var oldDateAdded = products[editingIndex].dateAdded;
                products[editingIndex] = {
                    name: name,
                    category: category,
                    quantity: quantity,
                    minStock: minStock,
                    price: price,
                    image: imageBase64 || products[editingIndex].image || null,
                    dateAdded: oldDateAdded,
                    dateModified: dateNow,
                };
                showMessage('Producto actualizado correctamente.', 'success');
            }
            else {
                products.push({
                    name: name,
                    category: category,
                    quantity: quantity,
                    minStock: minStock,
                    price: price,
                    image: imageBase64 || null,
                    dateAdded: dateNow,
                    dateModified: null,
                });
                showMessage('Producto agregado correctamente.', 'success');
            }
            saveToStorage();
            renderTable(searchInput ? searchInput.value : '');
            resetForm();
        }
        if (imageFile) {
            readImage(imageFile, function (base64) { return saveProduct(base64); });
        }
        else {
            saveProduct();
        }
    });
}
// Editar y eliminar producto usando delegación de eventos
if (productTableBody) {
    productTableBody.addEventListener('click', function (e) {
        var target = e.target;
        var btn = target.closest('button');
        if (!btn)
            return;
        var index = Number(btn.getAttribute('data-index'));
        if (btn.classList.contains('btn-warning')) {
            // Editar
            var product = products[index];
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-quantity').value = product.quantity.toString();
            document.getElementById('product-minstock').value = product.minStock.toString();
            document.getElementById('product-price').value = product.price.toString();
            document.getElementById('product-image').value = '';
            isEditing = true;
            editingIndex = index;
            if (bootstrapModal)
                bootstrapModal.show();
        }
        if (btn.classList.contains('btn-danger')) {
            // Eliminar
            if (confirm('¿Estás seguro de eliminar este producto?')) {
                products.splice(index, 1);
                saveToStorage();
                renderTable(searchInput ? searchInput.value : '');
                showMessage('Producto eliminado.', 'danger');
            }
        }
    });
}
// Filtrar tabla
if (searchInput) {
    searchInput.addEventListener('input', function () {
        renderTable(searchInput.value);
    });
}
// Exportar CSV
if (exportCSVBtn) {
    exportCSVBtn.addEventListener('click', function () {
        if (products.length === 0) {
            showMessage('No hay productos para exportar.', 'warning');
            return;
        }
        var csv = 'Nombre,Categoría,Cantidad,Stock Mínimo,Precio Individual,Precio Total,Fecha Ingreso,Última Modificación\n';
        products.forEach(function (p) {
            csv += "\"".concat(p.name, "\",\"").concat(p.category, "\",").concat(p.quantity, ",").concat(p.minStock, ",").concat(p.price, ",").concat((p.price * p.quantity).toFixed(2), ",\"").concat(p.dateAdded, "\",\"").concat(p.dateModified || '-', "\"\n");
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
// Alternar tema claro/oscuro
if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', function () {
        var body = document.body;
        if (body.classList.contains('bg-dark')) {
            body.classList.replace('bg-dark', 'bg-light');
            body.classList.replace('text-light', 'text-dark');
            toggleThemeBtn.textContent = 'Modo Oscuro';
            toggleThemeBtn.classList.remove('btn-outline-light');
            toggleThemeBtn.classList.add('btn-outline-dark');
        }
        else {
            body.classList.replace('bg-light', 'bg-dark');
            body.classList.replace('text-dark', 'text-light');
            toggleThemeBtn.textContent = 'Modo Claro';
            toggleThemeBtn.classList.remove('btn-outline-dark');
            toggleThemeBtn.classList.add('btn-outline-light');
        }
    });
}
// Inicializar tabla al cargar página
renderTable();
// Mostrar mensaje de bienvenida después de cargar la página
document.addEventListener('DOMContentLoaded', function () {
    showMessage('¡Hola! Bienvenido al Sistema de Inventario', 'info');
});
// Si la página ya está cargada, mostrar mensaje inmediatamente
if (document.readyState === 'loading') {
    // Ya se configuró el listener arriba
}
else {
    showMessage('¡Hola! Bienvenido al Sistema de Inventario', 'info');
}
