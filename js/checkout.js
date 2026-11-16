// Rosé Lumière — checkout.js（ご購入手続きページ）
// 流れ：お客様情報の入力 → ご注文内容の確認（最終確認画面）→ 完了
// ※ デモです。実際に販売するときは、決済代行サービス（Stripe・PAY.JP・Shopify など）と連携してください。
//   カード番号はこのページで直接受け取らず、決済代行会社の画面・入力欄で入力してもらうのが安全です。
(function () {
  const { PRODUCTS, FREE_SHIP, COD_FEE, COUPONS, yen, loadCart, saveCart, calc } = window.RL;
  const $ = s => document.querySelector(s);

  /* ---------- 購入する商品 ----------
     「購入する」ボタンから来たとき（?buy=now）はその商品だけ。カートの中身はそのまま残します。 */
  let buyNowMode = false;
  let items = [];
  if (new URLSearchParams(location.search).get('buy') === 'now') {
    try {
      const b = JSON.parse(sessionStorage.getItem('rl-buynow'));
      if (b && PRODUCTS[b.id]) { items = [{ id: b.id, qty: Math.max(1, Math.min(99, b.qty | 0)) }]; buyNowMode = true; }
    } catch (e) {}
  }
  if (!buyNowMode) items = loadCart();

  const saveItems = () => {
    if (buyNowMode) { try { sessionStorage.setItem('rl-buynow', JSON.stringify(items[0] || null)); } catch (e) {} }
    else saveCart(items);
  };

  let coupon = null;
  let step = 'form';

  /* ---------- 都道府県・お届け日の選択肢 ---------- */
  const PREFS = '北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県 茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県 新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県 三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県 鳥取県 島根県 岡山県 広島県 山口県 徳島県 香川県 愛媛県 高知県 福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県'.split(' ');
  const prefSel = document.querySelector('[name="pref"]');
  PREFS.forEach(p => prefSel.add(new Option(p, p)));

  const dateSel = $('#coDate');
  const WD = '日月火水木金土';
  for (let d = 3; d <= 14; d++) { // 最短3日後〜2週間後まで
    const t = new Date(); t.setDate(t.getDate() + d);
    dateSel.add(new Option(`${t.getMonth() + 1}月${t.getDate()}日(${WD[t.getDay()]})`, `${t.getMonth() + 1}月${t.getDate()}日(${WD[t.getDay()]})`));
  }

  /* ---------- 注文内容（右側）の表示 ---------- */
  const form = $('#coForm');
  const payValue = () => form.querySelector('[name="pay"]:checked').value;

  function renderSummary() {
    if (!items.length) {
      $('#coGrid').hidden = true;
      $('#coEmpty').hidden = false;
      return;
    }
    const locked = step !== 'form';
    const list = $('#coItems');
    list.innerHTML = '';
    items.forEach(item => {
      const p = PRODUCTS[item.id];
      const li = document.createElement('li');
      li.className = 'co-item';
      li.innerHTML = `
        <span class="co-item-img"><img src="${p.img}" alt=""><b>${item.qty}</b></span>
        <div class="co-item-body">
          <p class="co-item-name"></p>
          <p class="co-item-meta">${p.size} ／ ${yen(p.price)}</p>
          ${locked ? '' : `<div class="qty">
            <button type="button" data-act="dec" aria-label="数量を減らす">−</button>
            <span>${item.qty}</span>
            <button type="button" data-act="inc" aria-label="数量を増やす">＋</button>
          </div><button type="button" class="ci-remove" data-act="del">削除</button>`}
        </div>
        <p class="co-item-price">${yen(p.price * item.qty)}</p>`;
      li.querySelector('.co-item-name').textContent = p.short;
      li.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.act === 'inc') item.qty = Math.min(99, item.qty + 1);
        if (b.dataset.act === 'dec') item.qty--;
        if (b.dataset.act === 'del' || item.qty < 1) items = items.filter(i => i !== item);
        saveItems(); renderSummary();
      }));
      list.appendChild(li);
    });

    const t = calc(items, { coupon, cod: payValue() === 'cod' });
    const rows = [
      ['小計', yen(t.subtotal)],
      t.discount ? [`クーポン（${COUPONS[coupon].label}）`, '−' + yen(t.discount), 'co-discount'] : null,
      ['送料', t.shipping ? yen(t.shipping) : '無料'],
      t.codFee ? ['代引き手数料', yen(t.codFee)] : null
    ].filter(Boolean);
    $('#coTotals').innerHTML = rows.map(([k, v, c]) => `<div class="${c || ''}"><dt>${k}</dt><dd>${v}</dd></div>`).join('')
      + `<div class="grand"><dt>合計<small>（税込）</small></dt><dd>${yen(t.total)}</dd></div>`;
    document.querySelector('.co-sum-total').textContent = yen(t.total);
    $('#coShipNote').textContent = t.freeShip
      ? '送料無料の対象です ✓'
      : `あと ${yen(FREE_SHIP - t.subtotal)} のお買い上げで送料無料`;
    $('#coBuyNowTag').hidden = !buyNowMode;
    $('#coCoupon').hidden = locked && !coupon;
    $('#coCouponInput').disabled = locked;
    $('#coCoupon button').disabled = locked;
    return t;
  }

  /* ---------- スマホ：注文内容の開閉 ---------- */
  const sumToggle = document.querySelector('.co-sum-toggle');
  sumToggle.addEventListener('click', () => {
    const open = sumToggle.getAttribute('aria-expanded') !== 'true';
    sumToggle.setAttribute('aria-expanded', String(open));
    sumToggle.querySelector('span').textContent = open ? 'ご注文内容を隠す' : 'ご注文内容を表示';
    document.querySelector('.co-summary').classList.toggle('open', open);
  });

  /* ---------- クーポン ---------- */
  $('#coCoupon').addEventListener('submit', e => {
    e.preventDefault();
    const code = $('#coCouponInput').value.trim().toUpperCase();
    const msg = $('#coCouponMsg');
    if (!code) { msg.textContent = ''; return; }
    if (COUPONS[code]) {
      coupon = code;
      msg.className = 'co-coupon-msg ok';
      msg.textContent = `クーポン「${code}」を適用しました`;
    } else {
      coupon = null;
      msg.className = 'co-coupon-msg err';
      msg.textContent = 'このクーポンコードはご利用いただけません';
    }
    renderSummary();
  });

  /* ---------- 入力チェック ---------- */
  const fields = [...form.querySelectorAll('input[required], select[required], input[pattern]')];
  function checkField(f) {
    const v = f.value.trim();
    const ok = (!f.required || v !== '') && (v === '' || f.checkValidity());
    f.closest('.co-field').classList.toggle('is-invalid', !ok);
    f.setAttribute('aria-invalid', String(!ok));
    return ok;
  }
  let triedSubmit = false;
  fields.forEach(f => {
    f.addEventListener('blur', () => { if (f.value.trim() || triedSubmit) checkField(f); });
    f.addEventListener('input', () => { if (f.closest('.is-invalid')) checkField(f); });
  });
  // 全角数字・全角ハイフンを半角に（郵便番号・電話番号）
  form.querySelectorAll('[name="zip"], [name="tel"]').forEach(f => f.addEventListener('blur', () => {
    f.value = f.value.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/[ー－‐−]/g, '-').trim();
    if (f.value.trim() || triedSubmit) checkField(f);
  }));

  form.querySelectorAll('[name="pay"]').forEach(r => r.addEventListener('change', renderSummary));

  const giftCb = $('#coGift');
  giftCb.addEventListener('change', () => { $('#coGiftBox').hidden = !giftCb.checked; });
  const msgArea = form.querySelector('[name="message"]');
  msgArea.addEventListener('input', () => { $('#coMsgCount').textContent = msgArea.value.length; });

  /* ---------- 画面の切り替え ---------- */
  const steps = document.querySelectorAll('.co-steps li[data-step]');
  function setStep(s) {
    step = s;
    const order = ['form', 'review', 'done'];
    steps.forEach(li => {
      const i = order.indexOf(li.dataset.step), cur = order.indexOf(s);
      li.classList.toggle('done', i < cur);
      li.classList.toggle('current', i === cur);
      if (i === cur) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    form.hidden = s !== 'form';
    $('#coReview').hidden = s !== 'review';
    $('#coGrid').hidden = s === 'done';
    $('#coDone').hidden = s !== 'done';
    renderSummary();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const PAY_LABEL = {
    card: ['クレジットカード', 'ご注文確定時にお支払いが確定します。'],
    konbini: ['コンビニ払い', 'ご注文から7日以内にお支払いください。ご入金確認後に発送します。'],
    cod: ['代金引換', `商品お受け取り時にお支払いください（手数料 ${yen(COD_FEE)} を含みます）。`],
    bank: ['銀行振込（前払い）', 'ご注文から7日以内にお振込みください。ご入金確認後に発送します。']
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    triedSubmit = true;
    const bad = fields.filter(f => !checkField(f));
    const err = form.querySelector('.co-form-err');
    if (bad.length) {
      err.textContent = `入力内容をご確認ください（${bad.length}件）`;
      bad[0].focus();
      bad[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    err.textContent = '';
    buildReview();
    setStep('review');
    setTimeout(() => $('#reviewTitle').focus({ preventScroll: true }), 50);
  });

  function buildReview() {
    const d = Object.fromEntries(new FormData(form));
    const t = calc(items, { coupon, cod: d.pay === 'cod' });
    const [payName, payWhen] = PAY_LABEL[d.pay];
    const prepaid = d.pay === 'konbini' || d.pay === 'bank';
    const rows = [
      ['ご注文商品', items.map(i => `${PRODUCTS[i.id].short}（${PRODUCTS[i.id].size}）× ${i.qty}　${yen(PRODUCTS[i.id].price * i.qty)}`).join('\n')],
      ['お支払い総額（税込）', `${yen(t.total)}\n（小計 ${yen(t.subtotal)}${t.discount ? ` − 割引 ${yen(t.discount)}` : ''} ＋ 送料 ${t.shipping ? yen(t.shipping) : '無料'}${t.codFee ? ` ＋ 代引き手数料 ${yen(t.codFee)}` : ''}）`],
      ['お支払い方法・時期', `${payName}\n${payWhen}`],
      ['お届け先', `〒${d.zip}　${d.pref}${d.address}${d.building ? ' ' + d.building : ''}\n${d.lastName} ${d.firstName} 様　TEL ${d.tel}`],
      ['ご連絡先メール', d.email],
      ['お届け予定', `${d.date || (prepaid ? 'ご入金確認後、2〜4営業日で発送' : 'ご注文から2〜4営業日で発送')}${d.time ? '　' + d.time : ''}`],
      ['ギフト包装', d.gift ? `あり（無料）${d.message ? '\nメッセージ：' + d.message : ''}${d.hidePrice ? '\n納品書に金額を記載しない' : ''}` : 'なし']
    ];
    const dl = $('#coReviewList');
    dl.innerHTML = '';
    rows.forEach(([k, v]) => {
      const wrap = document.createElement('div');
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      wrap.append(dt, dd); dl.appendChild(wrap);
    });
  }

  $('#coEdit').addEventListener('click', () => setStep('form'));

  $('#coPlace').addEventListener('click', () => {
    const agreeErr = $('#coAgreeErr');
    if (!$('#coAgree').checked) { agreeErr.textContent = '規約への同意が必要です'; $('#coAgree').focus(); return; }
    agreeErr.textContent = '';
    const btn = $('#coPlace');
    btn.disabled = true; btn.textContent = '処理中…'; // 二重注文を防ぐ

    setTimeout(() => { // デモ：実際はここで注文データをサーバー・決済サービスへ送ります
      const now = new Date();
      const no = `RL-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      $('#coOrderNo').textContent = no;
      const email = form.querySelector('[name="email"]').value;
      $('#coDoneText').textContent = `ご注文確認メールを ${email} 宛にお送りしました。発送の準備が整いましたら、改めてご連絡いたします。`;
      if (buyNowMode) { try { sessionStorage.removeItem('rl-buynow'); } catch (e) {} }
      else saveCart([]);
      setStep('done');
      setTimeout(() => $('#doneTitle').focus({ preventScroll: true }), 50);
    }, 900);
  });

  renderSummary();
})();
