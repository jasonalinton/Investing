const date = require('date-and-time');
const axios = require('axios');
const HmacSHA256 = require('crypto-js/hmac-sha256');
const Hex = require('crypto-js/enc-hex');
const { logErrors, currency } = require('../../utility/utility')

let assets = [];
let bogeWallets = [];
let bnbWallets = [];

async function portfolioBalance(parent, args, context, info) {
    return await balance();
}

async function balance() {
    let assets = [];

    bogeWallets = [
        { name: "My Main Wallet", address: "0xfd345014ed667bb07eb26345e66addc9e8164b3b", balance: undefined, value: undefined },
        { name: "My Trust Wallet", address: "0x003c2f2dbcd1a57c081155c09aa72ba349da3752", balance: undefined, value: undefined }
    ];

    bnbWallets = [
        { name: "My Main Wallet (BNB)", address: "0xfd345014ed667bb07eb26345e66addc9e8164b3b", balance: undefined, value: undefined },
        { name: "My Trust Wallet (BNB)", address: "0x003c2f2dbcd1a57c081155c09aa72ba349da3752", balance: undefined, value: undefined }
    ];

    let binance = 0;
    let boge = 0;
    let bnb = 0;
    let total = 0;

    let binance_promise = getBinancePortfolioAssets(assets)
        .then(() => {
            assets.forEach(asset => binance += asset.value);
            console.log(`Binance portfolio is worth $${currency(binance)}`);
        });

    let bogePromise = getBogePortfolioValues(bogeWallets)
        .then(() => {
            bogeWallets.forEach(wallet => boge += wallet.value);
            console.log(`Boge portfolio's BOGE is worth $${currency(boge)}`);
        });

    let bnbPromise = getBogePortfolioBNBValues(bnbWallets)
        .then(() => {
            bnbWallets.forEach(wallet => bnb += wallet.value);
            console.log(`Boge portfolio's BNB is worth $${currency(bnb)}`);
        });

    return await Promise.all([binance_promise, bogePromise, bnbPromise])
        .then(() => {
            total = binance + boge + bnb;
            console.log(`Portfolio is worth $${currency(total)}`);
            return { total, binance, boge, bnb }
        });
}

/* Binance */
async function getBinancePortfolioAssets(assets) {
    return getBinanceBalances()
        .then(res => {
            let promises = [];

            res.data.balances.forEach(balance => {
                if (balance.free != 0 && balance.asset != 'USD') {
                    promises.push(getAssetValue(balance.asset, (Number(balance.free) + Number(balance.locked))));
                } else if (balance.asset == 'USD') {
                    let amount = (Number(balance.free) + Number(balance.locked));
                    assets.push({ symbol: 'USD', balance: amount, price: amount, value: amount });
                }
            });

            return Promise.all(promises)
                .then(values => {
                    values.forEach(asset => {
                        assets.push(asset);
                        console.log(`Portfolio's ${asset.balance.toFixed(2)} ${asset.symbol} is worth $${currency(asset.value)}`);
                    });
                }, logErrors);
        }, logErrors);
}

async function getBinanceBalances() {
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

async function getAssetValue(symbol, balance) {
    return getAssetPrice(symbol)
        .then(res => {
            let price = Number(res.data.price);
            let asset = { symbol, balance, price, value: price * balance };
            return asset;
        }, logErrors);     
}

/* BOGE */
async function getBogePortfolioValues(bogeWallets) {
    let promises = [];

    promises.push(getBogePrice());
    promises.push(getBogePortfolioWallets(bogeWallets));

    return Promise.all(promises)
        .then(value => {
            let price = value[0].data.data.getBogePrice;

            bogeWallets.forEach(wallet => {
                wallet.value = wallet.balance * price;
            }, logErrors);
        });
}

async function getBogePrice() {
    var data = {
        query: `
        query {
            getBogePrice
        }`
    }
    return axios.post('http://localhost:4000/graphql', data);
}

async function getBogePortfolioWallets(bogeWallets) {
    let promises = [];

    bogeWallets.forEach(wallet => {
        promises.push(getWalletBalance(wallet.name));
    });

    return Promise.all(promises)
        .then(wallets => {
            for (let i = 0; i < wallets.length; i++) {
                let wallet = wallets[i].data.data.getWalletBalance;
                bogeWallets[i].balance = wallet.balance;
            }
        });
}

async function getWalletBalance(name) {
    var data = {
        query: `
        mutation {
            getWalletBalance(name: "${name}") {
                datetime
                balance
            }
        }`
    }
    // console.log(data.query);
    return axios.post('http://localhost:4000/graphql', data);
}

/* BNB */
async function getBogePortfolioBNBValues(bnbWallets) {
    let promises = [];

    promises.push(getAssetPrice("BNB"));
    promises.push(getBNBPortfolioWallets(bnbWallets));

    return Promise.all(promises)
        .then(value => {
            let price = Number(value[0].data.price);

            bnbWallets.forEach(wallet => {
                wallet.value = wallet.balance * price;
        }, logErrors);
    })
}

async function getBNBPortfolioWallets(bnbWallets) {
    let promises = [];

    bnbWallets.forEach(wallet => {
        promises.push(getWalletBalance(wallet.name));
    });

    return Promise.all(promises)
        .then(wallets => {
            for (let i = 0; i < wallets.length; i++) {
                let wallet = wallets[i].data.data.getWalletBalance;
                bnbWallets[i].balance = wallet.balance;
            }
    })
}

async function getAssetPrice(symbol) {
    if (symbol == "SHIB")
        return axios.get(`https://api.binance.us/api/v3/ticker/price?symbol=${symbol}USDT`);
    else
        return axios.get(`https://api.binance.us/api/v3/ticker/price?symbol=${symbol}USD`);
}

module.exports = {
    portfolioBalance
}