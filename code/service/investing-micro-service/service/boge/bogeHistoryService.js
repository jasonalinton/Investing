import axios from "axios";
import date from 'date-and-time';

class BogeHistoryService {
    intervalID;
    transfers = [];
    klines = []
    processing = false;
    bogeHistory = {
        intervalString: '15m',
        intervalMinutes: 15,
        startDate: new Date(2021, 3, 18, 16, 30, 0),
    }

    constructor(serviceInterval) {
        this.serviceInterval = serviceInterval;
    }

    async start() {
        this.intervalID = setInterval(this.run, this.serviceInterval, this);
        return this.run(this);
    }

    restart() {
        clearInterval(this.intervalID);
        this.start();
    }

    stop() {
        clearInterval(this.intervalID);
        this.intervalID = null;
    }

    async run(self) {
        return new Promise((resolveRun) => {
            if (self.processing == false) {
                self.processing = true;

                self.getAndDeleteLastKlines("BOGE", self.bogeHistory.intervalString)
                    .then((res) => {
                        self.lastSavedKline = res.data.data.getAndDeleteLastKlines;
                        self.lastSavedKlineTime = new Date(Number((self.lastSavedKline) ? self.lastSavedKline.openTime : self.bogeHistory.startDate));

                        return self.getTransfers(self.lastSavedKlineTime);
                    }, () => { self.processing = false; })
                    .then((res) => new Promise((resolve) => {
                        self.transfers = res.data.data.getBogeTransferRange;
                        self.createBogeKlines(self, resolve);
                    }), () => { self.processing = false; })
                    .then(() => new Promise((resolve) => {
                        self.saveHistory(self, resolve);
                    }), () => { self.processing = false; })
                    .then(() => {
                        self.processing = false;
                        resolveRun();
                    });
            }
        })
        
    }

    async getAndDeleteLastKlines(symbol, intervalString) {
        var data = {
            query: `
            mutation {
                getAndDeleteLastKlines(symbol: "${symbol}", interval: "${intervalString}") {
                  id
                  interval
                  openTime
                  open
                  close
                  closeTime
                }
            }
            `
        }
        return axios.post('http://localhost:4000/graphql', data);
    }

    async getTransfers(startDatetime) {
        var data = {
            query: `
            mutation {
                getBogeTransferRange(startDatetime: "${startDatetime}") {
                  datetime
                  type
                  bnbAmount
                  bogeAmount
                  priceUnit
                  priceTotal
                  senderAddress
                  receiverAddress
                  txHash
                }
              }
              
            `
        }
        return axios.post('http://localhost:4000/graphql', data);
    }

    createBogeKlines(self, resolve) {
        let openTime = self.lastSavedKlineTime;
        let closeTime = date.addMinutes(openTime, self.bogeHistory.intervalMinutes)
    
        self.transfers = self.transfers.sort((a, b) => a.datetime - b.datetime);
    
        let symbol = "BOGE";
        let interval = self.bogeHistory.intervalString;
        let total = 0; // Used to determine average price
        let high = (self.lastSavedKline) ? self.lastSavedKline.open : 0;
        let low = (self.lastSavedKline) ? self.lastSavedKline.open : 1000000000;
        let open = (self.lastSavedKline) ? self.lastSavedKline.close : 0;
        let close = (self.lastSavedKline) ? self.lastSavedKline.close : 0;
        let volume = 0;
        let numberOfTrades = 0;
        let average = 0;
    
        while (openTime < new Date()) {
            var now = new Date();
            var originalClose;
            if (closeTime > now) {
                originalClose = closeTime;
                closeTime = now;
            }
    
            let transfers = self.transfers.filter(transfer => {
                return transfer.datetime > openTime && transfer.datetime < closeTime && 
                transfer.priceUnit != -1 && transfer.bogeAmount != -1;
            });
                
            if (transfers.length > 0) {
                total = 0;
                high = 0;
                low = 1000000000;
                open = transfers[0].priceUnit;
                close = transfers[transfers.length - 1].priceUnit;
                volume = 0;
                numberOfTrades = 0;
                
                transfers.forEach(transfer => {
                    total += transfer.priceUnit;
                    high = (transfer.priceUnit > high) ? transfer.priceUnit : high
                    low = (transfer.priceUnit < low) ? transfer.priceUnit : low
                    volume += transfer.bogeAmount;
                    numberOfTrades++;
                });
    
                average = total / numberOfTrades;
            } else {
                // If no trades in time-period, open will be the last close amount. High and low will also be that same value
                open = close;
                high = open;
                low = open;
                volume = 0;
                numberOfTrades = 0;
            }
    
            self.klines.push({ average, symbol, interval, openTime, open, high, low, 
                close, volume, closeTime, numberOfTrades });
            
            if (closeTime.getTime() == now.getTime())
                closeTime = originalClose;
    
            openTime = closeTime;
            closeTime = date.addMinutes(closeTime, 15);
        }
        resolve();
    }

    saveHistory(self, resolve) {
        if (self.klines.length == 0) return;

        var kline = self.klines.shift();
        self.saveKline("BOGE", kline, self.bogeHistory.intervalString)
            .then(() => {
                if (self.klines.length > 0) {
                    self.saveHistory(self, resolve);
                } else {
                    resolve();
                }
            });
    }
    
    saveKline(symbol, kline, interval) {
        var data = {
            query: 
            `mutation {
                addAssetValue(
                    assetValue:
                        {
                            symbol: "${symbol}"
                            interval: "${interval}"
                            openTime: "${kline.openTime.toJSON()}"
                            open: ${kline.open}
                            high: ${kline.high}
                            low: ${kline.low}
                            close: ${kline.close}
                            volume: ${kline.volume}
                            closeTime: "${kline.closeTime.toJSON()}"
                            quoteAssetVolume: ${(kline.quoteAssetVolume) ? kline.quoteAssetVolume : null}
                            numberOfTrades: ${(kline.numberOfTrades) ? kline.numberOfTrades : 0}
                            takerBuyBaseAssetVolume: ${(kline.takerBuyBaseAssetVolume) ? kline.takerBuyBaseAssetVolume : null}
                            takerBuyQuoreAssetVolume: ${(kline.takerBuyQuoreAssetVolume) ? kline.takerBuyQuoreAssetVolume : null}
                            baseAsset: { symbol: "${symbol}" }
                            quoteAsset: { symbol: "USD" }
                        }
                ) {
                    id
                    symbol
                    openTime
                }
            }
        `
        }
        return axios.post('http://localhost:4000/graphql', data);
    }
}

export default BogeHistoryService;