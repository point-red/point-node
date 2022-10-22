const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes, projectCode) => {
  class PaymentOrderDetail extends Model {
    static associate({ [projectCode]: models }) {
      this.belongsTo(models.PaymentOrder, { as: 'paymentOrder', foreignKey: 'paymentOrderId' });

      this.belongsTo(models.ChartOfAccount, { as: 'chartOfAccount', foreignKey: 'chartOfAccountId' });

      this.belongsTo(models.Allocation, { as: 'allocation', foreignKey: 'allocationId' });
    }
  }
  PaymentOrderDetail.init(
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
      referenceableId: {
        type: DataTypes.INTEGER,
      },
      referenceableType: {
        type: DataTypes.STRING,
      },
    },
    {
      hooks: {},
      sequelize,
      modelName: 'PaymentOrderDetail',
      tableName: 'payment_order_details',
      underscored: true,
      timestamps: false,
    }
  );
  return PaymentOrderDetail;
};
