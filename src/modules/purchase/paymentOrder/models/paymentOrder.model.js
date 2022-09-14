const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes, projectCode) => {
  class PaymentOrder extends Model {
    static associate({ [projectCode]: models }) {
      this.belongsTo(models.Supplier, { as: 'supplier', foreignKey: 'supplierId' });

      this.hasOne(models.Form, {
        as: 'form',
        foreignKey: 'formableId',
        constraints: false,
        scope: { formable_type: 'PaymentOrder' },
      });
    }
  }
  PaymentOrder.init(
    {
      paymentType: {
        type: DataTypes.STRING,
      },
      dueDate: {
        type: DataTypes.DATE,
      },
      paymentAccountId: {
        type: DataTypes.INTEGER,
      },
      amount: {
        type: DataTypes.DECIMAL,
      },
      paymentableId: {
        type: DataTypes.INTEGER,
      },
      paymentableType: {
        type: DataTypes.STRING,
      },
      paymentableName: {
        type: DataTypes.STRING,
      },
      paymentId: {
        type: DataTypes.INTEGER,
      },
      formId: {
        type: DataTypes.INTEGER,
      },
      supplierId: {
        type: DataTypes.INTEGER,
      },
      totalInvoice: {
        type: DataTypes.DECIMAL,
      },
      totalDownPayment: {
        type: DataTypes.DECIMAL,
      },
      totalReturn: {
        type: DataTypes.DECIMAL,
      },
      totalOther: {
        type: DataTypes.DECIMAL,
      },
    },
    {
      hooks: {},
      sequelize,
      modelName: 'PaymentOrder',
      tableName: 'payment_orders',
      underscored: true,
    }
  );
  return PaymentOrder;
};
