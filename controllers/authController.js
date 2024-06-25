const User = require('../models/user'); // Assuming your User model is in models/User.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mailer = require('./emailsender');
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
            isLoggedIn: true,
            wishlistCount: user.wishlist.length,
            cartCount: user.cart.length
        });
        mailer(user.email, '', '', `Welcome back, ${user.name}! 👋`, `
            <div class="container">
                <h1>Welcome back, <b>${user.name}</b>!</h1>
                <p>We hope that you are enjoying our services! Kindly start your shopping.<br>
                You logged in at: <strong>${new Date().toLocaleString()}</strong></p>
            </div>
        `);

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

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        console.log(token)
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Email verification token is invalid or has expired.' });
        }

        user.is_verified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        const verificationEmail = `
            <div class="container">
                <h1>Welcome, <b>${user.name}</b>!</h1>
                <p>Thank you for verifying your email. You can login Now.</p>
                <a href="http://${req.headers.host}/my-account">Login</a>
            </div>
        `;

        mailer(newUser.email, '', '', 'Email Verification - The Pallu Story', verificationEmail);
        res.redirect('/account')
    } catch (error) {
        console.log('verifyEmail error', error);
        res.status(500).json({ error: 'An error occurred during email verification. Please try again.' });
    }
};


exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: 'No account with that email address exists.' });
        }

        const resetPasswordToken = crypto.randomBytes(20).toString('hex');
        const resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.resetPasswordToken = resetPasswordToken;
        user.resetPasswordExpires = resetPasswordExpires;
        await user.save();

        const resetEmail = `
            <div class="container">
                <p>You requested a password reset. Please click the link below to reset your password:</p>
                <a href="http://${req.headers.host}/reset-password/${resetPasswordToken}">Reset Password</a>
            </div>
        `;

        mailer(user.email, '', '', 'Password Reset - The Pallu Story', resetEmail);

        res.status(200).json({ success: true, message: 'Password reset email sent.' });
    } catch (error) {
        console.log('forgotPassword error', error);
        res.status(500).json({ error: 'An error occurred while sending password reset email. Please try again.' });
    }
};


exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, cpassword } = req.body;
        if (password !== cpassword) {
            return res.status(400).json({ error: 'Passwords do not match.' });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
        }

        const saltRounds = 10;
        user.password = await bcrypt.hash(password, saltRounds);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        const resetEmail = `
            <div class="container">
                <p>Attention : Password Changed!</p>
            </div>
        `;

        mailer(user.email, '', '', 'Password Reset - The Pallu Story', resetEmail);

        res.status(200).json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
    } catch (error) {
        console.log('resetPassword error', error);
        res.status(500).json({ error: 'An error occurred while resetting password. Please try again.' });
    }
};


exports.logout = async (req, res) => {
    try {
        if (req.cookies && req.cookies.token) {
            try {
                const tokenData = jwt.verify(req.cookies.token, process.env.JWT_SECRET).data;
                mailer(tokenData.email, '', '', `Bye ! ${tokenData.name} 👋 `, `
                    <div class="container">
                        <h1>Bye! <b>${tokenData.name}</b></h1>
                        <p>We hope that you have enjoyed our store services! Kindly visit again at your loved store.<br>
                        You logged out at: <strong>${new Date().toLocaleString()}</strong></p>
                    </div>
                `);
                const userEmail = tokenData.email || 'Unknown';
                
                console.log(`Logout: ${userEmail}`);

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
            return res.status(400).json({ error: 'You must agree to the terms and conditions.' });
        }

        if (!password || !cpassword) {
            return res.status(400).json({ error: 'Password and Confirm Password fields are required.' });
        }

        if (password !== cpassword) {
            return res.status(400).json({ error: 'Passwords do not match.' });
        }

        const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long and contain at least one special character.' });
        }

        const user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ error: 'User already exists. Please sign in.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const emailVerificationToken = crypto.randomBytes(20).toString('hex');
        const emailVerificationExpires = Date.now() + 3600000; // 1 hour

        const newUser = new User({
            name: username,
            email,
            password: hashedPassword,
            role: 'user',
            is_verified: false,
            emailVerificationToken,
            emailVerificationExpires
        });

        const verificationEmail = `
            <div class="container">
                <h1>Welcome, <b>${newUser.name}</b>!</h1>
                <p>Thank you for registering. Please verify your email by clicking the link below:</p>
                <a href="https://${req.headers.host}/verify-email/${emailVerificationToken}">Verify Email</a>
            </div>
        `;

        mailer(newUser.email, '', '', 'Email Verification - The Pallu Story', verificationEmail);

        await newUser.save();

        res.status(200).json({ success: true, message: 'Account created. Please verify your email.' });
    } catch (error) {
        console.log('register error', error);
        res.status(500).json({ error: 'An error occurred during registration. Please try again.' });
    }
};



module.exports = exports;