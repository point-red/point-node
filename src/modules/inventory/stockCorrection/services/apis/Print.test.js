const httpStatus = require('http-status');
const tenantDatabase = require('@src/models').tenant;
const ApiError = require('@src/utils/ApiError');
const factory = require('@root/tests/utils/factory');
const { SettingLogo, Form } = require('@src/models').tenant;
const Print = require('./Print');

describe('Print Stock Correction', () => {
  describe('validations', () => {
    it('throw error when stock correction is not exist', async () => {
      const stockCorrectionId = 'invalid-id';
      const tenant = 'tenant_test';
      await expect(async () => {
        await new Print(tenantDatabase, stockCorrectionId, tenant).call();
      }).rejects.toThrow(new ApiError(httpStatus.NOT_FOUND, 'Stock correction is not exist'));
    });
  });

  describe('success', () => {
    let stockCorrection;
    beforeEach(async (done) => {
      const recordFactories = await generateRecordFactories();
      ({ stockCorrection } = recordFactories);

      done();
    });

    it("return stock correction's print data", async () => {
      const tenant = 'tenant_test';
      const stockCorrectionId = stockCorrection.id;
      const print = await new Print(tenantDatabase, stockCorrectionId, tenant).call();

      expect(print).toBeInstanceOf(Buffer);
    });

    it("return stock correction's print data when tenant has setting logo", async () => {
      const publicUrl =
        'https://pointnode.s3.ap-southeast-1.amazonaws.com/demo1234/settingLogo/70e552c4-3ecd-4058-a204-263ff1e35adf.png';
      await SettingLogo.create({
        createdBy: 1,
        path: 'logo',
        publicUrl,
      });

      const tenant = 'tenant_test';
      const stockCorrectionId = stockCorrection.id;
      const print = await new Print(tenantDatabase, stockCorrectionId, tenant).call();

      expect(print).toBeInstanceOf(Buffer);
    });

    it("return stock correction's print data when stock correction is cancelled", async () => {
      const tenant = 'tenant_test';
      const stockCorrectionId = stockCorrection.id;
      await Form.update({ approvalStatus: -1 }, { where: { formableId: stockCorrectionId } });
      const print = await new Print(tenantDatabase, stockCorrectionId, tenant).call();

      expect(print).toBeInstanceOf(Buffer);
    });
  });
});

const generateRecordFactories = async ({
  maker,
  approver,
  branch,
  warehouse,
  item,
  stockCorrection,
  stockCorrectionItem,
  stockCorrectionForm,
} = {}) => {
  const chartOfAccountType = await tenantDatabase.ChartOfAccountType.create({
    name: 'cost of sales',
    alias: 'beban pokok penjualan',
    isDebit: true,
  });
  const chartOfAccount = await tenantDatabase.ChartOfAccount.create({
    typeId: chartOfAccountType.id,
    position: 'DEBIT',
    name: 'beban selisih persediaan',
    alias: 'beban selisih persediaan',
  });

  maker = await factory.user.create(maker);
  approver = await factory.user.create(approver);
  branch = await factory.branch.create(branch);
  warehouse = await factory.warehouse.create({ branch, ...warehouse });
  item = await factory.item.create({ chartOfAccount, ...item });
  stockCorrection = await factory.stockCorrection.create({ warehouse, ...stockCorrection });
  stockCorrectionItem = await factory.stockCorrectionItem.create({
    stockCorrection,
    quantity: 10,
    item,
  });
  stockCorrectionForm = await factory.form.create({
    branch,
    createdBy: maker.id,
    updatedBy: maker.id,
    requestApprovalTo: approver.id,
    formable: stockCorrection,
    formableType: 'StockCorrection',
    number: 'SC2101001',
  });

  const settingJournal = await tenantDatabase.SettingJournal.create({
    feature: 'stock correction',
    name: 'difference stock expenses',
    description: 'difference stock expenses',
    chartOfAccountId: chartOfAccount.id,
  });

  const inventoryForm = await factory.form.create({
    date: new Date('2022-01-01'),
    branch,
    number: 'PI2101001',
    formable: { id: 1 },
    formableType: 'PurchaseInvoice',
    createdBy: maker.id,
    updatedBy: maker.id,
  });
  await factory.inventory.create({
    form: inventoryForm,
    warehouse,
    item,
  });

  return {
    maker,
    approver,
    branch,
    warehouse,
    item,
    stockCorrection,
    stockCorrectionItem,
    stockCorrectionForm,
    settingJournal,
  };
};
