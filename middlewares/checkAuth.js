const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const checkAuth = (req, res, next) => {
  try {
    // Check if the user is logged in via session
    if (req.cookies && req.cookies.isLoggedIn) {
      return next();
    }

    // If no session, check the token in cookies
    const token = req.cookies.token;

    if (!token) {
      // If no token is present, respond with unauthorized access
      console.log({ message: 'Unauthorized access & token does not exist' });
      return res.redirect('/my-account'); // Ensure to return here
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the token has expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      console.log({ message: 'Unauthorized access, token expired' });
      return res.redirect('/my-account'); // Ensure to return here
    }

    // Attach the decoded token data to the request object
    req.user = decoded;

    // If token is valid and not expired, allow access to the next middleware or route handler
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      console.log({ message: 'Unauthorized access, token expired' });
      return res.redirect('/my-account');
    } else if (error.name === 'JsonWebTokenError') {
      console.log({ message: 'Unauthorized access, invalid token' });
      return res.redirect('/my-account');
    } else {
      // General error handling
      console.log('Error verifying token');
      return res.redirect('/my-account');
    
    }
  }
};




module.exports = { checkAuth };
