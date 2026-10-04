require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');

const products = [
  { name: 'Wireless Headphones', description: 'Noise-cancelling over-ear headphones', price: 89.99, category: 'Electronics', brand: 'SoundX', stock: 40 },
  { name: 'Mechanical Keyboard', description: 'RGB hot-swappable keyboard', price: 59.5, category: 'Electronics', brand: 'KeyPro', stock: 25 },
  { name: 'Running Shoes', description: 'Lightweight breathable running shoes', price: 74.0, category: 'Fashion', brand: 'Stride', stock: 60 },
  { name: 'Cotton T-Shirt', description: '100% organic cotton tee', price: 15.99, category: 'Fashion', brand: 'Basic', stock: 120 },
  { name: 'Coffee Maker', description: '12-cup programmable coffee maker', price: 49.0, category: 'Home', brand: 'BrewIt', stock: 30 },
  { name: 'JavaScript: The Good Parts', description: 'Classic programming book', price: 22.0, category: 'Books', brand: 'OReilly', stock: 50 },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany(), Product.deleteMany(), Cart.deleteMany(), Order.deleteMany()]);
  if (process.argv.includes('--destroy')) {
    console.log('Data destroyed');
    return process.exit();
  }
  await User.create([
    { name: 'Admin', email: 'admin@example.com', password: 'admin123', role: 'admin' },
    { name: 'Test User', email: 'user@example.com', password: 'user123' },
  ]);
  await Product.insertMany(products);
  console.log('Seeded: admin@example.com / admin123 , user@example.com / user123');
  process.exit();
})().catch((e) => { console.error(e); process.exit(1); });
