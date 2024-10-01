const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
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

// Function to fetch and process the parking status
const fetchParkingStatus = async () => {
    try {
        const fetch = (await import('node-fetch')).default; // Dynamic import
        const response = await fetch('https://raw.githubusercontent.com/ayadric/Website_BeachPark_UserHome/main/Data/Spot_One/parking_status.txt'); // Your raw URL
        const data = await response.text();
        const lines = data.split('\n');

        const statusMessages = [];

        if (lines[0]) {
            if (lines[0].includes('10')) {
                statusMessages.push('Spot 1 Available');
            } else if (lines[0].includes('11')) {
                statusMessages.push('Spot 1 Unavailable');
            }
        }

        if (lines[1]) {
            if (lines[1].includes('20')) {
                statusMessages.push('Spot 2 Available');
            } else if (lines[1].includes('21')) {
                statusMessages.push('Spot 2 Unavailable');
            }
        }

        if (lines[2]) {
            if (lines[2].includes('30')) {
                statusMessages.push('Spot 3 Available');
            } else if (lines[2].includes('31')) {
                statusMessages.push('Spot 3 Unavailable');
            }
        }

        const finalStatus = statusMessages.join(', ');

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
