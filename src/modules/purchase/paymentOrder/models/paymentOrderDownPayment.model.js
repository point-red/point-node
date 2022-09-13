const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes, projectCode) => {
  class PaymentOrderDownPayment extends Model {
    static associate({ [projectCode]: models }) {
      this.belongsTo(models.PaymentOrder, { as: 'paymentOrder', foreignKey: 'paymentOrderId' });

      this.belongsTo(models.PurchaseDownPayment, { as: 'purchaseDownPayment', foreignKey: 'purchaseDownPaymentId' });
    }
  }
  PaymentOrderDownPayment.init(
    {
      paymentOrderId: {
        type: DataTypes.INTEGER,
      },
      purchaseDownPaymentId: {
        type: DataTypes.INTEGER,
      },
      amount: {
        type: DataTypes.DECIMAL,
      },
    },
    {
      hooks: {},
      sequelize,
      modelName: 'PaymentOrderDownPayment',
      tableName: 'payment_order_down_payments',
      underscored: true,
    }
  );
  return PaymentOrderDownPayment;
};
