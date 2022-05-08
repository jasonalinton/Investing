const util = require('util');
const axios = require("axios");
const date = require('date-and-time');
const { logErrors } = require('../../utility/utility');
const assetValueDAO = require('../../data/asset/assetValueDAO');
const { AssetValue } = require('../../models/initialization/assetValue');

class AssetValueService {
    intervalID;
    processing = false;
    responseLimit = 1000;
    logMessages = [];
    symbol = "";
    baseAsset = "";
    quoteAsset = "";
    bars = {};
    barIntervals = [
        '1m',
        '3m',
        '5m',
        '15m',
        '30m',
        '1h',
        '2h',
        '4h',
        '6h',
        '8h',
        '12h',
        '1d',
        '3d',
        '1w',
        '1M'
    ];

    constructor(baseAsset, quoteAsset, barIntervals, serviceInterval) {
        this.baseAsset = baseAsset;
        this.quoteAsset = quoteAsset;
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

            return Promise.allSettled(promises)
                .then(() => { self.processing = false })
                .catch((error) => {
                    logErrors(error);
                    self.processing = false;
                });
        }
    }

    async processAssetValues(self, barInterval) {
        return assetValueDAO.getLastSavedTime(this.baseAsset, this.quoteAsset, barInterval)
            .then(lastSavedTime => self.getAssetHistory(self, barInterval, lastSavedTime), logErrors)
            .then(bars => self.saveAssetHistory(self, bars, barInterval), logErrors)
            .catch(logErrors);
    }

    async getAssetHistory(self, barInterval, lastSavedTime, bars) {
        if (!bars) {
            if (barInterval == '1m') {
                lastSavedTime = date.addMinutes(new Date(lastSavedTime), 1);
            } else if (barInterval == '1h') {
                lastSavedTime = date.addHours(new Date(lastSavedTime), 1);
            } else if (barInterval == '1d') {
                lastSavedTime = date.addDays(new Date(lastSavedTime), 1);
            } else if (barInterval == '1w') {
                lastSavedTime = date.addDays(new Date(lastSavedTime), 7);
            } else if (barInterval == '1M') {
                lastSavedTime = date.addMonths(new Date(lastSavedTime), 1);
            }
            bars = [];
        }
        let symbol = `${this.baseAsset}${this.quoteAsset}`;
        return axios.get(`https://api.binance.us/api/v3/klines?symbol=${symbol}&limit=${self.responseLimit}&interval=${barInterval}&startTime=${lastSavedTime.getTime()}`)
            .then(response => {
                bars = self.createBars(response.data, bars, barInterval);

                if (response.data.length > 0 && response.data.length % self.responseLimit == 0) {
                    util.log(`${bars.length} ${symbol} records queried so far for ${barInterval} interval`);
                    let lastCloseDate = new Date(bars[bars.length - 1].closeTime);
                    return self.getAssetHistory(self, barInterval, lastCloseDate, bars);
                } else {
                    util.log(`${bars.length} total ${symbol} records queried for ${barInterval} interval`);
                    return bars;
                }
            }, logErrors);
    }
    
    createBars(responseDate, bars, barInterval) {
        let _this = this;
        responseDate.forEach( _bar => {
            let bar = new AssetValue();

            bar.symbol = _this.baseAsset;
            bar.interval = barInterval;
            bar.openTime = new Date( _bar[0]);
            // bar.openTime = _bar[0];
            bar.open = Number( _bar[1]);
            bar.high = Number( _bar[2]);
            bar.low = Number( _bar[3]);
            bar.close = Number( _bar[4]);
            bar.closeTime = new Date( _bar[6]);
            bar.volume = Number( _bar[5]);
            bar.numberOfTrades = Number( _bar[8]);
            bar.baseAsset = _this.baseAsset;
            bar.quoteAsset = 'USD'
            // bar.quoteAssetVolume = Number( _bar[7]);
            // bar.takerBuyBaseAssetVolume = Number( _bar[9]);
            // bar.takerBuyQuoteAssetVolume = Number( _bar[10]);
            bars.push(bar);
        });
        return bars;
    }

    async saveAssetHistory(self, bars) {
        if (bars.length == 0) return;
        let bar = bars.shift();

        return assetValueDAO.addAssetValue(bar)
            .then(() => {
                if (bars.length > 0)
                    return self.saveAssetHistory(self, bars);
                else
                    return;
            });
    }
    
    // async saveBNBbar(self, bar, barInterval) {
    //     var data = {
    //         query: 
    //         `mutation {
    //             addAssetValue(
    //                 assetValue:
    //                     {
    //                         symbol:"${self.symbol}"
    //                         interval: "${barInterval}"
    //                         openTime: "${bar.openTime}"
    //                         open: ${bar.open}
    //                         high: ${bar.high}
    //                         low: ${bar.low}
    //                         close: ${bar.close}
    //                         volume: ${bar.volume}
    //                         closeTime: "${bar.closeTime}"
    //                         quoteAssetVolume: ${bar.quoteAssetVolume}
    //                         numberOfTrades: ${bar.numberOfTrades}
    //                         baseAsset: { symbol: "${self.symbol}" }
    //                         quoteAsset: { symbol: "USD" }
    //                     }
    //             ) {
    //                 id
    //                 symbol
    //                 openTime
    //             }
    //         }
    //     `
    //     }
    //     return axios.post('http://localhost:4000/graphql', data);
    // }
}

function formatDate(date) {
    return new Intl.DateTimeFormat([], { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

module.exports = AssetValueService;