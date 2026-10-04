const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const loadCart = async (userId) => {
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { upsert: true, new: true }
  ).populate('items.product', 'name price images stock isActive');
  return cart;
};

const withTotals = (cart) => {
  const items = cart.items.filter((i) => i.product);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  return { id: cart._id, items, subtotal: Math.round(subtotal * 100) / 100 };
};

exports.getCart = asyncHandler(async (req, res) => {
  res.json({ success: true, cart: withTotals(await loadCart(req.user._id)) });
});

exports.addItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const quantity = parseInt(req.body.quantity) || 1;
  if (quantity < 1) throw new AppError('Quantity must be at least 1', 400);

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new AppError('Product not found', 404);

  const cart = await loadCart(req.user._id);
  const existing = cart.items.find((i) => i.product && i.product._id.equals(productId));
  const newQty = (existing ? existing.quantity : 0) + quantity;
  if (newQty > product.stock) throw new AppError(`Only ${product.stock} in stock`, 400);

  if (existing) existing.quantity = newQty;
  else cart.items.push({ product: productId, quantity });
  await cart.save();

  res.status(201).json({ success: true, cart: withTotals(await loadCart(req.user._id)) });
});

exports.updateItem = asyncHandler(async (req, res) => {
  const quantity = parseInt(req.body.quantity);
  if (!quantity || quantity < 1) throw new AppError('Quantity must be at least 1', 400);

  const cart = await loadCart(req.user._id);
  const item = cart.items.find((i) => i.product && i.product._id.equals(req.params.productId));
  if (!item) throw new AppError('Item not in cart', 404);
  if (quantity > item.product.stock) throw new AppError(`Only ${item.product.stock} in stock`, 400);

  item.quantity = quantity;
  await cart.save();
  res.json({ success: true, cart: withTotals(await loadCart(req.user._id)) });
});

exports.removeItem = asyncHandler(async (req, res) => {
  const cart = await loadCart(req.user._id);
  cart.items = cart.items.filter((i) => !(i.product && i.product._id.equals(req.params.productId)));
  await cart.save();
  res.json({ success: true, cart: withTotals(await loadCart(req.user._id)) });
});

exports.clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.json({ success: true, message: 'Cart cleared' });
});
