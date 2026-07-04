const pool = require('../config/db');

// Haversine formula — returns distance in km between two lat/lng points
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/products
const getAllProducts = async (req, res, next) => {
  try {
    const { search, category, lat, lng } = req.query;
    const buyerLat = lat ? parseFloat(lat) : null;
    const buyerLng = lng ? parseFloat(lng) : null;
    const hasLocation = buyerLat !== null && buyerLng !== null;

    let query = `
      SELECT p.*, 
             gp.price_per_unit as government_price,
             gp.effective_date as price_effective_date,
             COUNT(DISTINCT fp.id) FILTER (
               WHERE fp.is_available AND fp.stock_quantity > 0
               ${hasLocation
                 ? `AND u.location_lat IS NOT NULL AND u.location_lng IS NOT NULL
                    AND (
                      6371 * 2 * ASIN(SQRT(
                        POWER(SIN((RADIANS(u.location_lat) - RADIANS(${buyerLat})) / 2), 2) +
                        COS(RADIANS(${buyerLat})) * COS(RADIANS(u.location_lat)) *
                        POWER(SIN((RADIANS(u.location_lng) - RADIANS(${buyerLng})) / 2), 2)
                      ))
                    ) <= 20`
                 : ''}
             ) as available_farmers
      FROM products p
      JOIN government_prices gp ON gp.product_id = p.id AND gp.is_active = true
      LEFT JOIN farmer_products fp ON fp.product_id = p.id
      ${hasLocation ? 'LEFT JOIN users u ON u.id = fp.farmer_id' : ''}
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
// Optional query params: ?lat=&lng=&radius=<km>  (0 = no limit / show all)
const getProductFarmers = async (req, res, next) => {
  try {
    const buyerLat = req.query.lat ? parseFloat(req.query.lat) : null;
    const buyerLng = req.query.lng ? parseFloat(req.query.lng) : null;
    const hasLocation = buyerLat !== null && buyerLng !== null;
    const radius = req.query.radius !== undefined ? parseFloat(req.query.radius) : 20;
    const noLimit = radius === 0;

    const result = await pool.query(
      `SELECT fp.id as farmer_product_id, fp.stock_quantity, fp.is_available,
              u.id as farmer_id, u.name as farmer_name, u.avatar_url,
              u.phone as farmer_phone, u.email as farmer_email,
              u.location_lat, u.location_lng, u.location_address,
              prof.farm_name, prof.rating_avg, prof.total_ratings, prof.is_verified
       FROM farmer_products fp
       JOIN users u ON u.id = fp.farmer_id
       LEFT JOIN farmer_profiles prof ON prof.farmer_id = fp.farmer_id
       WHERE fp.product_id = $1 AND fp.is_available = true AND fp.stock_quantity > 0 AND u.is_active = true
       ORDER BY prof.rating_avg DESC, fp.stock_quantity DESC`,
      [req.params.id]
    );

    let farmers = result.rows;

    if (hasLocation) {
      // Compute real distance for every farmer
      farmers = farmers.map(f => {
        if (f.location_lat && f.location_lng) {
          const dist = haversineKm(buyerLat, buyerLng, parseFloat(f.location_lat), parseFloat(f.location_lng));
          return { ...f, distance_km: Math.round(dist * 10) / 10 };
        }
        // Farmer has no location — place at end with null distance
        return { ...f, distance_km: null };
      });

      if (!noLimit) {
        // Filter to farmers within the requested radius (must have a location set)
        farmers = farmers.filter(f => f.distance_km !== null && f.distance_km <= radius);
      }

      // Sort: farmers with known distance first (nearest first), then unknown
      farmers.sort((a, b) => {
        if (a.distance_km === null && b.distance_km === null) return 0;
        if (a.distance_km === null) return 1;
        if (b.distance_km === null) return -1;
        return a.distance_km - b.distance_km;
      });
    } else {
      // No buyer location: return all farmers, distance_km = null
      farmers = farmers.map(f => ({ ...f, distance_km: null }));
    }

    res.json({ success: true, data: farmers });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllProducts, getCategories, getProduct, getProductFarmers };
