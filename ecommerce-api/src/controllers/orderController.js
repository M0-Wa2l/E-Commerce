const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const FREE_SHIPPING_OVER = 100;
const SHIPPING_FEE = 10;
const round2 = (n) => Math.round(n * 100) / 100;

// Valid status transitions (admin)
const TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const restock = (order) =>
  Promise.all(
    order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } }))
  );

// POST /api/orders — builds the order from the user's cart. Prices are read from the DB, never the client.
exports.createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'cod' } = req.body;
  if (!shippingAddress) throw new AppError('Shipping address is required', 400);

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400);

  const reserved = [];
  const orderItems = [];

  try {
    for (const { product, quantity } of cart.items) {
      if (!product || !product.isActive) throw new AppError('A product in your cart is no longer available', 400);

      // Atomic stock decrement: only succeeds if enough stock remains (prevents overselling)
      const updated = await Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } }
      );
      if (!updated) throw new AppError(`Not enough stock for "${product.name}"`, 400);

      reserved.push({ product: product._id, quantity });
      orderItems.push({ product: product._id, name: product.name, price: product.price, quantity });
    }

    const itemsPrice = round2(orderItems.reduce((s, i) => s + i.price * i.quantity, 0));
    const shippingPrice = itemsPrice >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice: round2(itemsPrice + shippingPrice),
    });

    cart.items = [];
    await cart.save();

    res.status(201).json({ success: true, order });
  } catch (err) {
    // Roll back any stock we already reserved
    await Promise.all(
      reserved.map((r) => Product.updateOne({ _id: r.product }, { $inc: { stock: r.quantity } }))
    );
    throw err;
  }
});

exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json({ success: true, count: orders.length, orders });
});

exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new AppError('Order not found', 404);
  if (req.user.role !== 'admin' && !order.user._id.equals(req.user._id)) throw new AppError('Forbidden', 403);
  res.json({ success: true, order });
});

// Mock payment — replace with Stripe/PayPal webhook logic in production
exports.payOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (!order.user.equals(req.user._id)) throw new AppError('Forbidden', 403);
  if (order.status === 'cancelled') throw new AppError('Order is cancelled', 400);
  if (order.isPaid) throw new AppError('Order already paid', 400);
  order.isPaid = true;
  order.paidAt = new Date();
  await order.save();
  res.json({ success: true, order });
});

exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (req.user.role !== 'admin' && !order.user.equals(req.user._id)) throw new AppError('Forbidden', 403);
  if (!['pending', 'processing'].includes(order.status))
    throw new AppError(`Cannot cancel an order that is ${order.status}`, 400);
  order.status = 'cancelled';
  await order.save();
  await restock(order);
  res.json({ success: true, order });
});

// ---- Admin ----
exports.getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const filter = req.query.status ? { status: String(req.query.status) } : {};
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, total, page, pages: Math.ceil(total / limit), orders });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (!TRANSITIONS[order.status].includes(status))
    throw new AppError(`Cannot change status from ${order.status} to ${status}`, 400);

  order.status = status;
  if (status === 'delivered') {
    order.deliveredAt = new Date();
    if (order.paymentMethod === 'cod') {
      order.isPaid = true;
      order.paidAt = new Date();
    }
  }
  await order.save();
  if (status === 'cancelled') await restock(order);
  res.json({ success: true, order });
});
