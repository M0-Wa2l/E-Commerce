const router = require('express').Router();
const c = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);
router.route('/').post(c.createOrder).get(restrictTo('admin'), c.getAllOrders);
router.get('/mine', c.getMyOrders);
router.get('/:id', c.getOrder);
router.put('/:id/pay', c.payOrder);
router.put('/:id/cancel', c.cancelOrder);
router.put('/:id/status', restrictTo('admin'), c.updateOrderStatus);

module.exports = router;
