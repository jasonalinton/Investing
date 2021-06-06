import axios from "axios";

class AssetValueService {
    intervalID;
    processing = false;
    responseLimit = 1000;
    logMessages = [];
    symbol = "";
    bars = {};
    barIntervals = [
        '1m',
        '3m',
        '5m',
        '15m',
        '30m',
        '1h',
        '12h',
        '1d',
        '1w',
        '1M'
    ];

    constructor(symbol, barIntervals, serviceInterval) {
        this.symbol = symbol;
        this.serviceInterval = serviceInterval;
        this.barIntervals = (barIntervals) ? barIntervals : this.barIntervals;
    }

    async start() {
        this.intervalID = setInterval(this.run, this.serviceInterval, this);
        return this.run(this);
    }

    async restart() {
        clearInterval(this.intervalID);
        return this.start();
    }

    stop() {
        clearInterval(this.intervalID);
        this.intervalID = null;
    }

    async run(self) {
        if (!self.processing) {
            self.processing = true;

            let promises = [];
            self.barIntervals.forEach(barInterval => {
                promises.push(self.processAssetValues(self, barInterval));
            });

            Promise.allSettled(promises)
                .then(() => { self.processing = false })
                .catch((error) => {
                    if (error.response.data.errors) {
                        error.response.data.errors.forEach(err => console.log(err));
                    } else {
                        console.log(error);
                    }
                    self.processing = false;
                });

        }
    }

    async processAssetValues(self, barInterval) {
        return new Promise((resolve) => {
            self.getLastSavedTime(self.symbol, barInterval)
                .then(response => self.getAssetHistory_Priomise(self, barInterval, response))
                .then(response => self.saveAssetHistory_Promise(self, response, barInterval))
                .then(() => resolve())
                .catch((error) => {
                    if (error.response.data.errors)
                        error.response.data.errors.forEach(err => console.log(err));
                    else
                        console.log(error);
                });
        });
    }

    async getLastSavedTime(symbol, interval) {
        var data = {
            query: `
            mutation {
                getLastSavedTime(symbol: "${symbol}", interval: "${interval}")
            }`
        }
        return axios.post('http://localhost:4000/graphql', data);
    }

    async getAssetHistory_Priomise(self, barInterval, response) {
        return new Promise((resolve) => {
            let lastSavedTime = new Date(response.data.data.getLastSavedTime);
            console.log(`${self.symbol} history last saved on ${formatDate(lastSavedTime)} for ${barInterval} interval`);

            self.bars[barInterval] = [];
            self.getAssetHistory(self, barInterval, lastSavedTime, resolve);  
        });
    }

    getAssetHistory(self, barInterval, lastSavedTime, resolve) {
        axios.get(`https://api.binance.us/api/v3/klines?symbol=${self.symbol}USD&limit=${self.responseLimit}&interval=${barInterval}&startTime=${lastSavedTime.getTime()}`)
            .then(response => self.requestAssetHistory_Resolved(self, barInterval, response, resolve));
    }
    
    requestAssetHistory_Resolved(self, barInterval, response, resolve) {
        let bars = self.bars[barInterval];
        response.data.forEach(bar => {
            var bar_New = {
                time: new Date(bar[0]).toJSON(),
                value: Number(bar[1]),
                openTime: new Date(bar[0]).toJSON(),
                open: Number(bar[1]),
                high: Number(bar[2]),
                low: Number(bar[3]),
                close: Number(bar[4]),
                volume: Number(bar[5]),
                closeTime: new Date(bar[6]).toJSON(),
                quoteAssetVolume: Number(bar[7]),
                numberOfTrades: Number(bar[8]),
                takerBuyBaseAssetVolume: Number(bar[9]),
                takerBuyQuoreAssetVolume: Number(bar[10])
            };
            bars.push(bar_New);
        });

        console.log(`${bars.length} ${self.symbol} records queried for ${barInterval} interval`);

        if (bars.length > 0 && bars.length % self.responseLimit == 0) {
            var lastCloseDate = new Date(bars[bars.length - 1].closeTime);
            self.getAssetHistory(self, barInterval, lastCloseDate, resolve);
        } else {
            resolve(bars); return;
        }
    }

    saveAssetHistory_Promise(self, bars, barInterval) {
        return new Promise(resolve => {
            self.saveAssetHistory(self, bars, barInterval, resolve);
        });
    }

    saveAssetHistory(self, bars, barInterval, resolve) {
        if (bars.length == 0) {
            resolve(); return;
        }

        var bar = bars.shift();
        self.saveBNBbar(self, bar, barInterval)
            .then(() => {
                if (bars.length > 0) {
                    self.saveAssetHistory(self, bars, barInterval, resolve);
                } else {
                    resolve();
                }
            });
    }
    
    async saveBNBbar(self, bar, barInterval) {
        var data = {
            query: 
            `mutation {
                addAssetValue(
                    assetValue:
                        {
                            symbol:"${self.symbol}"
                            interval: "${barInterval}"
                            openTime: "${bar.openTime}"
                            open: ${bar.open}
                            high: ${bar.high}
                            low: ${bar.low}
                            close: ${bar.close}
                            volume: ${bar.volume}
                            closeTime: "${bar.closeTime}"
                            quoteAssetVolume: ${bar.quoteAssetVolume}
                            numberOfTrades: ${bar.numberOfTrades}
                            takerBuyBaseAssetVolume: ${bar.takerBuyBaseAssetVolume}
                            takerBuyQuoreAssetVolume: ${bar.takerBuyQuoreAssetVolume}
                            baseAsset: { symbol: "${self.symbol}" }
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

export default AssetValueService;