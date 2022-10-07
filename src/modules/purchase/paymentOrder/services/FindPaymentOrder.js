const httpStatus = require('http-status');
const ApiError = require('@src/utils/ApiError');

class FindPaymentOrder {
  constructor(tenantDatabase, paymentOrderId) {
    this.tenantDatabase = tenantDatabase;
    this.paymentOrderId = paymentOrderId;
  }

  async call() {
    let invoices = [];
    let downPayments = [];
    let returns = [];
    let others = [];

    const paymentOrder = await this.tenantDatabase.PaymentOrder.findOne({
      where: {
        id: this.paymentOrderId,
      },
      include: [
        {
          model: this.tenantDatabase.Form,
          as: 'form',
          include: [
            { model: this.tenantDatabase.User, as: 'requestApprovalToUser' },
            { model: this.tenantDatabase.User, as: 'createdByUser' },
          ],
        },
        { model: this.tenantDatabase.Supplier, as: 'supplier' },
      ],
    });
    if (!paymentOrder) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment order not found');
    }

    const paymentOrderInvoice = await this.tenantDatabase.PaymentOrderInvoice.findAll({
      where: {
        paymentOrderId: this.paymentOrderId,
      },
    });

    for (const value of paymentOrderInvoice) {
      const invoiceAmountRemaining = await this.tenantDatabase.PurchaseInvoiceDone.sum('value', {
        where: { purchaseInvoiceId: value.purchaseInvoiceId },
      });

      const form = await this.tenantDatabase.Form.findOne({
        where: { formableType: 'PurchaseInvoice', formableId: value.purchaseInvoiceId },
      });

      const invoice = {
        id: value.id,
        date: form.date,
        formNumber: form.number,
        notes: form.notes,
        availableAmount: parseInt(invoiceAmountRemaining) + parseInt(value.amount),
        amountOrder: parseInt(value.amount),
      };

      invoices.push(invoice);
    }

    const paymentOrderDownPayment = await this.tenantDatabase.PaymentOrderDownPayment.findAll({
      where: {
        paymentOrderId: this.paymentOrderId,
      },
      include: { model: this.tenantDatabase.PurchaseDownPayment, as: 'purchaseDownPayment' },
    });

    for (const value of paymentOrderDownPayment) {
      const form = await this.tenantDatabase.Form.findOne({
        where: { formableType: 'PurchaseDownPayment', formableId: value.purchaseDownPaymentId },
      });

      const downPayment = {
        id: value.id,
        date: form.date,
        formNumber: form.number,
        notes: form.notes,
        availableAmount: parseInt(value.purchaseDownPayment.remaining) + parseInt(value.amount),
        amountOrder: parseInt(value.amount),
      };

      downPayments.push(downPayment);
    }

    const paymentOrderReturn = await this.tenantDatabase.PaymentOrderReturn.findAll({
      where: {
        paymentOrderId: this.paymentOrderId,
      },
      include: { model: this.tenantDatabase.PurchaseReturn, as: 'purchaseReturn' },
    });

    for (const value of paymentOrderReturn) {
      const form = await this.tenantDatabase.Form.findOne({
        where: { formableType: 'PurchaseReturn', formableId: value.purchaseReturnId },
      });

      const returnValue = {
        id: value.id,
        date: form.date,
        formNumber: form.number,
        notes: form.notes,
        availableAmount: parseInt(value.purchaseReturn.remaining) + parseInt(value.amount),
        amountOrder: parseInt(value.amount),
      };

      returns.push(returnValue);
    }

    const paymentOrderOther = await this.tenantDatabase.PaymentOrderOther.findAll({
      where: {
        paymentOrderId: this.paymentOrderId,
      },
      include: [
        { model: this.tenantDatabase.ChartOfAccount, as: 'chartOfAccount' },
        { model: this.tenantDatabase.Allocation, as: 'allocation' },
      ],
    });

    for (const value of paymentOrderOther) {
      const other = {
        id: value.id,
        account: value.chartOfAccount.name,
        notes: value.notes,
        amount: parseInt(value.amount),
        allocation: value.allocation.name,
      };

      others.push(other);
    }

    const paymentOrderDetail = {
      id: paymentOrder.id,
      supplier: paymentOrder.supplier.name,
      date: paymentOrder.form.date,
      formNumber: paymentOrder.form.number,
      paymentMethod: paymentOrder.paymentType,
      invoiceCollection: invoices,
      downPaymentCollection: downPayments,
      returnCollection: returns,
      otherCollection: others,
      totalInvoice: parseInt(paymentOrder.totalInvoice),
      totalDownPayment: parseInt(paymentOrder.totalDownPayment),
      totalReturn: parseInt(paymentOrder.totalReturn),
      totalOther: parseInt(paymentOrder.totalOther),
      totalAmount: parseInt(paymentOrder.amount),
      notes: paymentOrder.form.notes,
      createdAt: paymentOrder.form.createdAt,
      createdBy: paymentOrder.form.createdByUser.name,
      approvedBy: paymentOrder.form.requestApprovalToUser.name,
    };

    return paymentOrderDetail;
  }
}

module.exports = FindPaymentOrder;
