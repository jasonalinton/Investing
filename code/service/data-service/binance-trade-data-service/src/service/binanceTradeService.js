import axios from "axios";
import HmacSHA256 from 'crypto-js/hmac-sha256';
import Hex from 'crypto-js/enc-hex';

class BinanceTradeService {
    assetPairs = []
    trades = [];

    constructor(serviceInterval, port) {
        this.serviceInterval = serviceInterval;
        this.port = port;
    }

    start() {
        //this.intervalID = setInterval(this.run, this.serviceInterval, this);
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

    run(self) {
        if (!self.processing) {
            self.processing = true;

            return self.getAssetPairs(self)
                .then(() => self.processTrades(self), logErrors)
                .then(() => self.saveTrades(self), logErrors)
                .then(() => self.processing == false, logErrors)
                .catch((err) => {
                    logErrors(err);
                    self.processing = false;
                });
        }
    }

    async getAssetPairs(self) {
        return axios.get(`https://api.binance.us/api/v3/exchangeInfo`)
            .then(res => {
                res.data.symbols.forEach(symbol => {
                    self.assetPairs.push({ symbol: symbol.symbol, baseAsset: symbol.baseAsset, quoteAsset: symbol.quoteAsset });
                });
            });
    }

    async processTrades(self) {
        const promises = [];
        self.assetPairs.forEach(assetPair => {
            let promise = self.getLastTradeDatetime(assetPair.baseAsset, self.port)
                .then(res => self.getTrades(assetPair.symbol, res.data.data.getLastTradeDatetime), logErrors)
                .then(res => self.populateTrades(self, assetPair.baseAsset, res.data), logErrors)
            promises.push(promise);
        });
        return Promise.all(promises);
    }

    async getLastTradeDatetime(symbol, port) {
        var data = {
            query: `
            mutation {
                getLastTradeDatetime(symbol: "${symbol}")
            }`
        }
        return axios.post(`http://localhost:${port}/graphql`, data);
    }

    async getTrades(assetPair, startTime) {
        const BINANCE_API_KEY= process.env.BINANCE_API_KEY;
        const BINANCE_SECRETE_KEY = process.env.BINANCE_SECRETE_KEY;
        const timestamp = Date.now();
        let options = undefined;
        
        if (startTime == null) {
            const queryString = `symbol=${assetPair}&timestamp=${timestamp}`;

            const hash = HmacSHA256(queryString, BINANCE_SECRETE_KEY);
            const signature = Hex.stringify(hash);

            options = {
                method: 'get',
                url: 'https://api.binance.us/api/v3/myTrades',
                headers: { 'X-MBX-APIKEY': `${BINANCE_API_KEY}` },
                params: { symbol: assetPair, timestamp, signature }
            }
            console.log(queryString);
        } else {
            const queryString = `symbol=${assetPair}&startTime=${startTime}&timestamp=${timestamp}`;

            const hash = HmacSHA256(queryString, BINANCE_SECRETE_KEY);
            const signature = Hex.stringify(hash);

            options = {
                method: 'get',
                url: 'https://api.binance.us/api/v3/myTrades',
                headers: { 'X-MBX-APIKEY': `${BINANCE_API_KEY}` },
                params: { symbol: assetPair, startTime, timestamp, signature }
            }
            console.log(queryString);
        }
        return axios(options);
    }

    populateTrades(self, symbol, trades_In) {
        trades_In.forEach(trade => {
            let type = (trade.isBuyer) ? 'buy' : 'sell'
            let price_Subtotal = (type == 'buy') ?
                Number(trade.quoteQty) - Number(trade.commission) :
                Number(trade.quoteQty) + Number(trade.commission)

            self.trades.push({
                // date: new Date(trade.time),
                datetime: (new Date(trade.time)).toJSON(),
                symbol: symbol,
                feeSymbol: trade.commissionAsset,
                type: type,
                amount_Traded: Number(trade.qty),
                amount_Fee: Number(trade.commission),
                price_Unit: Number(trade.price),
                price_Total: Number(trade.quoteQty),
                price_Subtotal: price_Subtotal,
                orderID_Exchange: trade.orderId,
                // idTransaction
                // idExchange
                // idOrder
                // idType
                // idAsset
                // idAsset_Fee
                // idAsset_Price
            })
        });
    }

    async saveTrades(self) {
        let promises = [];

        orderByAscDate(self.trades);
        let trade = self.trades.shift();
        if (trade) {
            let promise = self.saveTrade(trade, self.port)
                .then(res => { if (self.trades.length > 0) self.saveTrades(self) }, logErrors)
                .catch(logErrors);
            promises.push(promise);
        }

        return Promise.all(promises);
    }

    async saveTrade(trade, port) {
        var data = {
            query: `
            mutation {
                addTrade(trade: ${queryString((trade))}) {
                    id
                    symbol
                    amount_Traded
                }
            }`
        }
        console.log(data.query);
        return axios.post(`http://localhost:${port}/graphql`, data);
    }
}

function queryString(object) {
    let queryString = "{ "
    for (let prop in object) {
        if (typeof object[prop] == "string" || typeof object[prop] == "date") {
            queryString += `${prop}:"${object[prop]}" `;
        } else {
            queryString += `${prop}:${object[prop]} `;
        }
    }
    queryString += "}";
    return queryString;
}

function logErrors(err) {
    if (err.response.data.errors) {
        err.response.data.errors.forEach(error => {
            console.log(error);
        })
    } else if (err.data.data.errors) {
        err.data.data.errors.forEach(error => {
            console.log(error);
        })
    }
    else if (err.stack) {
        console.log(err.stack);
    }
    else if (err.message) {
        console.log(err.stack);
    } else {
        console.log(err);
    }
}

function formatDate(date) {
    return new Intl.DateTimeFormat([], { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function orderByAscDate(object) {
    object = object.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    return object;
}

export default BinanceTradeService;