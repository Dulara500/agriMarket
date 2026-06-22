const pool = require('../config/db');

// POST /api/orders — create from cart
const createOrder = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { payment_method = 'cod', delivery_address, delivery_lat, delivery_lng, notes } = req.body;
    await client.query('BEGIN');

    // Get cart items with current price
    const cartItems = await client.query(
      `SELECT ci.id as cart_item_id, ci.quantity, ci.farmer_product_id,
              fp.farmer_id, fp.stock_quantity,
              p.id as product_id,
              gp.price_per_unit
       FROM carts c
       JOIN cart_items ci ON ci.cart_id = c.id AND ci.reserved_until > NOW()
       JOIN farmer_products fp ON fp.id = ci.farmer_product_id
       JOIN products p ON p.id = fp.product_id
       LEFT JOIN government_prices gp ON gp.product_id = p.id AND gp.is_active = true
       WHERE c.buyer_id = $1
       FOR UPDATE OF fp`,
      [req.user.id]
    );

    if (cartItems.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Cart is empty or reservations expired' });
    }

    // Group by farmer
    const byFarmer = {};
    for (const item of cartItems.rows) {
      if (!byFarmer[item.farmer_id]) byFarmer[item.farmer_id] = [];
      byFarmer[item.farmer_id].push(item);
    }

    const createdOrders = [];

    for (const [farmer_id, items] of Object.entries(byFarmer)) {
      // Validate stock
      for (const item of items) {
        if (item.stock_quantity < item.quantity) {
          await client.query('ROLLBACK');
          return res.status(409).json({ success: false, message: 'Insufficient stock for one or more items' });
        }
      }

      const total = items.reduce((sum, i) => sum + (i.price_per_unit * i.quantity), 0);

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (buyer_id, farmer_id, total_amount, payment_method, delivery_address, delivery_lat, delivery_lng, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [req.user.id, farmer_id, total, payment_method, delivery_address, delivery_lat, delivery_lng, notes]
      );
      const order = orderResult.rows[0];

      // Create order items & deduct stock atomically
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, farmer_product_id, quantity, price_at_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.product_id, item.farmer_product_id, item.quantity, item.price_per_unit]
        );
        await client.query(
          'UPDATE farmer_products SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2',
          [item.quantity, item.farmer_product_id]
        );
      }

      // Create notification for farmer
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES ($1, 'new_order', 'New Order Received', $2, $3)`,
        [farmer_id, `You have a new order #${order.id.slice(0, 8).toUpperCase()}`, JSON.stringify({ order_id: order.id })]
      );

      createdOrders.push(order);
    }

    // Clear cart
    await client.query(
      'DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE buyer_id = $1)',
      [req.user.id]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: createdOrders, message: 'Orders placed successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// GET /api/orders
const getOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const isFarmer = req.user.role === 'farmer';
    const field = isFarmer ? 'o.farmer_id' : 'o.buyer_id';

    let query = `
      SELECT o.*,
             bu.name as buyer_name, bu.phone as buyer_phone, bu.email as buyer_email,
             fu.name as farmer_name, fu.phone as farmer_phone, fu.email as farmer_email, fp.farm_name,
             JSON_AGG(
               JSON_BUILD_OBJECT(
                 'id', oi.id, 'quantity', oi.quantity, 'price_at_order', oi.price_at_order,
                 'product_name', p.name, 'product_image', p.image_url, 'unit', p.unit
               )
             ) as items
      FROM orders o
      JOIN users bu ON bu.id = o.buyer_id
      JOIN users fu ON fu.id = o.farmer_id
      LEFT JOIN farmer_profiles fp ON fp.farmer_id = o.farmer_id
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE ${field} = $1
    `;
    const params = [req.user.id];

    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    query += ' GROUP BY o.id, bu.name, bu.phone, bu.email, fu.name, fu.phone, fu.email, fp.farm_name ORDER BY o.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
const getOrder = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT o.*,
              bu.name as buyer_name, bu.phone as buyer_phone, bu.email as buyer_email,
              fu.name as farmer_name, fu.phone as farmer_phone, fu.email as farmer_email, fp2.farm_name, fp2.rating_avg,
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', oi.id, 'quantity', oi.quantity, 'price_at_order', oi.price_at_order,
                  'product_id', p.id, 'product_name', p.name, 'product_image', p.image_url, 'unit', p.unit
                )
              ) as items
       FROM orders o
       JOIN users bu ON bu.id = o.buyer_id
       JOIN users fu ON fu.id = o.farmer_id
       LEFT JOIN farmer_profiles fp2 ON fp2.farmer_id = o.farmer_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       WHERE o.id = $1 AND (o.buyer_id = $2 OR o.farmer_id = $2)
       GROUP BY o.id, bu.name, bu.phone, bu.email, fu.name, fu.phone, fu.email, fp2.farm_name, fp2.rating_avg`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { status } = req.body;
    const validTransitions = {
      farmer: { 
        pending: ['accepted', 'rejected'], 
        accepted: ['preparing', 'out_for_delivery', 'delivered'],
        preparing: ['out_for_delivery', 'delivered'],
        out_for_delivery: ['delivered']
      },
      buyer: { delivered: ['completed'], pending: ['cancelled'] }
    };

    await client.query('BEGIN');

    const orderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orderResult.rows[0];
    const allowed = validTransitions[req.user.role]?.[order.status] || [];

    if (!allowed.includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: `Cannot transition from ${order.status} to ${status}` });
    }

    // Auth check
    if (req.user.role === 'farmer' && order.farmer_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    if (req.user.role === 'buyer' && order.buyer_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // If rejected → release stock
    if (status === 'rejected' || status === 'cancelled') {
      await client.query(
        `UPDATE farmer_products fp
         SET stock_quantity = fp.stock_quantity + oi.quantity, updated_at = NOW()
         FROM order_items oi
         WHERE oi.order_id = $1 AND oi.farmer_product_id = fp.id`,
        [order.id]
      );
    }

    // If completed → update farmer rating average
    const updatedOrder = await client.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, order.id]
    );

    // Notify buyer
    const notifyUser = req.user.role === 'farmer' ? order.buyer_id : order.farmer_id;
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, 'order_update', 'Order Status Updated', $2, $3)`,
      [notifyUser, `Order #${order.id.slice(0, 8).toUpperCase()} is now ${status}`, JSON.stringify({ order_id: order.id, status })]
    );

    await client.query('COMMIT');
    res.json({ success: true, data: updatedOrder.rows[0], message: `Order ${status}` });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// POST /api/orders/:id/review
const reviewOrder = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    await client.query('BEGIN');

    const order = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND buyer_id = $2 AND status = $3',
      [req.params.id, req.user.id, 'completed']
    );

    if (order.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Order not found or not completed' });
    }

    const { farmer_id } = order.rows[0];

    await client.query(
      `INSERT INTO reviews (buyer_id, farmer_id, order_id, rating, comment) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, farmer_id, req.params.id, rating, comment]
    );

    // Update farmer rating
    await client.query(
      `UPDATE farmer_profiles SET
       total_ratings = total_ratings + 1,
       rating_avg = (rating_avg * total_ratings + $1) / (total_ratings + 1)
       WHERE farmer_id = $2`,
      [rating, farmer_id]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Review submitted' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { createOrder, getOrders, getOrder, updateOrderStatus, reviewOrder };
