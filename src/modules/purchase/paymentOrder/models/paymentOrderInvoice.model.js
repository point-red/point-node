const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes, projectCode) => {
  class PaymentOrderInvoice extends Model {
    static associate({ [projectCode]: models }) {
      this.belongsTo(models.PaymentOrder, { as: 'paymentOrder', foreignKey: 'paymentOrderId' });

      this.belongsTo(models.PurchaseInvoice, { as: 'purchaseInvoice', foreignKey: 'purchaseInvoiceId' });
    }
  }
  PaymentOrderInvoice.init(
    {
      paymentOrderId: {
        type: DataTypes.INTEGER,
      },
      purchaseInvoiceId: {
        type: DataTypes.INTEGER,
      },
      amount: {
        type: DataTypes.DECIMAL,
      },
    },
    {
      hooks: {},
      sequelize,
      modelName: 'PaymentOrderInvoice',
      tableName: 'payment_order_invoices',
      underscored: true,
    }
  );
  return PaymentOrderInvoice;
};
