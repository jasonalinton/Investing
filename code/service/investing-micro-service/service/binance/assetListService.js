import axios from "axios";
import HmacSHA256 from 'crypto-js/hmac-sha256';
import Hex from 'crypto-js/enc-hex';
import { io } from "socket.io-client";

require('dotenv').config();

class AssetListService {
    constructor(serviceInterval, socketURL) {
        this.serviceInterval = serviceInterval;
        this.socket = io(socketURL);
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
        self.getBinanceBalances()
            .then(res => {
                res.data.balances = [ res.data.balances[0] ];
                res.data.balances.forEach(balance => {
                    let asset = { symbol: balance.asset, balance: balance.free };
                    self.getAssetInfo(self, asset);
                });
            }, err => {
                console.log(err);
            })
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

        let value_Promise = self.getAssetValues(asset.symbol)
            .then(res => { asset.value = res.data.data.getCurrentAssetValue; }, logErrors);

        let promises = [ name_Promise, value_Promise];

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

    async getAssetValues(symbol) {
        var data = {
            query: `
            mutation {
                getAssetTimeframeValues(symbol: "${symbol}")
            }`
        }
        return axios.post('http://localhost:4000/graphql', data);
    }


}

function logErrors(err) {
    err.data.data.errors.forEach(error => {
        console.log(error);
    })
}

export default AssetListService;