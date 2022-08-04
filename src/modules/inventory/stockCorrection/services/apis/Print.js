const fs = require('fs/promises');
const path = require('path');
const moment = require('moment');
const htmlToPdf = require('html-pdf-node');
const database = require('@src/models');
const GetCurrentStock = require('../../../services/GetCurrentStock');

const { Project } = database.main;

class Print {
  constructor(tenantDatabase, stockCorrectionId, tenant) {
    this.tenantDatabase = tenantDatabase;
    this.stockCorrectionId = stockCorrectionId;
    this.tenant = tenant;
  }

  async call() {
    const stockCorrection = await this.tenantDatabase.StockCorrection.findOne({
      where: {
        id: this.stockCorrectionId,
      },
      include: [
        {
          model: this.tenantDatabase.Form,
          as: 'form',
          include: [
            { model: this.tenantDatabase.User, as: 'createdByUser' },
            { model: this.tenantDatabase.User, as: 'requestApprovalToUser' },
          ],
        },
        { model: this.tenantDatabase.Warehouse, as: 'warehouse' },
        {
          model: this.tenantDatabase.StockCorrectionItem,
          as: 'items',
          include: [
            { model: this.tenantDatabase.Item, as: 'item', include: [{ model: this.tenantDatabase.ItemUnit, as: 'units' }] },
            { model: this.tenantDatabase.Allocation, as: 'allocation' },
          ],
        },
      ],
    });

    const settingLogo = await this.tenantDatabase.SettingLogo.findOne();
    const project = await Project.findOne({ where: { code: this.tenant } });

    await getStockCorrectionItemStock(this.tenantDatabase, stockCorrection);

    return this.generatePdf(stockCorrection, project, settingLogo);
  }

  async generatePdf(stockCorrection, project, settingLogo) {
    let pdfBody = await fs.readFile(path.resolve(__dirname, '../../mails/stockCorrectionPrint.html'), 'utf8');
    let itemsHtml = '';

    stockCorrection.items.forEach((item) => {
      itemsHtml += `
        <tr>
          <td>${item.item.name}</td>
          <td>${item.initialStock} PCS</td>
          <td>${item.quantity} PCS</td>
          <td>${item.finalStock} PCS</td>
        </tr>
      `;
    });

    if (settingLogo) {
      const logo = `<img src="${settingLogo.publicUrl}" alt="logo" style="width: 100px; height:100px;">`;
      pdfBody = pdfBody.replace('{{logo}}', logo);
    } else {
      pdfBody = pdfBody.replace('{{logo}}', '');
    }

    if (stockCorrection.form.approvalStatus === -1) {
      pdfBody = pdfBody.replace(
        '{{cancel}}',
        `
        <div class="cancel">
          <p>Cancelled</p>
        </div>
      `
      );
    } else {
      pdfBody = pdfBody.replace('{{cancel}}', ``);
    }

    pdfBody = pdfBody.replace('{{items}}', itemsHtml);
    pdfBody = pdfBody.replace('{{date}}', moment(stockCorrection.form.date).format('DD MMMM YYYY'));
    pdfBody = pdfBody.replace('{{warehouse}}', stockCorrection.warehouse.name || '-');
    pdfBody = pdfBody.replace('{{address}}', stockCorrection.warehouse.address || '-');
    pdfBody = pdfBody.replace('{{phone}}', stockCorrection.warehouse.phone || '-');
    pdfBody = pdfBody.replace('{{createdBy}}', stockCorrection.form.createdByUser.fullName);
    pdfBody = pdfBody.replace('{{requestApprovalTo}}', stockCorrection.form.requestApprovalToUser.fullName);
    pdfBody = pdfBody.replace('{{number}}', stockCorrection.form.number);

    pdfBody = pdfBody.replace('{{tenantName}}', project.name);
    pdfBody = pdfBody.replace('{{tenantAddress}}', project.address || '-');
    pdfBody = pdfBody.replace('{{tenantPhone}}', project.phone || '-');

    const pdfBuffer = await htmlToPdf.generatePdf(
      { content: pdfBody, name: `Stock Correction-${stockCorrection.form.number}` },
      { format: 'A4' }
    );

    return pdfBuffer;
  }
}

async function getStockCorrectionItemStock(tenantDatabase, stockCorrection) {
  const { form: stockCorrectionForm, items: stockCorrectionItems } = stockCorrection;
  const doGetItemStocks = stockCorrectionItems.map(async (stockCorrectionItem) => {
    const currentStock = await new GetCurrentStock(tenantDatabase, {
      item: stockCorrectionItem.item,
      date: stockCorrectionForm.date,
      warehouseId: stockCorrection.warehouseId,
      options: {
        expiryDate: stockCorrectionItem.expiryDate,
        productionNumber: stockCorrectionItem.productionNumber,
      },
    }).call();

    stockCorrectionItem.initialStock = currentStock;
    stockCorrectionItem.finalStock = currentStock + stockCorrectionItem.quantity;
  });

  await Promise.all(doGetItemStocks);

  return stockCorrectionItems;
}

module.exports = Print;
