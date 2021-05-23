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

// function emit() {
//     let transfer = {
//         datetime: '1621622332000',
//         type: 'sell',
//         bnbAmount: 0.6028962603910373,
//         bogeAmount: 164.240473368,
//         priceUnit: 1.226185924542937,
//         priceTotal: 201.3893566841107,
//         senderAddress: '0x217416e0bf187623913e15162fb63212d864e739',
//         receiverAddress: '0x15ef0be23194e4f21a4c4b871a78985c38e0ce39',
//         txHash: '0xe5badcbc85913e77a0aac4df438cfbb7b79c613d65b98c24f289f29528ba1caa'
//       }

//       io.emit('transfer-added', transfer);
// }


const bnbService = new BNBService(60000);
bnbService.start()
    .then(() => {
        const bogeTransferService = new BogeTransferService(5000, "http://localhost:3050");
        return bogeTransferService.start();
    })
    .then(() => {
        const bogeHistoryService = new BogeHistoryService(150000);
        bogeHistoryService.start();
    })

const bogeWalletService = new BogeWalletService(60000);
bogeWalletService.start();