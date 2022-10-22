const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes, projectCode) => {
  class PaymentOrderReturn extends Model {
    static associate({ [projectCode]: models }) {
      this.belongsTo(models.PaymentOrder, { as: 'paymentOrder', foreignKey: 'paymentOrderId' });

      this.belongsTo(models.PurchaseReturn, { as: 'purchaseReturn', foreignKey: 'purchaseReturnId' });
    }
  }
  PaymentOrderReturn.init(
    {
      paymentOrderId: {
        type: DataTypes.INTEGER,
      },
      purchaseReturnId: {
        type: DataTypes.INTEGER,
      },
      amount: {
        type: DataTypes.DECIMAL,
      },
    },
    {
      hooks: {},
      sequelize,
      modelName: 'PaymentOrderReturn',
      tableName: 'payment_order_returns',
      underscored: true,
    }
  );
  return PaymentOrderReturn;
};
