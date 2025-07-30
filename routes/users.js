const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const pool = require("../db")
const { authenticateToken } = require('../middleware/authMiddleware')
const router = express.Router()

// 🌴Register User
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  // invalid password pattern
  if (!password || password.trim() === '') {
    return res.status(400).json({ message: 'Password cannot be empty' })
  }

  // hashed password for secure
  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await pool.query('INSERT INTO users(name, email, password, status) VALUES ($1,$2,$3, $4) RETURNING id, name, email, registration_time',
      [name, email, hashedPassword, 'active'])

    res.status(201).json(newUser.rows[0])

  } catch (error) {
    // console.log(error);
    res.status(500).json({ message: 'User Already registered using this email' })

  }
})

// 🌴Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const userResult = await pool.query('Select * From users WHERE email =$1', [email])
    const user = userResult.rows[0]

    if (!user) {
      return res.status(401).json({ message: 'Invalid Credentials' })
    }

    if (user.status === "blocked") {
      return res.status(403).json({ message: 'Your account has been Blocked' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid Credentials' })
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])

    // token create
    const token = jwt.sign(
      { userId: user.id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' }
    )
    // console.log(token);

    res.json({ token, userId: user.id, name: user.name })

  } catch (error) {
    console.log("Login Error:", error);
    res.status(500).json({ message: 'Login failed due to Server Interruption' })
  }
})

// 🌴 Get all Users 
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, status, registration_time, last_login FROM users ORDER BY last_login DESC NULLS LAST'
    )
    res.json(result.rows)
  } catch (error) {
    console.log("Get users Error", error);
    res.status(500).json({ message: 'Server error while fetching users.' })
  }
})

// 🌴 update user
router.patch('/status', authenticateToken, async (req, res) => {
  const { userIds, status } = req.body

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'User IDs must be a non-empty array' })
  }
  if (!['active', 'blocked'].includes(status)) {
    return res.status(400).json({ message: "Invalid status. Must be 'active' or 'blocked'." });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET status = $1 WHERE id = ANY($2) RETURNING id, status',
      [status, userIds]
    );

    const loggedInUserId = req.user.userId;
    const selfBlocked = userIds.includes(loggedInUserId) && status === 'blocked';

    res.json({
      message: `Successfully updated ${result.rowCount} users.`,
      selfBlocked: selfBlocked
    });

  } catch (error) {
    console.error("Status Update Error:", error);
    res.status(500).json({ message: 'Server error while updating status.' });
  }
})

// 🌴 Delete Users
router.delete('/', authenticateToken, async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'User IDs must be a non-empty array.' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = ANY($1)',
      [userIds]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No matching users found to delete.' });
    }

    const loggedInUserId = req.user.userId;
    const selfDeleted = userIds.includes(loggedInUserId);

    res.json({
      message: `Successfully deleted ${result.rowCount} users.`,
      selfDeleted: selfDeleted
    });

  } catch (error) {
    console.error("Delete Users Error:", error);
    res.status(500).json({ message: 'Server error while deleting users.' });
  }
});



module.exports = router;
