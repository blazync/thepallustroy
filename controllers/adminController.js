const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Product = require('../models/products');
const User = require('../models/user');
const Enquiry = require('../models/enquiry');
const Categories = require('../models/categories');
const { decodeToken } =  require('../middlewares/decodeJwt');
const Category = require('../models/categories');
const Order = require('../models/orders');
const Payment = require('../models/payments');
const Settings = require('../models/setting');
const bcrypt = require('bcryptjs');
const mailer = require('./emailsender');
const fs = require('fs');
const path = require('path');
exports.index = async (req, res) => {
    const userData = decodeToken(req.cookies.token);
    try {
        let totalPaymentEarned = 0;
        let totalUsers = 0;
        let totalOrders = 0;
        let userOrders;

        if (userData.role === "admin") {
            // Fetch all orders

            const orders = await Order.find();
            userOrders = await Order.find().sort({ created_at: -1 });
            // Calculate total payment earned
            totalPaymentEarned =  orders
                .filter(order => order.payment_status === 'Paid')
                .reduce((acc, order) => acc + order.total_amount, 0);
                            // Fetch total number of users
            totalUsers = await User.countDocuments();
            // Calculate total number of orders
            totalOrders = orders.length;
        } else {
            // Fetch orders related to the user
            userOrders = await Order.find({ user_id: userData.userId });
            // Calculate total payment earned
            totalPaymentEarned = userOrders.reduce((acc, order) => acc + order.total_amount, 0);
            // For a regular user, total users count is 1
            totalUsers = 1;
            // Total orders for a user
            totalOrders = userOrders.length;
        }

        console.log(userData);
        res.render('dashboard/index', { userData, totalPaymentEarned, totalUsers, totalOrders ,userOrders});
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
};



// Function to render the form for adding a new user
exports.addAttributes = async (req, res) => {
    try {
        res.render('dashboard/add-attributes', { userData: decodeToken(req.cookies.token) });
    } catch (error) {
        console.error("Error rendering add attributes page:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.addNewUser = async (req, res) => {
    try {
        res.render('dashboard/add-new-user', { user: '', type: "add", userData: decodeToken(req.cookies.token) });
    } catch (error) {
        console.error("Error rendering add new user page:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.editUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        res.render('dashboard/add-new-user', { user, type: "edit", userData: decodeToken(req.cookies.token) });
    } catch (error) {
        console.error("Error rendering edit user page:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Function to handle adding or editing a user
exports.saveUser = async (req, res) => {
    try {
        const { type, userId, name, email, password, cpassword, role } = req.body;
        console.log(req.body);

        if (type === "edit") {
            // Update existing user
            await User.findByIdAndUpdate(userId, { name, email, role });
        } else {
            // Password confirmation check
        if (password !== cpassword) {
            return res.redirect(`/dashboard/add-new-user?error=Passwords do not match&type=${type}&userId=${userId}`);
        }

        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);
            // Create new user
            const newUser = new User({ name, email, password: hashedPassword, role });
            await newUser.save();
        }
        res.redirect('/dashboard/all-user'); // Redirect to user list after saving
    } catch (error) {
        console.error('Error handling user:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.addProduct = async (req, res) => {
    const category = await Category.find();
    res.render('dashboard/add-product',{category,type:"add",product:'',userData:decodeToken(req.cookies.token) });
};

exports.editProduct = async (req, res) => {
    try {
        const productId = req.params.id; // Corrected req.param to req.params
        const product = await Product.findById(productId); // Corrected findbyId to findById
        const category = await Category.find();
        res.render('dashboard/add-product', {
            category,
            product,
            type:"edit",
            userData: decodeToken(req.cookies.token)
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const deleteImages = (images) => {
    images.forEach(image => {
        const imagePath = path.join(__dirname, '..', 'public', 'upload', 'multiple', image);
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error(`Error deleting image: ${imagePath}`, err);
            } else {
                console.log(`Deleted image: ${imagePath}`);
            }
        });
    });
};


exports.deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findByIdAndDelete(productId);
        
        if (product && product.images) {
            deleteImages(product.images);
        }

        res.redirect('/dashboard/product-list?success=Product deleted successfully');
    } catch (error) {
        console.error('Error deleting product:', error);
        res.redirect('/dashboard/product-list?error=Error deleting product');
    }
};


exports.postProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            discountedPrice,
            sku,
            no_of_components,
            color,
            material,
            fit,
            artisan,
            categories,
            occasion,
            collection,
            brand,
            place_of_manufacture,
            caution,
            contents,
            stock,
            views,
            type,
            productId // Assuming productId is sent in the request body
        } = req.body;

        // Convert checkbox values to boolean
        const bestseller = req.body.bestseller === 'true';
        const status = req.body.status === 'true';

        // Handle uploaded images
        const images = req.files ? req.files.map(file => file.filename) : [];

        if (type === "edit") {
            const existingProduct = await Product.findById(productId);

            if (!existingProduct) {
                return res.status(404).send("Product not found");
            }

            // If new images are uploaded, delete old images
            if (images.length > 0 && existingProduct.images) {
                existingProduct.images.forEach(img => {
                    fs.unlink(path.join(__dirname, '..', 'public', 'upload', 'multiple', img), err => {
                        if (err) console.error(err);
                    });
                });
            }

            // Update product with new data
            await Product.findByIdAndUpdate(productId, {
                name,
                description,
                price,
                discountedPrice,
                sku,
                no_of_components,
                color,
                material,
                fit,
                artisan,
                categories,
                occasion,
                collection,
                brand,
                place_of_manufacture,
                caution,
                contents,
                images: images.length > 0 ? images : existingProduct.images,
                stock,
                views,
                bestseller,
                status
            });

            res.redirect('/dashboard/product-list');
        } else {
            // Check for existing product with the same name or SKU
            const existingProduct = await Product.findOne({ $or: [{ name }, { sku }] });

            if (existingProduct) {
                return res.redirect('/dashboard/add-product?error=Product with the same name or SKU already exists');
            }

            // Create a new product
            const newProduct = new Product({
                name,
                description,
                price,
                discountedPrice,
                sku,
                no_of_components,
                color,
                material,
                fit,
                artisan,
                categories,
                occasion,
                collection,
                brand,
                place_of_manufacture,
                caution,
                contents,
                images,
                stock,
                views,
                bestseller,
                status
            });

            await newProduct.save();

            res.redirect('/dashboard/product-list');
        }
    } catch (error) {
        console.error('Error adding or editing product:', error);
        res.redirect('/dashboard/add-product?error=Error adding or editing product');
    }
};



exports.allRoles = async (req, res) => {
    res.render('dashboard/all-roles',{ userData:decodeToken(req.cookies.token) });
};

exports.allUser = async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = search ? { email: { $regex: search, $options: 'i' } } : {};
    
    try {
        const userCount = await User.countDocuments(query);
        const users = await User.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        
        res.render('dashboard/all-user', {
            users,
            userData: decodeToken(req.cookies.token),
            currentPage: page,
            totalPages: Math.ceil(userCount / limit),
            search
        });
    } catch (error) {
        res.status(500).send(error);
    }
};


exports.attributes = async (req, res) => {
    res.render('dashboard/attributes',{ userData:decodeToken(req.cookies.token) });
};

exports.categoryList = async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};

    try {
        const categoryCount = await Categories.countDocuments(query);
        const categories = await Categories.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.render('dashboard/category-list', {
            categories,
            userData: decodeToken(req.cookies.token),
            currentPage: parseInt(page),
            totalPages: Math.ceil(categoryCount / limit),
            search
        });
    } catch (error) {
        console.error('Error handling category list:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.cities = async (req, res) => {
    res.render('dashboard/cities',{ userData:decodeToken(req.cookies.token) });
};

exports.components = async (req, res) => {
    res.render('dashboard/components',{ userData:decodeToken(req.cookies.token) });
};

exports.countries = async (req, res) => {
    res.render('dashboard/countries',{ userData:decodeToken(req.cookies.token) });
};

exports.createRole = async (req, res) => {
    res.render('dashboard/create-role',{ userData:decodeToken(req.cookies.token) });
};

exports.editPage = async (req, res) => {
    res.render('dashboard/edit-page',{ userData:decodeToken(req.cookies.token) });
};

exports.gallery = async (req, res) => {
    res.render('dashboard/gallery',{ userData:decodeToken(req.cookies.token) });
};

exports.home2 = async (req, res) => {
    res.render('dashboard/home-2',{ userData:decodeToken(req.cookies.token) });
};

exports.home3 = async (req, res) => {
    res.render('dashboard/home-3',{ userData:decodeToken(req.cookies.token) });
};

exports.home4 = async (req, res) => {
    res.render('dashboard/home-4',{ userData:decodeToken(req.cookies.token) });
};

exports.homeBoxed = async (req, res) => {
    res.render('dashboard/home-boxed',{ userData:decodeToken(req.cookies.token) });
};

exports.homeMenuIconDefault = async (req, res) => {
    res.render('dashboard/home-menu-icon-default',{ userData:decodeToken(req.cookies.token) });
};

exports.homeMenuIconHover = async (req, res) => {
    res.render('dashboard/home-menu-icon-hover',{ userData:decodeToken(req.cookies.token) });
};

exports.listPage = async (req, res) => {
    res.render('dashboard/list-page',{ userData:decodeToken(req.cookies.token) });
};
exports.enquiry = async (req, res) => {
    try {
        const userData = decodeToken(req.cookies.token);
        const { page = 1, limit = 10, search = '' } = req.query;

        const query = search ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] } : {};

        const enquiries = await Enquiry.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        const totalEnquiries = await Enquiry.countDocuments(query);

        res.render('dashboard/enquiry', {
            enquiries,
            userData,
            currentPage: page,
            totalPages: Math.ceil(totalEnquiries / limit),
            search
        });
    } catch (error) {
        console.error('Error handling enquiry list:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.login = async (req, res) => {
    res.render('dashboard/login',{ userData:decodeToken(req.cookies.token) });
};

exports.newCategory = async (req, res) => {
    res.render('dashboard/new-category',{ type:"",category:'',userData:decodeToken(req.cookies.token) });
};
exports.editCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const category = await Categories.findById(id);

        if (!category) {
            // Handle the case where the category is not found
            return res.status(404).redirect('/dashboard/category-list')
        }

        res.render('dashboard/new-category', {
            type: "edit",
            category,
            userData: decodeToken(req.cookies.token)
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).render('dashboard/new-category', {
            type: "edit",
            category: null,
            userData: decodeToken(req.cookies.token),
            error: 'An error occurred while fetching the category'
        });
    }
};


exports.postcategory = async (req, res) => {
    try {
        const image = req.file ? req.file.filename : null; // Get the uploaded image filename if it exists
        const { name, description, type, categoryId } = req.body; // Destructure the name, description, type, and categoryId from the request body

        if (type === "edit") {
            // Handle category edit
            const category = await Categories.findById(categoryId);
            
            if (!category) {
                return res.status(404).send("Category not found");
            }

            // If a new image is uploaded, delete the old image file
            if (image && category.images) {
                console.log(category.images)
                fs.unlink(path.join(__dirname, '..', 'public', 'upload', 'single', category.images), err => {
                    if (err) console.error(err);
                });
            }

            category.name = name;
            category.description = description;
            if (image) {
                category.images = image;
            }

            await category.save();

            // Redirect to the category list page
            res.redirect('/dashboard/category-list');
        } else {
            // Handle new category creation
            const newCategory = new Categories({
                name,
                description,
                images:image
            });

            await newCategory.save();

            // Redirect to the category list page
            res.redirect('/dashboard/category-list');
        }
    } catch (error) {
        console.error("Error saving category:", error);
        res.status(500).send("Internal Server Error");
    }
};


exports.deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Categories.findById(categoryId);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Delete the associated image file
        if (category.images) {
            fs.unlink(path.join(__dirname, '..', 'public', 'upload', 'single', category.images), err => {
                if (err) console.error(err);
            });
        }

        await Categories.findByIdAndDelete(categoryId);

        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, message: 'Error deleting category' });
    }
};


exports.newPage = async (req, res) => {
    res.render('dashboard/new-page',{ userData:decodeToken(req.cookies.token) });
};

exports.paymentDetail = async (req, res) => {
    try {
        const userData = decodeToken(req.cookies.token);
        let payment;
        if (userData.role === "admin") {
            payment = await Payment.find();
        } else {
            payment = await Payment.find({ user_id: userData.userId });

        }
        res.render('dashboard/payment-detail', { payment, userData });
    } catch (error) {
        console.error('Error handling payment detail:', error);
        res.status(500).send('Internal Server Error');
    }
};


exports.oderDetail = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('products.product_id');
        const productData = await Product.find();
        
        if (!order) {
            return res.status(404).send('Order not found');
        }
        
       const userId = order.user_id;
        const user = await User.findById(userId).select('name email')
        if (!user) {
                return res.status(404).send('User not found');
        }

        res.render('dashboard/oder-detail', {
            productData,
            order,
            userData: decodeToken(req.cookies.token),
            user
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
};


exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        console.log('Received request to update order status. Order ID:', orderId, 'New Status:', status);

        // Assuming you have an Order model and you want to update the status
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
      

        if (!updatedOrder) {
            console.log('Order not found.');
            return res.status(404).json({ error: 'Order not found' });
        }
        
       const userId = updatedOrder.user_id;
        const user = await User.findById(userId).select('name email')
        if (!user) {
                return res.status(404).send('User not found');
        }

        if (status === 'delivered' || status === 'cancelled') {
            const stockAdjustment = status === 'delivered' ? -1 : 1;
            
            for (const item of updatedOrder.products) {
                await Product.findByIdAndUpdate(item.product_id, {
                    $inc: { stock: item.quantity * stockAdjustment }
                });
            }
        }

         const orderStatusChangeEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Order Status Update</h2>
                <p>Dear ${user.name},</p>
                <p>We wanted to inform you that the status of your order has been updated.</p>
        
            <h3>Order Details:</h3>
            <ul>
                <li><strong>Order ID:</strong> ${orderId}</li>
                
                <li><strong>Current Status:</strong> ${status}</li>
            </ul>
        
        <p>We appreciate your patience and understanding as we process your order.</p>
        
        <p>You can track your order status by visiting <a href="${process.env.SITE_URL}/orderDetails/${orderId}" target="_blank">Track Order</a>.</p>
        
        <p>If you have any questions or concerns, please do not hesitate to contact our customer support team.</p>
        
        <p>Thank you for shopping with us!</p>
        
    </div>
`;

        mailer(user.email, 'Order Status Change', '', 'Your order Status Updated!', orderStatusChangeEmail);
        console.log('Order status updated successfully.');
        return res.status(200).json({ status: updatedOrder.status });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.updatePaymentStatus = async (req, res) => {
    const { orderId, payment_status, payment_method, payment_id } = req.body;
    try {
        // Find the order by orderId
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if payment status is already 'Paid'
        if (order.payment_status === 'Paid') {
            return res.status(400).json({ error: 'Payment status is already Paid. Cannot modify.' });
        }

        // If payment method is 'Manual', check and update payment status
        if (payment_method === 'Manual') {
            // If converting from 'Pending' to 'Paid' in manual mode, require payment_id
            if (payment_status === 'Paid') {
                if (!payment_id) {
                    return res.status(400).json({ error: 'Payment ID is required for Manual payment.' });
                }
                // Update payment status and payment_id
                order.payment_status = payment_status;
                order.payment_method = payment_method;
                order.payment_id = payment_id;
            } else {
                // Directly update payment status for 'Pending' to 'Paid'
                order.payment_status = payment_status;
                order.payment_method = payment_method;
            }
        } else {
            // Update payment status for non-manual methods
            order.payment_status = payment_status;
            order.payment_method = payment_method;
        }

        // Save the updated order
        const updatedOrder = await order.save();

        return res.status(200).json({ orderId: updatedOrder._id, paymentStatus: updatedOrder.payment_status });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



exports.oderList = async (req, res) => {
    try {
        const userData = decodeToken(req.cookies.token);
        const { page = 1, limit = 10, search = '' } = req.query;

        let query = userData.role === "admin" ? {} : { user_id: userData.userId };

        if (search) {
            if (mongoose.Types.ObjectId.isValid(search)) {
                query._id = new mongoose.Types.ObjectId(search);
            } else {
                query._id = { $regex: search, $options: 'i' };
            }
        }

        const orderCount = await Order.countDocuments(query);
        const order = await Order.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.render('dashboard/oder-list', {
            order,
            userData,
            currentPage: parseInt(page),
            totalPages: Math.ceil(orderCount / limit),
            search
        });
    } catch (error) {
        console.error('Error handling order list:', error);
        res.status(500).send('Internal Server Error');
    }
};



exports.oderTracking = async (req, res) => {
    try{
        const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if (!order) {
            return res.status(404).send('Order not found');
        }
     const userId = order.user_id;
    const user = await User.findById(userId).select('name email')
    if (!user) {
            return res.status(404).send('User not found');
    }
    res.render('dashboard/oder-tracking',{ user,order,userData:decodeToken(req.cookies.token) });
    }
    catch(error){
         res.status(500).send(error.message);
    }
};

exports.productList = async (req, res) => {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};

    try {
        const productCount = await Product.countDocuments(query);
        const products = await Product.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.render('dashboard/product-list', {
            products,
            userData: decodeToken(req.cookies.token),
            currentPage: parseInt(page),
            totalPages: Math.ceil(productCount / limit),
            search
        });
    } catch (error) {
        res.status(500).send(error);
    }
};

exports.userReport = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.redirect('/dashboard/all-user')
    }

        // Fetch user details
        const user = await User.findById(userId)
            .populate('wishlist.product_id')
            .populate('cart.product_id')
            .populate('reviews');
        console.log(user)
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const { page = 1, limit = 10, search = '' } = req.query;

        let query = { user_id: userId};

        if (search) {
            if (mongoose.Types.ObjectId.isValid(search)) {
                query._id = new mongoose.Types.ObjectId(search);
            } else {
                query._id = { $regex: search, $options: 'i' };
            }
        }

        const orderCount = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit)).populate('products.product_id');
        // Calculate total order value and total delivered items
        let totalOrderAmount = 0;
        orders.forEach(order => {
            totalOrderAmount += order.total_amount;
        });


        res.render('dashboard/user-report', {
            userData: decodeToken(req.cookies.token),
            user,
            orders,
            totalOrderAmount,
            currentPage: parseInt(page),
            totalPages: Math.ceil(orderCount / limit),
            search
        });
    } catch (error) {
        console.error('Error fetching user report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


exports.setting = async (req, res) => {
    try {
        if (req.method === 'GET') {
            const settings = await Settings.findById("6666dde311c07f0f762377c6");
            res.render('dashboard/setting', { settings, userData: decodeToken(req.cookies.token) });
        } else if (req.method === 'POST') {
            const updatedData = req.body; // Assuming all the form fields are sent in the request body
            await Settings.findByIdAndUpdate("6666dde311c07f0f762377c6", updatedData);
            res.redirect('/dashboard/setting');
        }
    } catch (error) {
        console.error('Error handling settings:', error);
        res.status(500).send('Internal Server Error');
    }
};
exports.profile = async (req, res) => {
    try {
        const userData = decodeToken(req.cookies.token);
        
        if (req.method === 'GET') {
            const profile = await User.findOne({ email: userData.email });
            if (!profile) {
                // Handle the case where the profile data is not found
                return res.status(404).send('Profile not found');
            }
            res.render('dashboard/profile', { profile, userData });
        } else if (req.method === 'POST') {
            const { password, cpassword, ...otherData } = req.body; // Destructure password and cpassword from the request body

            // Check if a new password is provided and if it matches the confirmation password
            if (password && password === cpassword) {
                const hashedPassword = await bcrypt.hash(password, 10);
                otherData.password = hashedPassword;
            } else if (password && password !== cpassword) {
                // Handle the case where passwords don't match
                return res.status(400).send('Passwords do not match');
            }

            // Handle the address separately
            const address = {
                address_line1: req.body.address_line1 || '',
                address_line2: req.body.address_line2 || '',
                city: req.body.city || '',
                state: req.body.state || '',
                zip_code: req.body.zip_code || '',
                country: req.body.country || ''
            };

            // Update user data
            const updatedUserData = { ...otherData, addresses: address };
            await User.findOneAndUpdate({ email: userData.email }, updatedUserData);
            res.redirect('/dashboard/profile');
        }
    } catch (error) {
        console.error('Error handling profile:', error);
        res.status(500).send('Internal Server Error');
    }
};




exports.signUp = async (req, res) => {
    res.render('dashboard/sign-up',{ userData:decodeToken(req.cookies.token) });
};

exports.states = async (req, res) => {
    res.render('dashboard/states',{ userData:decodeToken(req.cookies.token) });
};

module.exports = exports;
