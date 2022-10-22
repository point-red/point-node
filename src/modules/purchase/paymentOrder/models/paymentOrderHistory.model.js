const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes, projectCode) => {
  class PaymentOrderHistory extends Model {
    static associate({ [projectCode]: models }) {
      this.belongsTo(models.PaymentOrder, { as: 'paymentOrder', foreignKey: 'paymentOrderId' });

      this.belongsTo(models.User, { as: 'user', foreignKey: 'userId' });
    }
  }
  PaymentOrderHistory.init(
    {
      paymentOrderId: {
        type: DataTypes.INTEGER,
      },
      userId: {
        type: DataTypes.INTEGER,
      },
      activity: {
        type: DataTypes.STRING,
      },
    },
    {
      hooks: {},
      sequelize,
      modelName: 'PaymentOrderHistory',
      tableName: 'payment_order_histories',
      underscored: true,
    }
  );
  return PaymentOrderHistory;
};
