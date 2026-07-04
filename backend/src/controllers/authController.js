const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { name, email, phone, password, role, farm_name, bio, address, id_number } = req.body;

    if (!name || !password || !role || !id_number) {
      return res.status(400).json({ success: false, message: 'Name, password, role, and ID number are required' });
    }
    if (!['buyer', 'farmer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be buyer or farmer' });
    }
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' });
    }

    await client.query('BEGIN');

    // Check existing
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email || null, phone || null]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'User already exists with this email or phone' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role, id_number)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, phone, role, id_number, created_at`,
      [name, email || null, phone || null, password_hash, role, id_number]
    );

    const user = userResult.rows[0];

    // Create farmer profile if needed
    if (role === 'farmer') {
      await client.query(
        `INSERT INTO farmer_profiles (farmer_id, farm_name, bio, address) VALUES ($1, $2, $3, $4)`,
        [user.id, farm_name || name + "'s Farm", bio || '', address || '']
      );
    }

    // Create cart for buyer
    if (role === 'buyer') {
      await client.query('INSERT INTO carts (buyer_id) VALUES ($1)', [user.id]);
    }

    await client.query('COMMIT');

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user, token }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    if (!password || (!email && !phone)) {
      return res.status(400).json({ success: false, message: 'Email/phone and password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR phone = $2',
      [email || '', phone || '']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: userWithoutPassword, token }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar_url, u.id_number,
              u.location_lat, u.location_lng, u.location_address, u.created_at,
              fp.farm_name, fp.bio, fp.address as farm_address, fp.rating_avg, 
              fp.total_ratings, fp.is_verified
       FROM users u
       LEFT JOIN farmer_profiles fp ON fp.farmer_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/profile
const updateProfile = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { name, phone, location_address, location_lat, location_lng, farm_name, bio, address, id_number } = req.body;
    await client.query('BEGIN');

    await client.query(
      `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone),
       location_address = COALESCE($3, location_address),
       location_lat = COALESCE($4, location_lat),
       location_lng = COALESCE($5, location_lng),
       id_number = COALESCE($6, id_number), updated_at = NOW()
       WHERE id = $7`,
      [name, phone, location_address, location_lat, location_lng, id_number, req.user.id]
    );

    if (req.user.role === 'farmer') {
      await client.query(
        `UPDATE farmer_profiles SET 
         farm_name = COALESCE($1, farm_name), bio = COALESCE($2, bio), address = COALESCE($3, address)
         WHERE farmer_id = $4`,
        [farm_name, bio, address, req.user.id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// PATCH /api/auth/location
const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng, address } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }
    const result = await pool.query(
      `UPDATE users SET location_lat = $1, location_lng = $2, location_address = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, email, phone, role, avatar_url, id_number,
                 location_lat, location_lng, location_address, created_at`,
      [lat, lng, address || null, req.user.id]
    );
    res.json({ success: true, data: result.rows[0], message: 'Location saved successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateProfile, updateLocation };
