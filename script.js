// --- CONFIGURAÇÃO DO JSONBIN ---
const BIN_ID = '6abd51fcac6210605a065b96'; // Ex: '65f8a123abc123456789'
const API_KEY = '$2a$10$Ou3dLTtyVpyo5yy8ZYcedOJd42.3SyIritGLDH/cs60eFVjjjjDNS'; // Ex: '$2a$10$abcdefghijklmnopqrstuvwxyz'



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

// Carregar Itens da Nuvem (Trata Arrays e Objetos do JSONBin)
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
        
        // Trata o registo independentemente de ser Array direto ou contido no record
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
                'X-Master-Key': API_KEY
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
