const httpStatus = require('http-status');
const ApiError = require('@src/utils/ApiError');
const tenantDatabase = require('@src/models').tenant;
const factory = require('@root/tests/utils/factory');
const CreatePaymentOrderReject = require('./CreatePaymentOrderReject');

describe('Payment Order - CreatePaymentOrderReject', () => {
  describe('validations', () => {
    it('throw error when payment order is not exist', async () => {
      const approver = await factory.user.create();

      await expect(async () => {
        await new CreatePaymentOrderReject(tenantDatabase, { approver, paymentOrderId: 'invalid-id' }).call();
      }).rejects.toThrow(new ApiError(httpStatus.NOT_FOUND, 'Payment order is not exist'));
    });

    it('throw error when rejected by unwanted user', async () => {
      const approver = { id: 'invalid-id' };
      const createPaymentOrderRejectDto = {
        reason: 'example reason',
      };

      await expect(async () => {
        await new CreatePaymentOrderReject(tenantDatabase, {
          approver,
          paymentOrderId: 6,
          createPaymentOrderRejectDto,
        }).call();
      }).rejects.toThrow(new ApiError(httpStatus.FORBIDDEN, 'Forbidden - You are not the selected approver'));
    });

    it('throw error when payment order is already approved', async () => {
      const approver = await factory.user.create();
      const createPaymentOrderRejectDto = {
        reason: 'example reason',
      };

      await expect(async () => {
        await new CreatePaymentOrderReject(tenantDatabase, {
          approver: approver,
          paymentOrderId: 5,
          createPaymentOrderRejectDto,
        }).call();
      }).rejects.toThrow(new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'Payment order already approved'));
    });

    it('return rejected payment order when payment order is already rejected', async () => {
      const approver = await factory.user.create();
      const createPaymentOrderRejectDto = {
        reason: 'example reason',
      };

      const createFormApprove = await new CreatePaymentOrderReject(tenantDatabase, {
        approver,
        paymentOrderId: 4,
        createPaymentOrderRejectDto,
      }).call();

      expect(createFormApprove.paymentOrder).toBeDefined();
      expect(createFormApprove.paymentOrder.form.approvalStatus).toEqual(-1);
    });
  });

  describe('success reject', () => {
    it('update form status to rejected', async () => {
      const approver = await factory.user.create();
      const createPaymentOrderRejectDto = {
        reason: 'example reason',
      };

      ({ paymentOrder } = await new CreatePaymentOrderReject(tenantDatabase, {
        approver,
        paymentOrderId: 6,
        createPaymentOrderRejectDto,
      }).call());

      expect(paymentOrder.form.approvalStatus).toEqual(-1);
    });
  });
});
