const axios = require('axios');
const HmacSHA256 = require('crypto-js/hmac-sha256');
const Hex = require('crypto-js/enc-hex');
const { logErrors } = require('../../utility/utility');
const { sortAlphabeticallyAsc } = require('../../utility/utility');

require('dotenv').config();

async function assets(parent, args, context, info) {
    let assets = await context.prisma.asset.findMany({
        select: {
            id: true,
            symbol: true,
            text: true
        }
    })
    return sortAlphabeticallyAsc(assets, 'symbol')
}

// async function assets(parent, args, context, info) {
//     let assetListService = new AssetListService();
//     return await assetListService.getAssetList();
// }

class AssetListService {
    constructor() {
        this.assets = [];
        this.followedAssets = [
            'SHIB',
            'ADA',
            'BNB',
            'BTC',
            'ETH',
            'DOGE',
            'MATIC',
            'ONE',
            // 'XRP'
        ];
    }

    async getAssetList() {
        let self = this;
        return self.getBinanceBalances()
            .then(res => {
                let promises = [];

                res.data.balances.forEach(balance => {
                    if (self.followedAssets.includes(balance.asset)) {
                        let asset = { symbol: balance.asset, balance: (Number(balance.free) + Number(balance.locked)), timeframes: [] };
                        self.assets.push(asset);

                        promises.push(self.getAssetInfo(self, asset));
                    }
                });

                return Promise.all(promises);
            }, logErrors)
            .then(() => {
                    self.calculateChanges(self);
                    return self.assets;
                }, logErrors)
            .catch(logErrors);
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
        if (symbol == "SHIB")
            return axios.get(`https://api.binance.us/api/v3/ticker/price?symbol=${symbol}USDT`);
        else
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
}

module.exports = {
    assets
}