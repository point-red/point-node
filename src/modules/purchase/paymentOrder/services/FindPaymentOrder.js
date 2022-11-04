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
        form_number: form.number,
        notes: form.notes,
        available_amount: parseInt(invoiceAmountRemaining) + parseInt(value.amount),
        amount_order: parseInt(value.amount),
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
        form_number: form.number,
        notes: form.notes,
        available_amount: parseInt(value.purchaseDownPayment.remaining) + parseInt(value.amount),
        amount_order: parseInt(value.amount),
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
        form_number: form.number,
        notes: form.notes,
        available_amount: parseInt(value.purchaseReturn.remaining) + parseInt(value.amount),
        amount_order: parseInt(value.amount),
      };

      returns.push(returnValue);
    }

    const paymentOrderOther = await this.tenantDatabase.PaymentOrderOther.findAll({
      where: {
        paymentOrderId: this.paymentOrderId,
      },
      include: [
        {
          model: this.tenantDatabase.ChartOfAccount,
          as: 'chartOfAccount',
          include: { model: this.tenantDatabase.ChartOfAccountType, as: 'type' },
        },
        { model: this.tenantDatabase.Allocation, as: 'allocation' },
      ],
    });

    for (const value of paymentOrderOther) {
      const other = {
        id: value.id,
        account_id: value.chartOfAccount.id,
        account_name: value.chartOfAccount.alias,
        account_type: value.chartOfAccount.type.name,
        account_alias: value.chartOfAccount.type.alias,
        notes: value.notes,
        amount: parseInt(value.amount),
        allocation_id: value.allocation.id,
        allocation_name: value.allocation.name,
      };

      others.push(other);
    }

    const paymentOrderDetail = {
      id: paymentOrder.id,
      supplier_id: paymentOrder.supplierId,
      supplier_name: paymentOrder.supplier.name,
      supplier_address: paymentOrder.supplier.address,
      supplier_phone: paymentOrder.supplier.phone,
      date: paymentOrder.form.date,
      form_number: paymentOrder.form.number,
      payment_method: paymentOrder.paymentType,
      invoice_collection: invoices,
      down_payment_collection: downPayments,
      return_collection: returns,
      other_collection: others,
      total_invoice: parseInt(paymentOrder.totalInvoice),
      total_down_payment: parseInt(paymentOrder.totalDownPayment),
      total_return: parseInt(paymentOrder.totalReturn),
      total_other: parseInt(paymentOrder.totalOther),
      total_amount: parseInt(paymentOrder.amount),
      notes: paymentOrder.form.notes,
      created_at: paymentOrder.form.createdAt,
      created_by: paymentOrder.form.createdByUser.name,
      request_approval_to: paymentOrder.form.requestApprovalToUser,
      approval_reason: paymentOrder.form.approvalReason,
      approval_status: paymentOrder.form.approvalStatus,
      cancellation_status: paymentOrder.form.cancellationStatus,
      cancellation_approval_reason: paymentOrder.form.cancellationApprovalReason,
      request_cancellation_reason: paymentOrder.form.requestCancellationReason,
    };

    return paymentOrderDetail;
  }
}

module.exports = FindPaymentOrder;
