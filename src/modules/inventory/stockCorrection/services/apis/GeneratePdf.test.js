const httpStatus = require('http-status');
const ApiError = require('@src/utils/ApiError');
const tenantDatabase = require('@src/models').tenant;
const GeneratePdf = require('./GeneratePdf');

describe('Stock Correction - Generate Pdf', () => {
  describe('validations', () => {
    it('throw error when stock correction is not exist', async () => {
      await expect(async () => {
        await new GeneratePdf(tenantDatabase, (stockCorrectionId = 'invalid-id')).call();
      }).rejects.toThrow(new ApiError(httpStatus.NOT_FOUND, 'Stock correction is not exist'));
    });
  });

  describe('success', () => {
    let options;
    it('Pdf Generated', async () => {
      ({ options } = await new GeneratePdf(tenantDatabase, 1).call());
      expect(options).toEqual({
        height: '297mm',
        width: '210mm',
        orientation: 'portrait',
        localUrlAccess: true,
      });
    });
  });
});
