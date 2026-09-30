// --- CONFIGURAÇÃO DO JSONBIN ---
const BIN_ID = '6abd51fcac6210605a065b96'; // Ex: '65f8a123abc123456789'
const API_KEY = '$2a$10$Ou3dLTtyVpyo5yy8ZYcedOJd42.3SyIritGLDH/cs60eFVjjjjDNS'; // Ex: '$2a$10$abcdefghijklmnopqrstuvwxyz'




// Estado Local
let shoppingItems = [];
let currentFilter = 'all';

// Elementos do DOM
const itemForm = document.getElementById('item-form');
const itemNameInput = document.getElementById('item-name');
const itemQtyInput = document.getElementById('item-qty');
const itemPriceInput = document.getElementById('item-price');
const itemCategoryInput = document.getElementById('item-category');
const shoppingListEl = document.getElementById('shopping-list');
const totalPriceEl = document.getElementById('total-price');
const syncStatusEl = document.getElementById('sync-status');
const searchInput = document.getElementById('search-input');
const configWarning = document.getElementById('config-warning');
const themeToggleBtn = document.getElementById('theme-toggle');

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    checkConfig();
    setupTheme();
    loadItemsFromCloud();

    // Event Listeners
    itemForm.addEventListener('submit', handleAddItem);
    searchInput.addEventListener('input', renderList);
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('bg-brand-600', 'text-white');
                b.classList.add('bg-gray-200', 'dark:bg-gray-700');
            });
            e.target.classList.remove('bg-gray-200', 'dark:bg-gray-700');
            e.target.classList.add('bg-brand-600', 'text-white');
            currentFilter = e.target.dataset.filter;
            renderList();
        });
    });
});

// Valida se as chaves foram preenchidas
function checkConfig() {
    if (BIN_ID === "SEU_BIN_ID_AQUI" || API_KEY === "SUA_API_KEY_AQUI") {
        configWarning.classList.remove('hidden');
        syncStatusEl.textContent = "Status: Chaves não configuradas";
        syncStatusEl.classList.add("text-red-500");
    } else {
        configWarning.classList.add('hidden');
    }
}

// ==========================================
// COMUNICAÇÃO COM O JSONBIN (NUVEM)
// ==========================================

// Ler dados do JSONBin
async function loadItemsFromCloud() {
    if (BIN_ID === "SEU_BIN_ID_AQUI") return;

    syncStatusEl.textContent = "Status: Sincronizando com a nuvem...";
    
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY
            }
        });

        if (!response.ok) throw new Error("Erro ao carregar dados");

        const data = await response.json();
        
        // Se a resposta for um array ou um objeto com record
        const record = data.record;
        shoppingItems = Array.isArray(record) ? record : (record.items || []);

        syncStatusEl.textContent = "Status: Atualizado em tempo real";
        syncStatusEl.className = "text-xs text-brand-600 dark:text-brand-500";
        renderList();
    } catch (error) {
        console.error(error);
        syncStatusEl.textContent = "Status: Erro ao carregar da nuvem";
        syncStatusEl.className = "text-xs text-red-500";
    }
}

// Escrever dados no JSONBin
async function saveItemsToCloud() {
    if (BIN_ID === "SEU_BIN_ID_AQUI") return;

    syncStatusEl.textContent = "Status: Salvando...";

    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(shoppingItems)
        });

        if (!response.ok) throw new Error("Erro ao salvar");

        syncStatusEl.textContent = "Status: Salvo na nuvem!";
        syncStatusEl.className = "text-xs text-brand-600 dark:text-brand-500";
    } catch (error) {
        console.error(error);
        syncStatusEl.textContent = "Status: Erro ao salvar alterações";
        syncStatusEl.className = "text-xs text-red-500";
    }
}

// ==========================================
// OPERAÇÕES NA LISTA
// ==========================================

function handleAddItem(e) {
    e.preventDefault();

    const newItem = {
        id: Date.now().toString(),
        name: itemNameInput.value.trim(),
        qty: parseFloat(itemQtyInput.value) || 1,
        price: parseFloat(itemPriceInput.value) || 0,
        category: itemCategoryInput.value,
        completed: false
    };

    shoppingItems.unshift(newItem);
    
    // Limpa o formulário
    itemNameInput.value = '';
    itemQtyInput.value = '1';
    itemPriceInput.value = '';
    itemNameInput.focus();

    renderList();
    saveItemsToCloud();
}

function toggleItemStatus(id) {
    shoppingItems = shoppingItems.map(item => {
        if (item.id === id) {
            return { ...item, completed: !item.completed };
        }
        return item;
    });
    renderList();
    saveItemsToCloud();
}

function deleteItem(id) {
    shoppingItems = shoppingItems.filter(item => item.id !== id);
    renderList();
    saveItemsToCloud();
}

// ==========================================
// RENDERIZAÇÃO DA INTERFACE
// ==========================================

function renderList() {
    const searchTerm = searchInput.value.toLowerCase();
    
    const filteredItems = shoppingItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        
        if (currentFilter === 'pending') return matchesSearch && !item.completed;
        if (currentFilter === 'completed') return matchesSearch && item.completed;
        return matchesSearch;
    });

    shoppingListEl.innerHTML = '';

    if (filteredItems.length === 0) {
        shoppingListEl.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fa-solid fa-cart-flatbed text-3xl mb-2"></i>
                <p>Nenhum item encontrado.</p>
            </div>`;
    } else {
        filteredItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = `flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700/50 transition ${item.completed ? 'opacity-50' : ''}`;
            
            const totalItemPrice = item.qty * item.price;
            
            itemEl.innerHTML = `
                <div class="flex items-center gap-3 flex-1">
                    <button onclick="toggleItemStatus('${item.id}')" class="text-xl text-gray-400 hover:text-brand-600 transition">
                        <i class="fa-${item.completed ? 'solid fa-circle-check text-brand-600' : 'regular fa-circle'}"></i>
                    </button>
                    <div>
                        <p class="font-semibold ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}">
                            ${item.name}
                        </p>
                        <div class="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>${item.category}</span>
                            <span>•</span>
                            <span>Qtd: ${item.qty}</span>
                            ${item.price > 0 ? `<span>• R$ ${item.price.toFixed(2)}/un</span>` : ''}
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    ${totalItemPrice > 0 ? `<span class="font-bold text-sm">R$ ${totalItemPrice.toFixed(2)}</span>` : ''}
                    <button onclick="deleteItem('${item.id}')" class="text-gray-400 hover:text-red-500 transition p-1">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            shoppingListEl.appendChild(itemEl);
        });
    }

    calculateTotal();
}

function calculateTotal() {
    const total = shoppingItems.reduce((acc, item) => {
        return acc + (item.qty * (item.price || 0));
    }, 0);

    totalPriceEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Dark Mode Toggle
function setupTheme() {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}
