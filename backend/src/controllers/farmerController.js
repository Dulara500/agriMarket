const pool = require('../config/db');

// GET /api/farmer/products
const getMyProducts = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT fp.*, p.name, p.description, p.category, p.image_url, p.unit,
              gp.price_per_unit as government_price
       FROM farmer_products fp
       JOIN products p ON p.id = fp.product_id
       LEFT JOIN government_prices gp ON gp.product_id = p.id AND gp.is_active = true
       WHERE fp.farmer_id = $1
       ORDER BY p.name`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/products (all products for farmer to pick from)
const getAllProductsForFarmer = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*, gp.price_per_unit as government_price,
              CASE WHEN fp.id IS NOT NULL THEN true ELSE false END as already_listed
       FROM products p
       LEFT JOIN government_prices gp ON gp.product_id = p.id AND gp.is_active = true
       LEFT JOIN farmer_products fp ON fp.product_id = p.id AND fp.farmer_id = $1
       WHERE p.is_active = true ORDER BY p.name`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/farmer/products
const addProduct = async (req, res, next) => {
  try {
    const { product_id, stock_quantity } = req.body;
    if (!product_id || stock_quantity === undefined) {
      return res.status(400).json({ success: false, message: 'product_id and stock_quantity required' });
    }

    const result = await pool.query(
      `INSERT INTO farmer_products (farmer_id, product_id, stock_quantity) 
       VALUES ($1, $2, $3)
       ON CONFLICT (farmer_id, product_id) DO UPDATE SET stock_quantity = $3, is_available = true, updated_at = NOW()
       RETURNING *`,
      [req.user.id, product_id, stock_quantity]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Product listed successfully' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/farmer/products/:id/stock
const updateStock = async (req, res, next) => {
  try {
    const { stock_quantity, is_available } = req.body;
    const result = await pool.query(
      `UPDATE farmer_products 
       SET stock_quantity = COALESCE($1, stock_quantity),
           is_available = COALESCE($2, is_available),
           updated_at = NOW()
       WHERE id = $3 AND farmer_id = $4
       RETURNING *`,
      [stock_quantity, is_available, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Stock updated' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/farmer/products/:id
const removeProduct = async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM farmer_products WHERE id = $1 AND farmer_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product removed from listings' });
  } catch (err) {
    next(err);
  }
};

// GET /api/farmer/stats
const getFarmerStats = async (req, res, next) => {
  try {
    const [ordersRes, revenueRes, productsRes, profileRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total, 
        COUNT(*) FILTER (WHERE status='pending') as pending,
        COUNT(*) FILTER (WHERE status='accepted') as accepted,
        COUNT(*) FILTER (WHERE status='completed') as completed
        FROM orders WHERE farmer_id = $1`, [req.user.id]),
      pool.query(`SELECT COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0) as monthly_revenue
        FROM orders WHERE farmer_id = $1 AND status = 'completed'`, [req.user.id]),
      pool.query(`SELECT COUNT(*) as total FROM farmer_products WHERE farmer_id = $1 AND is_available = true`, [req.user.id]),
      pool.query(`SELECT rating_avg, total_ratings FROM farmer_profiles WHERE farmer_id = $1`, [req.user.id]),
    ]);

    res.json({
      success: true,
      data: {
        orders: ordersRes.rows[0],
        revenue: revenueRes.rows[0],
        products: productsRes.rows[0],
        profile: profileRes.rows[0],
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/farmer/earnings
const getEarnings = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        DATE_TRUNC('month', o.created_at) as month,
        COUNT(o.id) as orders,
        SUM(o.total_amount) as revenue
       FROM orders o
       WHERE o.farmer_id = $1 AND o.status = 'completed'
       GROUP BY DATE_TRUNC('month', o.created_at)
       ORDER BY month DESC
       LIMIT 12`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/farmer/product-requests
const createProductRequest = async (req, res, next) => {
  try {
    const { name, description, category = 'Vegetables', unit = 'kg', suggested_price } = req.body;
    if (!name || !suggested_price || parseFloat(suggested_price) <= 0) {
      return res.status(400).json({ success: false, message: 'Crop name and valid suggested price are required' });
    }

    const result = await pool.query(
      `INSERT INTO product_requests (farmer_id, name, description, category, unit, suggested_price)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, name, description, category, unit, suggested_price]
    );

    // Notify admins via socket
    const io = req.app.get('io');
    if (io) {
      io.to('role:admin').emit('new_product_request', result.rows[0]);
    }

    res.status(201).json({ success: true, data: result.rows[0], message: 'Crop request submitted successfully!' });
  } catch (err) {
    next(err);
  }
};

// GET /api/farmer/product-requests
const getMyProductRequests = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM product_requests WHERE farmer_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyProducts,
  getAllProductsForFarmer,
  addProduct,
  updateStock,
  removeProduct,
  getFarmerStats,
  getEarnings,
  createProductRequest,
  getMyProductRequests
};
