const User = require('../models/user'); // Assuming your User model is in models/User.js
const bcrypt = require('bcryptjs');
// const mailer = require('./emailsender');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const { generateAccessToken, saveTokenInCookie } = require('../middlewares/jwt');




exports.postlogin = async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);

    try {
        // Find user by email
        const user = await User.findOne({ email });

        // Check if user exists
        if (!user) {
            return res.redirect('web/my-account', { error: 'User not found' });
        }
        console.log(user);
        // Validate password (compare hashed passwords)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.redirect('web/my-account', { error: 'Invalid password' });
        }

        console.log('Login Successfully', user.email);

        // Generate a token
        const token = generateAccessToken({
            userId:user._id, 
            email: user.email,
            name: user.name?user.name:user.role,
            role: user.role,
            isLoggedIn: true
        });

        // Save token in a cookie
        saveTokenInCookie(res, token);

        // Redirect based on user role with success message
        if(user.role == "user"){
            return res.redirect('/');    
        }else{
            return res.redirect('/dashboard/');    
        }    

    } catch (error) {
        console.error('Login error:', error);
        return res.redirect('/my-account?error=Internal%20server%20error');
    }
};

exports.logout = async (req, res) => {
    try {
        if (req.cookies && req.cookies.token) {
            try {
                const tokenData = jwt.verify(req.cookies.token, process.env.JWT_SECRET).data;
                const userEmail = tokenData.email || 'Unknown';
                
                console.log(`Logout: ${userEmail}`);
                // mailer(userEmail, '', '', `Bye ! ${userName} 👋 `, `
                //     <div class="container">
                //         <h1>Bye! <b>${userName}</b></h1>
                //         <p>We hope that you have enjoyed our store services! Kindly visit again at your loved store.<br>
                //         You logged out at: <strong>${new Date().toLocaleString()}</strong></p>
                //     </div>
                // `);

                // Clear the token cookie
                res.clearCookie('token');

                // Destroy the session
                req.session.destroy((err) => {
                    if (err) {
                        console.error('Error destroying session:', err);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }
                    res.redirect('/');
                });
            } catch (err) {
                console.error('Error verifying JWT:', err);
                console.log({ error: 'Invalid Token' });
                return res.redirect('/');
            }
        } else {
            // If no token is found, just redirect to the index page
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.postregister = async (req, res) => {
    try {
        const { username, email, password, cpassword, agree } = req.body;

        if (!agree) {
            return res.render('web/register', { error: 'Terms and Conditions not Agreed' });
        }

        if (!password || !cpassword || password !== cpassword) {
            return res.render('web/register', { error: 'Passwords do not match' });
        }

        const user = await User.findOne({ email });

        if (user) {
            return res.render('web/register', { error: 'User already exists. Please sign in.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            name: username,
            email,
            password: hashedPassword,
            role: 'user'
        });

        await newUser.save();

        res.redirect('/my-account');
    } catch (error) {
        console.log('register error', error);
        res.redirect('/register');
    }
};

module.exports = exports;