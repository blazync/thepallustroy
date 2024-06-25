const { decodeToken } = require('../middlewares/decodeJwt');
const Enquiry = require('../models/enquiry');
const Product = require('../models/products');
const ProductReviews = require('../models/productReviews');
const Category = require('../models/categories');
const Payment = require('../models/payments');
const User = require('../models/user');
const Order = require('../models/orders');
const Settings = require('../models/setting');
const crypto = require('crypto');
const mailer = require('./emailsender');
const axios = require('axios'); // Make sure to replace with the correct path to your payment model

exports.index = async (req, res) => {
    try {
        const products = await Product.find(); // Fetch all products from the database
        // Fetch product details for each item in the cart

        res.render('web/index', {
            products, 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find(),
        });
    } catch (error) {
        console.error("Error fetching index data:", error);
        res.status(500).send("Internal Server Error");
    }
};
exports.getForgotPassword = async (req, res) => {
    res.render('web/forgot-password',{
        userData: decodeToken(req.cookies.token),
        navCategories: await Category.find(),
        navProduct: await Product.find(),});
};
exports.getResetPassword = async (req, res) => {
    const {token} = req.params;
    res.render('web/reset-password',{
        userData: decodeToken(req.cookies.token),
        token:token,
        navCategories: await Category.find(),
        navProduct: await Product.find(),});
};


exports.category = async (req, res) => {
    try {
        const categoryName = req.params.id ? req.params.id.replace(/-/g, ' ') : null;

        if (categoryName) {
            const category = await Category.findOne({ name: categoryName });
            if (!category) {
                return res.status(404).send('Category not found');
            }
            
            // Fetch products associated with the category
            const products = await Product.find({ categories: category._id });
            console.log(products);

            const categories = await Category.find();
            const userData = decodeToken(req.cookies.token);

            res.render('web/categoryDetails', { 
                category, 
                products, 
                categories, 
                userData,
                navCategories: await Category.find(),
                navProduct: await Product.find(), 
            });
        } else {
            const userData = decodeToken(req.cookies.token);

            res.render('web/category', { 
                userData,
                navCategories: await Category.find(),
                navProduct: await Product.find(), 
            });
        }
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).send("Internal Server Error");
    }
};
exports.product = async (req, res) => {
    const productName = req.params.id ? req.params.id.replace(/-/g, ' ') : null;

    try {
        if (productName) {
            const product = await Product.findOne({ name: productName });
            if (!product) {
                return res.status(404).send('Product not found');
            }

            const categories = await Category.find();
            const userData = decodeToken(req.cookies.token);

            // Fetch product reviews only after confirming the product exists
            const productReviews = await ProductReviews.find({ product_id: product._id }).populate('user_id', 'name');

            res.render('web/productDetails', { 
                product, 
                categories, 
                userData,
                productReviews,  // Pass product reviews to the view
                navCategories: await Category.find(),
                navProduct: await Product.find(), 
            });
        } else {
            const userData = decodeToken(req.cookies.token);

            res.render('web/product', { 
                userData,
                navCategories: await Category.find(),
                navProduct: await Product.find(), 
            });
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).send("Internal Server Error");
    }
};


exports.addtowishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userData = decodeToken(req.cookies.token);

        if (userData) {
            // Find the user by their email
            const user = await User.findOne({ email: userData.email });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check if the product exists
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            // Check if the product is already in the user's wishlist
            const wishlistItemIndex = user.wishlist.findIndex(item => item.product_id.toString() === productId);

            if (wishlistItemIndex > -1) {
                // If the product is already in the wishlist, do nothing or update timestamp
                user.wishlist[wishlistItemIndex].timestamp = Date.now();
            } else {
                // If the product is not in the wishlist, add it
                user.wishlist.push({
                    product_id: productId,
                     product_name: product.name,
                     timestamp: Date.now()
                });
            }

            // Save the updated user document
            await user.save();

            res.status(200).json({ message: 'Product added to wishlist successfully' });
        } else {
            res.redirect('/my-account');
        }
    } catch (error) {
        console.error("Error adding product to wishlist:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.removewishlistitem = async (req, res) => {
    try {
        const { wishlistItemId } = req.body;
        const userData = decodeToken(req.cookies.token);

        if (userData) {
            // Find the user by their email
            const user = await User.findOne({ email: userData.email });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check if the wishlist item exists
            const wishlistItemIndex = user.wishlist.findIndex(item => item._id.toString() === wishlistItemId);

            if (wishlistItemIndex > -1) {
                // Remove the item from the wishlist array
                user.wishlist.splice(wishlistItemIndex, 1);
            } else {
                return res.status(404).json({ message: 'Wishlist item not found' });
            }

            // Save the updated user document
            await user.save();

            res.status(200).json({ message: 'Product removed from wishlist successfully' });
        } else {
            res.redirect('/my-account');
        }
    } catch (error) {
        console.error("Error removing product from wishlist:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};





exports.addtocart = async (req, res) => {
    try {
        const { productId, quantity,operation } = req.body;
        const userData = decodeToken(req.cookies.token);
        console.log(userData)
        if (userData) {
            console.log(`Product ID: ${productId}, Quantity: ${quantity}`);

            // Find the user by their email
            const user = await User.findOne({ email: userData.email });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check if the product exists
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            // Check if the product is already in the user's cart
            const cartItemIndex = user.cart.findIndex(item => item.product_id.toString() === productId);

            if (cartItemIndex > -1) {
                // If the product is already in the cart, update the quantity
                if(operation==='plus'){
                    user.cart[cartItemIndex].quantity += parseInt(quantity, 10);
                }
                 else if(operation==='minus'){
                    if( user.cart[cartItemIndex].quantity <=1){
                         // Remove the product from the cart
                        user.cart.splice(cartItemIndex, 1);

                        // Save the updated user document
                        await user.save();
                    }else{
                        user.cart[cartItemIndex].quantity -= parseInt(quantity, 10);
                    }
                }
            } else {
                // If the product is not in the cart, add a new cart item
                user.cart.push({
                    product_id: productId,
                    quantity: parseInt(quantity, 10)
                });
            }

            // Save the updated user document
            await user.save();

            res.status(200).json({ message: 'Product added to cart successfully' });
        } else {
            res.redirect('my-account');
        }
    } catch (error) {
        console.error("Error adding product to cart:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


exports.updateCartQuantityDirectly = async (req, res) => {
    try {
        const { productId, quantity,operation } = req.body;
        const userData = decodeToken(req.cookies.token);
        console.log(userData)
        if (userData) {
            console.log(`Product ID: ${productId}, Quantity: ${quantity}`);

            // Find the user by their email
            const user = await User.findOne({ email: userData.email });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check if the product exists
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            // Check if the product is already in the user's cart
            const cartItemIndex = user.cart.findIndex(item => item.product_id.toString() === productId);

            if (cartItemIndex > -1) {
                 if( quantity ===0){
                         // Remove the product from the cart
                        user.cart.splice(cartItemIndex, 1);

                        // Save the updated user document
                        await user.save();
                    }
                // If the product is already in the cart, update the quantity
                    user.cart[cartItemIndex].quantity = parseInt(quantity, 10);

            } else {
                // If the product is not in the cart, add a new cart item
                user.cart.push({
                    product_id: productId,
                    quantity: parseInt(quantity, 10)
                });
            }

            // Save the updated user document
            await user.save();

            res.status(200).json({ message: 'Product added to cart successfully' });
        } else {
            res.redirect('my-account');
        }
    } catch (error) {
        console.error("Error adding product to cart:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


exports.deletefromcart = async (req, res) => {
    try {
        const { productId } = req.body;
        const userData = decodeToken(req.cookies.token);

        if (userData) {
            const user = await User.findOne({ email: userData.email });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check if the product exists in the user's cart
            const cartItemIndex = user.cart.findIndex(item => item.product_id.toString() === productId);

            if (cartItemIndex === -1) {
                return res.status(404).json({ message: 'Product not found in cart' });
            }

            // Remove the product from the cart
            user.cart.splice(cartItemIndex, 1);

            // Save the updated user document
            await user.save();

            res.status(200).json({ message: 'Product removed from cart successfully' });
        } else {
            res.redirect('my-account');
        }
    } catch (error) {
        console.error("Error removing product from cart:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


exports.about = async (req, res) => {
    try {
        res.render('web/about', { 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find(), 
        });
    } catch (error) {
        console.error("Error fetching about page data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.contact = async (req, res) => {
    try {
        res.render('web/contact', { 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find(), 
        });
    } catch (error) {
        console.error("Error fetching contact page data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.savecontact = async (req, res) => {
    try {
        console.log(req.body);
        const newEnquiry = new Enquiry({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            enquiry: req.body.enquiry
        });

        await newEnquiry.save();

        res.redirect('/contact'); // Redirect to the contact page or a success page
    } catch (error) {
        console.error("Error saving contact enquiry:", error);
        res.redirect('/contact'); // Redirect to the contact page or an error page
    }
};

exports.siteMap = async (req, res) => {
    try {
        res.render('web/site-map', { 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find(), 
        });
    } catch (error) {
        console.error("Error fetching site map data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.myAccount = async (req, res) => {
    try {
        res.render('web/my-account', { 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find(), 
        });
    } catch (error) {
        console.error("Error fetching my account data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.blog = async (req, res) => {
    try {
        res.render('web/blog', { 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find(), 
        });
    } catch (error) {
        console.error("Error fetching blog data:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Function to get product details
async function getProductDetails(productId) {
    try {
        return await Product.findById(productId).lean();
    } catch (error) {
        console.error("Error fetching product details:", error);
        throw error;
    }
}
exports.productReview = async (req, res) => {
    try {
        // Decode user data from token
        const userData = decodeToken(req.cookies.token);
        const { productId, rating, review } = req.body;

        // Validate input data
        if (!productId || !rating || !review) {
            return res.status(400).json({ message: 'Invalid request: Missing required fields' });
        }
         const order = await Order.findOne({
            user_id: userData.userId,
            'products.product_id': productId
        });

        if (!order) {
            return res.status(403).json({ message: 'You can only review products you have bought' });
        }
        // Check if there's an existing review by the same user for the same product
        const existingReview = await ProductReviews.findOne({ user_id: userData.userId, product_id: productId });

        if (existingReview) {
            // Update the existing review
            existingReview.rating = parseInt(rating);
            existingReview.review = review;
            existingReview.updated_at = new Date();

            await existingReview.save();
            res.status(200).json({ message: 'Review updated successfully' });
        } else {
            // Create a new review object
            const newReview = new ProductReviews({
                user_id: userData.userId,
                product_id: productId,
                rating: parseInt(rating),
                review: review,
                created_at: new Date(),
                updated_at: new Date()
            });

            // Save the review to the database
            await newReview.save();
            res.status(201).json({ message: 'Review submitted successfully' });
        }
    } catch (error) {
        console.error('Error creating product review:', error.message);
        res.status(500).json({ message: 'Failed to submit review' });
    }
};

// Route to render cart
exports.shoppingCart = async (req, res) => {
    try {
        const userData = decodeToken(req.cookies.token);
        const user = await User.findOne({ email: userData.email }).lean();
        const settings = await Settings.findOne();

        // Fetch product details for each item in the cart
        const cartDetails = await Promise.all(user.cart.map(async (cartItem) => {
            const product = await getProductDetails(cartItem.product_id);
            return {
                ...cartItem,
                product,
            };
        }));

        res.render('web/shopping-cart', {
            user,
            settings,
            cartDetails,
            navCategories: await Category.find(),
            navProduct: await Product.find(),
            userData: decodeToken(req.cookies.token)
        });
    } catch (error) {
        console.error('Error rendering shopping cart:', error);
        res.status(500).send('Internal Server Error');
    }
};


exports.checkout = async (req, res) => {
    try {
        const userData = decodeToken(req.cookies.token);
        res.render('web/checkout', {
            userData,
            paymentSessionId:null,
            navCategories: await Category.find(),
            navProduct: await Product.find(),
        });
    } catch (error) {
        console.error("Error rendering checkout page:", error);
        res.status(500).send("Internal Server Error");
    }
};


exports.manyPublishingPackages = async (req, res) => {
    try {
        res.render('web/many-publishing-packages', { 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find(), 
        });
    } catch (error) {
        console.error("Error fetching many publishing packages data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.manyVariations = async (req, res) => {
    try {
        res.render('web/many-variations', { 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find(), 
        });
    } catch (error) {
        console.error("Error fetching many variations data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.standardLorem = async (req, res) => {
    try {
        res.render('web/standard-lorem', { 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find(), 
        });
    } catch (error) {
        console.error("Error fetching standard lorem data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.establishedFact = async (req, res) => {
    try {
        res.render('web/established-fact', { 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find(), 
        });
    } catch (error) {
        console.error("Error fetching established fact data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.consecteturAdipiscing = async (req, res) => {
    try {
        res.render('web/consectetur-adipiscing', { 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find(), 
        });
    } catch (error) {
        console.error("Error fetching consectetur adipiscing data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.refundpolicy = async (req, res) => {
    try {
        res.render('web/refund-policy', { 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find(), 
        });
    } catch (error) {
        console.error("Error fetching refund policy data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.privacyPolicy = async (req, res) => {
    try {
        res.render('web/privacy-policy', { 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find(), 
        });
    } catch (error) {
        console.error("Error fetching privacy policy data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.termandconditions = async (req, res) => {
    try {
        res.render('web/terms-and-conditions', { 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find(), 
        });
    } catch (error) {
        console.error("Error fetching terms and conditions data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.register = async (req, res) => {
    try {
        res.render('web/register', { 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find()
        });
    } catch (error) {
        console.error("Error fetching register page data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.postOrder = async (req, res) => {
    try {
        const { amount } = req.body; // Ensure that these are correctly coming from your request
        const user = decodeToken(req.cookies.token);

        // Create payment order with Cashfree
        const order_id = `order_${new Date().getTime()}`; // Unique order ID
        const cashfreeUrl = 'https://test.cashfree.com/api/v1/order/create'; // Use test or live URL based on environment

        const payload = {
            order_id,
            order_amount: amount,
            customer_details: {
                customer_id: user._id,
                customer_email: user.email,
                customer_phone: user.phone // Ensure that you have user's phone number
            },
            order_meta: {
                return_url: `${process.env.BASE_URL}/payment/callback?order_id={order_id}`,
                notify_url: `${process.env.BASE_URL}/payment/webhook`
            }
        };

        const response = await axios.post(cashfreeUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': process.env.CASHFREE_CLIENT_ID,
                'x-client-secret': process.env.CASHFREE_CLIENT_SECRET
            }
        });

        if (response.data.status === 'OK') {
            const payment = new Payment({
                order_id,
                amount,
                payment_status: 'PENDING',
                user: user._id
            });

            await payment.save();

            res.redirect(response.data.payment_link); // Redirect to Cashfree payment page
        } else {
            res.status(500).send('Error creating payment order');
        }
    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).send('Error processing payment');
    }
};

exports.paymentCallback = async (req, res) => {
    try {
        const { order_id, tx_status, tx_msg, tx_time, reference_id } = req.body;

        const payment = await Payment.findOne({ order_id });

        if (!payment) {
            return res.status(404).send('Order not found');
        }

        payment.payment_status = tx_status === 'SUCCESS' ? 'COMPLETED' : 'FAILED';
        payment.transaction_id = reference_id;

        await payment.save();

        if (tx_status === 'SUCCESS') {
            res.redirect('/payment-success'); // Redirect to success page
        } else {
            res.redirect('/payment-failed'); // Redirect to failure page
        }
    } catch (error) {
        console.error("Error handling payment callback:", error);
        res.status(500).send('Error handling payment callback');
    }
};

exports.account = async (req, res) => {
    try {
        const userData = decodeToken(req.cookies.token);

        // Fetch the user document to get the wishlist
        const user = await User.findById(userData.userId);

        // Fetch all orders for the user
        const orders = await Order.find({ user_id: userData.userId });

        // Calculate total spend
        const totalSpend = orders.reduce((sum, order) => sum + order.total_amount, 0);

        // Get total orders count
        const totalOrders = orders.length;

        // Get total wishlist items count
        const totalWishlistItems = user.wishlist ? user.wishlist.length : 0;

        // Fetch navigation categories and products
        const navCategories = await Category.find();
        const navProduct = await Product.find();

        res.render('account/account', { 
            userData,
            orders,
            navCategories,
            navProduct,
            totalSpend,
            totalOrders,
            totalWishlistItems
        });
    } catch (error) {
        console.error("Error fetching my account data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.myorder = async (req, res) => {
    try {
        const userData = decodeToken(req.cookies.token);
        console.log(userData)
        const perPage = 10; // Number of items per page
        const page = parseInt(req.query.page) || 1; // Current page (default: 1)

        const ordersQuery = Order.find({ user_id: userData.userId });
        const countPromise = Order.countDocuments({ user_id: userData.userId });

        const orders = await ordersQuery
            .sort({ createdAt: -1 }) // Example: Sort by createdAt in descending order
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        const count = await countPromise;

        res.render('account/myorder', { 
            userData,
            orders,
            currentPage: page,
            totalPages: Math.ceil(count / perPage),
            navCategories: await Category.find(),
            navProduct: await Product.find(), 
        });
    } catch (error) {
        console.error("Error fetching my account data:", error);
        res.status(500).send("Internal Server Error");
    }
};


exports.mywishlist = async (req, res) => {
    const userData = decodeToken(req.cookies.token);
    const user = await User.findById(userData.userId);
    try {
        res.render('account/mywishlist', { 
            userData,
            wishlist:user.wishlist,
            navCategories: await Category.find(),
            navProduct: await Product.find(), 
        });
    } catch (error) {
        console.error("Error fetching my account data:", error);
        res.status(500).send("Internal Server Error");
    }
};
exports.myprofile = async (req, res) => {
    try {
        const userData = decodeToken(req.cookies.token);

        if (!userData) {
            return res.status(401).send('Unauthorized');
        }

        if (req.method === "POST") {
            const { name, email, contactNumber, password, cpassword, role } = req.body;

            // Fetch user from the database
            const user = await User.findById(userData.userId);

            if (!user) {
                return res.status(404).send('User not found');
            }

            // Check if password is entered and update if valid
            if (password && password === cpassword) {
                user.password = password;
            }

            // Update other fields if provided
            if (name) user.name = name;
            if (email) user.email = email;
            if (contactNumber) user.contactNumber = contactNumber;
            if (role) user.role = role;

            await user.save(); // Save changes to the User document

            res.redirect('/myprofile')
        } else {
            const userData = decodeToken(req.cookies.token);
            const user = await User.findById(userData.userId)
            if (!userData) {
                return res.status(401).send('Unauthorized');
            }

            res.render('account/myprofile', {
                userData,
                user,
                navCategories: await Category.find(),
                navProduct: await Product.find(),
            });
        }
    } catch (error) {
        console.error("Error updating/fetching user data:", error);
        res.status(500).send("Internal Server Error");
    }
};
exports.myaddress = async (req, res) => {
    const { id } = req.query; // Destructure id from req.query
    const userData = decodeToken(req.cookies.token);

    if (!userData) {
        return res.status(401).send('Unauthorized');
    }

    try {
        // Fetch user from the database
        const user = await User.findById(userData.userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        const navCategories = await Category.find();
        const navProduct = await Product.find();
        const address = id ? user.addresses.id(id) : '';

        // Render the myaddress view with user data
        res.render('account/myaddress', {
            userData,
            user,
            address,
            navCategories,
            navProduct,
        });

        if (id) {
            console.log(address);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
exports.saveaddress = async (req, res) => {
    const { type, address_line1, address_line2, city, state, zip_code, country, addressId } = req.body;

    if (type !== 'add' && type !== 'edit') {
        return res.status(400).send('Invalid request type');
    }

    try {
        const userData = decodeToken(req.cookies.token);

        if (!userData) {
            return res.status(401).send('Unauthorized');
        }

        // Fetch the user from the database
        const user = await User.findById(userData.userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        if (type === 'edit' && addressId) {
            // Update existing address
            const addressToUpdate = user.addresses.id(addressId);

            if (!addressToUpdate) {
                return res.status(404).send('Address not found');
            }

            addressToUpdate.address_line1 = address_line1;
            addressToUpdate.address_line2 = address_line2;
            addressToUpdate.city = city;
            addressToUpdate.state = state;
            addressToUpdate.zip_code = zip_code;
            addressToUpdate.country = country;

        } else if (type === 'add') {
            // Add new address
            const newAddress = {
                address_line1,
                address_line2,
                city,
                state,
                zip_code,
                country,
            };

            user.addresses.push(newAddress);
        }

        await user.save(); // Save changes to the User document

        // Redirect back to myaddress page or wherever appropriate
        return res.redirect('/myaddress');
    } catch (error) {
        console.error('Error saving address:', error);
        return res.status(500).send('Internal Server Error');
    }
};
exports.togglePrimary = async (req, res) => {
    const { addressId, isPrimary } = req.body;
    console.log(req.body);

    try {
        const userData = decodeToken(req.cookies.token);

        if (!userData) {
            return res.status(401).send('Unauthorized');
        }

        // Fetch user from the database
        const user = await User.findById(userData.userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Find the address to update
        const addressToUpdate = user.addresses.id(addressId);

        if (!addressToUpdate) {
            return res.status(404).send('Address not found');
        }

        // If setting current address as primary
        if (isPrimary === 'true') {
            console.log('Setting current address as primary...');
            // Set all other addresses' primary to false
            user.addresses.forEach(addr => {
                addr.primary = addr._id.equals(addressToUpdate._id); // Set to true only for the current address
                console.log(`Address ${addr._id}: primary set to ${addr.primary}`);
            });
        } else {
            console.log('Unsetting current address from primary...');
            // Just set the current address as not primary
            addressToUpdate.primary = false;
            console.log(`Address ${addressToUpdate._id}: primary set to false`);
        }

        // Save user document (update in the database)
        await user.save();

        // Send response with updated primary status
        res.json({ isPrimary: addressToUpdate.primary });
    } catch (error) {
        console.error('Error toggling primary status:', error);
        res.status(500).send('Internal Server Error');
    }
};




exports.deleteAddress = async (req, res) => {
    const { addressId } = req.params;
    console.log(addressId);

    try {
        const userData = decodeToken(req.cookies.token);

        if (!userData) {
            return res.status(401).send('Unauthorized');
        }

        // Fetch the user from the database
        const user = await User.findById(userData.userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Find the index of the address to be removed
        const indexToRemove = user.addresses.findIndex(address => address._id.toString() === addressId);

        if (indexToRemove === -1) {
            return res.status(404).send('Address not found');
        }

        // Remove the address from the user's addresses array
        user.addresses.splice(indexToRemove, 1);

        // Save the updated user document
        await user.save();

        // Redirect back to myaddress page or send a success response
        return res.redirect('/myaddress');
        // Or you can send a JSON response:
        // return res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        return res.status(500).send('Internal Server Error');
    }
};







exports.orderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userData = decodeToken(req.cookies.token);
        const orderDetails = await Order.findById(orderId);
        res.render('account/orderDetails', { 
            userData,
            orderDetails,
            navCategories: await Category.find(),
            navProduct: await Product.find()
        });
    } catch (error) {
        console.error("Error fetching register page data:", error);
        res.status(500).send("Internal Server Error");
    }
};
exports.trackOrder = async (req, res) => {
    try {
        res.render('account/trackOrder', { 
            userData: decodeToken(req.cookies.token),
            navCategories: await Category.find(),
            navProduct: await Product.find()
        });
    } catch (error) {
        console.error("Error fetching register page data:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.sendVerificationEmail = async (req, res) => {
    try {
        const userData = decodeToken(req.cookies.token);

        if (!userData) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findById(userData.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate verification token
        const emailVerificationToken = crypto.randomBytes(20).toString('hex');
        const emailVerificationExpires = Date.now() + 3600000; // 1 hour
        user.emailVerificationToken  = emailVerificationToken ;
        user.emailVerificationExpires  = emailVerificationExpires ;
        await user.save();

        // Construct verification URL
        const verificationUrl = `${req.protocol}://${req.get('host')}/verify-email/${emailVerificationToken}`;

        // Prepare email content
        const verificationEmail = `
            <div class="container">
                <h1>Hello, <b>${user.name}</b>!</h1>
                <p>Please verify your email by clicking the link below:</p>
                <a href="${verificationUrl}">${verificationUrl}</a>
                <p>This link will expire in 1 hour.</p>
            </div>
        `;

        // Send verification email
        await mailer(user.email, '', '', 'Email Verification', verificationEmail);

        res.redirect('/account')
    } catch (error) {
        console.error("Error sending verification email:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


module.exports = exports;
