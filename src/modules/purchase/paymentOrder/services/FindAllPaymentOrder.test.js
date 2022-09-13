const tenantDatabase = require('@src/models').tenant;
const FindAllPaymentOrder = require('./FindAllPaymentOrder');

describe('Payment Order - FindAll', () => {
  describe('success', () => {
    it('return expected payment orders', async () => {
      const { data } = await new FindAllPaymentOrder(tenantDatabase).call();

      expect(data[0].supplier).toEqual('Supplier Test');
      expect(data[0].notes).toEqual('string');
      expect(data[0].done_status).toEqual('Pending');
    });

    it('return expected payment orders with query', async () => {
      let queries = {
        dateFrom: '2022-09-11',
        dateTo: '2022-09-13',
        approvalStatus: 'pending',
        doneStatus: 'pending',
        limit: 10,
        page: 1,
      };
      let { data } = await new FindAllPaymentOrder(tenantDatabase, queries).call();

      expect(data[0].supplier).toEqual('Supplier Test');
      expect(data[0].notes).toEqual('string');
      expect(data[0].done_status).toEqual('Pending');

      queries = {
        dateFrom: '2022-09-11',
        dateTo: '2022-09-13',
        doneStatus: 'done',
        limit: 10,
        page: 1,
      };
      ({ data } = await new FindAllPaymentOrder(tenantDatabase, queries).call());

      expect(data[0].supplier).toEqual('Supplier Test');
      expect(data[0].notes).toEqual('string');
      expect(data[0].done_status).toEqual('Done');

      queries = {
        dateFrom: '2022-09-11',
        dateTo: '2022-09-13',
        doneStatus: 'canceled',
        limit: 10,
        page: 1,
      };
      ({ data } = await new FindAllPaymentOrder(tenantDatabase, queries).call());

      expect(data[0].supplier).toEqual('Supplier Test');
      expect(data[0].notes).toEqual('string');
      expect(data[0].done_status).toEqual('Canceled');

      queries = {
        dateFrom: '2022-09-11',
        dateTo: '2022-09-13',
        approvalStatus: 'approved',
        limit: 10,
        page: 1,
      };
      ({ data } = await new FindAllPaymentOrder(tenantDatabase, queries).call());

      expect(data[0].supplier).toEqual('Supplier Test');
      expect(data[0].notes).toEqual('string');
      expect(data[0].approval_status).toEqual('Approved');

      queries = {
        dateFrom: '2022-09-11',
        dateTo: '2022-09-13',
        approvalStatus: 'rejected',
        limit: 10,
        page: 1,
      };
      ({ data } = await new FindAllPaymentOrder(tenantDatabase, queries).call());

      expect(data[0].supplier).toEqual('Supplier Test');
      expect(data[0].notes).toEqual('string');
      expect(data[0].approval_status).toEqual('Rejected');
    });
  });
});
