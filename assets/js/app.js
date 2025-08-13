(function () {
  const liveOrdersBody = document.getElementById('liveOrdersBody');
  const mealQueue = document.getElementById('mealQueue');
  const kpiTotal = document.getElementById('kpiTotal');
  const kpiPending = document.getElementById('kpiPending');
  const kpiCompleted = document.getElementById('kpiCompleted');
  const yearEl = document.getElementById('year');

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
    if (!row) return;
    const id = row.dataset.id;
    const order = state.orders.find((o) => o.id === id);
    if (!order) return;

    if (target.classList.contains('act-start')) {
      order.status = STATUS.IN_PROGRESS;
      order.startedAt = Date.now();
    }
    if (target.classList.contains('act-ready')) {
      order.status = STATUS.READY;
    }
    if (target.classList.contains('act-deliver')) {
      order.status = 'DELIVERED';
    }
    render();
  });

  // Controls
  // No filter/search/sound controls in simplified layout

  let simTimer = null;
  // Auto simulation on load for demo
  state.simulate = true;
  simTimer = setInterval(() => {
    const order = createMockOrder();
    state.orders.unshift(order);
    beep();
    render();
  }, 4000);

  // Live timers re-render
  setInterval(render, 5000);

  // Seed initial orders
  state.orders = [createMockOrder(), createMockOrder(), createMockOrder()];
  state.nextToken += 10; // make space for demo tokens

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  render();
})();


