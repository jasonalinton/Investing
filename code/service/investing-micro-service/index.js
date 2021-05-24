const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
      }
});
const port = 3050;
import BNBService from './service/bnbService.js';
import BogeTransferService from './service/boge/bogeTransferService';
import BogeHistoryService from './service/boge/bogeHistoryService';
import BogeWalletService from './service/boge/bogeWalletService';
import BogeContractService from './service/boge/bogeContractService';

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
});

io.on('connection', (socket) => {
    console.log('user connected');
    socket.emit('message', { manny: 'Hey how are you' })
    socket.on('another event', (data) => {
        console.log(data);
    });

    socket.on('emit-transfer-added', transfer => {
        io.emit('transfer-added', transfer);
    });
});

const bnbService = new BNBService(60000);
bnbService.start()
    .then(() => {
        const bogeTransferService = new BogeTransferService(20000, "http://localhost:3050"); // Every 20 seconds
        return bogeTransferService.start();
    })
    .then(() => {
        const bogeHistoryService = new BogeHistoryService(900000); // Every 15 minutes
        bogeHistoryService.start();
    });

// Running these services at the same time could cause too many requests being sent to BSCScan at one time
const bogeContractService = new BogeContractService(60000); // Every minute
bogeContractService.start()
    .then(() => {
        const bogeWalletService = new BogeWalletService(900000); // Every 15 minutes
        bogeWalletService.start();
    });

    