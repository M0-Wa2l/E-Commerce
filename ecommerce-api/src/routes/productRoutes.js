const router = require('express').Router();
const c = require('../controllers/productController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', c.getProducts);
router.get('/categories', c.getCategories);
router.get('/:id', c.getProduct);

router.post('/', protect, restrictTo('admin'), c.createProduct);
router.route('/:id').put(protect, restrictTo('admin'), c.updateProduct).delete(protect, restrictTo('admin'), c.deleteProduct);

module.exports = router;
