const jwt = require('jsonwebtoken');
require('dotenv').config();
const secretKey = process.env.JWT_SECRET;
const { decodeToken } = require('./decodeJwt');

const checkAdmin = (req, res, next) => {
  try {
    const userData = decodeToken(req.cookies.token);
    if (userData.role === "admin") {
      next();
    } else {
      res.status(403).render('error/access-denied'); // Render the "Access Denied" page
    }
  } catch (error) {
    console.error('Error in checkAdmin middleware:', error);
    res.status(500).render('error/error', { message: 'Internal Server Error' }); // Render a general error page
  }
};

module.exports = { checkAdmin };
