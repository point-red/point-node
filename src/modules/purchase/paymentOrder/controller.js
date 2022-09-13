const httpStatus = require('http-status');
const catchAsync = require('@src/utils/catchAsync');
const services = require('./services');

const createPaymentOrder = catchAsync(async (req, res) => {
  const { currentTenantDatabase, user: maker, body: createPaymentOrderDto } = req;
  const paymentOrder = await new services.CreatePaymentOrder(currentTenantDatabase, {
    maker,
    createPaymentOrderDto,
  }).call();

  res.status(httpStatus.CREATED).send({ message: 'Success', data: paymentOrder });
});

module.exports = {
  createPaymentOrder,
};
