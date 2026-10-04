const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const ALLOWED_FIELDS = ['name', 'description', 'price', 'category', 'brand', 'stock', 'images', 'isActive'];
const pick = (obj) => Object.fromEntries(Object.entries(obj).filter(([k]) => ALLOWED_FIELDS.includes(k)));

// GET /api/products?search=&category=&minPrice=&maxPrice=&sort=price|-price|-createdAt&page=1&limit=12
exports.getProducts = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, sort = '-createdAt' } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 100);

  const filter = { isActive: true };
  if (search) filter.$text = { $search: String(search) };
  if (category) filter.category = String(category);
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const allowedSort = ['price', '-price', 'createdAt', '-createdAt', 'name', '-name'];
  const sortBy = allowedSort.includes(sort) ? sort : '-createdAt';

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortBy).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: products.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    products,
  });
});

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category', { isActive: true });
  res.json({ success: true, categories });
});

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product || !product.isActive) throw new AppError('Product not found', 404);
  res.json({ success: true, product });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(pick(req.body));
  res.status(201).json({ success: true, product });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, pick(req.body), {
    new: true,
    runValidators: true,
  });
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, product });
});

// Soft delete so past orders keep their references
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) throw new AppError('Product not found', 404);
  res.json({ success: true, message: 'Product removed' });
});
