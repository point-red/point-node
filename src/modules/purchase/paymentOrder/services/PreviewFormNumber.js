class PreviewFormNumber {
  constructor(tenantDatabase) {
    this.tenantDatabase = tenantDatabase;
  }

  async call() {
    const currentDate = new Date(Date.now());

    const { incrementNumber } = await getFormIncrement(this.tenantDatabase, currentDate);
    const formNumber = await generateFormNumber(currentDate, incrementNumber);

    return formNumber;
  }
}

async function getFormIncrement(tenantDatabase, currentDate) {
  const incrementGroup = `${currentDate.getFullYear()}${getMonthFormattedString(currentDate)}`;
  const lastForm = await tenantDatabase.Form.findOne({
    where: {
      formableType: 'PaymentOrder',
      incrementGroup,
    },
    order: [['increment', 'DESC']],
  });

  return { incrementNumber: lastForm ? lastForm.incrementNumber + 1 : 1 };
}

async function generateFormNumber(currentDate, incrementNumber) {
  const monthValue = getMonthFormattedString(currentDate);
  const yearValue = getYearFormattedString(currentDate);
  const orderNumber = `000${incrementNumber}`.slice(-3);
  return `PP${yearValue}${monthValue}${orderNumber}`;
}

function getYearFormattedString(currentDate) {
  const fullYear = currentDate.getFullYear().toString();
  return fullYear.slice(-2);
}

function getMonthFormattedString(currentDate) {
  const month = currentDate.getMonth() + 1;
  return `0${month}`.slice(-2);
}

module.exports = PreviewFormNumber;
