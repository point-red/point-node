const fs = require('fs');
const httpStatus = require('http-status');
const ApiError = require('@src/utils/ApiError');

class GeneratePdf {
  constructor(tenantDatabase, stockCorrectionId) {
    this.tenantDatabase = tenantDatabase;
    this.stockCorrectionId = stockCorrectionId;
  }

  async call() {
    let items = [];
    let templatePath = 'stockCorrection';

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
          ],
        },
      ],
    });
    if (!stockCorrection) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Stock correction is not exist');
    }

    const date = new Date(stockCorrection.form.date).toLocaleDateString('id', { dateStyle: 'long' });
    stockCorrection.items.forEach((e) => {
      let obj = {};
      obj.item = e.item.name;
      obj.stockDatabase = parseInt(e.item.stock);
      obj.stockCorrectionQty = e.quantity;
      obj.balance = parseInt(e.item.stock) - e.quantity;
      items.push(obj);
    });

    if (stockCorrection.form.approvalStatus === 0) {
      templatePath = 'stockCorrectionWatermarked';
    }

    const html = fs.readFileSync(`src/modules/inventory/stockCorrection/templates/${templatePath}.html`, 'utf-8');
    const options = {
      height: '297mm',
      width: '210mm',
      orientation: 'portrait',
      localUrlAccess: true,
    };

    const document = {
      html,
      data: {
        date,
        formNumber: stockCorrection.form.number,
        warehouse: stockCorrection.warehouse.name,
        address: stockCorrection.warehouse.address,
        phone: stockCorrection.warehouse.phone,
        items,
        createdBy: stockCorrection.form.createdByUser?.name,
        approveBy: stockCorrection.form.requestApprovalToUser?.name,
      },
      path: './stock-correction.pdf',
      type: 'stream',
    };

    return {document, options}
  }
}

module.exports = GeneratePdf;
