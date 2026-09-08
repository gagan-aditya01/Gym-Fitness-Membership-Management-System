const errorHandler = (err, req, res, next) => {
  // Default to 500 if status not set
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Mongoose CastError (invalid ObjectId or type)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid identifier provided',
      errorCode: 'VALIDATION_ERROR',
    });
  }

  // Duplicate key error (e.g., unique email)
  if (err.code && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      errorCode: 'DUPLICATE_KEY',
    });
  }

  const errorCode = err.errorCode || (statusCode === 404 ? 'NOT_FOUND' : 'SERVER_ERROR');

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errorCode: errorCode,
  });
};

module.exports = errorHandler;
