// --- State ---
const state = {
  products: [],
  viewProducts: [],
  cart: [],
  delivery: 50,
  shipping: 80,
  coupon: null,
  balance: 0,
};

// --- Utils ---
const fmt = (n) => Math.round(n);
const saveBalance = () => localStorage.setItem('smartshop_balance', String(state.balance));
const loadBalance = () => Number(localStorage.getItem('smartshop_balance') ?? '1000');
const clamp6 = (arr) => arr.slice(0, 6);

// --- Theme Toggle ---
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') document.documentElement.classList.add('dark');
themeIcon.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeIcon.textContent = isDark ? '☀️' : '🌙';
});

// --- Mobile menu ---
document.getElementById('menuBtn').addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.toggle('hidden');
});

// --- Active link highlight on scroll ---
const sections = ['home','products','reviews','contact'];
const links = [...document.querySelectorAll('[data-link]')];
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.id;
      links.forEach(a => {
        const on = a.getAttribute('href') === `#${id}`;
        a.classList.toggle('text-brand-600', on);
        a.classList.toggle('font-semibold', on);
      })
    }
  })
}, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
sections.forEach(id => {
  const el = document.getElementById(id);
  if (el) obs.observe(el);
});

// --- Banner carousel ---
const banners = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1600&auto=format&fit=crop'
];
let bIndex = 0;
const bannerImg = document.getElementById('bannerImg');
const cycleBanner = (dir=1) => {
  bIndex = (bIndex + dir + banners.length) % banners.length;
  bannerImg.classList.add('fade-enter');
  requestAnimationFrame(() => bannerImg.classList.add('fade-enter-active'));
  bannerImg.src = banners[bIndex];
  setTimeout(() => bannerImg.classList.remove('fade-enter','fade-enter-active'), 450);
}
document.getElementById('prevBanner').onclick = () => cycleBanner(-1);
document.getElementById('nextBanner').onclick = () => cycleBanner(1);
setInterval(() => cycleBanner(1), 4500);

// --- Fetch products (limit to 6) ---
async function loadProducts() {
  const res = await fetch('https://fakestoreapi.com/products');
  const data = await res.json();
  state.products = data.map(p => ({
    id: p.id,
    title: p.title,
    price: p.price,
    image: p.image,
    rating: p.rating?.rate ?? Math.round(3 + Math.random()*2)
  }));
  state.viewProducts = clamp6(state.products);
  renderProducts();
}

// --- Render products ---
const productGrid = document.getElementById('productGrid');
function renderProducts() {
  productGrid.innerHTML = '';
  state.viewProducts.forEach(p => {
    const card = document.createElement('div');
    card.className = 'rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow hover:shadow-md transition p-3 flex flex-col';
    card.innerHTML = `
      <div class="aspect-square w-full overflow-hidden rounded-xl bg-gray-50 dark:bg-zinc-800">
        <img src="${p.image}" alt="${p.title}" class="w-full h-full object-contain p-4">
      </div>
      <h3 class="mt-2 line-clamp-2 font-semibold">${p.title}</h3>
      <div class="mt-1 text-sm text-gray-500">⭐ ${p.rating} / 5</div>
      <div class="mt-1 font-bold">${fmt(p.price)} BDT</div>
      <button data-add="${p.id}" class="mt-2 px-3 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700">Add to Cart</button>
    `;
    productGrid.appendChild(card);
  });
}

// --- Search / Sort ---
document.getElementById('searchInput').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = state.products.filter(p => p.title.toLowerCase().includes(q));
  state.viewProducts = clamp6(filtered);
  renderProducts();
});
document.getElementById('sortSelect').addEventListener('change', (e) => {
  const val = e.target.value;
  let arr = [...state.viewProducts];
  if (val === 'price-asc') arr.sort((a,b) => a.price-b.price);
  if (val === 'price-desc') arr.sort((a,b) => b.price-a.price);
  if (val === 'rating-desc') arr.sort((a,b) => (b.rating??0)-(a.rating??0));
  state.viewProducts = arr;
  renderProducts();
});

// --- Cart logic ---
const cartList = document.getElementById('cartList');
const subtotalEl = document.getElementById('subtotal');
const deliveryEl = document.getElementById('delivery');
const shippingEl = document.getElementById('shipping');
const discountEl = document.getElementById('discount');
const grandTotalEl = document.getElementById('grandTotal');
const balanceEl = document.getElementById('balance');
const balanceWarn = document.getElementById('balanceWarn');

function addToCart(prod){
  const existing = state.cart.find(i => i.id === prod.id);
  if (existing) existing.qty++;
  else state.cart.push({id: prod.id, title: prod.title, price: prod.price, image: prod.image, qty: 1});
  updateCart();
}
function changeQty(id, delta){
  const item = state.cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter(i => i.id !== id);
  updateCart();
}
function removeItem(id){
  state.cart = state.cart.filter(i => i.id !== id);
  updateCart();
}

function calcTotals(){
  const subtotal = state.cart.reduce((s,i)=> s + i.price * i.qty, 0);
  const delivery = subtotal>0 ? state.delivery : 0;
  const shipping = subtotal>0 ? state.shipping : 0;
  let discount = 0;
  if (state.coupon === 'SMART10') discount = 0.10 * subtotal;
  const total = Math.max(0, subtotal + delivery + shipping - discount);
  return {subtotal, delivery, shipping, discount, total};
}

function updateCart(){
  cartList.innerHTML = '';
  state.cart.forEach(i => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-3';
    row.innerHTML = `
      <img src="${i.image}" alt="${i.title}" class="w-12 h-12 object-contain rounded-lg border border-gray-200 dark:border-zinc-800">
      <div class="flex-1">
        <div class="text-sm font-medium line-clamp-1">${i.title}</div>
        <div class="text-xs text-gray-500">${fmt(i.price)} BDT</div>
      </div>
      <div class="flex items-center gap-2">
        <button class="px-2 rounded-lg border" data-dec="${i.id}">-</button>
        <span>${i.qty}</span>
        <button class="px-2 rounded-lg border" data-inc="${i.id}">+</button>
      </div>
      <button class="ml-2 text-red-600" title="Remove" data-remove="${i.id}">✕</button>
    `;
    cartList.appendChild(row);
  });

  cartList.querySelectorAll('[data-inc]').forEach(btn => btn.onclick = (e)=>changeQty(Number(e.currentTarget.dataset.inc), +1));
  cartList.querySelectorAll('[data-dec]').forEach(btn => btn.onclick = (e)=>changeQty(Number(e.currentTarget.dataset.dec), -1));
  cartList.querySelectorAll('[data-remove]').forEach(btn => btn.onclick = (e)=>removeItem(Number(e.currentTarget.dataset.remove)));

  const {subtotal, delivery, shipping, discount, total} = calcTotals();
  subtotalEl.textContent = fmt(subtotal);
  deliveryEl.textContent = fmt(delivery);
  shippingEl.textContent = fmt(shipping);
  discountEl.textContent = fmt(discount);
  grandTotalEl.textContent = fmt(total);

  balanceWarn.classList.toggle('hidden', total <= state.balance);
}

// Global add-to-cart
productGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  const id = Number(btn.dataset.add);
  const prod = state.products.find(p => p.id === id);
  if (!prod) return;

  // Predict total if we add one
  const tempCart = JSON.parse(JSON.stringify(state.cart));
  const existing = tempCart.find(i => i.id === id);
  if (existing) existing.qty++; else tempCart.push({id: id, title: prod.title, price: prod.price, image: prod.image, qty: 1});
  const subtotal = tempCart.reduce((s,i)=> s + i.price * i.qty, 0);
  const delivery = subtotal>0 ? state.delivery : 0;
  const shipping = subtotal>0 ? state.shipping : 0;
  let discount = state.coupon==='SMART10' ? 0.10 * subtotal : 0;
  const wouldTotal = Math.max(0, subtotal + delivery + shipping - discount);

  if (wouldTotal > state.balance) {
    balanceWarn.classList.remove('hidden');
    document.querySelector('#checkoutBtn').classList.add('animate-pulse');
    setTimeout(()=>document.querySelector('#checkoutBtn').classList.remove('animate-pulse'), 600);
    return;
  }
  addToCart(prod);
});

// Coupon
document.getElementById('applyCoupon').addEventListener('click', () => {
  const code = document.getElementById('coupon').value.trim().toUpperCase();
  state.coupon = code === 'SMART10' ? 'SMART10' : null;
  updateCart();
  alert(state.coupon ? 'Coupon applied: 10% off' : 'Invalid coupon');
});

// Balance controls
const balanceElInit = () => { document.getElementById('balance').textContent = fmt(state.balance); }
document.getElementById('addMoney').addEventListener('click', () => {
  state.balance += 1000;
  saveBalance();
  balanceElInit();
  updateCart();
});
document.getElementById('resetBalance').addEventListener('click', () => {
  state.balance = 1000;
  saveBalance();
  balanceElInit();
  updateCart();
});

document.getElementById('checkoutBtn').addEventListener('click', () => {
  const { total } = calcTotals();
  if (total === 0) { alert('Your cart is empty.'); return; }
  if (total > state.balance) { alert('Insufficient balance. Please add money.'); return; }
  state.balance -= total;
  saveBalance();
  balanceElInit();
  alert(`Payment successful! Paid ${fmt(total)} BDT.`);
  state.cart = [];
  updateCart();
});

// --- Reviews carousel ---
const reviewTrack = document.getElementById('reviewTrack');
let reviews = [];
let rIndex = 0;
async function loadReviews(){
  try {
    const res = await fetch('reviews.json');
    const parsed = await res.json();
    reviews = parsed.reviews ?? [];
  } catch(e) {
    reviews = [];
  }
  renderReviews();
}
function renderReviews(){
  reviewTrack.innerHTML = '';
  reviews.forEach(rv => {
    const card = document.createElement('div');
    card.className = 'min-w-full p-6';
    card.innerHTML = `
      <div class="rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900 shadow">
        <div class="flex items-center justify-between mb-1">
          <div class="font-semibold">${rv.name}</div>
          <div class="text-sm text-gray-500">${rv.date}</div>
        </div>
        <div class="text-amber-500 mb-2">${'★'.repeat(rv.rating)}${'☆'.repeat(5-rv.rating)}</div>
        <p class="text-sm">${rv.comment}</p>
      </div>`;
    reviewTrack.appendChild(card);
  });
  jumpToReview(0);
}
function jumpToReview(idx){
  if (reviews.length === 0) return;
  rIndex = (idx + reviews.length) % reviews.length;
  reviewTrack.style.transform = `translateX(-${rIndex*100}%)`;
}
document.getElementById('prevReview').onclick = () => jumpToReview(rIndex-1);
document.getElementById('nextReview').onclick = () => jumpToReview(rIndex+1);
setInterval(() => jumpToReview(rIndex+1), 5000);

// --- Init ---
(async function init(){
  state.balance = loadBalance();
  balanceElInit();
  await loadProducts();
  await loadReviews();
})();
