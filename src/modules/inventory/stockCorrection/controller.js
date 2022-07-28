/* eslint-disable no-else-return */
const httpStatus = require('http-status');
const catchAsync = require('@src/utils/catchAsync');
const pdf = require('html-pdf');
const apiServices = require('./services/apis');

const findAll = catchAsync(async (req, res) => {
  const { currentTenantDatabase, query: queries } = req;
  const { total, stockCorrections, maxItem, currentPage, totalPage } = await new apiServices.FindAll(
    currentTenantDatabase,
    queries
  ).call();
  res.status(httpStatus.OK).send({
    data: stockCorrections,
    meta: {
      current_page: currentPage,
      last_page: totalPage,
      per_page: maxItem,
      total,
    },
  });
});

const findOne = catchAsync(async (req, res) => {
  const {
    currentTenantDatabase,
    params: { stockCorrectionId },
  } = req;
  const { stockCorrection } = await new apiServices.FindOne(currentTenantDatabase, stockCorrectionId).call();
  res.status(httpStatus.OK).send({ data: stockCorrection });
});

const printReject = catchAsync(async (req, res) => {
  // const {
  //   currentTenantDatabase,
  //   params: { stockCorrectionId },
  // } = req;
  // const { stockCorrection } = await new apiServices.FindOne(currentTenantDatabase, stockCorrectionId).call();

  pdf
    .create(
      `
    <style>
    .tables, .tables > th, .tables> td {
      border: 1px solid black;
    }
  
    #watermark {
      flow: static(watermarkflow);
      font-size: 80px;
      opacity: 0.5;
      color:red;
      -webkit-transform: rotate(-30deg);
      text-align: center;
      position: fixed;
      left: 5%;
      top: 25%;
    }
  
    @page {
        @prince-overlay {
          content: flow(watermarkflow)
        }
    }
    </style>
    <div id="watermark">CANCELLED</div>
    <table style="width:100%;margin:0;padding:0"">
        <tr style="margin:0;padding:0">
          <td>
            <div data-v-4f803afb="" style="align-self: center;">
              <img data-v-4f803afb="" src="" alt="Logo" style="width: 80px; height: 80px;">
            </div>
          </td>
          <td>
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          </td>
          <td valign="top">
              <h3 style="margin:0;padding:0">Stock Correction</h3>
              <h4 style="margin:0;padding:0"> </h4>
              <p style="margin:0;padding:0;font-size:12px"> </p>
              <p style="margin:0;padding:0;font-size:12px"> </p>
          </td>
        </tr>
        <tr style="margin:0;padding:0">
          <td colspan="3"><hr/></td>
        <tr>
    </table>
    <table style="width:100%">
        <tr>
          <td>
            <p style="margin:0;padding:0;font-size:12px">Date: 08 Agustus 2022</p>
            <p style="margin:0;padding:0;font-size:12px">Form Number: 1234343</p>
          </td>
          <td>
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          </td>
          <td>
            <p style="margin:0;padding:0;font-size:12px">Warehaouse: PT Nusa Abadi Jaya</p>
            <p style="margin:0;padding:0;font-size:12px">Adress: -</p>
            <p style="margin:0;padding:0;font-size:12px">Phone Number: (021)-121212121</p>
          </td>
        <tr>
    </table>
    <br/>
    <br/>
    <br/>
    <table style="width:100%;border:1px solid;border-collapse: collapse;">
        <tr>
          <td style="border:1px solid;font-weight:bold;border-collapse: collapse;font-size:12px">
            Item
          </td>
          <td style="border:1px solid;font-weight:bold;border-collapse: collapse;font-size:12px">
            Stock Database
          </td>
          <td style="border:1px solid;font-weight:bold;border-collapse: collapse;font-size:12px">
            Stock Correction
          </td>
          <td style="border:1px solid;font-weight:bold;border-collapse: collapse;font-size:12px">
            Balance
          </td>
        </tr>
        <tr>
          <td style="border:1px solid;border-collapse: collapse;font-size:12px">
            Meja Belajar yaa
          </td>
          <td style="border:1px solid;border-collapse: collapse;font-size:12px">
            2 PCS
          </td>
          <td style="border:1px solid;border-collapse: collapse;font-size:12px">
            2 PCS
          </td>
          <td style="border:1px solid;border-collapse: collapse;font-size:12px">
            4 PCS
          </td>
        </tr>
    </table>
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <table style="margin-left:auto">
      <tr>
        <td style="text-align:left;padding-left:10px;padding-right:10px">Created By <br/><br/><br/><br/></td>
        <td style="text-align:left;padding-left:10px;padding-right:10px">Approved By <br/><br/><br/><br/></td>
      </tr>
      <tr>
        <td style="text-align:left;padding-left:10px;padding-right:10px">ADMIN ADMIN</td>
        <td style="text-align:left;padding-left:10px;padding-right:10px">ADMIN ADMIN</td>
      </tr>
    </table>
  `
    )
    .toStream((err, pdfStream) => {
      if (err) {
        // handle error and return a error response code
        return res.sendStatus(500);
      } else {
        // send a status code of 200 OK
        res.statusCode = 200;

        // once we are done reading end the response
        pdfStream.on('end', () => {
          // done reading
          return res.end();
        });

        // pipe the contents of the PDF directly to the response
        pdfStream.pipe(res);
      }
    });
  // res.status(httpStatus.OK).send({ data: abc });
});

const printApproved = catchAsync(async (req, res) => {
  // const {
  //   currentTenantDatabase,
  //   params: { stockCorrectionId },
  // } = req;
  // const { stockCorrection } = await new apiServices.FindOne(currentTenantDatabase, stockCorrectionId).call();

  pdf
    .create(
      `
    <style>
    .tables, .tables > th, .tables> td {
      border: 1px solid black;
    }
  
    @page {
        @prince-overlay {
          content: flow(watermarkflow)
        }
    }
    </style>
    <table style="width:100%;margin:0;padding:0"">
        <tr style="margin:0;padding:0">
          <td>
            <div data-v-4f803afb="" style="align-self: center;">
              <img data-v-4f803afb="" src="" alt="Logo" style="width: 80px; height: 80px;">
            </div>
          </td>
          <td>
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          </td>
          <td valign="top">
              <h3 style="margin:0;padding:0">Stock Correction</h3>
              <h4 style="margin:0;padding:0"> </h4>
              <p style="margin:0;padding:0;font-size:12px"> </p>
              <p style="margin:0;padding:0;font-size:12px"> </p>
          </td>
        </tr>
        <tr style="margin:0;padding:0">
          <td colspan="3"><hr/></td>
        <tr>
    </table>
    <table style="width:100%">
        <tr>
          <td>
            <p style="margin:0;padding:0;font-size:12px">Date: 08 Agustus 2022</p>
            <p style="margin:0;padding:0;font-size:12px">Form Number: 1234343</p>
          </td>
          <td>
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;
          </td>
          <td>
            <p style="margin:0;padding:0;font-size:12px">Warehaouse: PT Nusa Abadi Jaya</p>
            <p style="margin:0;padding:0;font-size:12px">Adress: -</p>
            <p style="margin:0;padding:0;font-size:12px">Phone Number: (021)-121212121</p>
          </td>
        <tr>
    </table>
    <br/>
    <br/>
    <br/>
    <table style="width:100%;border:1px solid;border-collapse: collapse;">
        <tr>
          <td style="border:1px solid;font-weight:bold;border-collapse: collapse;font-size:12px">
            Item
          </td>
          <td style="border:1px solid;font-weight:bold;border-collapse: collapse;font-size:12px">
            Stock Database
          </td>
          <td style="border:1px solid;font-weight:bold;border-collapse: collapse;font-size:12px">
            Stock Correction
          </td>
          <td style="border:1px solid;font-weight:bold;border-collapse: collapse;font-size:12px">
            Balance
          </td>
        </tr>
        <tr>
          <td style="border:1px solid;border-collapse: collapse;font-size:12px">
            Kursi Plastik
          </td>
          <td style="border:1px solid;border-collapse: collapse;font-size:12px">
            2 PCS
          </td>
          <td style="border:1px solid;border-collapse: collapse;font-size:12px">
            4 PCS
          </td>
          <td style="border:1px solid;border-collapse: collapse;font-size:12px">
            6 PCS
          </td>
        </tr>
    </table>
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <table style="margin-left:auto">
      <tr>
        <td style="text-align:left;padding-left:10px;padding-right:10px">Created By <br/><br/><br/><br/></td>
        <td style="text-align:left;padding-left:10px;padding-right:10px">Approved By <br/><br/><br/><br/></td>
      </tr>
      <tr>
        <td style="text-align:left;padding-left:10px;padding-right:10px">ADMIN ADMIN</td>
        <td style="text-align:left;padding-left:10px;padding-right:10px">ADMIN ADMIN</td>
      </tr>
    </table>
  `
    )
    .toStream((err, pdfStream) => {
      if (err) {
        // handle error and return a error response code
        return res.sendStatus(500);
      } else {
        // send a status code of 200 OK
        res.statusCode = 200;

        // once we are done reading end the response
        pdfStream.on('end', () => {
          // done reading
          return res.end();
        });

        // pipe the contents of the PDF directly to the response
        pdfStream.pipe(res);
      }
    });
  // res.status(httpStatus.OK).send({ data: abc });
});

const createFormRequest = catchAsync(async (req, res) => {
  const { currentTenantDatabase, user: maker, body: createFormRequestDto } = req;
  const stockCorrection = await new apiServices.CreateFormRequest(currentTenantDatabase, {
    maker,
    createFormRequestDto,
  }).call();

  // pdf.create(html, options).toFile('./businesscard.pdf', function(err, res) {
  //   if (err) return console.log(err);
  //   console.log(res); // { filename: '/app/businesscard.pdf' }
  // });

  res.status(httpStatus.CREATED).send({ data: stockCorrection });
});

const createFormApprove = catchAsync(async (req, res) => {
  const {
    currentTenantDatabase,
    user: approver,
    params: { stockCorrectionId },
  } = req;
  const { stockCorrection } = await new apiServices.CreateFormApprove(currentTenantDatabase, {
    approver,
    stockCorrectionId,
  }).call();
  res.status(httpStatus.OK).send({ data: stockCorrection });
});

const createFormApproveByToken = catchAsync(async (req, res) => {
  const {
    currentTenantDatabase,
    body: { token },
  } = req;

  const { stockCorrection, project } = await new apiServices.CreateFormApproveByToken(currentTenantDatabase, token).call();
  res.status(httpStatus.OK).send({ data: stockCorrection, meta: { projectName: project.name } });
});

const createFormReject = catchAsync(async (req, res) => {
  const {
    currentTenantDatabase,
    user: approver,
    params: { stockCorrectionId },
    body: createFormRejectDto,
  } = req;
  const stockCorrection = await new apiServices.CreateFormReject(currentTenantDatabase, {
    approver,
    stockCorrectionId,
    createFormRejectDto,
  }).call();
  res.status(httpStatus.OK).send({ data: stockCorrection });
});

const createFormRejectByToken = catchAsync(async (req, res) => {
  const {
    currentTenantDatabase,
    body: { token },
  } = req;

  const { stockCorrection, project } = await new apiServices.CreateFormRejectByToken(currentTenantDatabase, token).call();
  res.status(httpStatus.OK).send({ data: stockCorrection, meta: { projectName: project.name } });
});

const updateForm = catchAsync(async (req, res) => {
  const {
    currentTenantDatabase,
    user: maker,
    params: { stockCorrectionId },
    body: updateFormDto,
  } = req;
  const { stockCorrection } = await new apiServices.UpdateForm(currentTenantDatabase, {
    maker,
    stockCorrectionId,
    updateFormDto,
  }).call();
  res.status(httpStatus.OK).send({ data: stockCorrection });
});

const deleteFormRequest = catchAsync(async (req, res) => {
  const {
    currentTenantDatabase,
    user: maker,
    params: { stockCorrectionId },
    body: deleteFormRequestDto,
  } = req;
  const { stockCorrection } = await new apiServices.DeleteFormRequest(currentTenantDatabase, {
    maker,
    stockCorrectionId,
    deleteFormRequestDto,
  }).call();
  res.status(httpStatus.OK).send({ data: stockCorrection });
});

const deleteFormApprove = catchAsync(async (req, res) => {
  const {
    currentTenantDatabase,
    user: approver,
    params: { stockCorrectionId },
  } = req;
  const { stockCorrection } = await new apiServices.DeleteFormApprove(currentTenantDatabase, {
    approver,
    stockCorrectionId,
  }).call();
  res.status(httpStatus.OK).send({ data: stockCorrection });
});

const deleteFormApproveByToken = catchAsync(async (req, res) => {
  const {
    currentTenantDatabase,
    body: { token },
  } = req;

  const { stockCorrection, project } = await new apiServices.DeleteFormApproveByToken(currentTenantDatabase, token).call();
  res.status(httpStatus.OK).send({ data: stockCorrection, meta: { projectName: project.name } });
});

const deleteFormReject = catchAsync(async (req, res) => {
  const {
    currentTenantDatabase,
    user: approver,
    params: { stockCorrectionId },
    body: deleteFormRejectDto,
  } = req;
  const { stockCorrection } = await new apiServices.DeleteFormReject(currentTenantDatabase, {
    approver,
    stockCorrectionId,
    deleteFormRejectDto,
  }).call();
  res.status(httpStatus.OK).send({ data: stockCorrection });
});

const deleteFormRejectByToken = catchAsync(async (req, res) => {
  const {
    currentTenantDatabase,
    body: { token },
  } = req;

  const { stockCorrection, project } = await new apiServices.DeleteFormRejectByToken(currentTenantDatabase, token).call();
  res.status(httpStatus.OK).send({ data: stockCorrection, meta: { projectName: project.name } });
});

module.exports = {
  findAll,
  findOne,
  printReject,
  printApproved,
  createFormRequest,
  createFormApprove,
  createFormApproveByToken,
  createFormReject,
  createFormRejectByToken,
  updateForm,
  deleteFormRequest,
  deleteFormApprove,
  deleteFormApproveByToken,
  deleteFormReject,
  deleteFormRejectByToken,
};
