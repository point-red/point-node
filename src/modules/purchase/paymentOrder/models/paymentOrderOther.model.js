const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes, projectCode) => {
  class PaymentOrderOther extends Model {
    static associate({ [projectCode]: models }) {
      this.belongsTo(models.PaymentOrder, { as: 'paymentOrder', foreignKey: 'paymentOrderId' });
    }
  }
  PaymentOrderOther.init(
    {
      paymentOrderId: {
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
      modelName: 'PaymentOrderOther',
      tableName: 'payment_order_others',
      underscored: true,
    }
  );
  return PaymentOrderOther;
};
