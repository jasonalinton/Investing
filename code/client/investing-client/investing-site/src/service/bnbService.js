import $ from "jquery";
import axios from "axios";

function saveNewBNBValues(self, resolveValues) {
    let interval = "1m";

    getLastSavedTime()
        .then((res) => new Promise((resolve) => {
            getBNBHistory(self, interval, new Date(res.data.data.getLastSavedTime), resolve);
        }))
        .then(() => new Promise((resolve) => {
            saveBNBHistory(self, interval, resolve);
        }))
        .then(resolveValues);
}

async function getLastSavedTime() {
    var data = {
        query: `
        mutation {
            getLastSavedTime(symbol: "BNB")
        }`
    }
    return axios.post('http://localhost:4000/graphql', data);
}

function getBNBHistory(self, interval, lastSavedTime, resolve) {
    axios.get(`https://api.binance.us/api/v3/klines?symbol=BNBUSD&limit=1000&interval=${interval}&startTime=${lastSavedTime.getTime()}`)
        .then(function (res) {
            var klines = []
            $(res.data).each(function (index, kline) {
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
                klines.push(kline_New);
                self.bnbBinanceKlines.push(kline_New);
            });

            if (self.bnbBinanceKlines.length == 0) {
                resolve();
                return;
            }

            var lastCloseDate = new Date(self.bnbBinanceKlines[self.bnbBinanceKlines.length - 1].closeTime);
            console.log(lastCloseDate.toString() + " " + res.data.length);

            if (lastCloseDate < new Date()) {
                getBNBHistory(self, interval, lastCloseDate, resolve);
            } else {
                resolve();
            }
        }
    );
}

function saveBNBHistory(self, interval, resolve) {
    if (self.bnbBinanceKlines.length == 0) return;

    var kline = self.bnbBinanceKlines.shift();
    saveBNBKline(kline, interval)
        .then(() => {
            if (self.bnbBinanceKlines.length > 0) {
                saveBNBHistory(self, interval, resolve);
            } else {
                resolve();
            }
        });
}

function saveBNBKline(kline, interval) {
    var data = {
        query: 
        `mutation {
            addAssetValue(
                assetValue:
                    {
                        symbol:"BNB"
                        interval: "${interval}"
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

export default saveNewBNBValues;