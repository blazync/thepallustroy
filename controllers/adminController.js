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
const mongoose = require('mongoose');

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
            userOrders = await Order.find();
            // Calculate total payment earned
            totalPaymentEarned = orders.reduce((acc, order) => acc + order.total_amount, 0);
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
exports.deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        await Product.findByIdAndDelete(productId);
        // Redirecting to the product list page with success message
        res.redirect('/dashboard/product-list?success=Product deleted successfully');
    } catch (error) {
        console.error('Error deleting product:', error);
        // Redirecting to the product list page with error message
        res.redirect('/dashboard/product-list?error=Error deleting product');
    }
};


exports.postProduct = async (req, res) => {
    if (req.body.type === "edit") {
        const productId = req.body.productId; // Assuming the ID of the product to edit is passed in the request body
        try {
            const images = req.file ? req.file.filename : req.body.images; // Use existing images if no new file is uploaded

            // Extracting data from req.body
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
            } = req.body;

            // Find the product by ID and update it
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
                categories, // Assuming categories is a comma-separated string
                occasion, // Assuming occasion is a comma-separated string
                collection,
                brand,
                place_of_manufacture,
                caution,
                contents,
                images, // Assuming images is a comma-separated string
                stock,
                views,
            });

            // Redirecting to the product list page with success message
            res.redirect('/dashboard/product-list');
        } catch (error) {
            console.error('Error editing product:', error);
            // Redirecting to the add product page with error message
            res.redirect('/dashboard/add-product?error=Error editing product');
        }
    } else {
        const images = req.file ? req.file.filename : null;
        try {
            // Extracting data from req.body
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
            } = req.body;

            // Check for existing product with the same name or SKU
            const existingProduct = await Product.findOne({ $or: [{ name }, { sku }] });

            if (existingProduct) {
                // Redirecting to the add product page with error message if product already exists
                return res.redirect('/dashboard/add-product?error=Product with the same name or SKU already exists');
            }

            // Creating a new product
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
                categories, // Assuming categories is a comma-separated string
                occasion, // Assuming occasion is a comma-separated string
                collection,
                brand,
                place_of_manufacture,
                caution,
                contents,
                images, // Assuming images is a comma-separated string
                stock,
                views,
            });

            // Saving the new product to the database
            await newProduct.save();

            // Redirecting to the product list page with success message
            res.redirect('/dashboard/product-list');
        } catch (error) {
            console.error('Error adding product:', error);
            // Redirecting to the add product page with error message
            res.redirect('/dashboard/add-product?error=Error adding product');
        }
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
        const { name, description, type } = req.body; // Destructure the name, description, and type from the request body

        if (type === "edit") {
            console.log(req.body);
            // Handle category edit
            const categoryId = req.body.categoryId; // Assuming the category ID is passed as a route parameter
            const updatedCategory = await Categories.findByIdAndUpdate(categoryId, {
                name,
                description,
                image
            });

            if (!updatedCategory) {
                return res.status(404).send("Category not found");
            }

            // Redirect to the category list page
            res.redirect('/dashboard/category-list');
        } else {
            // Handle new category creation
            // Create a new category instance
            const newCategory = new Categories({
                name,
                description,
                image
            });

            // Save the category to the database
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
        const deletedCategory = await Category.findByIdAndDelete(categoryId);
        if (!deletedCategory) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
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
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    const productData = await Product.find();
    res.render('dashboard/oder-detail',{ productData,order,userData:decodeToken(req.cookies.token) });
};
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        console.log('Received request to update order status. Order ID:', orderId, 'New Status:', status);

        // Assuming you have an Order model and you want to update the status
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
        console.log('Updated order:', updatedOrder);

        if (!updatedOrder) {
            console.log('Order not found.');
            return res.status(404).json({ error: 'Order not found' });
        }

        console.log('Order status updated successfully.');
        return res.status(200).json({ status: updatedOrder.status });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.updatePaymentStatus = async (req, res) => {
    const { orderId, paymentStatus } = req.body;
    
    try {
        // Find the order by orderId and update its payment status
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { payment_status: paymentStatus }, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

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
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    res.render('dashboard/oder-tracking',{ order,userData:decodeToken(req.cookies.token) });
};

exports.productList = async (req, res) => {
    const { page = 1, limit = 3, search = '' } = req.query;
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

exports.report = async (req, res) => {
    
    res.render('dashboard/report',{ userData:decodeToken(req.cookies.token) });
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
