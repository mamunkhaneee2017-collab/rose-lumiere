// Rosé Lumière — products.js
// 商品データとカートの共通処理。トップページ（main.js）と購入ページ（checkout.js）の両方で使います。
//
// ■ 商品を追加するとき
//   PRODUCTS に1件追加するだけで、商品一覧・詳細・カート・購入ページすべてに反映されます。
//   cat … 'hair'（ヘアケア）/ 'body'（ボディケア）/ 'hair body'（両方）/ 'gift'（一覧には出さない）
//   badge … 'Best Seller' / 'New' / 'Limited' など（不要なら null）
//   ※ 容量・成分・使い方などはサンプル文です。実際の商品情報に差し替えてください。

window.RL = (function () {
  const FREE_SHIP = 5000; // 送料無料になる金額（税込）
  const SHIPPING = 550;   // 送料（税込）
  const COD_FEE = 330;    // 代引き手数料（税込）
  const COUPONS = { ROSE10: { rate: 0.1, label: '初回10%OFF' } }; // デモ用クーポン

  const PRODUCTS = {
    conditioner: {
      name: 'ローズ ヘア＆ボディ コンディショナー', short: 'ヘア＆ボディ コンディショナー', en: 'Hair & Body Conditioner',
      cat: 'hair body', badge: 'Best Seller', price: 3300, size: '300mL', rating: 4.9, reviews: 128,
      img: 'images/product-conditioner.jpg', alt: 'ピンクのチューブとバラ',
      lead: '髪にも肌にも使える、ブランドを代表するオールインワン。',
      desc: '髪にはトリートメントとして、肌にはボディミルクとして使える、ブランドを代表するオールインワン。ダマスクローズの上品な香りが、お風呂上がりまでふんわり続きます。',
      ing: ['ダマスクローズ水（整肌）', 'ホホバオイル（保湿）', 'シアバター（保護）'],
      how: '髪：シャンプー後、毛先を中心になじませ1〜2分おいてすすぎます。\n肌：入浴後、手のひらで温めて全身にのばします。',
      spec: '容量 300mL ／ 香り：ダマスクローズ ／ 日本製\nお肌に異常が生じていないかよく注意してご使用ください。'
    },
    shampoo: {
      name: 'ローズ ジェントル シャンプー', short: 'ジェントル シャンプー', en: 'Gentle Shampoo',
      cat: 'hair', badge: null, price: 2970, size: '300mL', rating: 4.8, reviews: 86,
      img: 'images/product-shampoo.jpg', alt: '透明なポンプボトル',
      lead: 'アミノ酸系の洗浄成分で、頭皮の潤いを守りながらやさしく洗う。',
      desc: 'アミノ酸系の洗浄成分で、頭皮の潤いを守りながらやさしく洗い上げます。きしみにくく、指どおりのよい髪へ。',
      ing: ['アミノ酸系洗浄成分', 'ダマスクローズ水（整肌）', 'アルガンオイル（保湿）'],
      how: '髪全体を十分に濡らし、適量を泡立てて指の腹で頭皮をマッサージするように洗い、しっかりすすぎます。',
      spec: '容量 300mL ／ 香り：ダマスクローズ ／ 日本製\n目に入ったときは、すぐに洗い流してください。'
    },
    bodybutter: {
      name: 'ローズ リッチ ボディバター', short: 'リッチ ボディバター', en: 'Body Butter',
      cat: 'body', badge: 'New', price: 3850, size: '120g', rating: 4.9, reviews: 42,
      img: 'images/product-bodybutter.jpg', alt: 'ピンクのクリームジャー',
      lead: 'シアバター配合の濃密クリーム。乾燥が気になる部分に。',
      desc: 'シアバターをたっぷり配合した濃密クリーム。体温でとろけてなじみ、ひじ・ひざ・かかとなど乾燥が気になる部分をしっとり保護します。',
      ing: ['シアバター（保護）', 'ホホバオイル（保湿）', 'ダマスクローズ水（整肌）'],
      how: '入浴後、肌が湿っているうちに適量を手に取り、乾燥が気になる部分にやさしくなじませます。',
      spec: '容量 120g ／ 香り：ダマスクローズ ／ 日本製\n傷やはれもの等、異常のある部位にはお使いにならないでください。'
    },
    hairoil: {
      name: 'ローズ シルキー ヘアオイル', short: 'シルキー ヘアオイル', en: 'Hair Oil',
      cat: 'hair', badge: null, price: 2750, size: '50mL', rating: 4.7, reviews: 64,
      img: 'images/product-hairoil.jpg', alt: '茶色のガラスボトル',
      lead: 'ホホバ＆アルガンオイルで、毛先までツヤとまとまりを。',
      desc: 'ホホバ＆アルガンオイルが髪の内側まで潤いを届け、毛先までツヤとまとまりを。ドライヤーの熱から髪を守ります。',
      ing: ['アルガンオイル（保湿）', 'ホホバオイル（保湿）', 'ローズ精油（香り）'],
      how: 'タオルドライ後、1〜2プッシュを手のひらにのばし、毛先を中心になじませてから乾かします。乾いた髪の仕上げにも。',
      spec: '容量 50mL ／ 香り：ダマスクローズ ／ 日本製\n直射日光・高温の場所を避けて保管してください。'
    },
    hairmask: {
      name: 'ローズ ディープ ヘアマスク', short: 'ディープ ヘアマスク', en: 'Deep Hair Mask',
      cat: 'hair', badge: 'New', price: 3080, size: '200g', rating: 4.8, reviews: 37,
      img: 'images/texture.jpg', alt: 'クリームとオイルのテクスチャー',
      lead: '週1〜2回のスペシャルケア。傷んだ毛先を集中補修。',
      desc: 'とろけるような濃厚クリームが、カラーや熱で傷んだ髪を内側から補修。週1〜2回のスペシャルケアで、翌朝の手ざわりが変わります。',
      ing: ['シアバター（保護）', 'アルガンオイル（保湿）', '加水分解ケラチン（補修）'],
      how: 'シャンプー後、軽く水気を切って毛先を中心になじませ、5分ほどおいてからしっかりすすぎます。',
      spec: '容量 200g ／ 香り：ダマスクローズ ／ 日本製\n頭皮への使用は避け、毛先を中心にお使いください。'
    },
    hairmist: {
      name: 'ローズ モイスト ヘアミスト', short: 'モイスト ヘアミスト', en: 'Hair Mist',
      cat: 'hair', badge: null, price: 2420, size: '150mL', rating: 4.6, reviews: 29,
      img: 'images/cat-hair.jpg', alt: '長い髪の後ろ姿',
      lead: '朝の寝ぐせ直しや、外出先での香りづけに。',
      desc: 'みずみずしいミストが髪の広がりを抑え、ふんわりローズの香りをまとわせます。朝のスタイリング前や、外出先でのリフレッシュに。',
      ing: ['ダマスクローズ水（整肌）', 'ヒアルロン酸Na（保湿）', 'ローズ精油（香り）'],
      how: '髪から15〜20cmほど離して、全体に数回スプレーします。手ぐしで整えてからスタイリングしてください。',
      spec: '容量 150mL ／ 香り：ダマスクローズ ／ 日本製\n火気の近くでは使用しないでください。'
    },
    handcream: {
      name: 'ローズ ハンドクリーム', short: 'ハンドクリーム', en: 'Hand Cream',
      cat: 'body', badge: 'Best Seller', price: 1980, size: '50g', rating: 4.8, reviews: 152,
      img: 'images/hand-lotion.jpg', alt: 'ハンドクリームを手になじませる様子',
      lead: 'ベタつかず、塗ってすぐスマホも触れる軽いつけ心地。',
      desc: '軽いつけ心地なのに、しっとり感が長続き。ベタつかないので、塗ってすぐにスマホや書類も触れます。ちょっとしたプレゼントにも人気です。',
      ing: ['シアバター（保護）', 'ダマスクローズ水（整肌）', 'グリセリン（保湿）'],
      how: '適量を手の甲に取り、手全体・指先・爪のまわりまでやさしくなじませます。',
      spec: '容量 50g ／ 香り：ダマスクローズ ／ 日本製\n傷やはれもの等、異常のある部位にはお使いにならないでください。'
    },
    bodyoil: {
      name: 'ローズ ボタニカル ボディオイル', short: 'ボタニカル ボディオイル', en: 'Botanical Body Oil',
      cat: 'body', badge: 'Limited', price: 4180, size: '100mL', rating: 4.7, reviews: 31,
      img: 'images/amber-bottles.jpg', alt: '並んだ茶色のガラスボトル',
      lead: 'ローズヒップ＆ホホバ配合。マッサージにも。',
      desc: '植物オイルだけでつくった、さらりとなじむボディオイル。お風呂上がりの濡れた肌にのばせば、潤いを閉じ込めてやわらかな肌へ。マッサージにもおすすめです。',
      ing: ['ローズヒップオイル（保湿）', 'ホホバオイル（保湿）', 'ダマスクローズ油（香り）'],
      how: '入浴後、濡れた肌に数滴をのばし、なじませてからタオルで軽く押さえます。マッサージには手のひらで温めてから。',
      spec: '容量 100mL ／ 香り：ダマスクローズ ／ 日本製 ／ 数量限定\n床に垂れるとすべりやすくなるのでご注意ください。'
    },
    giftset: {
      name: 'トライアル ギフトセット', short: 'トライアル ギフトセット', en: 'Holiday Gift Set',
      cat: 'gift', badge: null, price: 4980, size: 'ミニサイズ4点', rating: null, reviews: 0, freeShip: true,
      img: 'images/gift-set.jpg', alt: 'ギフトボックスとクリームチューブ',
      lead: '人気の4アイテムをミニサイズで。',
      desc: '人気の4アイテムをミニサイズで詰め合わせた、はじめての方にもぴったりのセット。無料ラッピングとメッセージカードでお届けします（送料無料）。',
      ing: ['ヘア＆ボディ コンディショナー 50mL', 'ジェントル シャンプー 50mL', 'リッチ ボディバター 30g', 'シルキー ヘアオイル 10mL'],
      how: '各アイテムの使い方は、同梱のリーフレットをご覧ください。',
      spec: 'ギフトボックス入り ／ 日本製\nラッピング・メッセージカードは無料です。'
    }
  };

  const yen = n => '¥' + Math.round(n).toLocaleString('ja-JP');

  /* ---------- カートの保存（ブラウザ内） ----------
     保存するのは「商品ID」と「数量」だけ。価格は必ず PRODUCTS から取り直します。 */
  const CART_KEY = 'rl-cart';
  function loadCart() {
    let raw = [];
    try { raw = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { raw = []; }
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(i => i && PRODUCTS[i.id] && i.qty > 0)
      .map(i => ({ id: i.id, qty: Math.min(99, Math.floor(i.qty)) }));
  }
  function saveCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart.map(({ id, qty }) => ({ id, qty })))); } catch (e) {}
  }

  /* ---------- 金額の計算（カート・購入ページ共通） ---------- */
  function calc(items, { coupon = null, cod = false } = {}) {
    const subtotal = items.reduce((s, i) => s + PRODUCTS[i.id].price * i.qty, 0);
    const discount = coupon && COUPONS[coupon] ? Math.floor(subtotal * COUPONS[coupon].rate) : 0;
    const freeShip = subtotal >= FREE_SHIP || items.some(i => PRODUCTS[i.id].freeShip);
    const shipping = items.length && !freeShip ? SHIPPING : 0;
    const codFee = items.length && cod ? COD_FEE : 0;
    return { subtotal, discount, shipping, codFee, freeShip, total: subtotal - discount + shipping + codFee };
  }

  /* ---------- 「購入する」ボタン：その商品だけで購入ページへ ---------- */
  function buyNow(id, qty = 1) {
    try { sessionStorage.setItem('rl-buynow', JSON.stringify({ id, qty })); } catch (e) {}
    location.href = 'checkout.html?buy=now';
  }

  return { PRODUCTS, FREE_SHIP, SHIPPING, COD_FEE, COUPONS, yen, loadCart, saveCart, calc, buyNow };
})();
