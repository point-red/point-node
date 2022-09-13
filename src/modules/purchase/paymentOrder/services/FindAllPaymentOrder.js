const { Op } = require('sequelize');

class FindAllPaymentOrder {
  constructor(tenantDatabase, queries = {}) {
    this.tenantDatabase = tenantDatabase;
    this.queries = queries;
  }

  async call() {
    let approvalStatus, doneStatus;
    let data = [];
    const [queryLimit, queryPage] = [parseInt(this.queries.limit, 10) || 10, parseInt(this.queries.page, 10) || 1];
    const { count: total, rows: paymentOrders } = await this.tenantDatabase.PaymentOrder.findAndCountAll({
      where: generateFilter(this.queries),
      include: [
        {
          model: this.tenantDatabase.Form,
          as: 'form',
        },
        { model: this.tenantDatabase.Supplier, as: 'supplier' },
      ],
      order: [['form', 'created_at', 'DESC']],
      limit: queryLimit,
      offset: offsetParams(queryPage, queryLimit),
      subQuery: false,
    });

    const totalPage = Math.ceil(total / parseInt(queryLimit, 10));

    for (const paymentOrder of paymentOrders) {
      if (paymentOrder.form.approvalStatus === 0) {
        approvalStatus = 'Pending';
      } else if (paymentOrder.form.approvalStatus === 1) {
        approvalStatus = 'Approved';
      } else if (paymentOrder.form.approvalStatus === -1) {
        approvalStatus = 'Rejected';
      }

      if (paymentOrder.form.cancellationStatus === 1) {
        doneStatus = 'Canceled';
      } else if (paymentOrder.form.done === true) {
        doneStatus = 'Done';
      } else if (paymentOrder.form.done === false) {
        doneStatus = 'Pending';
      }

      const result = {
        payment_order_id: paymentOrder.id,
        date: paymentOrder.form.date,
        form_number: paymentOrder.form.number,
        supplier: paymentOrder.supplier.name,
        notes: paymentOrder.form.notes,
        value: paymentOrder.amount,
        approval_status: approvalStatus,
        done_status: doneStatus,
      };

      data.push(result);
    }

    return { data, maxItem: queryLimit, currentPage: queryPage, totalPage, total };
  }
}

function generateFilter(queries) {
  const filter = { [Op.and]: [] };

  // form date
  const filterFormDate = generateFilterFormDate(queries);
  filter[Op.and] = [...filter[Op.and], filterFormDate];

  // form status
  const filterFormStatus = generateFilterFormStatus(queries.approvalStatus, queries.doneStatus);
  filter[Op.and] = [...filter[Op.and], ...filterFormStatus];

  return filter;
}

function generateFilterFormDate(queries) {
  let minDate = new Date();
  minDate.setDate(new Date().getDate() - 30);
  if (queries.dateFrom) {
    minDate = new Date(queries.dateFrom);
  }
  minDate.setHours(0, 0, 0, 0);

  let maxDate = new Date();
  if (queries.dateTo) {
    maxDate = new Date(queries.dateTo);
  }
  maxDate.setHours(24, 0, 0, 0);

  return {
    '$form.date$': {
      [Op.between]: [minDate, maxDate],
    },
  };
}

function generateFilterFormStatus(approvalStatus, doneStatus) {
  const result = [];

  if (!approvalStatus && !doneStatus) {
    return result;
  }

  const doneStatuses = {
    pending: false,
    done: true,
  };

  const approvalStatusses = {
    pending: 0,
    approved: 1,
    rejected: -1,
  };

  if (doneStatus !== undefined) {
    if (doneStatus === 'canceled') {
      result.push({ '$form.cancellation_status$': 1 });
    }

    if (doneStatus !== 'canceled') {
      result.push({ '$form.cancellation_status$': null });
      result.push({ '$form.done$': doneStatuses[doneStatus] });
    }
  }

  if (approvalStatus !== undefined) {
    result.push({ '$form.approval_status$': approvalStatusses[approvalStatus] });
  }

  return result;
}

function offsetParams(page, maxItem) {
  return page > 1 ? maxItem * (page - 1) : 0;
}

module.exports = FindAllPaymentOrder;
