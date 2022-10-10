const express = require('express');
const { celebrate } = require('celebrate');
const auth = require('@src/modules/auth/services/auth.service');
const requestValidations = require('./requestValidations');
const controller = require('./controller');

const router = express.Router();

// PAYMENT ORDER REFERENCE
router
  .route('/reference/:supplierId')
  .get(
    celebrate(requestValidations.requireAuth),
    celebrate(requestValidations.paymentOrderReference),
    auth(),
    controller.findPaymentOrderReference
  )

// CREATE NEW PAYMENT ORDER
router
  .route('/')
  .post(
    celebrate(requestValidations.requireAuth),
    celebrate(requestValidations.createPaymentOrder),
    auth(),
    controller.createPaymentOrder
  );

// GET ALL PAYMENT ORDER
router
  .route('/')
  .get(
    celebrate(requestValidations.requireAuth),
    celebrate(requestValidations.getPaymentOrderListParams),
    auth(),
    controller.findAllPaymentOrder
  );

// APPROVE CREATING PAYMENT ORDER
router
  .route('/:paymentOrderId/approve')
  .patch(
    celebrate(requestValidations.requireAuth),
    celebrate(requestValidations.requirePaymentOrderId),
    auth(),
    controller.createPaymentOrderApprove
  );

// REJECT CREATING PAYMENT ORDER
router
  .route('/:paymentOrderId/reject')
  .patch(
    celebrate(requestValidations.requireAuth),
    celebrate(requestValidations.requirePaymentOrderId),
    celebrate(requestValidations.createPaymentOrderReject),
    auth(),
    controller.createPaymentOrderReject
  );

// PREVIEW FORM NUMBER
router
  .route('/preview-form-number')
  .get(
    celebrate(requestValidations.requireAuth),
    auth(),
    controller.previewFormNumber
  );

// GET DETAIL PAYMENT ORDER
router
  .route('/:paymentOrderId')
  .get(
    celebrate(requestValidations.requireAuth),
    celebrate(requestValidations.requirePaymentOrderId),
    auth('read purchase payment order'),
    controller.findPaymentOrder
  );

// PRINT PAYMENT ORDER
router
  .route('/:paymentOrderId/print')
  .get(
    celebrate(requestValidations.requireAuth),
    celebrate(requestValidations.requirePaymentOrderId),
    auth('read purchase payment order'),
    controller.printPaymentOrder
  );

module.exports = router;