require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected...');

  const result = await mongoose.connection.collection('bookings').updateMany(
    { garageId: { $exists: true } },
    [{
      $set: {
        garage:    '$garageId',
        customer:  '$user',
        jobStatus: {
          $switch: {
            branches: [
              { case: { $eq: ['$status', 'Pending'] },   then: 'pending' },
              { case: { $eq: ['$status', 'Confirmed'] }, then: 'in_progress' },
              { case: { $eq: ['$status', 'Completed'] }, then: 'completed' },
              { case: { $eq: ['$status', 'Cancelled'] }, then: 'cancelled' },
            ],
            default: 'pending'
          }
        },
        service:     '$serviceName',
        scheduledAt: '$bookingDate',
      }
    }]
  );

  console.log(`✅ Migrated: ${result.modifiedCount} bookings`);
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});