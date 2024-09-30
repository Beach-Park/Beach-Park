const mongoose = require('mongoose');

const ParkingReservationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Register', // Reference to the user
        required: true
    },
    car: {
        type: String,
        required: true
    },
    licensePlate: { // New license plate field
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    parkingSpot: {
        type: String,
        required: true
    },
    duration: { // New duration field (in minutes)
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['reserved', 'cancelled'],
        default: 'reserved'
    }
});

const ParkingReservationModel = mongoose.model('ParkingReservation', ParkingReservationSchema);
module.exports = ParkingReservationModel;

