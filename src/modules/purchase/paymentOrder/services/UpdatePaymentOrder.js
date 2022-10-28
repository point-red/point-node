const httpStatus = require('http-status');
const ApiError = require('@src/utils/ApiError');
const FindPaymentOrder = require('./FindPaymentOrder');

class UpdatePaymentOrder {
  constructor(tenantDatabase, { maker, paymentOrderId, updatePaymentOrderDto }) {
    this.tenantDatabase = tenantDatabase;
    this.maker = maker;
    this.paymentOrderId = paymentOrderId;
    this.updatePaymentOrderDto = updatePaymentOrderDto;
  }

  async call() {
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
    } = this.updatePaymentOrderDto;

    await validate(this.tenantDatabase, this.updatePaymentOrderDto);
    const paymentOrder = await this.tenantDatabase.PaymentOrder.findOne({
      where: { id: this.paymentOrderId },
      include: [{ model: this.tenantDatabase.Form, as: 'form' }],
    });
    if (!paymentOrder) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment order not found');
    }

    const paymentOrderArchive = await new FindPaymentOrder(this.tenantDatabase, this.paymentOrderId).call();
    await this.tenantDatabase.sequelize.transaction(async (transaction) => {
      const form = await paymentOrder.getForm();
      if (form.approvalStatus === 1) {
        await this.tenantDatabase.Journal.destroy({ where: { formId: form.id } }, { transaction });
      }

      await this.tenantDatabase.PaymentOrder.update(
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
        { where: { id: this.paymentOrderId }, transaction }
      );

      await this.tenantDatabase.Form.update(
        {
          date,
          notes,
          updatedBy: this.maker.id,
          requestApprovalTo: approvedBy,
          approvalStatus: 0,
          approvalBy: null,
          approvalAt: null,
        },
        { where: { id: form.id }, transaction }
      );

      await this.tenantDatabase.PurchaseInvoiceDone.destroy({ where: { refNo: form.number } }, { transaction });
      await this.tenantDatabase.PaymentOrderInvoice.destroy(
        { where: { paymentOrderId: this.paymentOrderId } },
        { transaction }
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
          { purchaseInvoiceId: invoice.id, refNo: form.number, value: -Math.abs(invoice.amount) },
          { transaction }
        );
      }

      if (downPayments.length > 0) {
        for (const downPayment of downPayments) {
          const existPaymentOrderDownPayment = await this.tenantDatabase.PaymentOrderDownPayment.findOne({
            where: { purchaseDownPaymentId: downPayment.id },
          });
          if (existPaymentOrderDownPayment) {
            await this.tenantDatabase.PaymentOrderDownPayment.update(
              { amount: downPayment.amount },
              { where: { paymentOrderId: paymentOrder.id, purchaseDownPaymentId: downPayment.id }, transaction }
            );

            const downPaymentData = await this.tenantDatabase.PurchaseDownPayment.findOne({ where: { id: downPayment.id } });

            // rollback remaining value as before created
            await this.tenantDatabase.PurchaseDownPayment.update(
              { remaining: downPaymentData.remaining + parseInt(existPaymentOrderDownPayment.amount) },
              { where: { id: downPayment.id }, transaction }
            );

            // update remaining value as inputted
            await this.tenantDatabase.PurchaseDownPayment.update(
              { remaining: downPaymentData.remaining - downPayment.amount },
              { where: { id: downPayment.id }, transaction }
            );
          } else {
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
      }

      if (returns.length > 0) {
        for (const returnVal of returns) {
          const existPaymentOrderReturn = await this.tenantDatabase.PaymentOrderReturn.findOne({
            where: { purchaseReturnId: returnVal.id },
          });
          if (existPaymentOrderReturn) {
            await this.tenantDatabase.PaymentOrderReturn.update(
              { amount: returnVal.amount },
              { where: { paymentOrderId: paymentOrder.id, purchaseReturnId: returnVal.id }, transaction }
            );

            const returnData = await this.tenantDatabase.PurchaseReturn.findOne({ where: { id: returnVal.id } });

            // rollback remaining value as before created
            await this.tenantDatabase.PurchaseReturn.update(
              { remaining: returnData.remaining + parseInt(existPaymentOrderReturn.amount) },
              { where: { id: returnVal.id }, transaction }
            );

            // update remaining value as inputted
            await this.tenantDatabase.PurchaseReturn.update(
              { remaining: returnData.remaining - returnVal.amount },
              { where: { id: returnVal.id }, transaction }
            );
          } else {
            await this.tenantDatabase.PaymentOrderReturn.create(
              {
                paymentOrderId: paymentOrder.id,
                purchaseReturnId: returnVal.id,
                amount: returnVal.amount,
              },
              { transaction }
            );

            const returnData = await this.tenantDatabase.PurchaseReturn.findOne({ where: { id: returnVal.id } });

            await this.tenantDatabase.PurchaseReturn.update(
              { remaining: returnData.remaining - returnVal.amount },
              { where: { id: returnVal.id }, transaction }
            );
          }
        }
      }

      if (others.length > 0) {
        await this.tenantDatabase.PaymentOrderOther.destroy(
          { where: { paymentOrderId: this.paymentOrderId } },
          { transaction }
        );
        for (const other of others) {
          await this.tenantDatabase.PaymentOrderOther.create(
            {
              paymentOrderId: this.paymentOrderId,
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
          paymentOrderId: this.paymentOrderId,
          userId: this.maker.id,
          activity: 'UPDATE',
          archive: paymentOrderArchive,
        },
        { transaction }
      );
    });

    await paymentOrder.reload();
    return { paymentOrder };
  }
}

async function validate(tenantDatabase, updatePaymentOrderDto) {
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
  } = updatePaymentOrderDto;
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

    if (returnVal.amount > returnData.remaining) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `available amount in purchase return ${returnVal.id} lower than inputted amount`
      );
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

module.exports = UpdatePaymentOrder;
