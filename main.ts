interface Product {
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  price: number;
  image?: string | null;
  dateAdded: string;
  dateModified?: string | null;
}

let products: Product[] = JSON.parse(localStorage.getItem('products') || '[]');

// Referencias DOM con tipos y comprobación
const productForm = document.getElementById('product-form') as HTMLFormElement | null;
const modalElement = document.getElementById('productModal') as HTMLElement | null;
const messageDiv = document.getElementById('message') as HTMLDivElement | null;
const productTableBody = document.getElementById('product-table-body') as HTMLTableSectionElement | null;
const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
const productCount = document.getElementById('product-count') as HTMLElement | null;
const inventoryTotal = document.getElementById('inventory-total') as HTMLElement | null;
const exportCSVBtn = document.getElementById('exportCSVBtn') as HTMLButtonElement | null;
const toggleThemeBtn = document.getElementById('toggleThemeBtn') as HTMLButtonElement | null;

// Bootstrap Modal solo si existe el modalElement
const bootstrapModal = modalElement
  ? new (window as any).bootstrap.Modal(modalElement)
  : null;

let isEditing = false;
let editingIndex: number | null = null;

// Guardar imagen en base64 temporalmente
function readImage(file: File, callback: (result: string | ArrayBuffer | null) => void): void {
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
}

// Mostrar mensajes
function showMessage(text: string, type: string = 'success'): void {
  if (!messageDiv) return;
  messageDiv.textContent = text;
  messageDiv.className = `alert alert-${type} animate__animated animate__fadeInDown`;
  setTimeout(() => {
    if (!messageDiv) return;
    messageDiv.className = '';
    messageDiv.textContent = '';
  }, 3500);
}

// Renderizar tabla de productos
function renderTable(filter: string = ''): void {
  if (!productTableBody || !productCount || !inventoryTotal) return;
  productTableBody.innerHTML = '';
  let totalInventory = 0;
  let totalProducts = 0;
  const filterLower = filter.toLowerCase();

  products.forEach((product, index) => {
    if (
      !product.name.toLowerCase().includes(filterLower) &&
      !product.category.toLowerCase().includes(filterLower)
    ) return;

    totalProducts++;
    const totalPrice = product.quantity * product.price;
    totalInventory += totalPrice;

    const lowStockClass = product.quantity <= product.minStock ? 'text-danger fw-bold' : '';

    const imgHTML = product.image
      ? `<img src="${product.image}" alt="${product.name}" class="product-img rounded" />`
      : `<i class="fas fa-box fa-2x text-secondary"></i>`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${imgHTML}</td>
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td class="${lowStockClass}">${product.quantity}</td>
      <td>${product.minStock}</td>
      <td>₡${product.price.toFixed(2)}</td>
      <td>₡${totalPrice.toFixed(2)}</td>
      <td>${product.dateAdded}</td>
      <td>${product.dateModified || '-'}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" title="Editar" data-index="${index}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger" title="Eliminar" data-index="${index}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    productTableBody.appendChild(row);
  });

  productCount.textContent = totalProducts.toString();
  inventoryTotal.textContent = totalInventory.toFixed(2);
}

// Guardar productos en localStorage
function saveToStorage(): void {
  localStorage.setItem('products', JSON.stringify(products));
}

// Limpiar formulario y estados
function resetForm(): void {
  if (!productForm) return;
  productForm.reset();
  isEditing = false;
  editingIndex = null;
  productForm.classList.remove('was-validated');
  if (bootstrapModal) bootstrapModal.hide();
}

// Validar formulario Bootstrap
if (productForm) {
  productForm.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (!productForm.checkValidity()) {
      productForm.classList.add('was-validated');
      return;
    }

    const name = (document.getElementById('product-name') as HTMLInputElement | null)?.value.trim() || '';
    const category = (document.getElementById('product-category') as HTMLSelectElement | null)?.value || '';
    const quantity = parseInt((document.getElementById('product-quantity') as HTMLInputElement | null)?.value || '0');
    const minStock = parseInt((document.getElementById('product-minstock') as HTMLInputElement | null)?.value || '0');
    const price = parseFloat((document.getElementById('product-price') as HTMLInputElement | null)?.value || '0');
    const imageFile = (document.getElementById('product-image') as HTMLInputElement | null)?.files?.[0];

    function saveProduct(imageBase64: string | null = null) {
      const dateNow = new Date().toLocaleString();

      if (isEditing && editingIndex !== null) {
        const oldDateAdded = products[editingIndex].dateAdded;
        products[editingIndex] = {
          name,
          category,
          quantity,
          minStock,
          price,
          image: imageBase64 || products[editingIndex].image || null,
          dateAdded: oldDateAdded,
          dateModified: dateNow,
        };
        showMessage('Producto actualizado correctamente.', 'success');
      } else {
        products.push({
          name,
          category,
          quantity,
          minStock,
          price,
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
      readImage(imageFile, (base64) => saveProduct(base64 as string));
    } else {
      saveProduct();
    }
  });
}

// Editar y eliminar producto usando delegación de eventos
if (productTableBody) {
  productTableBody.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('button');
    if (!btn) return;
    const index = Number(btn.getAttribute('data-index'));
    if (btn.classList.contains('btn-warning')) {
      // Editar
      const product = products[index];
      (document.getElementById('product-name') as HTMLInputElement | null)!.value = product.name;
      (document.getElementById('product-category') as HTMLSelectElement | null)!.value = product.category;
      (document.getElementById('product-quantity') as HTMLInputElement | null)!.value = product.quantity.toString();
      (document.getElementById('product-minstock') as HTMLInputElement | null)!.value = product.minStock.toString();
      (document.getElementById('product-price') as HTMLInputElement | null)!.value = product.price.toString();
      (document.getElementById('product-image') as HTMLInputElement | null)!.value = '';
      isEditing = true;
      editingIndex = index;
      if (bootstrapModal) bootstrapModal.show();
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
  searchInput.addEventListener('input', () => {
    renderTable(searchInput.value);
  });
}

// Exportar CSV
if (exportCSVBtn) {
  exportCSVBtn.addEventListener('click', () => {
    if (products.length === 0) {
      showMessage('No hay productos para exportar.', 'warning');
      return;
    }

    let csv = 'Nombre,Categoría,Cantidad,Stock Mínimo,Precio Individual,Precio Total,Fecha Ingreso,Última Modificación\n';
    products.forEach((p) => {
      csv += `"${p.name}","${p.category}",${p.quantity},${p.minStock},${p.price},${(p.price * p.quantity).toFixed(2)},"${p.dateAdded}","${p.dateModified || '-'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventario_completo.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Alternar tema claro/oscuro
if (toggleThemeBtn) {
  toggleThemeBtn.addEventListener('click', () => {
    const body = document.body;
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

// Inicializar tabla al cargar página
renderTable();