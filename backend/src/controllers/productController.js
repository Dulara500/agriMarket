const pool = require('../config/db');

// GET /api/products
const getAllProducts = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    let query = `
      SELECT p.*, 
             gp.price_per_unit as government_price,
             gp.effective_date as price_effective_date,
             COUNT(DISTINCT fp.id) FILTER (WHERE fp.is_available AND fp.stock_quantity > 0) as available_farmers
      FROM products p
      JOIN government_prices gp ON gp.product_id = p.id AND gp.is_active = true
      LEFT JOIN farmer_products fp ON fp.product_id = p.id
      WHERE p.is_active = true
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND p.name ILIKE $${params.length}`;
    }
    if (category) {
      params.push(category);
      query += ` AND p.category = $${params.length}`;
    }

    query += ` GROUP BY p.id, gp.price_per_unit, gp.effective_date ORDER BY p.name`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/categories
const getCategories = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT p.category 
       FROM products p
       JOIN government_prices gp ON gp.product_id = p.id AND gp.is_active = true
       WHERE p.is_active = true AND p.category IS NOT NULL 
       ORDER BY p.category`
    );
    res.json({ success: true, data: result.rows.map(r => r.category) });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id
const getProduct = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*, gp.price_per_unit as government_price, gp.effective_date as price_effective_date
       FROM products p
       JOIN government_prices gp ON gp.product_id = p.id AND gp.is_active = true
       WHERE p.id = $1 AND p.is_active = true`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id/farmers
const getProductFarmers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT fp.id as farmer_product_id, fp.stock_quantity, fp.is_available,
              u.id as farmer_id, u.name as farmer_name, u.avatar_url,
              u.phone as farmer_phone, u.email as farmer_email,
              u.location_address,
              prof.farm_name, prof.rating_avg, prof.total_ratings, prof.is_verified,
              -- Mock distance in km (2–50 range based on hash)
              ROUND((ABS(HASHTEXT(u.id::text)) % 490 + 20) / 10.0, 1) as distance_km
       FROM farmer_products fp
       JOIN users u ON u.id = fp.farmer_id
       LEFT JOIN farmer_profiles prof ON prof.farmer_id = fp.farmer_id
       WHERE fp.product_id = $1 AND fp.is_available = true AND fp.stock_quantity > 0 AND u.is_active = true
       ORDER BY prof.rating_avg DESC, fp.stock_quantity DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllProducts, getCategories, getProduct, getProductFarmers };
