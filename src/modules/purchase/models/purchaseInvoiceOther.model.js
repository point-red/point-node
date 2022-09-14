const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes, projectCode) => {
  class PurchaseInvoiceOther extends Model {
    // static associate({ [projectCode]: models }) {}
  }
  PurchaseInvoiceOther.init(
    {
      purchaseInvoiceId: {
        type: DataTypes.INTEGER,
      },
      chartOfAccountId: {
        type: DataTypes.INTEGER,
      },
      allocationId: {
        type: DataTypes.INTEGER,
      },
      amount: {
        type: DataTypes.DECIMAL,
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      hooks: {},
      sequelize,
      modelName: 'PurchaseInvoiceOther',
      tableName: 'purchase_invoice_others',
      underscored: true,
      timestamps: false,
    }
  );
  return PurchaseInvoiceOther;
};
