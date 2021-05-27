import axios from "axios";

class BNBService {
    intervalID;
    klines = [];
    processing = false;
    bnbHistoryInterval = '1m';

    constructor(serviceInterval, bnbHistoryInterval) {
        this.serviceInterval = serviceInterval;
        // this.bnbHistoryInterval = bnbHistoryInterval ?? this.bnbHistoryInterval;
        this.bnbHistoryInterval = (bnbHistoryInterval) ? bnbHistoryInterval : this.bnbHistoryInterval;
    }

    async start() {
        this.intervalID = setInterval(this.getAndSaveNewBNBValues, this.serviceInterval, this);
        return this.getAndSaveNewBNBValues(this);
    }

    restart() {
        clearInterval(this.intervalID);
        this.start();
    }

    stop() {
        clearInterval(this.intervalID);
        this.intervalID = null;
    }

    async getAndSaveNewBNBValues(self) {
        return new Promise((resolveRun) => {
            self.getLastSavedTime()
            .then((res) => new Promise((resolve) => {
                let lastSavedTime = new Date(res.data.data.getLastSavedTime);
                console.log(`BNB history last saved on ${formatDate(lastSavedTime)}`);

                if (!self.processing) {
                    self.processing = true;
                    self.getBNBHistory(self, lastSavedTime, resolve);
                } else {
                    resolveRun();
                    return;
                }
            }))
            .then(() => new Promise((resolve) => {
                self.saveBNBHistory(self, resolve);
            }))
            .then(() => {
                self.processing = false;
                resolveRun();
            });
        });
    }

    async getLastSavedTime() {
        var data = {
            query: `
            mutation {
                getLastSavedTime(symbol: "BNB")
            }`
        }
        return axios.post('http://localhost:4000/graphql', data);
    }

    getBNBHistory(self, lastSavedTime, resolve) {
        axios.get(`https://api.binance.us/api/v3/klines?symbol=BNBUSD&limit=1000&interval=${this.bnbHistoryInterval}&startTime=${lastSavedTime.getTime()}`)
            .then(function (res) {
                res.data.forEach(kline => {
                    var kline_New = {
                        time: new Date(kline[0]).toJSON(),
                        value: Number(kline[1]),
                        openTime: new Date(kline[0]).toJSON(),
                        open: Number(kline[1]),
                        high: Number(kline[2]),
                        low: Number(kline[3]),
                        close: Number(kline[4]),
                        volume: Number(kline[5]),
                        closeTime: new Date(kline[6]).toJSON(),
                        quoteAssetVolume: Number(kline[7]),
                        numberOfTrades: Number(kline[8]),
                        takerBuyBaseAssetVolume: Number(kline[9]),
                        takerBuyQuoreAssetVolume: Number(kline[10])
                    };
                    self.klines.push(kline_New);
                });

                if (self.klines.length == 0) {
                    resolve();
                    return;
                }

                var lastCloseDate = new Date(self.klines[self.klines.length - 1].closeTime);
                console.log(`${res.data.length} new BNB records`);

                if (lastCloseDate < new Date()) {
                    self.getBNBHistory(self, lastCloseDate, resolve);
                } else {
                    resolve();
                }
            }
        );
    }

    saveBNBHistory(self, resolve) {
        if (self.klines.length == 0) {
            resolve();
            return;
        }

        var kline = self.klines.shift();
        self.saveBNBKline(self, kline)
            .then(() => {
                if (self.klines.length > 0) {
                    self.saveBNBHistory(self, resolve);
                } else {
                    resolve();
                }
            });
    }
    
    saveBNBKline(self, kline) {
        var data = {
            query: 
            `mutation {
                addAssetValue(
                    assetValue:
                        {
                            symbol:"BNB"
                            interval: "${self.bnbHistoryInterval}"
                            openTime: "${kline.openTime}"
                            open: ${kline.open}
                            high: ${kline.high}
                            low: ${kline.low}
                            close: ${kline.close}
                            volume: ${kline.volume}
                            closeTime: "${kline.closeTime}"
                            quoteAssetVolume: ${kline.quoteAssetVolume}
                            numberOfTrades: ${kline.numberOfTrades}
                            takerBuyBaseAssetVolume: ${kline.takerBuyBaseAssetVolume}
                            takerBuyQuoreAssetVolume: ${kline.takerBuyQuoreAssetVolume}
                            baseAsset: { symbol: "BNB" }
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

function formatDate(date) {
    return new Intl.DateTimeFormat([], { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

export default BNBService;