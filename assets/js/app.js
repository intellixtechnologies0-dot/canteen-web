(function () {
  const ordersContainer = document.getElementById('orders');
  const statusFilter = document.getElementById('statusFilter');
  const searchInput = document.getElementById('searchInput');
  const simulateToggle = document.getElementById('simulateToggle');
  const soundToggle = document.getElementById('soundToggle');
  const themeToggle = document.getElementById('themeToggle');

  const kpiTotal = document.getElementById('kpiTotal');
  const kpiNew = document.getElementById('kpiNew');
  const kpiProg = document.getElementById('kpiProg');
  const kpiReady = document.getElementById('kpiReady');
  const kpiLate = document.getElementById('kpiLate');
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
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') document.documentElement.classList.add('light');
  themeToggle?.addEventListener('click', () => {
    document.documentElement.classList.toggle('light');
    const mode = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem('theme', mode);
  });

  // Utilities
  function formatItems(items) {
    return items.map((it) => `${it.qty}x ${it.name}`).join(', ');
  }

  function minutes(ms) { return Math.round(ms / 60000); }

  function computeDerivedStatus(order) {
    if (order.status === STATUS.READY || order.status === STATUS.CANCELLED) return order.status;
    const elapsed = Date.now() - order.placedAt;
    const isLate = minutes(elapsed) > order.etaMinutes;
    if (isLate && order.status !== STATUS.IN_PROGRESS) return STATUS.DELAYED;
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
  const menuItems = ['Veg Sandwich', 'Pasta', 'Tea', 'Coffee', 'Biryani', 'Fried Rice', 'Burger', 'Fries', 'Paneer Roll', 'Salad'];
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
    // Derived statuses
    state.orders = state.orders.map((o) => ({ ...o, status: computeDerivedStatus(o) }));

    const filter = statusFilter?.value || 'ALL';
    const query = (searchInput?.value || '').trim().toLowerCase();

    const filtered = state.orders.filter((o) => {
      const byStatus = filter === 'ALL' ? true : o.status === filter;
      const byQuery = !query ? true : (
        String(o.token).includes(query) ||
        o.table.toLowerCase().includes(query) ||
        formatItems(o.items).toLowerCase().includes(query)
      );
      return byStatus && byQuery;
    });

    // KPIs
    const counts = {
      total: state.orders.length,
      NEW: state.orders.filter((o) => o.status === STATUS.NEW).length,
      IN_PROGRESS: state.orders.filter((o) => o.status === STATUS.IN_PROGRESS).length,
      READY: state.orders.filter((o) => o.status === STATUS.READY).length,
      DELAYED: state.orders.filter((o) => o.status === STATUS.DELAYED).length,
    };
    if (kpiTotal) kpiTotal.textContent = counts.total;
    if (kpiNew) kpiNew.textContent = counts.NEW;
    if (kpiProg) kpiProg.textContent = counts.IN_PROGRESS;
    if (kpiReady) kpiReady.textContent = counts.READY;
    if (kpiLate) kpiLate.textContent = counts.DELAYED;

    // DOM
    if (!ordersContainer) return;
    ordersContainer.innerHTML = '';
    filtered
      .sort((a, b) => a.token - b.token)
      .forEach((o) => {
        const card = document.createElement('div');
        card.className = 'order';
        card.dataset.id = o.id;
        card.innerHTML = `
          <div class="order-head">
            <div>
              <div class="order-token">#${o.token} • ${o.table}</div>
              <div class="order-meta">ETA ${o.etaMinutes}m • Placed ${minutes(Date.now() - o.placedAt)}m ago</div>
            </div>
            <div class="order-status">
              ${renderStatusBadge(o.status)}
            </div>
          </div>
          <ul class="order-items">${o.items.map((i) => `<li>${i.qty}x ${i.name}</li>`).join('')}</ul>
          <div class="order-actions">
            ${renderActions(o.status)}
          </div>
        `;
        ordersContainer.appendChild(card);
      });
  }

  function renderStatusBadge(status) {
    switch (status) {
      case STATUS.NEW: return '<span class="badge new">NEW</span>';
      case STATUS.IN_PROGRESS: return '<span class="badge inprog">IN-PROGRESS</span>';
      case STATUS.READY: return '<span class="badge ready">READY</span>';
      case STATUS.DELAYED: return '<span class="badge delayed">DELAYED</span>';
      case STATUS.CANCELLED: return '<span class="badge cancel">CANCELLED</span>';
      default: return '';
    }
  }

  function renderActions(status) {
    const start = '<button class="btn btn-secondary act-start">Start</button>';
    const delay = '<button class="btn btn-ghost act-delay">+5m</button>';
    const ready = '<button class="btn btn-primary act-ready">Ready</button>';
    const cancel = '<button class="btn btn-ghost act-cancel">Cancel</button>';
    if (status === STATUS.NEW) return `${start}${delay}${cancel}`;
    if (status === STATUS.IN_PROGRESS) return `${ready}${delay}${cancel}`;
    if (status === STATUS.DELAYED) return `${start}${delay}${cancel}`;
    if (status === STATUS.READY || status === STATUS.CANCELLED) return '';
    return '';
  }

  // Actions
  ordersContainer?.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const card = target.closest('.order');
    if (!card) return;
    const id = card.dataset.id;
    const order = state.orders.find((o) => o.id === id);
    if (!order) return;

    if (target.classList.contains('act-start')) {
      order.status = STATUS.IN_PROGRESS;
      order.startedAt = Date.now();
    }
    if (target.classList.contains('act-delay')) {
      order.etaMinutes += 5;
    }
    if (target.classList.contains('act-ready')) {
      order.status = STATUS.READY;
    }
    if (target.classList.contains('act-cancel')) {
      order.status = STATUS.CANCELLED;
    }
    render();
  });

  // Controls
  statusFilter?.addEventListener('change', render);
  searchInput?.addEventListener('input', render);
  soundToggle?.addEventListener('click', () => {
    state.sound = !state.sound;
    soundToggle.setAttribute('aria-pressed', state.sound ? 'true' : 'false');
    soundToggle.textContent = state.sound ? 'Sound: On' : 'Sound: Off';
  });

  let simTimer = null;
  simulateToggle?.addEventListener('click', () => {
    state.simulate = !state.simulate;
    simulateToggle.textContent = state.simulate ? 'Stop Simulation' : 'Start Simulation';
    if (state.simulate) {
      simTimer = setInterval(() => {
        const order = createMockOrder();
        state.orders.unshift(order);
        beep();
        render();
      }, 3500);
    } else if (simTimer) {
      clearInterval(simTimer);
      simTimer = null;
    }
  });

  // Live timers re-render
  setInterval(render, 5000);

  // Seed initial orders
  state.orders = [createMockOrder(), createMockOrder(), createMockOrder()];
  state.nextToken += 10; // make space for demo tokens

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  render();
})();


