import BinanceWalletService from '../../service/binance/binanceWalletService';

const binanceWalletService = new BinanceWalletService(3600000);
binanceWalletService.start();