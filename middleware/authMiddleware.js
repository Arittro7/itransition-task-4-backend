const jwt = require('jsonwebtoken')
const pool = require('../db')

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']

  // if authenticate failed
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(400).json({ message: "🚫 Access denied. Valid Token is required" })
  }

  // extract token only
  const token = authHeader.split(' ')[1]
  // console.log('Extracted Token:', token);

  try {
    const verify = jwt.verify(token, process.env.JWT_SECRET)
    // console.log('Verify Token authM:', verify);

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [verify.userId])

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'User not Found. Please try again' })
    }

    const user = userResult.rows[0]

    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'This USER ID has been blocked' })
    }

    req.user = verify
    next()

  } catch (error) {
    // console.log(error);
    if(error.name === 'TokenExpiredError'){
      return res.status(401).json({message : 'Token has expired, please login again'})
    }
    return res.status(401).json({message: 'Invalid token'})

  }

}

module.exports = {authenticateToken}