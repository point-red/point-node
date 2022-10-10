const excelJS = require('exceljs');
const currencyFormat = require('@src/utils/currencyFormat');
const findAllPaymentOrder = require('./FindAllPaymentOrder');
const { Project } = require('@src/models').main;

class ExportPaymentOrder {
  constructor(tenantDatabase, tenant, queries, res = {}) {
    this.tenantDatabase = tenantDatabase;
    this.tenant = tenant;
    this.queries = queries;
    this.res = res;
  }

  async call() {
    try {
      let resData = [];
      if (!this.queries.dateFrom) {
        const date = new Date(),
          y = date.getFullYear(),
          m = date.getMonth();
        const firstDay = new Date(y, m, 1);
        this.queries.dateFrom = firstDay;
      }
      if (!this.queries.dateTo) {
        const date = new Date(),
          y = date.getFullYear(),
          m = date.getMonth();
        const lastDay = new Date(y, m + 1, 0);
        this.queries.dateTo = lastDay;
      }

      let from = this.queries.dateFrom;
      from = `${from.getFullYear()}${from.getMonth() + 1}${from.getUTCDate() + 1}`;
      let to = this.queries.dateTo;
      to = `${to.getFullYear()}${to.getMonth() + 1}${to.getUTCDate() + 1}`;
      const title = `Payment-Order-${from}-${to}`;
      const fromLocale = new Date(this.queries.dateFrom).toLocaleString('id-ID', { dateStyle: 'long' });
      const toLocale = new Date(this.queries.dateTo).toLocaleString('id-ID', { dateStyle: 'long' });
      const timeNow = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet(title);

      const project = await Project.findOne({ where: { code: this.tenant } });
      const { data } = await new findAllPaymentOrder(this.tenantDatabase, this.queries).call();
      data.forEach((e) => {
        const obj = {
          date: new Date(e.date).toLocaleString('id-ID', { dateStyle: 'long' }),
          number: e.form_number,
          supplier: e.supplier,
          paymentMethod: e.payment_method,
          amount: currencyFormat(e.value),
          approvalStatus: e.approval_status,
          formStatus: e.done_status,
        };
        resData.push(obj);
      });

      worksheet.columns = [
        { header: 'Date Form', key: 'date', width: 18 },
        { header: 'Form Number', key: 'number', width: 13 },
        { header: 'Supplier', key: 'supplier', width: 13 },
        { header: 'Payment Methode', key: 'paymentMethod', width: 17 },
        { header: 'Amount Collection', key: 'amount', width: 17 },
        { header: 'Approval Status', key: 'approvalStatus', width: 15 },
        { header: 'Form Status', key: 'formStatus', width: 11 },
      ];

      let counter = 1;
      resData.forEach((e) => {
        worksheet.addRow(e);
        worksheet.getRow(counter + 1).eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
        counter++;
      });

      worksheet.getRow(1).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'ffff00' },
        };
        cell.font = { bold: true, name: 'Calibri' };
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      for (let i = 0; i < 5; i++) {
        worksheet.insertRow(1, []);
      }

      worksheet.mergeCells('A5:G5');
      worksheet.mergeCells('A4:G4');

      worksheet.getCell('A5').value = project.name;
      worksheet.getCell('A4').value = 'Payment Order';
      worksheet.getCell('A2').value = 'Export Period';
      worksheet.getCell('B2').value = `${fromLocale} - ${toLocale}`;
      worksheet.getCell('A1').value = 'Date Export';
      worksheet.getCell('B1').value = timeNow;

      worksheet.getCell('A5').style = {
        alignment: { horizontal: 'center' },
        font: { bold: true, name: 'Calibri', size: 12 },
      };
      worksheet.getCell('A4').style = {
        alignment: { horizontal: 'center' },
        font: { bold: true, name: 'Calibri', size: 12 },
      };

      this.res.setHeader('Content-Type', 'application/vnd.ms-excel');
      this.res.setHeader('Content-Disposition', `attachment; filename=${title}.xlsx`);
      return await workbook.xlsx.write(this.res);
    } catch (err) {
      return this.res.send(err.message);
    }
  }
}

module.exports = ExportPaymentOrder;
