const pool = require('../config/db');

// GET /api/admin/products
const getProducts = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*, gp.price_per_unit as government_price, gp.effective_date, gp.id as price_id
       FROM products p
       LEFT JOIN government_prices gp ON gp.product_id = p.id AND gp.is_active = true
       ORDER BY p.name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// POST /api/admin/products
const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, image_url, unit } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });
    const result = await pool.query(
      `INSERT INTO products (name, description, category, image_url, unit) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, description, category, image_url, unit || 'kg']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// PATCH /api/admin/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const { name, description, category, image_url, unit, is_active } = req.body;
    const result = await pool.query(
      `UPDATE products SET name=COALESCE($1,name), description=COALESCE($2,description),
       category=COALESCE($3,category), image_url=COALESCE($4,image_url),
       unit=COALESCE($5,unit), is_active=COALESCE($6,is_active) WHERE id=$7 RETURNING *`,
      [name, description, category, image_url, unit, is_active, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// POST /api/admin/products/:id/price
const setPrice = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { price_per_unit, notes, effective_date } = req.body;
    if (!price_per_unit || price_per_unit <= 0) {
      return res.status(400).json({ success: false, message: 'Valid price required' });
    }

    await client.query('BEGIN');
    // Deactivate old price
    await client.query(
      'UPDATE government_prices SET is_active = false WHERE product_id = $1 AND is_active = true',
      [req.params.id]
    );
    // Insert new price
    const result = await client.query(
      `INSERT INTO government_prices (product_id, price_per_unit, set_by_admin_id, notes, effective_date, is_active)
       VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), true) RETURNING *`,
      [req.params.id, price_per_unit, req.user.id, notes, effective_date]
    );

    // Notify all users about price change
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message)
       SELECT id, 'price_update', 'Price Updated', $1 FROM users WHERE is_active = true`,
      [`Government price updated for a product. New price: Rs. ${price_per_unit}/unit`]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at, u.id_number,
             fp.farm_name, fp.rating_avg, fp.is_verified
      FROM users u
      LEFT JOIN farmer_profiles fp ON fp.farmer_id = u.id
      WHERE u.role != 'admin'
    `;
    const params = [];
    if (role) { params.push(role); query += ` AND u.role = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`; }
    query += ' ORDER BY u.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { is_active, is_verified } = req.body;
    await pool.query('UPDATE users SET is_active = COALESCE($1, is_active) WHERE id = $2', [is_active, req.params.id]);
    if (is_verified !== undefined) {
      await pool.query('UPDATE farmer_profiles SET is_verified = $1 WHERE farmer_id = $2', [is_verified, req.params.id]);
    }
    res.json({ success: true, message: 'User updated' });
  } catch (err) { next(err); }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const [ordersRes, revenueRes, usersRes, topProductsRes, monthlyRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total,
        COUNT(*) FILTER (WHERE status='completed') as completed,
        COUNT(*) FILTER (WHERE status='pending') as pending,
        COUNT(*) FILTER (WHERE status='rejected') as rejected
        FROM orders`),
      pool.query(`SELECT COALESCE(SUM(total_amount),0) as total_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'),0) as monthly_revenue
        FROM orders WHERE status='completed'`),
      pool.query(`SELECT COUNT(*) FILTER (WHERE role='buyer') as buyers,
        COUNT(*) FILTER (WHERE role='farmer') as farmers FROM users`),
      pool.query(`SELECT p.name, p.image_url, SUM(oi.quantity) as total_qty, SUM(oi.quantity * oi.price_at_order) as revenue
        FROM order_items oi JOIN products p ON p.id = oi.product_id
        GROUP BY p.id, p.name, p.image_url ORDER BY total_qty DESC LIMIT 5`),
      pool.query(`SELECT DATE_TRUNC('month', created_at) as month,
        COUNT(*) as orders, SUM(total_amount) as revenue
        FROM orders WHERE status='completed'
        GROUP BY DATE_TRUNC('month', created_at) ORDER BY month DESC LIMIT 12`),
    ]);

    res.json({
      success: true,
      data: {
        orders: ordersRes.rows[0],
        revenue: revenueRes.rows[0],
        users: usersRes.rows[0],
        top_products: topProductsRes.rows,
        monthly: monthlyRes.rows.reverse(),
      }
    });
  } catch (err) { next(err); }
};

// GET /api/admin/product-requests
const getProductRequests = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT pr.*, u.name as farmer_name, f.farm_name
       FROM product_requests pr
       JOIN users u ON u.id = pr.farmer_id
       LEFT JOIN farmer_profiles f ON f.farmer_id = pr.farmer_id
       ORDER BY pr.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/product-requests/:id/approve
const approveProductRequest = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { final_price, image_url } = req.body;
    if (!final_price || parseFloat(final_price) <= 0) {
      return res.status(400).json({ success: false, message: 'A valid standard price is required' });
    }

    await client.query('BEGIN');

    // Get the request
    const requestResult = await client.query(
      'SELECT * FROM product_requests WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );

    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const request = requestResult.rows[0];
    if (request.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    // Insert new product
    const productResult = await client.query(
      `INSERT INTO products (name, description, category, unit, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [request.name, request.description, request.category, request.unit, image_url || '']
    );
    const productId = productResult.rows[0].id;

    // Insert government price
    await client.query(
      `INSERT INTO government_prices (product_id, price_per_unit, set_by_admin_id, is_active)
       VALUES ($1, $2, $3, true)`,
      [productId, final_price, req.user.id]
    );

    // Update request status
    await client.query(
      `UPDATE product_requests SET status = 'approved', updated_at = NOW() WHERE id = $1`,
      [request.id]
    );

    // Notify farmer
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'request_approved', 'Crop Request Approved', $2, $3)`,
      [
        request.farmer_id,
        `Your request for ${request.name} has been approved! Government fixed price set to Rs. ${parseFloat(final_price).toFixed(2)}/${request.unit}.`,
        JSON.stringify({ product_id: productId })
      ]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Product request approved and created successfully!' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// PATCH /api/admin/product-requests/:id/reject
const rejectProductRequest = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const requestResult = await pool.query(
      'SELECT * FROM product_requests WHERE id = $1',
      [req.params.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const request = requestResult.rows[0];
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    // Update status
    await pool.query(
      `UPDATE product_requests SET status = 'rejected', updated_at = NOW() WHERE id = $1`,
      [request.id]
    );

    // Notify farmer
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'request_rejected', 'Crop Request Rejected', $2, $3)`,
      [
        request.farmer_id,
        `Your request for ${request.name} has been rejected. ${notes ? `Reason: ${notes}` : ''}`,
        JSON.stringify({ request_id: request.id })
      ]
    );

    res.json({ success: true, message: 'Product request rejected' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  setPrice,
  getUsers,
  updateUser,
  getAnalytics,
  getProductRequests,
  approveProductRequest,
  rejectProductRequest
};
