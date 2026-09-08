const Membership = require('../models/Membership');

const updateExpiredMemberships = async (additionalQuery = {}) => {
  const filter = {
    status: 'active',
    endDate: { $lt: new Date() },
    ...additionalQuery,
  };

  await Membership.updateMany(filter, { status: 'expired' });
};

module.exports = {
  updateExpiredMemberships,
};
