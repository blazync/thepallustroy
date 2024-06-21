const jwt = require('jsonwebtoken');
const generateAccessToken = (payload) => {
    const token = jwt.sign({ data: payload }, process.env.JWT_SECRET, { expiresIn: '30m' });
    return token;
};
  
// cache store
const saveTokenInCookie = (res, token) => {
    // Save the token in the cookies
    res.cookie('token', token, {
      httpOnly: true, // Ensures the cookie is only accessible via HTTP(S) and not by client-side scripts
      secure: process.env.NODE_ENV === 'production', // Ensures the cookie is only sent over HTTPS in production
      maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
    });
  };

  module.exports = { generateAccessToken,saveTokenInCookie };
