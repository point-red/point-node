const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes, projectCode) => {
  class PurchaseDownPayment extends Model {
    static associate({ [projectCode]: models }) {
      this.belongsTo(models.Supplier, { as: 'supplier', foreignKey: 'supplierId' });

      this.hasMany(models.PaymentOrderDownPayment, { as: 'paymentOrderDownPayment', foreignKey: 'purchaseDownPaymentId' });
    }
  }
  PurchaseDownPayment.init(
    {
      supplierId: {
        type: DataTypes.INTEGER,
      },
      supplierName: {
        type: DataTypes.STRING,
      },
      supplierAddress: {
        type: DataTypes.STRING,
      },
      supplierPhone: {
        type: DataTypes.STRING,
      },
      downpaymentableId: {
        type: DataTypes.INTEGER,
      },
      downpaymentableType: {
        type: DataTypes.STRING,
      },
      amount: {
        type: DataTypes.DECIMAL,
      },
      remaining: {
        type: DataTypes.DECIMAL,
      },
      paidBy: {
        type: DataTypes.INTEGER,
      },
    },
    {
      hooks: {},
      sequelize,
      modelName: 'PurchaseDownPayment',
      tableName: 'purchase_down_payments',
      underscored: true,
      timestamps: false,
    }
  );
  return PurchaseDownPayment;
};
