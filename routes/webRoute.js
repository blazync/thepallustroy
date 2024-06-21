const express = require('express');
const router = express.Router();
const controller = require('../controllers/webController');
const {createOrder,verifyOrder,paymentWebhook} = require('../controllers/paymentController')
const authController = require('../controllers/authController');
const { checkAuth } = require('../middlewares/checkAuth');

router.get('/', controller.index);
router.get('/index', controller.index);
// router.get('/category', controller.category);
router.get('/category/:id', controller.category);
router.get('/product/:id', controller.product);
router.get('/product', controller.product);
router.put('/product-review', controller.productReview);



router.get('/about', controller.about);
router.get('/contact', controller.contact);
router.post('/savecontact', controller.savecontact);
router.get('/site-map', controller.siteMap);

router.get('/my-account', controller.myAccount);
router.post('/postlogin', authController.postlogin);
router.get('/logout', authController.logout);

router.get('/blog', controller.blog);
router.get('/shopping-cart', checkAuth,controller.shoppingCart);
router.get('/many-publishing-packages', controller.manyPublishingPackages);
router.get('/there-are-many-variations', controller.manyVariations);
router.get('/the-standard-lorem', controller.standardLorem);
router.get('/it-is-established-fact', controller.establishedFact);
router.get('/consectetur-adipiscing', controller.consecteturAdipiscing);
router.get('/refund-policy', controller.refundpolicy);
router.get('/privacy-policy', controller.privacyPolicy);
router.get('/terms-and-conditions', controller.termandconditions);
router.get('/register', controller.register);
router.post('/register', authController.postregister);



router.post('/addtocart', controller.addtocart);
router.post('/update-cart', controller.updateCartFinalValue);
// router.post('/order',controller.postOrder);
router.get('/checkout',controller.checkout);
// Route to create order
router.post('/create-order', createOrder);
router.post('/verify-order/:order_id', verifyOrder);
router.post('/payment/webhook', paymentWebhook);


// user account

router.get('/account',checkAuth,controller.account);
router.get('/myorder',checkAuth,controller.myorder);
router.get('/orderDetails/:id',checkAuth,controller.orderDetails);
router.get('/trackOrder/:id',checkAuth,controller.trackOrder);
router.get('/mywishlist',checkAuth,controller.mywishlist);
router.get('/myprofile',checkAuth,controller.myprofile);
router.post('/myprofile',checkAuth,controller.myprofile);

module.exports = router;
