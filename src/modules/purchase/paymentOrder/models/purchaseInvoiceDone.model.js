const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes, projectCode) => {
  class PurchaseInvoiceDone extends Model {
    static associate({ [projectCode]: models }) {
      this.belongsTo(models.PurchaseInvoice, { as: 'purchaseInvoice', foreignKey: 'purchaseInvoiceId' });
    }
  }
  PurchaseInvoiceDone.init(
    {
      purchaseInvoiceId: {
        type: DataTypes.INTEGER,
      },
      refNo: {
        type: DataTypes.STRING,
      },
      value: {
        type: DataTypes.DECIMAL,
      },
    },
    {
      hooks: {},
      sequelize,
      modelName: 'PurchaseInvoiceDone',
      tableName: 'purchase_invoice_done',
      underscored: true,
    }
  );
  return PurchaseInvoiceDone;
};
