// Cart & wishlist tetap disimpan per-browser (localStorage) karena belum
// ada sistem login. Produk & riwayat pesanan datang dari backend lewat
// fetch() ke REST API Express — kontrak API-nya tidak diubah sama sekali,
// yang berubah cuma tampilan.
let products = [];
let cart = JSON.parse(localStorage.getItem("shopHubCart")) || [];
let wishlist = JSON.parse(localStorage.getItem("shopHubWishlist")) || [];
let activeCat = "Semua";

// Foto produk nyata (Unsplash) menggantikan emoji `icon` dari database.
// Dipetakan per-id, dengan fallback per-kategori kalau ada produk baru
// yang belum terdaftar di sini — jadi data/db.json tidak perlu diubah.
const PRODUCT_PHOTOS = {
  1: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop", // Headphone Bluetooth
  2: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop", // Smartwatch Active
  3: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop", // Sneakers Urban
  4: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop", // Lampu Meja LED
  5: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800&auto=format&fit=crop", // Keyboard Mechanical
  6: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop", // Tas Backpack
  7: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop", // Earbuds Wireless
  8: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=800&auto=format&fit=crop", // Kacamata Casual
};
const CATEGORY_FALLBACK_PHOTOS = {
  Elektronik: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
  Fashion: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
  Aksesoris: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
  Rumah: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
};
function photoFor(product) {
  return (
    PRODUCT_PHOTOS[product.id] ||
    CATEGORY_FALLBACK_PHOTOS[product.cat] ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop"
  );
}

const money = (n) => "Rp " + n.toLocaleString("id-ID");
const qtyInCart = (id) => {
  const i = cart.find((x) => x.id === id);
  return i ? i.qty : 0;
};

async function api(path, options) {
  const res = await fetch("/api" + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Terjadi kesalahan pada server");
  return data;
}

async function loadProducts() {
  try {
    products = await api("/products");
    renderHeroPicks();
    renderProducts();
  } catch (err) {
    document.getElementById("productGrid").innerHTML =
      '<div class="empty">Gagal memuat produk dari server. Pastikan backend (npm start) sedang berjalan.</div>';
  }
}

async function loadOrders() {
  try {
    const orders = await api("/orders");
    renderOrders(orders);
  } catch (err) {
    document.getElementById("orderList").innerHTML =
      '<div class="empty">Gagal memuat riwayat pesanan dari server.</div>';
  }
}

function renderHeroPicks() {
  const picks = products.filter((p) => p.best).slice(0, 3);
  document.getElementById("heroPicks").innerHTML = picks
    .map(
      (p) => `
   <div class="pick">
     <img class="pick-thumb" src="${photoFor(p)}" alt="${p.name}" loading="lazy">
     <div><div class="pick-name">${p.name}</div><div class="pick-cat">${p.cat}</div></div>
     <div class="pick-price">${money(p.price)}</div>
   </div>`
    )
    .join("");
}

function renderProducts() {
  const q = document.getElementById("search").value.toLowerCase();
  const sort = document.getElementById("sort").value;
  let data = products.filter(
    (p) =>
      (activeCat === "Semua" || p.cat === activeCat) &&
      (p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q))
  );
  if (sort === "low") data.sort((a, b) => a.price - b.price);
  if (sort === "high") data.sort((a, b) => b.price - a.price);

  document.getElementById("productGrid").innerHTML = data.length
    ? data
        .map((p) => {
          const inCart = qtyInCart(p.id);
          const soldOut = inCart >= p.stock;
          const isWished = wishlist.includes(p.id);
          return `
 <article class="product" data-cat="${p.cat}">
  <div class="product-img">
    <img src="${photoFor(p)}" alt="${p.name}" loading="lazy">
    ${p.best ? '<span class="badge-best">Terlaris</span>' : ""}
    <button class="wish-toggle${isWished ? " active" : ""}" aria-label="${
            isWished ? "Hapus dari favorit" : "Tambah ke favorit"
          }" onclick="toggleWish(${p.id})">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="${
        isWished ? "currentColor" : "none"
      }" stroke="currentColor" stroke-width="2"><path d="M12 20s-7-4.4-9.5-9C.8 7.4 2.7 4 6 4c2 0 3.4 1 4 2.3C10.6 5 12 4 14 4c3.3 0 5.2 3.4 3.5 7-2.5 4.6-9.5 9-9.5 9Z"/></svg>
    </button>
  </div>
  <div class="product-body">
   <span class="product-tag">${p.cat}</span><h3>${p.name}</h3><p>${p.desc}</p>
   <div class="price">${money(p.price)}</div>
   <span class="stock${p.stock - inCart <= 3 ? " low" : ""}">${
            soldOut ? "Stok di keranjang sudah maksimal" : "Stok tersedia: " + (p.stock - inCart)
          }</span>
   <div class="product-actions">
     <button class="outline" onclick="showDetail(${p.id})">Detail</button>
     <button class="btn primary" ${soldOut ? "disabled" : ""} onclick="addToCart(${p.id})">+ Keranjang</button>
   </div>
  </div>
 </article>`;
        })
        .join("")
    : `<div class="empty">Produk tidak ditemukan. Coba kata kunci atau kategori lain.</div>`;
}

function toggleWish(id) {
  wishlist = wishlist.includes(id) ? wishlist.filter((x) => x !== id) : [...wishlist, id];
  localStorage.setItem("shopHubWishlist", JSON.stringify(wishlist));
  document.getElementById("wishCount").textContent = wishlist.length;
  renderProducts();
}

function addToCart(id) {
  const product = products.find((p) => p.id === id);
  const item = cart.find((x) => x.id === id);
  const current = item ? item.qty : 0;
  if (current >= product.stock) {
    notify("Stok " + product.name + " sudah habis di keranjang");
    return;
  }
  if (item) item.qty++;
  else cart.push({ id, qty: 1 });
  saveCart();
  renderCart();
  renderProducts();
  notify(product.name + " ditambahkan ke keranjang");
}

function saveCart() {
  localStorage.setItem("shopHubCart", JSON.stringify(cart));
}

function renderCart() {
  const box = document.getElementById("cartItems");
  if (!cart.length) {
    box.innerHTML = '<div class="empty">Keranjang masih kosong.<br>Yuk pilih produk dulu di katalog.</div>';
  } else {
    box.innerHTML = cart
      .map((item) => {
        const p = products.find((x) => x.id === item.id);
        if (!p) return "";
        const atMax = item.qty >= p.stock;
        return `<div class="cart-row"><img class="cart-thumb" src="${photoFor(p)}" alt="${p.name}" loading="lazy"><div><h4>${p.name}</h4><small>${money(
          p.price
        )} / produk</small>
  <div class="qty">
    <button onclick="changeQty(${p.id},-1)" aria-label="Kurangi jumlah">−</button><b>${item.qty}</b>
    <button onclick="changeQty(${p.id},1)" ${atMax ? "disabled" : ""} aria-label="Tambah jumlah">+</button>
    <button class="remove" onclick="removeItem(${p.id})">Hapus</button>
  </div></div><div class="price">${money(p.price * item.qty)}</div></div>`;
      })
      .join("");
  }
  const subtotal = cart.reduce((s, i) => {
    const p = products.find((x) => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
  const shipping = cart.length ? 15000 : 0;
  document.getElementById("subtotal").textContent = money(subtotal);
  document.getElementById("shipping").textContent = money(shipping);
  document.getElementById("total").textContent = money(subtotal + shipping);
  document.getElementById("cartCount").textContent = cart.reduce((s, i) => s + i.qty, 0);
}

function changeQty(id, delta) {
  const i = cart.find((x) => x.id === id);
  const p = products.find((x) => x.id === id);
  if (!i || !p) return;
  const next = i.qty + delta;
  if (next > p.stock) {
    notify("Stok " + p.name + " tidak mencukupi");
    return;
  }
  i.qty = next;
  if (i.qty <= 0) cart = cart.filter((x) => x.id !== id);
  saveCart();
  renderCart();
  renderProducts();
}

function removeItem(id) {
  cart = cart.filter((x) => x.id !== id);
  saveCart();
  renderCart();
  renderProducts();
  notify("Produk dihapus dari keranjang");
}

function scrollToId(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

function showDetail(id) {
  const p = products.find((x) => x.id === id);
  document.getElementById("detailContent").innerHTML = `<div class="detail-media"><img src="${photoFor(p)}" alt="${p.name}"></div><div class="detail-info">
 <span class="product-tag">${p.cat}</span><h2 id="detailTitle">${p.name}</h2><p class="muted">${p.desc}</p><div class="price">${money(
    p.price
  )}</div>
 <p>Stok tersedia: <b>${p.stock}</b></p><button class="btn primary full" onclick="addToCart(${p.id});closeModal('productModal')">+ Tambahkan ke keranjang</button></div>`;
  document.getElementById("productModal").classList.add("show");
}

function openCheckout() {
  if (!cart.length) return notify("Keranjang masih kosong");
  document.getElementById("checkoutModal").classList.add("show");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("show");
}

function setFieldError(fieldId, message) {
  const el = document.querySelector(`.field-error[data-for="${fieldId}"]`);
  if (el) el.textContent = message || "";
}

document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("buyerName").value.trim();
  const address = document.getElementById("address").value.trim();
  const payment = document.getElementById("payment").value;
  let valid = true;
  setFieldError("buyerName", "");
  setFieldError("address", "");
  if (!name) {
    setFieldError("buyerName", "Nama penerima wajib diisi");
    valid = false;
  }
  if (!address) {
    setFieldError("address", "Alamat pengiriman wajib diisi");
    valid = false;
  }
  if (!valid) return;

  const payBtn = document.getElementById("payBtn");
  payBtn.disabled = true;
  payBtn.textContent = "Memproses…";

  try {
    // Server yang memutuskan valid/tidaknya stok & menyimpan order —
    // bukan cuma dicek di browser.
    const { order } = await api("/orders", {
      method: "POST",
      body: JSON.stringify({
        buyer: name,
        address,
        payment,
        items: cart.map((i) => ({ id: i.id, qty: i.qty })),
      }),
    });
    cart = [];
    saveCart();
    await loadProducts(); // stok terbaru dari server
    renderCart();
    await loadOrders();
    closeModal("checkoutModal");
    e.target.reset();
    notify(`Pesanan ${order.id} berhasil dibuat`);
    document.getElementById("orders").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    notify(err.message, true);
  } finally {
    payBtn.disabled = false;
    payBtn.textContent = "Bayar sekarang";
  }
});

function renderOrders(orders) {
  const box = document.getElementById("orderList");
  box.innerHTML = orders.length
    ? orders
        .slice(0, 5)
        .map(
          (o) => `<div class="order"><div><b>${o.id}</b><br><small>${new Date(o.date).toLocaleDateString(
            "id-ID"
          )} • ${o.buyer}</small></div><div><b>${money(o.total)}</b><br><span class="order-status">${
            o.status
          }</span></div></div>`
        )
        .join("")
    : '<div class="empty">Belum ada transaksi.</div>';
}

function notify(text, isError) {
  const t = document.getElementById("toast");
  t.textContent = text;
  t.classList.toggle("error", !!isError);
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}

document.querySelectorAll(".cat").forEach((btn) =>
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeCat = btn.dataset.cat;
    renderProducts();
  })
);
document.getElementById("search").addEventListener("input", renderProducts);
document.getElementById("sort").addEventListener("change", renderProducts);

// Tema default sekarang GELAP (identitas visual baru). Tombol tema
// beralih ke mode terang sebagai alternatif aksesibilitas, bukan sebaliknya.
document.getElementById("themeBtn").addEventListener("click", () => {
  const light = document.body.classList.toggle("light");
  document.getElementById("themeBtn").setAttribute("aria-pressed", light ? "true" : "false");
  localStorage.setItem("shopHubTheme", light ? "light" : "dark");
});
document.querySelectorAll(".modal").forEach((m) =>
  m.addEventListener("click", (e) => {
    if (e.target === m) m.classList.remove("show");
  })
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") document.querySelectorAll(".modal.show").forEach((m) => m.classList.remove("show"));
});

if (localStorage.getItem("shopHubTheme") === "light") {
  document.body.classList.add("light");
  document.getElementById("themeBtn").setAttribute("aria-pressed", "true");
}

document.getElementById("wishCount").textContent = wishlist.length;
loadProducts();
renderCart();
loadOrders();
