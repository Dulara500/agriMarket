const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);

  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry - resource already exists',
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource not found',
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
