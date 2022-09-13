const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes, projectCode) => {
  class PaymentOrderOther extends Model {
    static associate({ [projectCode]: models }) {
      this.belongsTo(models.PaymentOrder, { as: 'paymentOrder', foreignKey: 'paymentOrderId' });

      this.belongsTo(models.PurchaseInvoiceOther, { as: 'purchaseInvoiceOther', foreignKey: 'purchaseInvoiceOtherId' });
    }
  }
  PaymentOrderOther.init(
    {
      paymentOrderId: {
        type: DataTypes.INTEGER,
      },
      purchaseInvoiceOtherId: {
        type: DataTypes.INTEGER,
      },
    },
    {
      hooks: {},
      sequelize,
      modelName: 'PaymentOrderOther',
      tableName: 'payment_order_others',
      underscored: true,
    }
  );
  return PaymentOrderOther;
};
