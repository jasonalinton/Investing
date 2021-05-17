import axios from "axios";
import date from 'date-and-time';
import e from "express";

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

    start() {
        this.run(this);
        this.intervalID = setInterval(this.run, this.serviceInterval, this);
    }

    restart() {
        clearInterval(this.intervalID);
        this.start();
    }

    stop() {
        clearInterval(this.intervalID);
        this.intervalID = null;
    }

    run(self) {
        if (self.processing == false) {
            self.processing = true;

            self.getLastSavedTimes(self)
                .then((res) => {
                    self.lastSavedTransferTime = new Date(res[0].data.data.getLastSavedTransferTime);
                    self.lastSavedKlineTime = (new Date(res[1].data.data.getLastSavedTime)) ? new Date(res[1].data.data.getLastSavedTime)
                        : self.bogeHistory.startDate;
                    
                    var diff = Math.abs(self.lastSavedTransferTime - self.lastSavedKlineTime);
                    var minutes = Math.floor((diff/1000)/60);
                    if (minutes >= 15)
                        return self.getTransfers(self.lastSavedKlineTime)
                    else
                        self.processing = false;
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
                });
        }
    }

    async getLastSavedTimes(self) {
        let transferPromise = self.getLastSavedTransferTime();
        let klinePromise = self.getLastSavedKlineTime("BOGE");

        return Promise.all([transferPromise, klinePromise]);
    }

    async getLastSavedTransferTime() {
        var data = {
            query: `
            query {
                getLastSavedTransferTime 
            }`
        }
        return axios.post('http://localhost:4000/graphql', data);
    }

    async getLastSavedKlineTime(symbol) {
        var data = {
            query: `
            mutation {
                getLastSavedTime(symbol: "${symbol}")
            }`
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
        let high = 0;
        let low = 1000000000;
        let open = 0;
        let close = 0;
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
            console.log(closeTime.toString());
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
                            numberOfTrades: ${(kline.numberOfTrades) ? kline.numberOfTrades : null}
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
        console.log(data.query);
        return axios.post('http://localhost:4000/graphql', data);
    }
}

export default BogeHistoryService;