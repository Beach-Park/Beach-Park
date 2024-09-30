const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const RegisterModel = require('./models/Register');
const ParkingReservationModel = require('./models/ParkingReservation'); 

const app = express();
app.use(express.json()); // To parse JSON request bodies
app.use(cors());         // To enable CORS

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/BeachParking", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("Failed to connect to MongoDB", err));

// Login Route
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    RegisterModel.findOne({ email: email })
        .then(user => {
            if (user) {
                if (user.password === password) {
                    res.json({ message: "Success",
                               userId: user._id,
                               userName: user.name }); // Return userId on successful login
                } else {
                    res.json("The password is incorrect");
                }
            } else {
                res.json("No record existed");
            }
        })
        .catch(err => res.status(500).json({ message: "Server error", error: err }));
});

// Register Route
app.post("/register", (req, res) => {
    RegisterModel.create(req.body)
    .then(user => res.json({ message: "Sign up successful", userId: user._id, userName: user.name }))
    .catch(err => res.status(500).json({ message: "Server error", error: err }));
});

// Reserve Parking Spot Route
app.post("/reserve", (req, res) => {
    const { userId, car, licensePlate, date, parkingSpot, duration } = req.body;
    
    ParkingReservationModel.create({
        userId: userId,
        car: car,
        licensePlate: licensePlate, // License plate
        date: date,
        parkingSpot: parkingSpot,
        duration: duration // Duration in minutes
    })
    .then(reservation => res.json(reservation))
    .catch(err => res.status(500).json({ message: "Failed to reserve parking spot", error: err }));
});

// Get All Reservations for a User Route
app.get("/reservations/:userId", (req, res) => {
    const userId = req.params.userId;

    ParkingReservationModel.find({ userId: userId })
    .then(reservations => res.json(reservations))
    .catch(err => res.status(500).json({ message: "Failed to retrieve reservations", error: err }));
});

// Cancel Reservation Route
app.post("/cancel", (req, res) => {
    const { reservationId } = req.body;

    ParkingReservationModel.findByIdAndUpdate(reservationId, { status: 'cancelled' }, { new: true })
    .then(updatedReservation => res.json(updatedReservation))
    .catch(err => res.status(500).json({ message: "Failed to cancel reservation", error: err }));
});

// Start the server
const port = 3001;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
