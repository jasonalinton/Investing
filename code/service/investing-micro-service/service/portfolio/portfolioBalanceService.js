import axios from "axios";
import HmacSHA256 from 'crypto-js/hmac-sha256';
import Hex from 'crypto-js/enc-hex';
import { io } from "socket.io-client";

class PortfolioBalanceService {
    assets = [];
    bogeWallets = [];

    constructor(serviceInterval, socketURL) {
        this.init(this);
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
        if (!self.processing) {
            self.processing = true;

            let binance_promise = self.getBinancePortfolioAssets(self)
                .then(() => {
                    let totalValue = 0;
                    self.assets.forEach(asset => totalValue += asset.value);

                    console.log(`Binance portfolio is worth $${currency(totalValue)}`);
                    return totalValue;
                });

            let bogePromise = self.getBogePortfolioValues(self)
                .then(() => {
                    let totalValue = 0;
                    self.bogeWallets.forEach(wallet => totalValue += wallet.value);

                    console.log(`Boge portfolio is worth $${currency(totalValue)}`);
                    return totalValue;
                });

            Promise.all([ binance_promise, bogePromise ])
                .then(values => {
                    let totalValue = 0;
                    values.forEach(value => totalValue += value);

                    console.log(`Portfolio is worth $${currency(totalValue)}`);
                    self.init(self);

                    return totalValue;
                })
                .then(total => {
                    self.socket.emit('emit-portfolio-value', total);
                    self.processing = false;
                })
        }
    }

    init(self) {
        self.assets = [];

        self.bogeWallets = [
            { name: "Main", address: "0xfd345014ed667bb07eb26345e66addc9e8164b3b", balance: undefined, value: undefined },
            { name: "Trust", address: "0x003c2f2dbcd1a57c081155c09aa72ba349da3752", balance: undefined, value: undefined }
        ];
    }

    async getBinancePortfolioAssets(self) {
        return self.getBinanceBalances()
            .then(res => {
                let promises = [];

                res.data.balances.forEach(balance => {
                    if (balance.free != 0 && balance.asset != 'USD') {
                        promises.push(self.getAssetValue(self, balance.asset, Number(balance.free)));
                    } else if (balance.asset == 'USD') {
                        let amount = Number(balance.free);
                        self.assets.push({ symbol: 'USD', balance: amount, price: amount, value: amount });
                    }
                });

                return Promise.all(promises)
                    .then(values => {
                        values.forEach(asset => {
                            self.assets.push(asset);
                            console.log(`Portfolio's ${asset.balance.toFixed(2)} ${asset.symbol} is worth $${currency(asset.value)}`);
                        });
                    }, logErrors);
            }, logErrors);
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

    async getAssetPrice(symbol) {
        return axios.get(`https://api.binance.us/api/v3/ticker/price?symbol=${symbol}USD`);
    }

    async getAssetValue(self, symbol, balance) {
        return self.getAssetPrice(symbol)
            .then(res => {
                let price = Number(res.data.price);
                let asset = { symbol, balance, price, value: price * balance };
                return asset;
            }, logErrors);     
    }

    async getBogePortfolioValues(self) {
        let promises = [];

        promises.push(self.getBogePrice(self));
        promises.push(self.getBogePortfolioWallets(self));

        return Promise.all(promises)
            .then(value => {
                let price = value[0].data.data.getBogePrice;

                self.bogeWallets.forEach(wallet => {
                    wallet.value = wallet.balance * price;
            }, logErrors);
        })
    }

    async getBogePortfolioWallets(self) {
        let promises = [];

        self.bogeWallets.forEach(wallet => {
            promises.push(self.getWalletBalance(wallet.address));
        });

        return Promise.all(promises)
            .then(wallets => {
                for (let i = 0; i < wallets.length; i++) {
                    let wallet = wallets[i].data.data.getWalletBalance;
                    self.bogeWallets[i].balance = wallet.balance;
                }
        })
    }

    async getBogePrice() {
        var data = {
            query: `
            query {
                getBogePrice
            }`
        }
        return axios.post('http://localhost:4000/graphql', data);
    }

    async getWalletBalance(address) {
        var data = {
            query: `
            mutation {
                getWalletBalance(address: "${address}") {
                    datetime
                    balance
                }
            }`
        }
        console.log(data.query);
        return axios.post('http://localhost:4000/graphql', data);
    }
}

function logErrors(err) {
    err.data.data.errors.forEach(error => {
        console.log(error);
    })
}

function currency(number) {
    return new Intl.NumberFormat([ ], { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol' }).format(number);
}

export default PortfolioBalanceService;