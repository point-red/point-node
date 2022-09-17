const tenantDatabase = require('@src/models').tenant;
const FindPaymentOrderReference = require('./FindPaymentOrderReference');

describe('Payment Order - Find Reference', () => {
  describe('success', () => {
    it('return expected payment order references', async () => {
      const supplierId = 1;
      const paymentOrderRef = await new FindPaymentOrderReference(tenantDatabase, supplierId).call();

      expect(paymentOrderRef.purchase_invoices[0].id).toEqual(1)
      expect(paymentOrderRef.purchase_invoices[0].form_number).toEqual('PI0040821')
      expect(paymentOrderRef.purchase_down_payments[0].form_number).toEqual('DP1234501')
      expect(paymentOrderRef.purchase_returns[0].form_number).toEqual('PR2345601')
    });
  });
});
