const httpStatus = require('http-status');
const ApiError = require('@src/utils/ApiError');
const factory = require('@root/tests/utils/factory');
const tenantDatabase = require('@src/models').tenant;
const CreatePaymentOrder = require('./CreatePaymentOrder');

const mockedTime = new Date(Date.UTC(2021, 0, 1)).valueOf();
Date.now = jest.fn(() => new Date(mockedTime));

describe('Purchase - CreatePaymentOrder', () => {
  describe('when form created', () => {
    it('throw error when supplier id doesnt exist', async () => {
      const supplierId = 10;
      const maker = await factory.user.create();
      const createPaymentOrderDto = generateCreatePaymentOrderRequestDto({ supplierId });

      await expect(async () => {
        await new CreatePaymentOrder(tenantDatabase, {
          maker,
          createPaymentOrderDto,
        }).call();
      }).rejects.toThrow(`supplier ${supplierId} doesnt exist`);
    });

    it('throw error when invoice id doesnt exist', async () => {
      const invoices = [
        {
          id: 10,
          amount: 100000,
        },
      ];
      const maker = await factory.user.create();
      const createPaymentOrderDto = generateCreatePaymentOrderRequestDto({ invoices });

      await expect(async () => {
        await new CreatePaymentOrder(tenantDatabase, {
          maker,
          createPaymentOrderDto,
        }).call();
      }).rejects.toThrow(new ApiError(httpStatus.NOT_FOUND, `Invoice reference not found`));
    });

    it('throw error when down payment id doesnt exist', async () => {
      const downPayments = [
        {
          id: 10,
          amount: 50000,
        },
      ];
      const maker = await factory.user.create();
      const createPaymentOrderDto = generateCreatePaymentOrderRequestDto({ downPayments });

      await expect(async () => {
        await new CreatePaymentOrder(tenantDatabase, {
          maker,
          createPaymentOrderDto,
        }).call();
      }).rejects.toThrow(new ApiError(httpStatus.NOT_FOUND, `Down payment reference not found`));
    });

    it('throw error when return id doesnt exist', async () => {
      const returns = [
        {
          id: 10,
          amount: 50000,
        },
      ];
      const maker = await factory.user.create();
      const createPaymentOrderDto = generateCreatePaymentOrderRequestDto({ returns });

      await expect(async () => {
        await new CreatePaymentOrder(tenantDatabase, {
          maker,
          createPaymentOrderDto,
        }).call();
      }).rejects.toThrow(new ApiError(httpStatus.NOT_FOUND, `Purchase return reference not found`));
    });

    it('throw error when invoice amount > available', async () => {
      const invoices = [
        {
          id: 1,
          amount: 150000000,
        },
      ];
      const maker = await factory.user.create();
      const createPaymentOrderDto = generateCreatePaymentOrderRequestDto({ invoices });

      await expect(async () => {
        await new CreatePaymentOrder(tenantDatabase, {
          maker,
          createPaymentOrderDto,
        }).call();
      }).rejects.toThrow(`available amount in invoice ${invoices[0].id} lower than inputted amount`);
    });

    it('throw error when down payment amount > available', async () => {
      const downPayments = [
        {
          id: 1,
          amount: 150000000,
        },
      ];
      const maker = await factory.user.create();
      const createPaymentOrderDto = generateCreatePaymentOrderRequestDto({ downPayments });

      await expect(async () => {
        await new CreatePaymentOrder(tenantDatabase, {
          maker,
          createPaymentOrderDto,
        }).call();
      }).rejects.toThrow(`available amount in down payment ${downPayments[0].id} lower than inputted amount`);
    });

    it('throw error when total invoice different from accumulated invoices amount', async () => {
      const invoices = [
        {
          id: 1,
          amount: 100000,
        },
      ];
      const totalInvoiceAmount = 10000;
      const maker = await factory.user.create();
      const createPaymentOrderDto = generateCreatePaymentOrderRequestDto({ invoices, totalInvoiceAmount });

      await expect(async () => {
        await new CreatePaymentOrder(tenantDatabase, {
          maker,
          createPaymentOrderDto,
        }).call();
      }).rejects.toThrow(`Total invoice must be equal to accumulated invoices amount`);
    });

    it('throw error when total down payment different from accumulated down payments amount', async () => {
      const downPayments = [
        {
          id: 1,
          amount: 50000,
        },
      ];
      const totalDownPaymentAmount = 5000;
      const maker = await factory.user.create();
      const createPaymentOrderDto = generateCreatePaymentOrderRequestDto({ downPayments, totalDownPaymentAmount });

      await expect(async () => {
        await new CreatePaymentOrder(tenantDatabase, {
          maker,
          createPaymentOrderDto,
        }).call();
      }).rejects.toThrow(`Total down payment must be equal to accumulated down payments amount`);
    });

    it('throw error when total return different from accumulated returns amount', async () => {
      const returns = [
        {
          id: 1,
          amount: 10000,
        },
      ];
      const totalReturnAmount = 1000;
      const maker = await factory.user.create();
      const createPaymentOrderDto = generateCreatePaymentOrderRequestDto({ returns, totalReturnAmount });

      await expect(async () => {
        await new CreatePaymentOrder(tenantDatabase, {
          maker,
          createPaymentOrderDto,
        }).call();
      }).rejects.toThrow(`Total purchase return must be equal to accumulated purchase returns amount`);
    });

    it('throw error when total other different from accumulated others amount', async () => {
      const others = [
        {
          coaId: 1,
          notes: 'string',
          amount: 5000,
          allocationId: 1,
        },
      ];
      const totalOtherAmount = 500;
      const maker = await factory.user.create();
      const createPaymentOrderDto = generateCreatePaymentOrderRequestDto({ others, totalOtherAmount });

      await expect(async () => {
        await new CreatePaymentOrder(tenantDatabase, {
          maker,
          createPaymentOrderDto,
        }).call();
      }).rejects.toThrow(`Total other must be equal to accumulated others amount`);
    });

    it('throw error when total invoice lower than total down payment and total return', async () => {
      const invoices = [
        {
          id: 1,
          amount: 10000,
        },
      ];
      const totalInvoiceAmount = 10000;
      const totalDownPaymentAmount = 50000;
      const maker = await factory.user.create();
      const createPaymentOrderDto = generateCreatePaymentOrderRequestDto({
        invoices,
        totalInvoiceAmount,
        totalDownPaymentAmount,
      });

      await expect(async () => {
        await new CreatePaymentOrder(tenantDatabase, {
          maker,
          createPaymentOrderDto,
        }).call();
      }).rejects.toThrow(`Total invoice must be greater than total down payment + total return`);
    });

    it('add correct new payment order record', async () => {
      const maker = await factory.user.create();
      const createPaymentOrderDto = generateCreatePaymentOrderRequestDto({});

      const { paymentOrderForm, paymentOrder } = await new CreatePaymentOrder(tenantDatabase, {
        maker,
        createPaymentOrderDto,
      }).call();

      expect(paymentOrder.totalInvoice).toEqual(100000);
      expect(paymentOrder.supplierId).toEqual(1);
      expect(paymentOrderForm.formableType).toEqual('PaymentOrder');
    });

    it('add pending status', async () => {
      const invoices = [
        {
          id: 2,
          amount: 100000,
        },
      ];
      const downPayments = [
        {
          id: 2,
          amount: 50000,
        },
      ];
      const maker = await factory.user.create();
      const createPaymentOrderDto = generateCreatePaymentOrderRequestDto({ invoices, downPayments });

      const { paymentOrderForm } = await new CreatePaymentOrder(tenantDatabase, {
        maker,
        createPaymentOrderDto,
      }).call();

      expect(paymentOrderForm.done).toBeFalsy();
    });
  });
});

const generateCreatePaymentOrderRequestDto = ({
  supplierId,
  invoices,
  downPayments,
  returns,
  others,
  totalInvoiceAmount,
  totalDownPaymentAmount,
  totalReturnAmount,
  totalOtherAmount,
}) => ({
  paymentType: 'bank',
  supplierId: supplierId || 1,
  date: '2022-09-12',
  paymentAccountId: 1,
  invoices: invoices || [
    {
      id: 1,
      amount: 100000,
    },
  ],
  downPayments: downPayments || [
    {
      id: 1,
      amount: 50000,
    },
  ],
  returns: returns || [
    {
      id: 1,
      amount: 10000,
    },
  ],
  others: others || [
    {
      coaId: 1,
      notes: 'string',
      amount: 5000,
      allocationId: 1,
    },
  ],
  totalInvoiceAmount: totalInvoiceAmount || 100000,
  totalDownPaymentAmount: totalDownPaymentAmount || 50000,
  totalReturnAmount: totalReturnAmount || 10000,
  totalOtherAmount: totalOtherAmount || 5000,
  totalAmount: 35000,
  approvedBy: 1,
  notes: 'string',
});
