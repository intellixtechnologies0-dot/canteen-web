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
    'live-orders': document.getElementById('route-live-orders'),
    'inventory-management': document.getElementById('route-inventory-management'),
    'inventory': document.getElementById('route-inventory'),
    'meal-prep': document.getElementById('route-meal-prep'),
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
    nextToken: 1000,
    simulate: false,
    sound: false,
    inventory: [
      { id: 'i1', name: 'Tomatoes', stock: 12 },
      { id: 'i2', name: 'Cheese', stock: 4 },
      { id: 'i3', name: 'Tea Powder', stock: 1 },
    ],
    logs: [],
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
  function render() {
    state.orders = state.orders.map((o) => ({ ...o, status: computeDerivedStatus(o) }));

    const pending = state.orders.filter((o) => o.status === STATUS.NEW || o.status === STATUS.IN_PROGRESS);
    const completed = state.orders.filter((o) => o.status === STATUS.READY || o.status === 'DELIVERED');

    if (kpiTotal) kpiTotal.textContent = String(state.orders.length);
    if (kpiPending) kpiPending.textContent = String(pending.length);
    if (kpiCompleted) kpiCompleted.textContent = String(completed.length);

    if (liveOrdersBody) {
      liveOrdersBody.innerHTML = '';
      state.orders.slice(0, 6).forEach((o) => {
        const tr = document.createElement('tr');
        tr.dataset.id = o.id;
        tr.innerHTML = `
          <td>#${o.token}</td>
          <td>${o.items[0]?.name || ''}</td>
          <td>${o.items[0]?.qty || 1}</td>
          <td>${statusLabel(o.status)}</td>
          <td>${renderRowAction(o.status)}</td>
        `;
        liveOrdersBody.appendChild(tr);
      });
    }

    if (mealQueue) {
      mealQueue.innerHTML = '';
      pending.slice(0, 3).forEach((o) => {
        const div = document.createElement('div');
        div.className = 'queue-item';
        div.dataset.id = o.id;
        div.innerHTML = `
          <div>${o.items[0]?.name || ''}</div>
          <div class="status">${statusLabel(o.status)}</div>
        `;
        mealQueue.appendChild(div);
      });
    }

    // Dashboard previews
    const dashOrdersBody = document.getElementById('dashOrdersBody');
    if (dashOrdersBody) {
      dashOrdersBody.innerHTML = '';
      state.orders.slice(0, 3).forEach((o) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>#${o.token}</td>
          <td>${o.items[0]?.name || ''}</td>
          <td>${o.items[0]?.qty || 1}</td>
          <td>${statusLabel(o.status)}</td>
        `;
        dashOrdersBody.appendChild(tr);
      });
    }
    const dashMealQueue = document.getElementById('dashMealQueue');
    if (dashMealQueue) {
      dashMealQueue.innerHTML = '';
      pending.slice(0, 3).forEach((o) => {
        const div = document.createElement('div');
        div.className = 'queue-item';
        div.innerHTML = `<div>${o.items[0]?.name || ''}</div><div class="status">${statusLabel(o.status)}</div>`;
        dashMealQueue.appendChild(div);
      });
    }
    const dashInventoryBody = document.getElementById('dashInventoryBody');
    if (dashInventoryBody) {
      dashInventoryBody.innerHTML = '';
      state.inventory.slice(0, 5).forEach((it) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${it.name}</td><td>${it.stock}</td>`;
        dashInventoryBody.appendChild(tr);
      });
    }
    const dashLogsList = document.getElementById('dashLogsList');
    if (dashLogsList) {
      dashLogsList.innerHTML = state.logs.slice(0, 6).map((l) => `<li>${l}</li>`).join('');
    }

    // Inventory Alerts (dashboard + inventory mgmt)
    const lowItems = state.inventory.filter((i) => i.stock <= 2);
    const invAlerts = document.getElementById('invAlerts');
    if (invAlerts) {
      invAlerts.innerHTML = lowItems.length ? lowItems.map((i) => `<li>${i.name} low (${i.stock})</li>`).join('') : '<li>All good</li>';
    }
    const invMgmtAlerts = document.getElementById('invMgmtAlerts');
    if (invMgmtAlerts) {
      invMgmtAlerts.innerHTML = invAlerts?.innerHTML || '';
    }

    // Inventory table
    const inventoryBody = document.getElementById('inventoryBody');
    if (inventoryBody) {
      inventoryBody.innerHTML = '';
      state.inventory.forEach((it) => {
        const tr = document.createElement('tr');
        tr.dataset.id = it.id;
        tr.innerHTML = `
          <td>${it.name}</td>
          <td>${it.stock}</td>
          <td>
            <button class="btn btn-secondary inv-inc">+1</button>
            <button class="btn btn-ghost inv-dec">-1</button>
          </td>
        `;
        inventoryBody.appendChild(tr);
      });
    }

    // Reports KPIs
    const repTotal = document.getElementById('repTotal');
    const repPrep = document.getElementById('repPrep');
    const repDone = document.getElementById('repDone');
    if (repTotal) repTotal.textContent = String(state.orders.length);
    if (repPrep) repPrep.textContent = String(pending.length);
    if (repDone) repDone.textContent = String(completed.length);

    // Logs
    const logsList = document.getElementById('logsList');
    if (logsList) logsList.innerHTML = state.logs.map((l) => `<li>${l}</li>`).join('');
  }

  function statusLabel(status) {
    if (status === STATUS.NEW) return 'Pending';
    if (status === STATUS.IN_PROGRESS) return 'In Progress';
    if (status === STATUS.READY) return 'Ready';
    if (status === 'DELIVERED') return 'Delivered';
    return '';
  }

  function renderRowAction(status) {
    const start = '<button class="btn btn-secondary act-start">Start</button>';
    const ready = '<button class="btn btn-primary act-ready">Mark Ready</button>';
    const deliver = '<button class="btn btn-secondary act-deliver">Delivered</button>';
    if (status === STATUS.NEW) return `${start}`;
    if (status === STATUS.IN_PROGRESS) return `${ready}`;
    if (status === STATUS.READY) return `${deliver}`;
    return '';
  }

  // Actions
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const row = target.closest('[data-id]');
    const id = row?.dataset.id;

    if (id) {
      const order = state.orders.find((o) => o.id === id);
      if (order) {
        if (target.classList.contains('act-start')) { order.status = STATUS.IN_PROGRESS; order.startedAt = Date.now(); state.logs.unshift(`#${order.token} started`); }
        if (target.classList.contains('act-ready')) { order.status = STATUS.READY; state.logs.unshift(`#${order.token} marked ready`); }
        if (target.classList.contains('act-deliver')) { order.status = 'DELIVERED'; state.logs.unshift(`#${order.token} delivered`); }
      }
    }

    // Inventory adjust
    if (target.classList.contains('inv-inc') || target.classList.contains('inv-dec')) {
      const it = state.inventory.find((i) => i.id === id);
      if (it) {
        it.stock += target.classList.contains('inv-inc') ? 1 : -1;
        if (it.stock < 0) it.stock = 0;
        state.logs.unshift(`${it.name} stock ${target.classList.contains('inv-inc') ? '+1' : '-1'}`);
      }
    }
    render();
  });

  // Settings
  const settingSound = document.getElementById('settingSound');
  settingSound?.addEventListener('change', () => {
    state.sound = !!settingSound.checked;
    state.logs.unshift(`Sound ${state.sound ? 'enabled' : 'disabled'}`);
  });

  // Simple hash router
  function setRoute(route) {
    Object.values(routes).forEach((el) => el?.classList.remove('active'));
    routes[route]?.classList.add('active');
    document.querySelectorAll('.side-item').forEach((a) => a.classList.remove('active'));
    document.querySelector(`.side-item[data-route="${route}"]`)?.classList.add('active');
    // Show dashboard preview section only on home
    const dashPreviews = document.querySelector('[data-dash-previews]');
    if (dashPreviews) dashPreviews.classList.toggle('active', route === 'dashboard');
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


