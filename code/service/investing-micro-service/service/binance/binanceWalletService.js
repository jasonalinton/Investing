import axios from "axios";
import HmacSHA256 from 'crypto-js/hmac-sha256';
import Hex from 'crypto-js/enc-hex';

class BinanceWalletService {
    constructor(serviceInterval) {
        this.serviceInterval = serviceInterval;
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
                let datetime = new Date();
                res.data.balances.forEach(balance => {
                    if (balance.free != 0) {
                        self.saveWalletBalance(balance.asset, datetime, (balance.free + balance.locked))
                            .then(res => {
                                console.log(`Wallet balance added for ${balance.asset}: ${Number(balance.free).toFixed(2)}`);
                            }, logErrors);
                    }
                });
            }, err => {
                console.log(err);
            })
            .then(res => {
                console.log(res);
            }, logErrors)
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

    async saveWalletBalance(symbol, datetime, balance) {
        var data = {
            query: `
            mutation {
                saveBinanceWalletBalance(symbol: "${symbol}", datetime: "${datetime.toJSON()}", balance: ${balance}) {
                    datetime
                    symbol
                    balance
                }
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

export default BinanceWalletService;