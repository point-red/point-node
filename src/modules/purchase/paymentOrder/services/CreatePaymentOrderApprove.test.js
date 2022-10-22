const httpStatus = require('http-status');
const ApiError = require('@src/utils/ApiError');
const tenantDatabase = require('@src/models').tenant;
const factory = require('@root/tests/utils/factory');
const CreatePaymentOrderApprove = require('./CreatePaymentOrderApprove');

describe('Payment Order - CreatePaymentOrderApprove', () => {
  describe('validations', () => {
    it('throw error when payment order is not exist', async () => {
      const approver = await factory.user.create();

      await expect(async () => {
        await new CreatePaymentOrderApprove(tenantDatabase, { approver, paymentOrderId: 'invalid-id' }).call();
      }).rejects.toThrow(new ApiError(httpStatus.NOT_FOUND, 'Payment order is not exist'));
    });

    it('throw error when approved by unwanted user', async () => {
      const approver = { id: 'invalid-id' };
      const createPaymentOrderApproveDto = {
        reason: 'example reason',
      };

      await expect(async () => {
        await new CreatePaymentOrderApprove(tenantDatabase, {
          approver,
          paymentOrderId: 6,
          createPaymentOrderApproveDto,
        }).call();
      }).rejects.toThrow(new ApiError(httpStatus.FORBIDDEN, 'Forbidden - You are not the selected approver'));
    });

    it('throw error when payment order is already rejected', async () => {
      const approver = await factory.user.create();
      const createPaymentOrderApproveDto = {
        reason: 'example reason',
      };

      await expect(async () => {
        await new CreatePaymentOrderApprove(tenantDatabase, {
          approver: approver,
          paymentOrderId: 4,
          createPaymentOrderApproveDto,
        }).call();
      }).rejects.toThrow(new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'Payment order already rejected'));
    });

    it('return approved payment order when payment order is already approved', async () => {
      const approver = await factory.user.create();
      const createPaymentOrderApproveDto = {
        reason: 'example reason',
      };

      const createFormApprove = await new CreatePaymentOrderApprove(tenantDatabase, {
        approver,
        paymentOrderId: 5,
        createPaymentOrderApproveDto,
      }).call();

      expect(createFormApprove.paymentOrder).toBeDefined();
      expect(createFormApprove.paymentOrder.form.approvalStatus).toEqual(1);
    });
  });

  describe('success approve', () => {
    it('update form status to approved', async () => {
      const approver = await factory.user.create();
      const createPaymentOrderApproveDto = {
        reason: 'example reason',
      };

      ({ paymentOrder } = await new CreatePaymentOrderApprove(tenantDatabase, {
        approver,
        paymentOrderId: 6,
        createPaymentOrderApproveDto,
      }).call());

      expect(paymentOrder.form.approvalStatus).toEqual(1);
    });
  });
});
