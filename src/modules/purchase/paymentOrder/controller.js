const httpStatus = require('http-status');
const catchAsync = require('@src/utils/catchAsync');
const services = require('./services');

const findPaymentOrderReference = catchAsync(async (req, res) => {
  const {
    currentTenantDatabase,
    params: { supplierId },
  } = req;
  const paymentOrderRef = await new services.FindPaymentOrderReference(currentTenantDatabase, supplierId).call();
  res.status(httpStatus.OK).send({ message: 'Success', data: paymentOrderRef });
});

const createPaymentOrder = catchAsync(async (req, res) => {
  const { currentTenantDatabase, user: maker, body: createPaymentOrderDto } = req;
  const paymentOrder = await new services.CreatePaymentOrder(currentTenantDatabase, {
    maker,
    createPaymentOrderDto,
  }).call();

  res.status(httpStatus.CREATED).send({ message: 'Success', data: paymentOrder });
});

const findAllPaymentOrder = catchAsync(async (req, res) => {
  const { currentTenantDatabase, query: queries } = req;
  const { data, maxItem, currentPage, totalPage, total } = await new services.FindAllPaymentOrder(
    currentTenantDatabase,
    queries
  ).call();
  res.status(httpStatus.OK).send({
    data: data,
    meta: {
      current_page: currentPage,
      last_page: totalPage,
      per_page: maxItem,
      total,
    },
  });
});

const createPaymentOrderApprove = catchAsync(async (req, res) => {
  const {
    currentTenantDatabase,
    user: approver,
    params: { paymentOrderId },
  } = req;
  const { paymentOrder } = await new services.CreatePaymentOrderApprove(currentTenantDatabase, {
    approver,
    paymentOrderId,
  }).call();
  res.status(httpStatus.OK).send({ message: 'Success', data: paymentOrder });
});

const createPaymentOrderReject = catchAsync(async (req, res) => {
  const {
    currentTenantDatabase,
    user: approver,
    params: { paymentOrderId },
    body: createPaymentOrderRejectDto,
  } = req;
  const paymentOrder = await new services.CreatePaymentOrderReject(currentTenantDatabase, {
    approver,
    paymentOrderId,
    createPaymentOrderRejectDto,
  }).call();
  res.status(httpStatus.OK).send({ message: 'Success', data: paymentOrder });
});

const previewFormNumber = catchAsync(async (req, res) => {
  const { currentTenantDatabase } = req;
  const formNumber = await new services.PreviewFormNumber(currentTenantDatabase).call();
  res.status(httpStatus.OK).send({ message: 'Success', data: formNumber });
});

module.exports = {
  createPaymentOrder,
  findAllPaymentOrder,
  createPaymentOrderApprove,
  createPaymentOrderReject,
  findPaymentOrderReference,
  previewFormNumber,
};
