const Order = require('../models/orders');
const User = require('../models/user');
const { Cashfree } = require("cashfree-pg");
const { decodeToken } =  require('../middlewares/decodeJwt');
require('dotenv').config();
const mongoose = require('mongoose');
const base_url = "";
const Settings = require('../models/setting');

// Set Cashfree credentials and environment
Cashfree.XClientId = process.env.XClientId;
Cashfree.XClientSecret = process.env.XClientSecret;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX; // Use SANDBOX for testing

function generateOrderId() {
    const timestamp = Date.now().toString(36); // Convert current timestamp to base36 string
    const randomString = Math.random().toString(36).substring(2, 8); // Generate random string
    return `${timestamp}-${randomString}`; // Combine timestamp and random string
}

const createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Decode user data from token
        const userData = decodeToken(req.cookies.token);
        const settings = await Settings.findOne();

        // Extract order details from request body
        const { customer_id, customer_phone, customer_name, customer_email, products, serviceFee, deliveryCharges,shipping_address,totalprice } = req.body;

        // Validate user data
        if (!userData || !userData.userId) {
            throw new Error('Invalid user data');
        }

        // Validate request data
        if (!products || !products.length) {
            return res.status(400).send('Invalid request: No products provided');
        }

        // Create order items from products array
        const orderItems = products.map(product => ({
            product_id: product.product_id,
            name: product.name,
            price: parseFloat(product.price),
            quantity: parseInt(product.quantity),
            total_value: (parseFloat(product.price) * parseInt(product.quantity)) 
        }));

        let deliveryCharge = settings.deliveryCharges;

        if (totalprice > 299) {
            deliveryCharge = 0;
        }
        


        // Calculate total amount from products
        const totalAmount = orderItems.reduce((total, item) => total + item.total_value, 0)+settings.serviceFee+deliveryCharge;
        const totalOrderAmount = totalAmount;
        const order_id = generateOrderId();
        // Create order object
        const order = new Order({
            user_id: userData.userId,
            order_id:order_id,
            products: orderItems,
            total_amount: totalOrderAmount,
            shipping_address, // Replace with actual shipping address if available
            status: "receiving_orders",
            payment_status: "Pending",
            payment_id:null,
            serviceFee,
            deliveryCharges,
            created_at: new Date(),
            updated_at: new Date()
        });
        console.log(req.body);

        // Save the order in the database within the transaction
        await order.save({ session });

        

        // Create order request object for Cashfree
        const request = {
            order_amount: totalOrderAmount.toFixed(2),
            order_currency: 'INR',
            order_id: order_id,
            customer_details: {
                customer_id: userData.userId,
                customer_phone: customer_phone || userData.phone || '+919470345817', // Use provided phone number or default
                customer_name: customer_name || userData.name,
                customer_email: customer_email || userData.email
            },
            order_meta: {
                return_url: "http://localhost:5000/order-confirmation/?order_id={order_id}",
                notify_url: "http://localhost:5000/payment/webhook",
                payment_methods: "cc,dc,ppc,ccc,emi,paypal,upi,nb,app,paylater"
            },
            order_expiry_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            order_note: "Order no. #"+order_id,
            order_tags: {
                name: order_id,
                company: "The Pallu Story"
            }
        };

        // Call Cashfree API to create order
        const response = await Cashfree.PGCreateOrder("2023-08-01", request);
        console.log(response);

        // Extract paymentSessionId from response
        const paymentSessionId = response.data.payment_session_id;

        // Commit the transaction
        await session.commitTransaction();

        // Send response to frontend
        res.json({ paymentSessionId });
    } catch (error) {
        // If an error occurred, abort the transaction and roll back changes
        await session.abortTransaction();
        console.error('Error:', error.response ? error.response.data.message : error.message);
        res.status(500).send('Failed to create order');
    } finally {
        // End the session
        session.endSession();
    }
};
const verifyOrder = async (req, res) => {
    const order_id = req.query.order_id;
    console.log(order_id);
    const userData = decodeToken(req.cookies.token);
    try {
        // Fetch order payments from Cashfree
        const response = await Cashfree.PGOrderFetchPayments('2023-08-01', order_id);
        console.log(response.data);
        
        // Process the response data to determine the order status
        const transactions = response.data || [];
        let orderStatus;
  
        console.log(transactions);
        if (transactions.filter(transaction => transaction.payment_status === 'SUCCESS').length > 0) {
            orderStatus = 'Success';
        } else if (transactions.filter(transaction => transaction.payment_status === 'PENDING').length > 0) {
            orderStatus = 'Pending';
        } else {
            orderStatus = 'Failure';
        }
        
        // Extract the payment_id from the successful transaction, if exists
        const successfulTransaction = transactions.find(transaction => transaction.payment_status === 'SUCCESS');
        const payment_id = successfulTransaction ? successfulTransaction.cf_payment_id : null;

        // Update order status in the database
        if (orderStatus === 'Success') {
            await Order.findOneAndUpdate(
                { order_id: order_id },
                { 
                    status: 'Completed', 
                    payment_status: 'Paid',
                    payment_id: payment_id 
                }
            );
             if (userData) {

            // Find the user by their email
            const user = await User.findOne({ email: userData.email });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (userData) {
                const user = await User.findOne({ email: userData.email });
                if (!user) {
                return res.status(404).json({ message: 'User not found' });
                }

                // Clear the user's cart entirely after successful payment
                user.cart = [];

                await user.save();
            } else {
                res.redirect('/shopping-cart');
            }

            // Save the updated user document
            await user.save();
        } else {
            res.redirect('/shopping-cart');
        }
        let paymentSuccess = true;
            // Redirect to the order page
            res.redirect('/account');
        } else if (orderStatus === 'Pending') {
            await Order.findOneAndUpdate(
                { order_id: order_id },
                { 
                    status: 'Pending', 
                    payment_status: 'Pending' 
                }
            );
            // Redirect to the order page with pending status
            res.redirect('/web/shopping-cart');
        } else {
            await Order.findOneAndUpdate(
                { order_id: order_id },
                { 
                    status: 'Failed', 
                    payment_status: 'Failed' 
                }
            );
            // Redirect to a payment failure page
            res.redirect('/web/shopping-cart');
        }
    } catch (error) {
        console.error('Payment verification failed:', error.message);
        res.status(500).send('Payment verification failed');
    }
};


 
const paymentWebhook = async (req, res) => {
    try {
        // Verify webhook signature
        Cashfree.PGVerifyWebhookSignature(req.headers["x-webhook-signature"], req.rawBody, req.headers["x-webhook-timestamp"]);

        const { order_id, order_status } = req.body;

        if (order_status === 'PAID') {
            // Update order status in database
            await Order.findOneAndUpdate({ _id: order_id }, { status: 'Completed', payment_status: 'Paid' });

            // Empty the cart
            await Cart.deleteMany({ user_id: req.body.customer_details.customer_id });

            // Respond to webhook
            res.status(200).send('Webhook received');
        } else {
            // Handle other statuses
            await Order.findOneAndUpdate({ _id: order_id }, { status: 'Failed', payment_status: 'Failed' });
            res.status(200).send('Webhook received');
        }
    } catch (err) {
        console.error('Webhook verification failed:', err.message);
        res.status(400).send('Webhook verification failed');
    }
};

module.exports = { createOrder,paymentWebhook,verifyOrder };
