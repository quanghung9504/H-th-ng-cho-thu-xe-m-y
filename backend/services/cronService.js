const cron = require('node-cron');
const DepositListing = require('../models/DepositListing');

// Runs every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running cleanup cron: Checking for expired deposit listings...');
  try {
    const result = await DepositListing.updateMany(
      { status: 'OPEN', expiredAt: { $lt: new Date() } },
      { status: 'EXPIRED' }
    );
    console.log(`Cron job finished. Expired ${result.modifiedCount} listings.`);
  } catch (error) {
    console.error('Cron job error:', error);
  }
});

module.exports = cron;
