const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const money = (n) => "Rp " + n.toLocaleString("id-ID");

// --- GET /api/products -----------------------------------------------
// Kembalikan seluruh katalog. Stok yang dikirim SELALU dari file db,
// jadi kalau dua orang buka website bersamaan, stoknya konsisten.
app.get("/api/products", (req, res) => {
  const { products } = db.read();
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const { products } = db.read();
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Produk tidak ditemukan" });
  res.json(product);
});

// --- GET /api/orders ---------------------------------------------------
app.get("/api/orders", (req, res) => {
  const { orders } = db.read();
  res.json(orders.slice(0, 20));
});

// --- POST /api/orders ---------------------------------------------------
// Body: { buyer, address, payment, items: [{ id, qty }] }
// Validasi stok di server (bukan cuma di UI), lalu kurangi stok beneran
// di file db dan simpan order-nya. Ini bedanya dari versi localStorage:
// state final ditentukan server, bukan browser klien.
app.post("/api/orders", (req, res) => {
  const { buyer, address, payment, items } = req.body || {};

  if (!buyer || !String(buyer).trim()) {
    return res.status(400).json({ error: "Nama penerima wajib diisi" });
  }
  if (!address || !String(address).trim()) {
    return res.status(400).json({ error: "Alamat pengiriman wajib diisi" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Keranjang masih kosong" });
  }

  const data = db.read();

  // Validasi stok untuk setiap item sebelum menyentuh apa pun
  for (const item of items) {
    const product = data.products.find((p) => p.id === item.id);
    if (!product) {
      return res.status(400).json({ error: `Produk #${item.id} tidak ditemukan` });
    }
    if (item.qty < 1 || item.qty > product.stock) {
      return res.status(409).json({
        error: `Stok ${product.name} tidak mencukupi (sisa ${product.stock})`,
      });
    }
  }

  // Semua item valid → potong stok & hitung total
  let subtotal = 0;
  const orderItems = items.map((item) => {
    const product = data.products.find((p) => p.id === item.id);
    product.stock -= item.qty;
    subtotal += product.price * item.qty;
    return {
      id: product.id,
      name: product.name,
      icon: product.icon,
      qty: item.qty,
      price: product.price,
    };
  });

  const shipping = 15000;
  const order = {
    id: "SH" + String(data.nextOrderSeq).padStart(5, "0"),
    date: new Date().toISOString(),
    buyer: String(buyer).trim(),
    address: String(address).trim(),
    payment: payment || "Transfer bank (simulasi)",
    items: orderItems,
    subtotal,
    shipping,
    total: subtotal + shipping,
    status: "Diproses",
  };

  data.nextOrderSeq += 1;
  data.orders.unshift(order);
  db.write(data).then(() => {
    res.status(201).json({ order, formattedTotal: money(order.total) });
  }).catch((err) => {
    console.error(err);
    res.status(500).json({ error: "Gagal menyimpan pesanan, coba lagi." });
  });
});

// Vercel menjalankan Express sebagai serverless backend.
// Saat dijalankan lokal, server tetap listen seperti biasa.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`ShopHub backend jalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
