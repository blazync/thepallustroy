const jwt = require('jsonwebtoken');
require('dotenv').config();
const secretKey = process.env.JWT_SECRET;

const decodeToken = (token) => {
  try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      return decodedToken.data;
  } catch (error) {
      console.error('Error decoding token:', error);
      return null;
  }
};
module.exports = { decodeToken };