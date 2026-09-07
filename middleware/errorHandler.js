const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const errorCode = err.errorCode || (statusCode === 404 ? 'NOT_FOUND' : 'SERVER_ERROR');

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errorCode: errorCode,
  });
};

module.exports = errorHandler;
