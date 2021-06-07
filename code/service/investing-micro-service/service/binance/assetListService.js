import axios from "axios";
import HmacSHA256 from 'crypto-js/hmac-sha256';
import Hex from 'crypto-js/enc-hex';
import { io } from "socket.io-client";

require('dotenv').config();

class AssetListService {
    constructor(serviceInterval, socketURL) {
        this.serviceInterval = serviceInterval;
        this.socket = io(socketURL);
        this.assets = [];
        this.followedAssets = [
            'ADA',
            'BTC',
            'ETH',
            'DOGE',
            'MATIC',
            'ONE',
            // 'XRP'
        ];
    }

    start() {
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

    run(self) {
        if (!self.processing) {
            self.getBinanceBalances()
            .then(res => {
                let promises = [];

                res.data.balances.forEach(balance => {
                    if (balance.free > 0 && self.followedAssets.includes(balance.asset)) {
                        let asset = { symbol: balance.asset, balance: Number(balance.free), timeframes: [] };
                        self.assets.push(asset);

                        promises.push(self.getAssetInfo(self, asset));
                    }
                });

                return Promise.all(promises);
            }, logErrors)
            .then(
                () => {
                    self.calculateChanges(self);

                    self.socket.emit('emit-asset-list', self.assets);
                    self.refresh(self)
                },
                () => self.refresh(self))
            .catch(error => {
                logErrors(error);
                self.refresh(self);
            });
        }
        
    }

    async getBinanceBalances() {
        const BINANCE_API_KEY= process.env.BINANCE_API_KEY;
        const BINANCE_SECRETE_KEY= process.env.BINANCE_SECRETE_KEY;
        
        const timestamp = Date.now();
        const queryString = "timestamp=" + timestamp;

        const hash = HmacSHA256(queryString, BINANCE_SECRETE_KEY);
        const hex = Hex.stringify(hash);

        const options = {
            method: 'get',
            url: 'https://api.binance.us/api/v3/account',
            headers: {
                'X-MBX-APIKEY': `${BINANCE_API_KEY}`
            },
            params: {
                timestamp: timestamp,
                signature: hex
            }
        }

        return axios(options);
    }

    async getAssetInfo(self, asset) {
        let name_Promise = self.getAssetName(asset.symbol)
            .then(res => { asset.name = res.data.data.getAssetName; }, logErrors);

        let price_Promise = self.getAssetPrices(asset.symbol)
            .then(async res => { 
                // TODO: Check that all timeframes return a value > -1. Handle if not
                asset.prices = res.data.data.getAssetPrices; 

                asset.price = asset.prices.find(price => price.timeframe == '1m').price;

                // if (asset.price == -1) {
                //     let response = await self.getAssetPrice(asset.symbol);
                //     asset.price = Number(response.data.price);
                // }


                asset.value = asset.price * asset.balance;
            }, logErrors);

        let balance_Promise = self.getAssetBalances(asset.symbol)
            .then(res => {
                // TODO: Check that all timeframes return a balance > -1. Handle if not
                asset.balances = res.data.data.getAssetBalances;
            }, logErrors);

        let promises = [ name_Promise, price_Promise, balance_Promise];

        return Promise.allSettled(promises)
    }

    async getAssetName(symbol) {
        var data = {
            query: `
            mutation {
                getAssetName(symbol: "${symbol}")
            }`
        }
        return axios.post('http://localhost:4000/graphql', data);
    }

    async getAssetPrices(symbol) {
        var data = {
            query: `
            mutation {
                getAssetPrices(symbol: "${symbol}") {
                    timeframe
                    price
                }
            }`
        }
        return axios.post('http://localhost:4000/graphql', data);
    }

    async getAssetPrice(symbol) {
        return axios.get(`https://api.binance.us/api/v3/ticker/price?symbol=${symbol}USD`);
    }

    async getAssetBalances(symbol) {
        var data = {
            query: `
            mutation {
                getAssetBalances(symbol: "${symbol}") {
                    timeframe
                    balance
                }
            }`
        }
        return axios.post('http://localhost:4000/graphql', data);
    }

    calculateChanges(self) {
        self.assets.forEach(asset => {
            let timeframes = [ '1m', '1h', '1d', '1w', '1M' ]

            timeframes.forEach(timeframe => {
                let price = asset.prices.find(price => price.timeframe == timeframe).price;
                let balance = asset.balances.find(balance => balance.timeframe == timeframe).balance;
                
                let tf = {
                    timeframe: timeframe,
                    balance: (balance > -1) ? balance : null,
                    price: (price > -1) ? price : null,
                    value: (balance > -1 && price > -1) ? (price * balance) : null,
                    change: {
                        balance: (balance > -1) ? asset.balance - balance : null,
                        value: (balance > -1 && price > -1) ? asset.value - (price * balance) : null
                    }
                }
                let balancePercent = (tf.change.balance != null) ? tf.change.balance / tf.balance * 100: null;
                let valuePercent = (tf.change.value != null) ? tf.change.value / tf.value * 100 : null;

                tf.change.balancePercent = balancePercent;
                tf.change.valuePercent = valuePercent;

                asset.timeframes.push(tf);

            });
        });
    }
    
    refresh(self) {
        self.assets = []
        self.process = false;
    }
}

function logErrors(err) {
    err.response.data.errors.forEach(error => {
        console.error(error.message);
    })
}

export default AssetListService;