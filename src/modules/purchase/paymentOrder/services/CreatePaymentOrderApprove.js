const httpStatus = require('http-status');
const ApiError = require('@src/utils/ApiError');

class CreatePaymentOrderApprove {
  constructor(tenantDatabase, { approver, paymentOrderId }) {
    this.tenantDatabase = tenantDatabase;
    this.approver = approver;
    this.paymentOrderId = paymentOrderId;
  }

  async call() {
    const paymentOrder = await this.tenantDatabase.PaymentOrder.findOne({
      where: { id: this.paymentOrderId },
      include: [{ model: this.tenantDatabase.Form, as: 'form' }],
    });
    if (!paymentOrder) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment order is not exist');
    }

    const form = await paymentOrder.getForm();
    validate(form, this.approver);
    if (form.approvalStatus === 1) {
      return { paymentOrder };
    }
    await this.tenantDatabase.sequelize.transaction(async (transaction) => {
      await form.update({ approvalStatus: 1, approvalBy: this.approver.id, approvalAt: new Date() }, { transaction });
    });

    await paymentOrder.reload();
    return { paymentOrder };
  }
}

function validate(form, approver) {
  if (form.approvalStatus === -1) {
    throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'Payment order already rejected');
  }

  if (form.requestApprovalTo !== approver.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden - You are not the selected approver');
  }
}

module.exports = CreatePaymentOrderApprove;
