const fs = require('fs/promises');
const path = require('path');
const moment = require('moment');
const htmlToPdf = require('html-pdf-node');
const findPaymentOrder = require('./FindPaymentOrder');
const currencyFormat = require('@src/utils/currencyFormat');
const { Project } = require('@src/models').main;

class ExportPaymentOrder {
  constructor(tenantDatabase, paymentOrderId, tenant) {
    this.tenantDatabase = tenantDatabase;
    this.paymentOrderId = paymentOrderId;
    this.tenant = tenant;
  }

  async call() {
    let pdfBody = await fs.readFile(path.resolve(__dirname, '../templates/exportPaymentOrder.html'), 'utf8');
    let invoicesHtml = '';
    let downpaymentsHtml = '';
    let returnsHtml = '';
    let othersHtml = '';

    const paymentOrder = await new findPaymentOrder(this.tenantDatabase, this.paymentOrderId).call();

    const project = await Project.findOne({ where: { code: this.tenant } });
    const settingLogo = await this.tenantDatabase.SettingLogo.findOne();

    paymentOrder.invoice_collection.forEach((invoice) => {
      invoicesHtml += `
        <tr>
          <td class="text-center">${moment(invoice.date).format('DD MMMM YYYY')}</td>
          <td class="text-center">${invoice.form_number}</td>
          <td class="text-center">${invoice.notes || ''}</td>
          <td class="text-right">Rp ${currencyFormat(invoice.available_amount)}</td>
          <td class="text-right">Rp ${currencyFormat(invoice.amount_order)}</td>
        </tr>
      `;
    });

    paymentOrder.down_payment_collection.forEach((downPayment) => {
      downpaymentsHtml += `
        <tr>
          <td class="text-center">${moment(downPayment.date).format('DD MMMM YYYY')}</td>
          <td class="text-center">${downPayment.form_number}</td>
          <td class="text-center">${downPayment.notes || ''}</td>
          <td class="text-right">Rp ${currencyFormat(downPayment.available_amount)}</td>
          <td class="text-right">Rp ${currencyFormat(downPayment.amount_order)}</td>
        </tr>
      `;
    });

    paymentOrder.return_collection.forEach((returnValue) => {
      returnsHtml += `
        <tr>
          <td class="text-center">${moment(returnValue.date).format('DD MMMM YYYY')}</td>
          <td class="text-center">${returnValue.form_number}</td>
          <td class="text-center">${returnValue.notes || ''}</td>
          <td class="text-right">Rp ${currencyFormat(returnValue.available_amount)}</td>
          <td class="text-right">Rp ${currencyFormat(returnValue.amount_order)}</td>
        </tr>
      `;
    });

    paymentOrder.other_collection.forEach((other) => {
      othersHtml += `
        <tr>
          <td class="text-center">${other.account}</td>
          <td class="text-center">${other.notes || ''}</td>
          <td class="text-right">Rp ${currencyFormat(other.amount)}</td>
          <td class="text-center">${other.allocation}</td>
        </tr>
      `;
    });

    pdfBody = pdfBody.replace('{{logoUrl}}', settingLogo?.publicUrl);
    pdfBody = pdfBody.replace('{{companyName}}', project.name);
    pdfBody = pdfBody.replace('{{companyAddress}}', project.address || '');
    pdfBody = pdfBody.replace('{{companyPhone}}', project.phone || '');
    pdfBody = pdfBody.replace('{{date}}', moment(paymentOrder.date).format('DD MMMM YYYY'));
    pdfBody = pdfBody.replace('{{formNumber}}', paymentOrder.form_number);
    pdfBody = pdfBody.replace('{{supplierName}}', paymentOrder.supplier_name);
    pdfBody = pdfBody.replace('{{supplierAddress}}', paymentOrder.supplier_address || '');
    pdfBody = pdfBody.replace('{{supplierPhone}}', paymentOrder.supplier_phone || '');
    pdfBody = pdfBody.replace('{{invoices}}', invoicesHtml);
    pdfBody = pdfBody.replace('{{downPayments}}', downpaymentsHtml);
    pdfBody = pdfBody.replace('{{returns}}', returnsHtml);
    pdfBody = pdfBody.replace('{{others}}', othersHtml);
    pdfBody = pdfBody.replace('{{totalInvoice}}', `Rp ${currencyFormat(paymentOrder.total_invoice)}`);
    pdfBody = pdfBody.replace('{{totalDownPayment}}', `Rp ${currencyFormat(paymentOrder.total_down_payment)}`);
    pdfBody = pdfBody.replace('{{totalReturn}}', `Rp ${currencyFormat(paymentOrder.total_return)}`);
    pdfBody = pdfBody.replace('{{totalOther}}', `Rp ${currencyFormat(paymentOrder.total_other)}`);
    pdfBody = pdfBody.replace('{{totalAmount}}', `Rp ${currencyFormat(paymentOrder.total_amount)}`);
    pdfBody = pdfBody.replace('{{notes}}', paymentOrder.notes);

    const options = { format: 'A4' };
    const pdfBuffer = await htmlToPdf.generatePdf({ content: pdfBody }, options);

    return pdfBuffer;
  }
}

module.exports = ExportPaymentOrder;
