const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const port = 3050;
import BNBService from './service/bnbService.js';
import BogeTransferService from './service/bogeTransferService';

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
});

const bnbService = new BNBService(30000);
bnbService.start();

const bogeService = new BogeTransferService(30000);
bogeService.start();