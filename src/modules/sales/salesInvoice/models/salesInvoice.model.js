const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes, projectCode) => {
  class SalesInvoice extends Model {
    static associate({ [projectCode]: models }) {
      this.hasMany(models.SalesInvoiceItem, { as: 'items' });

      this.belongsTo(models.Customer, { as: 'customer' });

      this.belongsTo(models.DeliveryNote, { as: 'salesDeliveryNote', foreignKey: 'referenceableId', constraints: false });

      this.belongsTo(models.SalesVisitation, { as: 'salesVisitation', foreignKey: 'referenceableId', constraints: false });

      this.hasOne(models.Form, {
        as: 'form',
        foreignKey: 'formableId',
        constraints: false,
        scope: { formable_type: 'SalesInvoice' },
      });
    }

    getReferenceable(options) {
      const referenceableTypes = ['SalesDeliveryNote', 'SalesVisitation'];
      if (!referenceableTypes.includes(this.referenceableType)) return Promise.resolve(null);
      const mixinMethodName = `get${this.referenceableType}`;
      return this[mixinMethodName](options);
    }

    getDiscountString() {
      const discountValue = parseFloat(this.discountValue);
      const discountPercent = parseFloat(this.discountPercent);

      if (discountValue > 0) {
        return `${discountValue}`;
      }

      if (discountPercent > 0) {
        return `${discountPercent} %`;
      }

      return '';
    }

    async getTotalDetails() {
      const items = await this.getItems();
      const subTotal = getSubTotal(items);
      const taxBase = getTaxBase(subTotal, this.discountValue, this.discountPercent);

      return {
        subTotal,
        taxBase,
        tax: parseFloat(this.tax),
        amount: parseFloat(this.amount),
      };
    }
  }
  SalesInvoice.init(
    {
      dueDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      discountPercent: {
        type: DataTypes.DECIMAL,
        defaultValue: 0,
      },
      discountValue: {
        type: DataTypes.DECIMAL,
        defaultValue: 0,
      },
      tax: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      typeOfTax: {
        type: DataTypes.STRING,
        validate: {
          isIn: [['include', 'exclude', 'non']],
        },
      },
      amount: {
        type: DataTypes.DECIMAL,
      },
      remaining: {
        type: DataTypes.DECIMAL,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      customerName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      customerAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      customerPhone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      referenceableId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      referenceableType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      hooks: {},
      sequelize,
      modelName: 'SalesInvoice',
      tableName: 'sales_invoices',
      underscored: true,
      timestamps: false,
    }
  );
  return SalesInvoice;
};

function getSubTotal(items) {
  const subTotal = items.reduce((result, item) => {
    return result + getItemsPrice(item);
  }, 0);

  return subTotal;
}

function getItemsPrice(item) {
  let perItemPrice = item.price;
  if (item.discountValue > 0) {
    perItemPrice -= item.discountValue;
  }
  if (item.discountPercent > 0) {
    const discountPercent = item.discountPercent / 100;
    perItemPrice -= perItemPrice * discountPercent;
  }
  const totalItemPrice = perItemPrice * item.quantity;

  return totalItemPrice;
}

function getTaxBase(subTotal, discountValue, discountPercent) {
  if (discountValue > 0) {
    return subTotal - discountValue;
  }

  if (discountPercent > 0) {
    return subTotal - subTotal * (discountPercent / 100);
  }

  return subTotal;
}