const responseFormatter = (req, res, next) => {
  res.success = (data = {}, message = 'Success') => {
    res.status(200).json({
      status: true,
      message,
      data
    });
  };

  res.error = (message = 'Error', statusCode = 400) => {
    res.status(statusCode).json({
      status: false,
      message,
      data: null
    });
  };

  next();
};

module.exports = responseFormatter;
