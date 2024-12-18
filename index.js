const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const firebaseAdmin = require("firebase-admin");
const ParkingReservationModel = require('./models/ParkingReservation');
const RegisterModel = require('./models/Register');

// Initialize Express
const app = express();
app.use(express.json());
app.use(cors());

// Firebase Admin SDK setup
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert("C:/Users/mar_v/Desktop/SeniorPro_Parking/ParkingApp/server/parking-reservation-syst-631f1-firebase-adminsdk-h4sj1-48794859ef.json"),
    databaseURL: "https://parking-reservation-syst-631f1-default-rtdb.firebaseio.com"
});
const dbRef = firebaseAdmin.database().ref('parkingSpots');

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/BeachParking", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Failed to connect to MongoDB", err));

// Reservation Route
app.post("/reserve", (req, res) => {
    const { userId, car, licensePlate, date, parkingSpot, duration } = req.body;

    console.log("Received reservation request:", req.body);

    dbRef.child(parkingSpot).once('value', (snapshot) => {
        const spotStatus = snapshot.val();
        console.log(`Parking spot status: ${spotStatus}`);

        if (spotStatus === "Available") {
            ParkingReservationModel.create({
                userId,
                car,
                licensePlate,
                date,
                parkingSpot,
                duration,
                status: "Reserved"
            })
            .then(reservation => {
                console.log("Reservation saved to MongoDB:", reservation);
                dbRef.child(parkingSpot).set('Reserved');
                res.json(reservation);
            })
            .catch(err => {
                console.error("Error saving reservation to MongoDB:", err);
                res.status(500).json({ message: "Failed to reserve parking spot", error: err });
            });
        } else {
            res.json({ message: "Parking spot is not available" });
        }
    });
});

// Get Reservations for User
app.get("/reservations/:userId", (req, res) => {
    const userId = req.params.userId;

    ParkingReservationModel.find({ userId })
        .then(reservations => {
            console.log("User reservations:", reservations);
            res.json(reservations);
        })
        .catch(err => {
            console.error("Error retrieving reservations:", err);
            res.status(500).json({ message: "Failed to retrieve reservations", error: err });
        });
});
// Cancel Reservation Route
app.post("/cancel", async (req, res) => {
    const { reservationId, parkingSpot } = req.body;

    console.log("Cancel request received with data:", { reservationId, parkingSpot });

    try {
        // Update the reservation status in MongoDB to "Canceled"
        const updatedReservation = await ParkingReservationModel.findByIdAndUpdate(
            reservationId,
            { status: "Canceled" },
            { new: true }
        );

        if (!updatedReservation) {
            console.log("Reservation not found in MongoDB:", reservationId);
            return res.status(404).json({ success: false, message: "Reservation not found" });
        }

        console.log("Updated reservation in MongoDB:", updatedReservation);

        // Update Firebase to mark the parking spot as "Available"
        await dbRef.child(parkingSpot).set("Available");
        console.log(`Parking spot ${parkingSpot} marked as Available in Firebase`);

        // Respond to the client
        res.json({ success: true, message: "Reservation canceled successfully" });
    } catch (error) {
        console.error("Error canceling reservation:", error);
        res.status(500).json({ success: false, message: "An error occurred while canceling the reservation" });
    }
});



// Start the server
const port = 3001;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
