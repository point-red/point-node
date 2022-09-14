const httpStatus = require('http-status');
const ApiError = require('@src/utils/ApiError');

class CreatePaymentOrder {
  constructor(tenantDatabase, { maker, createPaymentOrderDto }) {
    this.tenantDatabase = tenantDatabase;
    this.maker = maker;
    this.createPaymentOrderDto = createPaymentOrderDto;
  }

  async call() {
    const currentDate = new Date(Date.now());
    const {
      paymentType,
      supplierId,
      date,
      paymentAccountId,
      invoices,
      downPayments,
      returns,
      others,
      totalInvoiceAmount,
      totalDownPaymentAmount,
      totalReturnAmount,
      totalOtherAmount,
      totalAmount,
      approvedBy,
      notes,
    } = this.createPaymentOrderDto;

    await validate(this.tenantDatabase, this.createPaymentOrderDto);
    const { incrementNumber, incrementGroup } = await getFormIncrement(this.tenantDatabase, currentDate);
    const formNumber = await generateFormNumber(currentDate, incrementNumber);

    let paymentOrderForm, paymentOrder;
    await this.tenantDatabase.sequelize.transaction(async (transaction) => {
      paymentOrder = await this.tenantDatabase.PaymentOrder.create(
        {
          paymentType,
          supplierId,
          paymentAccountId,
          totalInvoice: totalInvoiceAmount,
          totalDownPayment: totalDownPaymentAmount,
          totalReturn: totalReturnAmount,
          totalOther: totalOtherAmount,
          amount: totalAmount,
        },
        { transaction }
      );

      paymentOrderForm = await this.tenantDatabase.Form.create(
        {
          date,
          number: formNumber,
          notes,
          createdBy: this.maker.id,
          updatedBy: this.maker.id,
          incrementNumber,
          incrementGroup,
          formableId: paymentOrder.id,
          formableType: 'PaymentOrder',
          requestApprovalTo: approvedBy,
        },
        { transaction }
      );

      await this.tenantDatabase.PaymentOrder.update(
        { formId: paymentOrderForm.id },
        { where: { id: paymentOrder.id }, transaction }
      );

      for (const invoice of invoices) {
        await this.tenantDatabase.PaymentOrderInvoice.create(
          {
            paymentOrderId: paymentOrder.id,
            purchaseInvoiceId: invoice.id,
            amount: invoice.amount,
          },
          { transaction }
        );

        await this.tenantDatabase.PurchaseInvoiceDone.create(
          { purchaseInvoiceId: invoice.id, refNo: paymentOrderForm.number, value: -Math.abs(invoice.amount) },
          { transaction }
        );
      }

      if (downPayments.length > 0) {
        for (const downPayment of downPayments) {
          await this.tenantDatabase.PaymentOrderDownPayment.create(
            {
              paymentOrderId: paymentOrder.id,
              purchaseDownPaymentId: downPayment.id,
              amount: downPayment.amount,
            },
            { transaction }
          );

          const downPaymentData = await this.tenantDatabase.PurchaseDownPayment.findOne({ where: { id: downPayment.id } });

          await this.tenantDatabase.PurchaseDownPayment.update(
            { remaining: downPaymentData.remaining - downPayment.amount },
            { where: { id: downPayment.id }, transaction }
          );
        }
      }

      if (returns.length > 0) {
        for (const returnVal of returns) {
          await this.tenantDatabase.PaymentOrderReturn.create(
            {
              paymentOrderId: paymentOrder.id,
              purchaseReturnId: returnVal.id,
              amount: returnVal.amount,
            },
            { transaction }
          );
        }
      }

      if (others.length > 0) {
        for (const other of others) {
          await this.tenantDatabase.PaymentOrderOther.create(
            {
              paymentOrderId: paymentOrder.id,
              chartOfAccountId: other.coaId,
              allocationId: other.allocationId,
              amount: other.amount,
              notes: other.notes,
            },
            { transaction }
          );
        }
      }

      await this.tenantDatabase.PaymentOrderHistory.create(
        {
          paymentOrderId: paymentOrder.id,
          userId: this.maker.id,
          activity: 'CREATE',
        },
        { transaction }
      );
    });

    return { paymentOrderForm, paymentOrder };
  }
}

async function validate(tenantDatabase, createPaymentOrderDto) {
  const {
    invoices,
    downPayments,
    returns,
    others,
    supplierId,
    totalInvoiceAmount,
    totalDownPaymentAmount,
    totalReturnAmount,
    totalOtherAmount,
  } = createPaymentOrderDto;
  let totalAccumulatedInvoice = 0;
  let totalAccumulatedDownPayment = 0;
  let totalAccumulatedReturn = 0;
  let totalAccumulatedOther = 0;

  const supplierData = await tenantDatabase.Supplier.findOne({ where: { id: supplierId } });
  if (!supplierData) {
    throw new ApiError(httpStatus.NOT_FOUND, `supplier ${supplierId} doesnt exist`);
  }

  for (const invoice of invoices) {
    const invoiceData = await tenantDatabase.PurchaseInvoice.findOne({
      where: { id: invoice.id, supplier_id: supplierId },
    });
    if (!invoiceData) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Invoice reference not found');
    }

    const invoiceAmountRemaining = await tenantDatabase.PurchaseInvoiceDone.sum('value', {
      where: { purchaseInvoiceId: invoice.id },
    });
    if (invoice.amount > invoiceAmountRemaining) {
      throw new ApiError(httpStatus.BAD_REQUEST, `available amount in invoice ${invoice.id} lower than inputted amount`);
    }

    totalAccumulatedInvoice += invoice.amount;
  }

  for (const downPayment of downPayments) {
    const downPaymentData = await tenantDatabase.PurchaseDownPayment.findOne({
      where: { id: downPayment.id, supplier_id: supplierId },
    });
    if (!downPaymentData) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Down payment reference not found');
    }

    if (downPayment.amount > downPaymentData.remaining) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `available amount in down payment ${downPayment.id} lower than inputted amount`
      );
    }

    totalAccumulatedDownPayment += downPayment.amount;
  }

  for (const returnVal of returns) {
    const returnData = await tenantDatabase.PurchaseReturn.findOne({
      where: { id: returnVal.id, supplier_id: supplierId },
    });
    if (!returnData) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Purchase return reference not found');
    }

    totalAccumulatedReturn += returnVal.amount;
  }

  for (const other of others) {
    totalAccumulatedOther += other.amount;
  }

  if (totalAccumulatedInvoice != totalInvoiceAmount) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Total invoice must be equal to accumulated invoices amount`);
  }
  if (totalAccumulatedDownPayment != totalDownPaymentAmount) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Total down payment must be equal to accumulated down payments amount`);
  }
  if (totalAccumulatedReturn != totalReturnAmount) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Total purchase return must be equal to accumulated purchase returns amount`);
  }
  if (totalAccumulatedOther != totalOtherAmount) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Total other must be equal to accumulated others amount`);
  }

  if (totalDownPaymentAmount + totalReturnAmount > totalInvoiceAmount) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Total invoice must be greater than total down payment + total return`);
  }
}

async function getFormIncrement(tenantDatabase, currentDate) {
  const incrementGroup = `${currentDate.getFullYear()}${getMonthFormattedString(currentDate)}`;
  const lastForm = await tenantDatabase.Form.findOne({
    where: {
      formableType: 'PaymentOrder',
      incrementGroup,
    },
    order: [['increment', 'DESC']],
  });

  return {
    incrementGroup,
    incrementNumber: lastForm ? lastForm.incrementNumber + 1 : 1,
  };
}

async function generateFormNumber(currentDate, incrementNumber) {
  const monthValue = getMonthFormattedString(currentDate);
  const yearValue = getYearFormattedString(currentDate);
  const orderNumber = `000${incrementNumber}`.slice(-3);
  return `PP${yearValue}${monthValue}${orderNumber}`;
}

function getYearFormattedString(currentDate) {
  const fullYear = currentDate.getFullYear().toString();
  return fullYear.slice(-2);
}

function getMonthFormattedString(currentDate) {
  const month = currentDate.getMonth() + 1;
  return `0${month}`.slice(-2);
}

module.exports = CreatePaymentOrder;
