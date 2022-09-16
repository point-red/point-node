const { Op } = require('sequelize');

class FindPaymentOrderReference {
  constructor(tenantDatabase, supplierId) {
    this.tenantDatabase = tenantDatabase;
    this.supplierId = supplierId;
  }

  async call() {
    let purchase_invoices = [];
    let purchase_down_payments = [];
    let purchase_returns = [];
    const forms = await this.tenantDatabase.Form.findAll({
      where: {
        formableType: { [Op.in]: ['PurchaseInvoice', 'PurchaseDownPayment', 'PurchaseReturn'] },
        done: 0,
        approvalStatus: 1,
      },
    });

    for (const form of forms) {
      if (form.formableType === 'PurchaseInvoice') {
        const purchaseInvoice = await this.tenantDatabase.PurchaseInvoice.findOne({
          where: { id: form.formableId, supplierId: this.supplierId },
        });

        const invoiceRes = {
          id: purchaseInvoice.id,
          date: form.date,
          form_number: form.number,
          notes: form.notes,
          available_amount: purchaseInvoice.remaining,
        };

        purchase_invoices.push(invoiceRes);
      }

      console.log(form.formableType);
      if (form.formableType === 'PurchaseDownPayment') {
        const purchaseDownPayment = await this.tenantDatabase.PurchaseDownPayment.findOne({
          where: { id: form.formableId, supplierId: this.supplierId },
        });

        const downPaymentRes = {
          id: purchaseDownPayment.id,
          date: form.date,
          form_number: form.number,
          notes: form.notes,
          available_amount: purchaseDownPayment.remaining,
        };

        purchase_down_payments.push(downPaymentRes);
      }

      if (form.formableType === 'PurchaseReturn') {
        const purchaseReturn = await this.tenantDatabase.PurchaseReturn.findOne({
          where: { id: form.formableId, supplierId: this.supplierId },
        });

        const returnRes = {
          id: purchaseReturn.id,
          date: form.date,
          form_number: form.number,
          notes: form.notes,
          available_amount: purchaseReturn.remaining,
        };

        purchase_returns.push(returnRes);
      }
    }
    const paymentOrderRef = { purchase_invoices, purchase_down_payments, purchase_returns };

    return paymentOrderRef;
  }
}

module.exports = FindPaymentOrderReference;
