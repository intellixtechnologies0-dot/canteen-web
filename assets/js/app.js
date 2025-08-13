(function () {
  const lanePreparing = document.getElementById('lanePreparing');
  const lanePrepared = document.getElementById('lanePrepared');
  const laneDelivered = document.getElementById('laneDelivered');
  const countPreparing = document.getElementById('countPreparing');
  const countPrepared = document.getElementById('countPrepared');
  const countDelivered = document.getElementById('countDelivered');
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
    if (order.status === STATUS.READY || order.status === STATUS.CANCELLED || order.status === 'DELIVERED') return order.status;
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

    const preparing = state.orders.filter((o) => o.status === STATUS.IN_PROGRESS || o.status === STATUS.NEW);
    const prepared = state.orders.filter((o) => o.status === STATUS.READY);
    const delivered = state.orders.filter((o) => o.status === 'DELIVERED');

    if (lanePreparing) lanePreparing.innerHTML = '';
    if (lanePrepared) lanePrepared.innerHTML = '';
    if (laneDelivered) laneDelivered.innerHTML = '';

    const append = (lane, order) => {
      const card = document.createElement('div');
      card.className = 'order';
      card.dataset.id = order.id;
      card.innerHTML = `
        <div class="order-head">
          <div>
            <div class="order-token">#${order.token} • ${order.table}</div>
            <div class="order-meta">ETA ${order.etaMinutes}m • ${minutes(Date.now() - order.placedAt)}m elapsed</div>
          </div>
          <div class="order-status">${renderStatusBadge(order.status)}</div>
        </div>
        <ul class="order-items">${order.items.map((i) => `<li>${i.qty}x ${i.name}</li>`).join('')}</ul>
        <div class="order-actions">${renderActions(order.status)}</div>
      `;
      lane?.appendChild(card);
    };

    preparing.sort((a, b) => a.token - b.token).forEach((o) => append(lanePreparing, o));
    prepared.sort((a, b) => a.token - b.token).forEach((o) => append(lanePrepared, o));
    delivered.sort((a, b) => a.token - b.token).forEach((o) => append(laneDelivered, o));

    if (countPreparing) countPreparing.textContent = String(preparing.length);
    if (countPrepared) countPrepared.textContent = String(prepared.length);
    if (countDelivered) countDelivered.textContent = String(delivered.length);
  }

  function renderStatusBadge(status) {
    switch (status) {
      case STATUS.NEW: return '<span class="badge">NEW</span>';
      case STATUS.IN_PROGRESS: return '<span class="badge">PREPARING</span>';
      case STATUS.READY: return '<span class="badge">PREPARED</span>';
      case 'DELIVERED': return '<span class="badge">DELIVERED</span>';
      default: return '';
    }
  }

  function renderActions(status) {
    const start = '<button class="btn btn-secondary act-start">Start</button>';
    const ready = '<button class="btn btn-primary act-ready">Prepared</button>';
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
    const card = target.closest('.order');
    if (!card) return;
    const id = card.dataset.id;
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


