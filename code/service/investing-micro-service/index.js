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
import BogeWalletService from './service/boge/bogeWalletService'
import BogeLiquidityService from './service/boge/bogeLiquidityService';
import AssetValueService from './service/binance/assetValueService';
import AssetListService from './service/binance/assetListService';
import BinanceWalletService from './service/binance/binanceWalletService';
import PortfolioBalanceService from './service/portfolio/portfolioBalanceService';

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

    socket.on('emit-asset-list', assetList => {
        io.emit('asset-list', assetList);
    });

    socket.on('emit-portfolio-value', portfolioValue => {
        io.emit('portfolio-value', portfolioValue);
    });
});

const portfolioBalanceService = new PortfolioBalanceService(60000, "http://localhost:3050");
portfolioBalanceService.start();

const binanceWalletService = new BinanceWalletService(3600000);
binanceWalletService.start();

const assetListService = new AssetListService(60000, "http://localhost:3050");
assetListService.start();


const assets = [ 'ADA', 'BTC', 'ETH', 'DOGE', 'MATIC', 'ONE', 'XRP' ];
const intervals = [ '1m', '1h', '1d' ]
assets.forEach(asset => {
    const assetValueService = new AssetValueService(asset, intervals, 60000);
    assetValueService.start();
});


const bnbService = new BNBService(60000);
bnbService.start()
    .then(() => {
        const bogeTransferService = new BogeTransferService(20000, "http://localhost:3050"); // Every 20 seconds
        return bogeTransferService.start();
    })
    .then(() => {
        const bogeHistoryService = new BogeHistoryService(900000); // Every 15 minutes
        return bogeHistoryService.start();
    })
    .then(() => {
        // Running these services at the same time could cause too many requests being sent to BSCScan at one time
        const bogeLiquidityService = new BogeLiquidityService(60000); // Every minute
        return bogeLiquidityService.start()
    })
    .then(() => {
        const bogeWalletService = new BogeWalletService(900000); // Every 15 minutes
        bogeWalletService.start();
    });

    



// const api = require('binance');
// const binanceWS = new api.BinanceWS(true);
// binanceWS.onKline('ADAUSD', '1m', data => {
//     console.log(data);
// });