const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const fetch = require('node-fetch'); // Use require for version 2
const port = 3000;

const server = http.createServer(function(req, res) {
    if (req.url === '/') {
        fs.readFile('action.html', 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server Error');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    }
});

const wss = new WebSocket.Server({ server: server });

// A client WebSocket broadcasting to all connected WebSocket clients, including itself.
const broadcast = (data) => {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

// Function to fetch and process the parking status from Firebase
const fetchParkingStatus = async () => {
    try {
        const response = await fetch('https://parking-reservation-syst-631f1-default-rtdb.firebaseio.com/parkingStatus.json'); // Correct URL for your Firebase
        const data = await response.json();

        // Check if the spots array exists
        if (!data || !data.spots) {
            console.error('No parking status data available');
            return; // Exit if there's no data
        }

        const statusMessages = data.spots; // Use the spots array directly

        const finalStatus = statusMessages.join(', '); // Combine messages

        broadcast(finalStatus);
    } catch (error) {
        console.error('Error fetching the file:', error.message);
    }
};

// Periodically fetch the parking status every 5 seconds
setInterval(fetchParkingStatus, 5000); // Adjust the interval as needed

server.listen(port, function(error) {
    if (error) {
        console.log('Something went wrong', error);
    } else {
        console.log('Server is listening on port ' + port);
    }
});
