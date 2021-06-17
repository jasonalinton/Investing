import axios from "axios";
import date from 'date-and-time';
import { logErrors } from '../utility'

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

            return Promise.allSettled(promises)
                .then(() => { self.processing = false })
                .catch((error) => {
                    logErrors(error);
                    self.processing = false;
                });
        }
    }

    async processAssetValues(self, barInterval) {
        return self.getLastSavedTime(self.symbol, barInterval)
            .then(lastSavedTime => self.getAssetHistory(self, barInterval, lastSavedTime), logErrors)
            // .then(res => self.updateLastSavedValues(res.lastSavedTime, res.bars), logErrors)
            .then(bars => self.saveAssetHistory(self, bars, barInterval), logErrors)
            .catch(logErrors);
    }

    async getLastSavedTime(symbol, interval) {
        var data = {
            query: `
            mutation {
                getLastSavedTime(symbol: "${symbol}", interval: "${interval}")
            }`
        }
        return axios.post('http://localhost:4000/graphql', data)
            .then(response => response.data.data.getLastSavedTime, logErrors);
    }

    async getAssetHistory(self, barInterval, lastSavedTime, bars) {
        if (!bars) {
            if (barInterval == '1m') {
                lastSavedTime = date.addMinutes(new Date(lastSavedTime), -1);
            } else if (barInterval == '1h') {
                lastSavedTime = date.addHours(new Date(lastSavedTime), -1);
            } else if (barInterval == '1d') {
                lastSavedTime = date.addDays(new Date(lastSavedTime), -1);
            }
            bars = [];
        }

        return axios.get(`https://api.binance.us/api/v3/klines?symbol=${self.symbol}USD&limit=${self.responseLimit}&interval=${barInterval}&startTime=${lastSavedTime.getTime()}`)
            .then(response => {
                bars = self.createBars(response.data, bars);

                if (response.data.length > 0 && response.data.length % self.responseLimit == 0) {
                    console.log(`${bars.length} ${self.symbol} records queried so far for ${barInterval} interval`);
                    let lastCloseDate = new Date(bars[bars.length - 1].closeTime);
                    return self.getAssetHistory(self, barInterval, lastCloseDate, bars);
                } else {
                    console.log(`${bars.length} total ${self.symbol} records queried for ${barInterval} interval`);
                    return bars;
                }
            }, logErrors);
    }

    async updateLastSavedValues(lastSavedTime, bars) {
        let oldBars = []
        let newBars = [];

        bars.forEach(bar => {
            if (bar.openTime.getTime() <= lastSavedTime.getTime())
                oldBars.push(bar);
            else
                newBars.push(bar);
        });


    }
    
    async updateBar(bar) {
        var data = {
            query: 
            `mutation {
                updateAssetValue(
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
                            takerBuyQuoteAssetVolume: ${bar.takerBuyQuoteAssetVolume}
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
    
    createBars(responseDate, bars) {
        responseDate.forEach(bar => {
            let bar_New = {
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
                takerBuyQuoteAssetVolume: Number(bar[10])
            };
            bars.push(bar_New);
        });
        return bars;
    }

    async saveAssetHistory(self, bars, barInterval) {
        if (bars.length == 0) return;
        let bar = bars.shift();

        return self.saveBNBbar(self, bar, barInterval)
            .then(() => {
                if (bars.length > 0)
                    return self.saveAssetHistory(self, bars, barInterval);
                else
                    return;
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
                            takerBuyQuoteAssetVolume: ${bar.takerBuyQuoteAssetVolume}
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