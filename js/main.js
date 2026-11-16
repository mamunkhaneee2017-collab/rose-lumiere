// Rosé Lumière — main.js（トップページ）
// 商品データは js/products.js にあります。
document.documentElement.classList.add('js');

(function () {
  const { PRODUCTS, FREE_SHIP, yen, loadCart, saveCart, calc, buyNow } = window.RL;
  const body = document.body;

  const CART_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z M9 8V6a3 3 0 0 1 6 0v2"/></svg>';

  /* ---------- 商品一覧を作る ---------- */
  const grid = document.querySelector('.product-grid');
  const listIds = Object.keys(PRODUCTS).filter(id => PRODUCTS[id].cat !== 'gift');
  const cards = {};
  listIds.forEach((id, i) => {
    const p = PRODUCTS[id];
    const el = document.createElement('article');
    el.className = 'product reveal';
    el.dataset.cat = p.cat;
    el.dataset.order = i;
    const badgeClass = p.badge === 'New' ? ' badge-new' : p.badge === 'Limited' ? ' badge-limited' : '';
    el.innerHTML = `
      <div class="product-media">
        ${p.badge ? `<span class="badge${badgeClass}">${p.badge}</span>` : ''}
        <img src="${p.img}" alt="" loading="lazy">
        <button class="qv-open" data-qv="${id}"><span>詳しく見る</span></button>
      </div>
      <div class="product-info">
        <p class="product-cat">${p.en} <span class="size">${p.size}</span></p>
        <h3><button class="qv-link" data-qv="${id}"></button></h3>
        <p class="product-desc"></p>
        <div class="product-row">
          <p class="price">${yen(p.price)}<small>税込</small></p>
          <span class="rating" style="--r:${p.rating}" role="img" aria-label="5点中${p.rating}点、レビュー${p.reviews}件"><span class="stars" aria-hidden="true"></span><small>${p.rating} (${p.reviews})</small></span>
        </div>
        <div class="product-actions">
          <button class="btn btn-dark btn-buy" data-buy="${id}">購入する</button>
          <button class="btn-cart" data-add="${id}">${CART_SVG}<span class="sr-only"></span></button>
        </div>
      </div>`;
    // 文字はテキストとして入れる（HTMLとして解釈させない）
    el.querySelector('.qv-link').textContent = p.name;
    el.querySelector('.product-desc').textContent = p.lead;
    el.querySelector('.qv-open').setAttribute('aria-label', `${p.name}の詳細を見る`);
    el.querySelector('.btn-cart').title = 'カートに入れる';
    el.querySelector('.btn-cart .sr-only').textContent = `${p.name}をカートに入れる`;
    el.querySelector('.btn-buy').setAttribute('aria-label', `${p.name}を購入する`);
    grid.appendChild(el);
    cards[id] = el;
  });

  /* ---------- 検索エンジン向けの商品情報（構造化データ） ---------- */
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': Object.values(PRODUCTS).map(p => Object.assign({
      '@type': 'Product', name: p.name, image: p.img, description: p.desc,
      brand: { '@type': 'Brand', name: 'Rosé Lumière' },
      offers: { '@type': 'Offer', price: String(p.price), priceCurrency: 'JPY', availability: 'https://schema.org/InStock' }
    }, p.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: String(p.rating), reviewCount: String(p.reviews) } } : {}))
  });
  document.head.appendChild(ld);

  /* ---------- お知らせバー（自動切り替え） ---------- */
  const msgs = document.querySelectorAll('.announce-track p');
  let mi = 0;
  if (msgs.length > 1) {
    setInterval(() => {
      const cur = msgs[mi];
      cur.classList.remove('is-active');
      cur.classList.add('is-leaving');
      setTimeout(() => cur.classList.remove('is-leaving'), 600);
      mi = (mi + 1) % msgs.length;
      msgs[mi].classList.add('is-active');
    }, 4500);
  }

  /* ---------- スマホメニュー ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('gnav');
  function setNav(open) {
    body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    body.classList.toggle('lock', open);
  }
  toggle.addEventListener('click', () => setNav(!body.classList.contains('nav-open')));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setNav(false)));

  /* ---------- 表示中のセクションのメニューを強調 ---------- */
  const navLinks = [...nav.querySelectorAll('ul a[href^="#"]')];
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });
  }

  /* ---------- トップへボタン ---------- */
  const toTop = document.querySelector('.to-top');
  const onScroll = () => toTop.classList.toggle('show', window.scrollY > 700);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- スクロールでふわっと表示 ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  /* ---------- 商品の絞り込み・並び替え ---------- */
  const chips = document.querySelectorAll('.chip');
  const sortSel = document.getElementById('sort');
  const countEl = document.querySelector('.result-count');
  let filter = 'all';
  function applyList() {
    const sorters = {
      recommend: (a, b) => cards[a].dataset.order - cards[b].dataset.order,
      priceAsc: (a, b) => PRODUCTS[a].price - PRODUCTS[b].price,
      priceDesc: (a, b) => PRODUCTS[b].price - PRODUCTS[a].price,
      reviews: (a, b) => PRODUCTS[b].reviews - PRODUCTS[a].reviews
    };
    let shown = 0;
    [...listIds].sort(sorters[sortSel.value] || sorters.recommend).forEach(id => {
      const el = cards[id];
      const show = filter === 'all' || el.dataset.cat.split(' ').includes(filter);
      el.classList.toggle('is-hidden', !show);
      if (show) { el.classList.add('in'); shown++; }
      grid.appendChild(el); // 並び順どおりに付け直す
    });
    countEl.textContent = `${shown}件の商品`;
  }
  function setFilter(f) {
    filter = f;
    chips.forEach(c => {
      const on = c.dataset.filter === f;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });
    applyList();
  }
  chips.forEach(chip => chip.addEventListener('click', () => setFilter(chip.dataset.filter)));
  sortSel.addEventListener('change', applyList);
  // カテゴリーの丸アイコン → 絞り込んだ状態で商品一覧へ
  document.querySelectorAll('[data-filter-link]').forEach(a => a.addEventListener('click', () => setFilter(a.dataset.filterLink)));
  countEl.textContent = `${listIds.length}件の商品`;

  /* ---------- 使い方タブ ---------- */
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
      document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
    });
  }));

  /* ---------- トースト ---------- */
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  /* ---------- フォーカスを閉じ込める（カート・メニュー用） ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  function trapFocus(container, e) {
    const els = [...container.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- カート ----------
     実際に販売するときは BASE / STORES / Shopify などのカートと連携してください。 */
  const drawer = document.getElementById('cart');
  const itemsEl = drawer.querySelector('.cart-items');
  const countEls = document.querySelectorAll('.cart-count');
  const countText = drawer.querySelector('.cart-count-text');
  const subtotalEl = drawer.querySelector('.cart-subtotal');
  const shippingEl = drawer.querySelector('.cart-shipping');
  const totalEl = drawer.querySelector('.cart-total');
  const shipText = drawer.querySelector('.ship-text');
  const shipFill = drawer.querySelector('.ship-fill');
  const upsell = drawer.querySelector('.upsell');
  const upsellItem = upsell.querySelector('.upsell-item');

  let cart = loadCart();

  function addToCart(id, qty = 1) {
    const found = cart.find(i => i.id === id);
    if (found) found.qty = Math.min(99, found.qty + qty); else cart.push({ id, qty });
    saveCart(cart); render();
    countEls.forEach(el => { el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 300); });
    showToast(`「${PRODUCTS[id].short}」をカートに追加しました`);
  }

  // 送料無料まで足りない金額を埋められる、カートに入っていない商品を1つ選ぶ
  function pickUpsell(rest) {
    const inCart = new Set(cart.map(i => i.id));
    const cands = listIds.filter(id => !inCart.has(id));
    if (!cands.length) return null;
    const enough = cands.filter(id => PRODUCTS[id].price >= rest).sort((a, b) => PRODUCTS[a].price - PRODUCTS[b].price);
    return enough[0] || cands.sort((a, b) => PRODUCTS[b].price - PRODUCTS[a].price)[0];
  }

  function render() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const t = calc(cart);
    countEls.forEach(el => el.textContent = count);
    countText.textContent = `(${count})`;
    subtotalEl.textContent = yen(t.subtotal);
    shippingEl.textContent = !cart.length ? '—' : t.shipping ? yen(t.shipping) : '無料';
    totalEl.textContent = yen(t.total);
    drawer.classList.toggle('is-empty', cart.length === 0);

    const rest = t.freeShip ? 0 : FREE_SHIP - t.subtotal;
    shipText.innerHTML = rest > 0
      ? `あと <strong>${yen(rest)}</strong> で送料無料`
      : '<strong>送料無料</strong>の対象です ✓';
    shipFill.style.width = (t.freeShip ? 100 : Math.min(100, (t.subtotal / FREE_SHIP) * 100)) + '%';

    const pick = cart.length && rest > 0 ? pickUpsell(rest) : null;
    upsell.hidden = !pick;
    if (pick) {
      const p = PRODUCTS[pick];
      upsellItem.innerHTML = `<img src="${p.img}" alt=""><div><p class="up-name"></p><p class="up-price">${yen(p.price)} <small>${p.size}</small></p></div><button type="button" class="btn btn-line up-add">追加</button>`;
      upsellItem.querySelector('.up-name').textContent = p.short;
      upsellItem.querySelector('.up-add').addEventListener('click', () => addToCart(pick));
    }

    itemsEl.innerHTML = '';
    cart.forEach(item => {
      const p = PRODUCTS[item.id];
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <img src="${p.img}" alt="">
        <div>
          <h4></h4>
          <p class="ci-price">${yen(p.price)} <small>${p.size}</small></p>
          <div class="qty">
            <button type="button" data-act="dec" aria-label="数量を減らす">−</button>
            <span>${item.qty}</span>
            <button type="button" data-act="inc" aria-label="数量を増やす">＋</button>
          </div>
        </div>
        <button type="button" class="ci-remove" data-act="del">削除</button>`;
      li.querySelector('h4').textContent = p.short;
      li.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.act === 'inc') item.qty = Math.min(99, item.qty + 1);
        if (b.dataset.act === 'dec') item.qty--;
        if (b.dataset.act === 'del' || item.qty < 1) cart = cart.filter(i => i !== item);
        saveCart(cart); render();
      }));
      itemsEl.appendChild(li);
    });
  }

  let lastFocus = null;
  function openCart(open) {
    if (open === body.classList.contains('cart-is-open')) return;
    body.classList.toggle('cart-is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    body.classList.toggle('lock', open);
    if (open) { lastFocus = document.activeElement; drawer.querySelector('[data-close]').focus(); }
    else if (lastFocus) { lastFocus.focus(); lastFocus = null; }
  }

  // 「カートに入れる」「購入する」ボタン（商品カード・ギフト欄など、ページ内すべて）
  document.addEventListener('click', e => {
    const add = e.target.closest('[data-add]');
    if (add) return addToCart(add.dataset.add);
    const buy = e.target.closest('[data-buy]');
    if (buy) return buyNow(buy.dataset.buy);
    const q = e.target.closest('[data-qv]');
    if (q) return openQuickView(q.dataset.qv);
  });
  document.querySelector('.cart-open').addEventListener('click', () => openCart(true));
  document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => openCart(false)));
  drawer.querySelector('.checkout').addEventListener('click', () => {
    if (!cart.length) return showToast('カートに商品がありません');
    location.href = 'checkout.html';
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { openCart(false); setNav(false); }
    if (e.key === 'Tab') {
      if (body.classList.contains('cart-is-open')) trapFocus(drawer, e);
      else if (body.classList.contains('nav-open')) trapFocus(document.querySelector('.site-header'), e);
    }
  });
  // 別のタブや購入ページでカートが変わったら反映
  window.addEventListener('storage', e => { if (e.key === 'rl-cart') { cart = loadCart(); render(); } });
  window.addEventListener('pageshow', () => { cart = loadCart(); render(); });
  render();

  /* ---------- 商品詳細（クイックビュー） ---------- */
  const qv = document.getElementById('quickview');
  let qvId = null, qvQty = 1;
  const qvQtyEl = qv.querySelector('.qv-qty span');
  function openQuickView(id) {
    const p = PRODUCTS[id];
    if (!p || typeof qv.showModal !== 'function') return;
    qvId = id; qvQty = 1; qvQtyEl.textContent = '1';
    const img = qv.querySelector('.qv-media img');
    img.src = p.img; img.alt = p.alt || p.name;
    qv.querySelector('.qv-cat').textContent = `${p.en} ／ ${p.size}`;
    qv.querySelector('.qv-title').textContent = p.name;
    const rating = qv.querySelector('.qv-rating');
    rating.hidden = !p.rating;
    if (p.rating) {
      rating.style.setProperty('--r', p.rating);
      rating.setAttribute('aria-label', `5点中${p.rating}点、レビュー${p.reviews}件`);
      rating.querySelector('small').textContent = `${p.rating} (${p.reviews}件のレビュー)`;
    }
    qv.querySelector('.qv-price').innerHTML = `${yen(p.price)}<small>税込</small>`;
    qv.querySelector('.qv-desc').textContent = p.desc;
    const ing = qv.querySelector('.qv-ing');
    ing.innerHTML = '';
    p.ing.forEach(t => { const li = document.createElement('li'); li.textContent = t; ing.appendChild(li); });
    qv.querySelector('.qv-acc summary').textContent = p.cat === 'gift' ? 'セット内容' : '主な成分';
    qv.querySelector('.qv-how').textContent = p.how;
    qv.querySelector('.qv-spec').textContent = p.spec;
    qv.querySelector('.qv-ship').textContent = p.freeShip
      ? '送料無料 ／ ギフト包装無料'
      : `${yen(FREE_SHIP)}以上で送料無料 ／ ギフト包装無料`;
    qv.showModal();
    body.classList.add('lock');
  }
  qv.addEventListener('close', () => body.classList.remove('lock'));
  qv.querySelector('.qv-close').addEventListener('click', () => qv.close());
  qv.addEventListener('click', e => { if (e.target === qv) qv.close(); }); // 背景クリックで閉じる
  qv.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => {
    qvQty = Math.max(1, Math.min(10, qvQty + Number(b.dataset.q)));
    qvQtyEl.textContent = qvQty;
  }));
  qv.querySelector('.qv-add').addEventListener('click', () => { addToCart(qvId, qvQty); qv.close(); });
  qv.querySelector('.qv-buynow').addEventListener('click', () => buyNow(qvId, qvQty));

  /* ---------- お問い合わせフォーム（デモ） ---------- */
  const form = document.getElementById('contactForm');
  const msg = form.querySelector('.form-msg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(f => {
      const valid = f.value.trim() !== '' && f.checkValidity();
      f.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    msg.className = 'form-msg ' + (ok ? 'ok' : 'err');
    msg.textContent = ok
      ? 'お問い合わせありがとうございます。2営業日以内にご連絡いたします。'
      : '未入力または正しくない項目があります。';
    if (ok) form.reset();
  });

  /* ---------- ニュースレター（デモ） ---------- */
  const nl = document.getElementById('nlForm');
  nl.addEventListener('submit', e => {
    e.preventDefault();
    const input = nl.querySelector('input');
    const valid = input.value.trim() !== '' && input.checkValidity();
    input.classList.toggle('invalid', !valid);
    if (!valid) return showToast('メールアドレスを正しく入力してください');
    showToast('ご登録ありがとうございます！');
    nl.reset();
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
