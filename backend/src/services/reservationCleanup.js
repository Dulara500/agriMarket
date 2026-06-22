const cron = require('node-cron');
const pool = require('../config/db');

// Run every 5 minutes — release expired cart reservations
const startReservationCleanup = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const result = await pool.query(
        'DELETE FROM cart_items WHERE reserved_until < NOW() RETURNING id'
      );
      if (result.rowCount > 0) {
        console.log(`🧹 Cleaned up ${result.rowCount} expired cart reservations`);
      }
    } catch (err) {
      console.error('Cleanup error:', err.message);
    }
  });
  console.log('⏰ Reservation cleanup cron started');
};

module.exports = { startReservationCleanup };
