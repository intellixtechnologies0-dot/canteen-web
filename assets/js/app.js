(function () {
  // Dashboard widgets
  const liveOrdersBody = document.getElementById('liveOrdersFullBody');
  const mealQueue = document.getElementById('mealQueueFull');
  const kpiTotal = document.getElementById('kpiTotal');
  const kpiPending = document.getElementById('kpiPending');
  const kpiCompleted = document.getElementById('kpiCompleted');
  const yearEl = document.getElementById('year');

  // Router elements
  const sideNav = document.getElementById('sideNav');
  const routes = {
    'dashboard': document.getElementById('route-dashboard'),
    'orders': document.getElementById('route-orders'),
    'inventory-management': document.getElementById('route-inventory-management'),
    'inventory': document.getElementById('route-inventory'),
    'reports': document.getElementById('route-reports'),
    'settings': document.getElementById('route-settings'),
    'logs': document.getElementById('route-logs'),
  };

  const STATUS = {
    NEW: 'NEW',
    IN_PROGRESS: 'IN_PROGRESS',
    READY: 'READY',
    DELAYED: 'DELAYED',
    CANCELLED: 'CANCELLED',
  };

  const state = {
    orders: [],
    foodItems: [],
    categories: [],
    simulate: false,
    sound: false,
  };

  // Theme
  // Keep single white/black theme aligned with app (no toggle here)

  // Utilities
  function formatItems(items) { return items.map((it) => `${it.qty}x ${it.name}`).join(', '); }

  function minutes(ms) { return Math.round(ms / 60000); }

  function computeDerivedStatus(order) {
    // Keep only three visible states per requirements
    if (order.status === STATUS.READY || order.status === STATUS.CANCELLED || order.status === 'DELIVERED') return order.status;
    return order.status;
  }

  // Sound via WebAudio
  let audioCtx = null;
  function beep() {
    if (!state.sound) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, audioCtx.currentTime);
      g.gain.setValueAtTime(0.001, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
      o.connect(g).connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + 0.22);
    } catch (_) {}
  }

  // Mock data
  const menuItems = ['Veg Sandwich', 'Pasta', 'Tea', 'Coffee', 'Biryani', 'Fried Rice'];
  function createMockOrder() {
    const itemCount = 1 + Math.floor(Math.random() * 3);
    const items = Array.from({ length: itemCount }, () => ({
      name: menuItems[Math.floor(Math.random() * menuItems.length)],
      qty: 1 + Math.floor(Math.random() * 3),
    }));
    state.nextToken += 1;
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()),
      token: state.nextToken,
      table: ['T1', 'T2', 'T3', 'T4', 'T5'][Math.floor(Math.random() * 5)],
      items,
      status: STATUS.NEW,
      placedAt: Date.now(),
      etaMinutes: 5 + Math.floor(Math.random() * 11), // 5-15
    };
  }

  // Render
  async function render() {
    try {
      // Load orders from Supabase
      const orders = await window.supabaseService.getOrders();
      state.orders = orders;

      const pending = state.orders.filter((o) => o.status === 'pending' || o.status === 'preparing');
      const completed = state.orders.filter((o) => o.status === 'ready' || o.status === 'delivered' || o.status === 'completed');

      if (kpiTotal) kpiTotal.textContent = String(state.orders.length);
      if (kpiPending) kpiPending.textContent = String(pending.length);
      if (kpiCompleted) kpiCompleted.textContent = String(completed.length);

      // Ongoing Orders (pending and preparing)
      const ongoingOrdersBody = document.getElementById('ongoingOrdersBody');
      if (ongoingOrdersBody) {
        ongoingOrdersBody.innerHTML = '';
        pending.forEach((order) => {
          const tr = document.createElement('tr');
          tr.dataset.id = order.id;
          
          // Get order items summary
          const itemsSummary = order.order_items?.map(item => 
            `${item.quantity}x ${item.food_items?.name || 'Unknown Item'}`
          ).join(', ') || 'No items';
          
          // Get customer info
          const customerName = order.profiles ? 
            `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() || 
            `Student ID: ${order.profiles.student_id || 'N/A'}` : 'Unknown Customer';
          
          tr.innerHTML = `
            <td>#${order.id.slice(-8)}</td>
            <td>${customerName}</td>
            <td>${itemsSummary}</td>
            <td>$${order.total_amount}</td>
            <td>${statusLabel(order.status)}</td>
            <td>${renderRowAction(order.status, order.id)}</td>
          `;
          ongoingOrdersBody.appendChild(tr);
        });
      }

      // Past Orders (ready, delivered, completed)
      const liveOrdersBody = document.getElementById('liveOrdersBody');
      if (liveOrdersBody) {
        liveOrdersBody.innerHTML = '';
        completed.forEach((order) => {
          const tr = document.createElement('tr');
          tr.dataset.id = order.id;
          
          const itemsSummary = order.order_items?.map(item => 
            `${item.quantity}x ${item.food_items?.name || 'Unknown Item'}`
          ).join(', ') || 'No items';
          
          const customerName = order.profiles ? 
            `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() || 
            `Student ID: ${order.profiles.student_id || 'N/A'}` : 'Unknown Customer';
          
          const completedTime = new Date(order.updated_at || order.created_at).toLocaleTimeString();
          
          tr.innerHTML = `
            <td>#${order.id.slice(-8)}</td>
            <td>${customerName}</td>
            <td>${itemsSummary}</td>
            <td>$${order.total_amount}</td>
            <td>${statusLabel(order.status)}</td>
            <td>${completedTime}</td>
          `;
          liveOrdersBody.appendChild(tr);
        });
      }

          // Dashboard previews
      const dashOrdersBody = document.getElementById('dashOrdersBody');
      if (dashOrdersBody) {
        dashOrdersBody.innerHTML = '';
        state.orders.slice(0, 3).forEach((order) => {
          const tr = document.createElement('tr');
          const itemsSummary = order.order_items?.map(item => 
            `${item.quantity}x ${item.food_items?.name || 'Unknown Item'}`
          ).join(', ') || 'No items';
          tr.innerHTML = `
            <td>#${order.id.slice(-8)}</td>
            <td>${itemsSummary}</td>
            <td>$${order.total_amount}</td>
            <td>${statusLabel(order.status)}</td>
          `;
          dashOrdersBody.appendChild(tr);
        });
      }

      // Full orders table inside dashboard card
      const dashOrdersFullBody = document.getElementById('dashOrdersFullBody');
      if (dashOrdersFullBody) {
        dashOrdersFullBody.innerHTML = '';
        state.orders.slice(0, 10).forEach((order) => {
          const tr = document.createElement('tr');
          tr.dataset.id = order.id;
          const itemsSummary = order.order_items?.map(item => 
            `${item.quantity}x ${item.food_items?.name || 'Unknown Item'}`
          ).join(', ') || 'No items';
          tr.innerHTML = `
            <td>#${order.id.slice(-8)}</td>
            <td>${itemsSummary}</td>
            <td>$${order.total_amount}</td>
            <td>${statusLabel(order.status)}</td>
            <td>${renderRowAction(order.status, order.id)}</td>
          `;
          dashOrdersFullBody.appendChild(tr);
        });
      }

      // Reports KPIs
      const repTotal = document.getElementById('repTotal');
      const repPrep = document.getElementById('repPrep');
      const repDone = document.getElementById('repDone');
      if (repTotal) repTotal.textContent = String(state.orders.length);
      if (repPrep) repPrep.textContent = String(pending.length);
      if (repDone) repDone.textContent = String(completed.length);

    } catch (error) {
      console.error('Error rendering orders:', error);
    }
  }
  }

  function statusLabel(status) {
    switch (status) {
      case 'pending': return 'Pending';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'delivered': return 'Delivered';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Unknown';
    }
  }

  function renderRowAction(status, orderId) {
    const start = `<button class="btn btn-secondary act-start" data-order-id="${orderId}">Start Preparing</button>`;
    const ready = `<button class="btn btn-primary act-ready" data-order-id="${orderId}">Mark Ready</button>`;
    const deliver = `<button class="btn btn-secondary act-deliver" data-order-id="${orderId}">Mark Delivered</button>`;
    
    switch (status) {
      case 'pending': return start;
      case 'preparing': return ready;
      case 'ready': return deliver;
      default: return '';
    }
  }

  // Actions
  document.addEventListener('click', async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    
    const orderId = target.dataset.orderId;
    
    if (orderId && target.classList.contains('act-start')) {
      try {
        await window.supabaseService.updateOrderStatus(orderId, 'preparing');
        console.log(`Order ${orderId} started preparing`);
        render();
      } catch (error) {
        console.error('Error updating order status:', error);
      }
    }
    
    if (orderId && target.classList.contains('act-ready')) {
      try {
        await window.supabaseService.updateOrderStatus(orderId, 'ready');
        console.log(`Order ${orderId} marked ready`);
        render();
      } catch (error) {
        console.error('Error updating order status:', error);
      }
    }
    
    if (orderId && target.classList.contains('act-deliver')) {
      try {
        await window.supabaseService.updateOrderStatus(orderId, 'delivered');
        console.log(`Order ${orderId} marked delivered`);
        render();
      } catch (error) {
        console.error('Error updating order status:', error);
      }
    }
  });

  // Settings
  const settingSound = document.getElementById('settingSound');
  settingSound?.addEventListener('change', () => {
    state.sound = !!settingSound.checked;
    state.logs.unshift(`Sound ${state.sound ? 'enabled' : 'disabled'}`);
  });

  // Tab functionality for Orders
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
      const tabName = e.target.dataset.tab;
      const tabButtons = document.querySelectorAll('.tab-btn');
      const tabPanes = document.querySelectorAll('.tab-pane');
      
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // Add active class to clicked button and corresponding pane
      e.target.classList.add('active');
      document.getElementById(`tab-${tabName}`).classList.add('active');
    }
  });

  // Simple hash router
  function setRoute(route) {
    Object.values(routes).forEach((el) => el?.classList.remove('active'));
    routes[route]?.classList.add('active');
    document.querySelectorAll('.side-item').forEach((a) => a.classList.remove('active'));
    document.querySelector(`.side-item[data-route="${route}"]`)?.classList.add('active');
    
    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
      const titles = {
        'dashboard': 'Dashboard',
        'orders': 'Orders',
        'inventory-management': 'Inventory Management',
        'inventory': 'Inventory',
        'reports': 'Reports',
        'settings': 'Settings',
        'logs': 'Logs'
      };
      pageTitle.textContent = titles[route] || 'Dashboard';
    }
    
    // Re-render immediately on route change so route-specific widgets update
    render();
  }
  function parseRoute() {
    const hash = window.location.hash || '#/dashboard';
    const route = hash.replace('#/', '');
    if (routes[route]) setRoute(route); else setRoute('dashboard');
  }
  window.addEventListener('hashchange', parseRoute);
  parseRoute();

  // Controls
  // No filter/search/sound controls in simplified layout

  let simTimer = null;
  // Simulation disabled per request. Orders will not auto-generate.
  state.simulate = false;

  // Live timers re-render
  setInterval(render, 5000);

  // Seed initial orders
  state.orders = [createMockOrder(), createMockOrder(), createMockOrder()];
  state.nextToken += 10; // make space for demo tokens

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  render();
})();


