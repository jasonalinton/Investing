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
        const bogeTransferService = new BogeTransferService(60000, "http://localhost:3050");
        return bogeTransferService.start();
    })
    .then(() => {
        const bogeHistoryService = new BogeHistoryService(60000);
        bogeHistoryService.start();
    });


