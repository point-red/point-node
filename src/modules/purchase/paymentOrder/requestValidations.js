const { Joi } = require('celebrate');

const requireAuth = {
  headers: Joi.object({
    authorization: Joi.string().required(),
  }).unknown(true),
};

const createPaymentOrder = {
  body: Joi.object({
    paymentType: Joi.string().required(),
    supplierId: Joi.number().required(),
    date: Joi.date().iso().required(),
    paymentAccountId: Joi.number().required(),
    invoices: Joi.array()
      .items({
        id: Joi.number().required(),
        amount: Joi.number().required(),
      })
      .required(),
    downPayments: Joi.array().items({
      id: Joi.number().required(),
      amount: Joi.number().required(),
    }),
    returns: Joi.array().items({
      id: Joi.number().required(),
      amount: Joi.number().required(),
    }),
    others: Joi.array().items({
      coaId: Joi.number().required(),
      notes: Joi.string().allow(null).default(''),
      amount: Joi.number().required(),
      allocationId: Joi.number().required(),
    }),
    totalInvoiceAmount: Joi.number().required(),
    totalDownPaymentAmount: Joi.number().min(0).default(0),
    totalReturnAmount: Joi.number().min(0).default(0),
    totalOtherAmount: Joi.number().min(0).default(0),
    totalAmount: Joi.number().required(),
    approvedBy: Joi.number().required(),
    notes: Joi.string().max(255).trim().allow(null).default(''),
  }),
};

module.exports = {
  requireAuth,
  createPaymentOrder,
};
