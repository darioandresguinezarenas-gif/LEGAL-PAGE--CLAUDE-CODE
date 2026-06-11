// ── Toast ─────────────────────────────────────────────────
export function showToast(message, type = 'success') {
  const prev = document.getElementById('__toast');
  if (prev) prev.remove();
  const t = document.createElement('div');
  t.id = '__toast';
  t.className = `toast toast-${type}`;
  t.textContent = message;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// ── Modal ─────────────────────────────────────────────────
export function showModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function hideModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Language tabs ─────────────────────────────────────────
export function initLangTabs(root) {
  root.querySelectorAll('.lang-tabs').forEach(tabBar => {
    const group = tabBar.dataset.group;
    const panels = root.querySelectorAll(`.lang-panel[data-group="${group}"]`);
    tabBar.querySelectorAll('.lang-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        tabBar.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        root.querySelector(`.lang-panel[data-group="${group}"][data-lang="${tab.dataset.lang}"]`)
          ?.classList.add('active');
      });
    });
  });
}

// ── JSONB lang field helpers ──────────────────────────────
export function getLang(root, field) {
  const obj = {};
  ['es', 'en', 'zh'].forEach(l => {
    const el = root.querySelector(`[name="${field}_${l}"]`);
    if (el) obj[l] = el.value.trim();
  });
  return obj;
}

export function setLang(root, field, value) {
  if (!value || typeof value !== 'object') return;
  ['es', 'en', 'zh'].forEach(l => {
    const el = root.querySelector(`[name="${field}_${l}"]`);
    if (el) el.value = value[l] ?? '';
  });
}

// ── Array tag input ───────────────────────────────────────
export function initTagInput(inputEl, listEl, initialValues = []) {
  let items = [...initialValues];

  function render() {
    listEl.innerHTML = items.map((v, i) =>
      `<span class="tag-item">${v}<button type="button" class="tag-remove" data-i="${i}">×</button></span>`
    ).join('');
    listEl.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        items.splice(Number(btn.dataset.i), 1);
        render();
      });
    });
  }

  inputEl.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ',') && inputEl.value.trim()) {
      e.preventDefault();
      items.push(inputEl.value.trim());
      inputEl.value = '';
      render();
    }
  });

  render();
  return () => items;
}

// ── Format helpers ────────────────────────────────────────
export function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function fmtCLP(n) {
  return n != null
    ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)
    : '—';
}

export function fmtBool(b, labelTrue = 'Sí', labelFalse = 'No') {
  return b
    ? `<span class="badge badge-green">${labelTrue}</span>`
    : `<span class="badge badge-gray">${labelFalse}</span>`;
}

// ── Loading / empty state ─────────────────────────────────
export function showSection(id) {
  document.querySelectorAll('[data-section]').forEach(el => {
    el.style.display = el.dataset.section === id ? '' : 'none';
  });
}
