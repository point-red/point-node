const { Model } = require('sequelize');
const moment = require('moment');

module.exports = (sequelize, DataTypes, projectCode) => {
  class StockCorrectionItem extends Model {
    static associate({ [projectCode]: models }) {
      this.belongsTo(models.StockCorrection, { as: 'stockCorrection', onUpdate: 'CASCADE', onDelete: 'CASCADE' });

      this.belongsTo(models.Item, { as: 'item', onUpdate: 'RESTRICT', onDelete: 'RESTRICT' });
    }
  }
  StockCorrectionItem.init(
    {
      stockCorrectionId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      itemId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        get() {
          return parseFloat(this.getDataValue('quantity'));
        },
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: true,
        get() {
          if (this.getDataValue('expiryDate') === null) return null;

          return moment(this.getDataValue('expiryDate')).format('YYYY-MM-DD HH:mm:ss');
        },
      },
      productionNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      converter: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        get() {
          return parseFloat(this.getDataValue('converter'));
        },
      },
      notes: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      hooks: {},
      sequelize,
      modelName: 'StockCorrectionItem',
      tableName: 'stock_correction_items',
      underscored: true,
      timestamps: false,
    }
  );
  return StockCorrectionItem;
};
