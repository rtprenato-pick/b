// --- CONFIGURAÇÃO DO JSONBIN ---
const BIN_ID = '6abd57bfac6210605a066d22'; 
const API_KEY = '$2a$10$Ou3dLTtyVpyo5yy8ZYcedOJd42.3SyIritGLDH/cs60eFVjjjjDNS'; 

// --------------------------------

let items = [];
let currentFilter = 'all';

let form, listContainer, totalPriceEl, syncStatusEl, configWarning;

document.addEventListener('DOMContentLoaded', () => {
    form = document.getElementById('item-form');
    listContainer = document.getElementById('shopping-list');
    totalPriceEl = document.getElementById('total-price');
    syncStatusEl = document.getElementById('sync-status');
    configWarning = document.getElementById('config-warning');

    loadItems();
    initTheme();

    if (form) {
        form.addEventListener('submit', handleAddItem);
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.className = 'filter-btn text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700');
            e.target.className = 'filter-btn text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-600 text-white';
            currentFilter = e.target.dataset.filter;
            render();
        });
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', render);
    }
});

// Carregar Itens da Nuvem
async function loadItems() {
    if (!BIN_ID || BIN_ID === 'COLE_AQUI_O_SEU_BIN_ID') {
        if (syncStatusEl) syncStatusEl.textContent = 'Status: Configuração pendente';
        return;
    }

    if (syncStatusEl) syncStatusEl.textContent = 'Status: Sincronizando...';
    
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            method: 'GET',
            headers: { 
                'X-Master-Key': API_KEY,
                'Cache-Control': 'no-cache'
            }
        });

        if (!res.ok) {
            throw new Error(`Erro na API: ${res.status}`);
        }

        const data = await res.json();
        
        if (Array.isArray(data.record)) {
            items = data.record;
        } else if (typeof data.record === 'object' && data.record !== null) {
            items = Object.values(data.record);
        } else {
            items = [];
        }

        if (syncStatusEl) syncStatusEl.textContent = 'Status: Sincronizado com a nuvem ✓';
        render();
    } catch (err) {
        console.error('Erro ao carregar:', err);
        if (syncStatusEl) syncStatusEl.textContent = 'Status: Erro ao carregar da nuvem';
        items = JSON.parse(localStorage.getItem('minha_lista') || '[]');
        render();
    }
}

// Salvar Itens na Nuvem
async function saveItems() {
    localStorage.setItem('minha_lista', JSON.stringify(items));
    if (!BIN_ID || BIN_ID === 'COLE_AQUI_O_SEU_BIN_ID') return;

    if (syncStatusEl) syncStatusEl.textContent = 'Status: Salvando...';
    
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY,
                'X-Bin-Versioning': 'false' // Impede erro de versionamento na conta gratuita
            },
            body: JSON.stringify(items)
        });

        if (res.ok) {
            if (syncStatusEl) syncStatusEl.textContent = 'Status: Sincronizado com a nuvem ✓';
        } else {
            throw new Error(`Erro ao salvar: ${res.status}`);
        }
    } catch (err) {
        console.error('Erro ao salvar:', err);
        if (syncStatusEl) syncStatusEl.textContent = 'Status: Erro ao salvar na nuvem';
    }
}

function handleAddItem(e) {
    e.preventDefault();
    const newItem = {
        id: Date.now(),
        name: document.getElementById('item-name').value.trim(),
        qty: parseFloat(document.getElementById('item-qty').value) || 1,
        price: parseFloat(document.getElementById('item-price').value) || 0,
        category: document.getElementById('item-category').value,
        completed: false
    };

    items.push(newItem);
    form.reset();
    document.getElementById('item-qty').value = '1';
    render();
    saveItems();
}

function toggleItem(id) {
    items = items.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
    render();
    saveItems();
}

function deleteItem(id) {
    items = items.filter(item => item.id !== id);
    render();
    saveItems();
}

function render() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    if (!listContainer) return;
    
    listContainer.innerHTML = '';

    const filteredItems = items.filter(item => {
        if (!item || !item.name) return false;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        const matchesFilter = currentFilter === 'all' ? true : 
                              currentFilter === 'completed' ? item.completed : !item.completed;
        return matchesSearch && matchesFilter;
    });

    if (filteredItems.length === 0) {
        listContainer.innerHTML = `<div class="text-center py-8 text-gray-400">Nenhum item encontrado</div>`;
        calculateTotal();
        return;
    }

    filteredItems.forEach(item => {
        const el = document.createElement('div');
        el.className = `flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm transition border-l-4 ${item.completed ? 'border-gray-400 opacity-60' : 'border-brand-500'}`;
        
        const itemTotal = ((item.qty || 1) * (item.price || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        el.innerHTML = `
            <div class="flex items-center gap-3 cursor-pointer" onclick="toggleItem(${item.id})">
                <input type="checkbox" ${item.completed ? 'checked' : ''} class="w-5 h-5 text-brand-600 rounded">
                <div>
                    <span class="font-semibold ${item.completed ? 'line-through text-gray-400' : ''}">${item.name}</span>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        <span>${item.qty}x</span> • <span>${item.category}</span>
                        ${item.price > 0 ? `• <span>R$ ${item.price.toFixed(2)} un.</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-bold text-sm ${item.completed ? 'text-gray-400' : 'text-brand-600 dark:text-brand-400'}">${itemTotal}</span>
                <button onclick="deleteItem(${item.id})" class="text-gray-400 hover:text-red-500 p-1">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        listContainer.appendChild(el);
    });

    calculateTotal();
}

function calculateTotal() {
    if (!totalPriceEl) return;
    const total = items.reduce((acc, item) => acc + ((item.qty || 1) * (item.price || 0)), 0);
    totalPriceEl.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
    }
    toggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
    });
}

// --- FUNCIONALIDADES EXCEL (EXPORTAR E IMPORTAR) ---

function exportToExcel() {
    if (typeof XLSX === 'undefined') {
        alert("A biblioteca do Excel ainda está a carregar ou foi bloqueada. Recarregue a página (Ctrl + F5).");
        return;
    }

    if (!items || items.length === 0) {
        alert("A sua lista está vazia! Adicione pelo menos um item antes de exportar.");
        return;
    }

    try {
        const excelData = items.map(item => ({
            "Item": item.name || '',
            "Quantidade": item.qty || 1,
            "Preço Unitário (R$)": item.price || 0,
            "Categoria": item.category || "Geral",
            "Comprado": item.completed ? "Sim" : "Não"
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Lista de Compras");

        XLSX.writeFile(workbook, "lista_de_compras.xlsx");
    } catch (err) {
        console.error("Erro ao gerar Excel:", err);
        alert("Ocorreu um erro ao gerar o ficheiro Excel.");
    }
}

function importFromExcel(event) {
    if (typeof XLSX === 'undefined') {
        alert("A biblioteca do Excel ainda está a carregar. Recarregue a página (Ctrl + F5).");
        return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const importedJson = XLSX.utils.sheet_to_json(worksheet);

            if (importedJson.length === 0) {
                alert("O ficheiro Excel selecionado está vazio.");
                return;
            }

            const newItems = importedJson.map((row, index) => ({
                id: Date.now() + index,
                name: String(row["Item"] || row["Nome"] || row["item"] || "Item sem nome").trim(),
                qty: parseFloat(row["Quantidade"] || row["Qtd"] || row["qty"]) || 1,
                price: parseFloat(row["Preço Unitário (R$)"] || row["Preço"] || row["price"]) || 0,
                category: String(row["Categoria"] || row["category"] || "Geral").trim(),
                completed: String(row["Comprado"] || row["completed"]).toLowerCase() === "sim" || row["Comprado"] === true
            }));

            items = [...items, ...newItems];

            render();
            saveItems();

            alert(`${newItems.length} itens importados com sucesso!`);
            event.target.value = '';
        } catch (err) {
            console.error("Erro ao importar Excel:", err);
            alert("Erro ao ler o ficheiro Excel. Verifique a estrutura do ficheiro.");
        }
    };

    reader.readAsArrayBuffer(file);
}
