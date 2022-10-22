const httpStatus = require('http-status');
const ApiError = require('@src/utils/ApiError');

class CreatePaymentOrderApprove {
  constructor(tenantDatabase, { approver, paymentOrderId }) {
    this.tenantDatabase = tenantDatabase;
    this.approver = approver;
    this.paymentOrderId = paymentOrderId;
  }

  async call() {
    const paymentOrder = await this.tenantDatabase.PaymentOrder.findOne({
      where: { id: this.paymentOrderId },
      include: [{ model: this.tenantDatabase.Form, as: 'form' }],
    });
    if (!paymentOrder) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment order is not exist');
    }

    const form = await paymentOrder.getForm();
    validate(form, this.approver);
    if (form.approvalStatus === 1) {
      return { paymentOrder };
    }
    await this.tenantDatabase.sequelize.transaction(async (transaction) => {
      await updateJournal(this.tenantDatabase, { transaction, paymentOrder, form });
      await form.update({ approvalStatus: 1, approvalBy: this.approver.id, approvalAt: new Date() }, { transaction });
    });

    await paymentOrder.reload();
    return { paymentOrder };
  }
}

function validate(form, approver) {
  if (form.approvalStatus === -1) {
    throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'Payment order already rejected');
  }

  if (form.requestApprovalTo !== approver.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden - You are not the selected approver');
  }
}

async function updateJournal(tenantDatabase, { transaction, paymentOrder, form }) {
  await createJournalPaymentOrder(tenantDatabase, { transaction, paymentOrder, form });
  await createJournalReturn(tenantDatabase, { transaction, paymentOrder, form });
  await createJournalDownPayment(tenantDatabase, { transaction, paymentOrder, form });
  await createJournalOther(tenantDatabase, { transaction, paymentOrder, form });
  await createJournalInvoice(tenantDatabase, { transaction, paymentOrder, form });
}

async function createJournalPaymentOrder(tenantDatabase, { transaction, paymentOrder, form }) {
  const settingJournal = await getSettingJournal(tenantDatabase, { feature: 'purchase', name: 'account payable' });
  await tenantDatabase.Journal.create(
    {
      formId: form.id,
      journalableType: 'Supplier',
      journalableId: paymentOrder.supplierId,
      chartOfAccountId: settingJournal.chartOfAccountId,
      credit: paymentOrder.amount,
    },
    { transaction }
  );
}

async function createJournalReturn(tenantDatabase, { transaction, paymentOrder, form }) {
  if (parseInt(paymentOrder.totalReturn) === 0) {
    return;
  }

  const settingJournal = await getSettingJournal(tenantDatabase, { feature: 'purchase', name: 'account payable' });
  await tenantDatabase.Journal.create(
    {
      formId: form.id,
      journalableType: 'Supplier',
      journalableId: paymentOrder.supplierId,
      chartOfAccountId: settingJournal.chartOfAccountId,
      credit: paymentOrder.totalReturn,
    },
    { transaction }
  );
}

async function createJournalDownPayment(tenantDatabase, { transaction, paymentOrder, form }) {
  if (parseInt(paymentOrder.totalDownPayment) === 0) {
    return;
  }

  const settingJournal = await getSettingJournal(tenantDatabase, { feature: 'purchase', name: 'down payment' });
  await tenantDatabase.Journal.create(
    {
      formId: form.id,
      journalableType: 'Supplier',
      journalableId: paymentOrder.supplierId,
      chartOfAccountId: settingJournal.chartOfAccountId,
      credit: paymentOrder.totalDownPayment,
    },
    { transaction }
  );
}

async function createJournalOther(tenantDatabase, { transaction, paymentOrder, form }) {
  if (parseInt(paymentOrder.totalOther) === 0) {
    return;
  }

  const others = await tenantDatabase.PaymentOrderOther.findAll({
    where: { paymentOrderId: paymentOrder.id },
    include: [{ model: tenantDatabase.ChartOfAccount, as: 'chartOfAccount' }],
  });

  for (const other of others) {
    const coa = await tenantDatabase.ChartOfAccount.findOne({
      where: { id: other.chartOfAccountId },
      include: [{ model: tenantDatabase.ChartOfAccountType, as: 'type' }],
    });

    if (coa.type.name === 'DIRECT EXPENSE') {
      await tenantDatabase.Journal.create(
        {
          formId: form.id,
          chartOfAccountId: other.chartOfAccountId,
          debit: other.amount,
        },
        { transaction }
      );
    }
    if (coa.type.name === 'OTHER INCOME') {
      await tenantDatabase.Journal.create(
        {
          formId: form.id,
          chartOfAccountId: other.chartOfAccountId,
          credit: other.amount,
        },
        { transaction }
      );
    }
  }
}

async function createJournalInvoice(tenantDatabase, { transaction, paymentOrder, form }) {
  const settingJournal = await getSettingJournal(tenantDatabase, { feature: 'purchase', name: 'account payable' });
  await tenantDatabase.Journal.create(
    {
      formId: form.id,
      journalableType: 'Supplier',
      journalableId: paymentOrder.supplierId,
      chartOfAccountId: settingJournal.chartOfAccountId,
      debit: paymentOrder.totalInvoice,
    },
    { transaction }
  );
}

async function getSettingJournal(tenantDatabase, { feature, name }) {
  const settingJournal = await tenantDatabase.SettingJournal.findOne({
    where: {
      feature,
      name,
    },
  });

  if (!settingJournal) {
    throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, `Journal ${feature} account - ${name} not found`);
  }

  return settingJournal;
}

module.exports = CreatePaymentOrderApprove;
