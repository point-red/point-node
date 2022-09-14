const httpStatus = require('http-status');
const ApiError = require('@src/utils/ApiError');

class CreatePaymentOrderReject {
  constructor(tenantDatabase, { approver, paymentOrderId, createPaymentOrderRejectDto }) {
    this.tenantDatabase = tenantDatabase;
    this.approver = approver;
    this.paymentOrderId = paymentOrderId;
    this.createPaymentOrderRejectDto = createPaymentOrderRejectDto;
  }

  async call() {
    const paymentOrder = await this.tenantDatabase.PaymentOrder.findOne({
      where: { id: this.paymentOrderId },
      include: [{ model: this.tenantDatabase.Form, as: 'form' }],
    });
    if (!paymentOrder) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment order is not exist');
    }
    const { form } = paymentOrder;

    validate({ form, paymentOrder, approver: this.approver });

    const { reason: approvalReason } = this.createPaymentOrderRejectDto;

    await form.update({
      approvalStatus: -1,
      approvalBy: this.approver.id,
      approvalAt: new Date(),
      approvalReason,
    });

    paymentOrder.reload();
    return { paymentOrder };
  }
}

function validate({ form, salesInvoice: paymentOrder, approver }) {
  if (form.approvalStatus === -1) {
    return { paymentOrder };
  }
  if (form.approvalStatus === 1) {
    throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'Payment order already approved');
  }

  if (form.requestApprovalTo !== approver.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden - You are not the selected approver');
  }
}

module.exports = CreatePaymentOrderReject;
