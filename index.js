const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const firebaseAdmin = require("firebase-admin");
const RegisterModel = require('./models/Register');
const ParkingReservationModel = require('./models/ParkingReservation');

const app = express();
app.use(express.json()); // To parse JSON request bodies
app.use(cors());         // To enable CORS

// Firebase Admin SDK setup (Make sure you have the service account JSON file from Firebase)
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert('path/to/serviceAccountKey.json'),
    databaseURL: "https://parking-reservation-syst-631f1-default-rtdb.firebaseio.com"
});
const dbRef = firebaseAdmin.database().ref('parkingSpots');

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/BeachParking")
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Failed to connect to MongoDB", err));

// Login Route
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    RegisterModel.findOne({ email: email })
        .then(user => {
            if (user) {
                if (user.password === password) {
                    res.json({ message: "Success", userId: user._id, userName: user.name }); // Return userId on successful login
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

    // Check if the parking spot is available
    dbRef.child(parkingSpot).once('value', (snapshot) => {
        const spotStatus = snapshot.val();
        if (spotStatus === "Available") {
            // Reserve the spot in the database
            ParkingReservationModel.create({
                userId: userId,
                car: car,
                licensePlate: licensePlate,
                date: date,
                parkingSpot: parkingSpot,
                duration: duration
            })
            .then(reservation => {
                // Update parking spot status to reserved in Firebase
                dbRef.child(parkingSpot).set('Reserved');
                res.json(reservation);
            })
            .catch(err => res.status(500).json({ message: "Failed to reserve parking spot", error: err }));
        } else {
            res.json({ message: "Parking spot is not available" });
        }
    });
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
    const { reservationId, parkingSpot } = req.body;

    // First, cancel the reservation in the MongoDB
    ParkingReservationModel.findByIdAndUpdate(reservationId, { status: 'cancelled' }, { new: true })
    .then(updatedReservation => {
        // If the reservation is updated, update the parking spot status in Firebase to "Available"
        dbRef.child(parkingSpot).set('Available')
        .then(() => res.json(updatedReservation))
        .catch(err => res.status(500).json({ message: "Failed to update parking spot in Firebase", error: err }));
    })
    .catch(err => res.status(500).json({ message: "Failed to cancel reservation", error: err }));
});

// Start the server
const port = 3001;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
