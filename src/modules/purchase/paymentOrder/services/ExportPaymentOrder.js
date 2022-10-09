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

    paymentOrder.invoiceCollection.forEach((invoice) => {
      invoicesHtml += `
        <tr>
          <td class="text-center">${moment(invoice.date).format('DD MMMM YYYY')}</td>
          <td class="text-center">${invoice.formNumber}</td>
          <td class="text-center">${invoice.notes || ''}</td>
          <td class="text-right">${currencyFormat(invoice.availableAmount)}</td>
          <td class="text-right">${currencyFormat(invoice.amountOrder)}</td>
        </tr>
      `;
    });

    paymentOrder.downPaymentCollection.forEach((downPayment) => {
      downpaymentsHtml += `
        <tr>
          <td class="text-center">${moment(downPayment.date).format('DD MMMM YYYY')}</td>
          <td class="text-center">${downPayment.formNumber}</td>
          <td class="text-center">${downPayment.notes || ''}</td>
          <td class="text-right">${currencyFormat(downPayment.availableAmount)}</td>
          <td class="text-right">${currencyFormat(downPayment.amountOrder)}</td>
        </tr>
      `;
    });

    paymentOrder.returnCollection.forEach((returnValue) => {
      returnsHtml += `
        <tr>
          <td class="text-center">${moment(returnValue.date).format('DD MMMM YYYY')}</td>
          <td class="text-center">${returnValue.formNumber}</td>
          <td class="text-center">${returnValue.notes || ''}</td>
          <td class="text-right">${currencyFormat(returnValue.availableAmount)}</td>
          <td class="text-right">${currencyFormat(returnValue.amountOrder)}</td>
        </tr>
      `;
    });

    paymentOrder.otherCollection.forEach((other) => {
      othersHtml += `
        <tr>
          <td class="text-center">${other.account}</td>
          <td class="text-center">${other.notes || ''}</td>
          <td class="text-right">${currencyFormat(other.amount)}</td>
          <td class="text-center">${other.allocation}</td>
        </tr>
      `;
    });

    pdfBody = pdfBody.replace('{{logoUrl}}', settingLogo?.publicUrl);
    pdfBody = pdfBody.replace('{{companyName}}', project.name);
    pdfBody = pdfBody.replace('{{companyAddress}}', project.address || '');
    pdfBody = pdfBody.replace('{{companyPhone}}', project.phone || '');
    pdfBody = pdfBody.replace('{{date}}', moment(paymentOrder.date).format('DD MMMM YYYY'));
    pdfBody = pdfBody.replace('{{formNumber}}', paymentOrder.formNumber);
    pdfBody = pdfBody.replace('{{supplierName}}', paymentOrder.supplierName);
    pdfBody = pdfBody.replace('{{supplierAddress}}', paymentOrder.supplierAddress || '');
    pdfBody = pdfBody.replace('{{supplierPhone}}', paymentOrder.supplierPhone || '');
    pdfBody = pdfBody.replace('{{invoices}}', invoicesHtml);
    pdfBody = pdfBody.replace('{{downPayments}}', downpaymentsHtml);
    pdfBody = pdfBody.replace('{{returns}}', returnsHtml);
    pdfBody = pdfBody.replace('{{others}}', othersHtml);
    pdfBody = pdfBody.replace('{{totalInvoice}}', currencyFormat(paymentOrder.totalInvoice));
    pdfBody = pdfBody.replace('{{totalDownPayment}}', currencyFormat(paymentOrder.totalDownPayment));
    pdfBody = pdfBody.replace('{{totalReturn}}', currencyFormat(paymentOrder.totalReturn));
    pdfBody = pdfBody.replace('{{totalOther}}', currencyFormat(paymentOrder.totalOther));
    pdfBody = pdfBody.replace('{{totalAmount}}', currencyFormat(paymentOrder.totalAmount));
    pdfBody = pdfBody.replace('{{notes}}', paymentOrder.notes);

    const options = { format: 'A4' };
    const pdfBuffer = await htmlToPdf.generatePdf({ content: pdfBody }, options);

    return pdfBuffer;
  }
}

module.exports = ExportPaymentOrder;
