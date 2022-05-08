const axios = require('axios');
const HmacSHA256 = require('crypto-js/hmac-sha256');
const Hex = require('crypto-js/enc-hex');
const Asset = require('../models/initialization/asset');
const AssetPair = require('../models/initialization/assetPair');
const Transfer = require('../models/initialization/transfer');
const Wallet = require('../models/initialization/wallet');
const { addDay, thisDay, isSameOrBefore } = require('../utility/timeUtility');
const { sortAsc } = require('../utility/utility');

const BINANCE_API_KEY= process.env.BINANCE_API_KEY;
const BINANCE_SECRETE_KEY= process.env.BINANCE_SECRETE_KEY;

async function getAccountInfo() {
    const recvWindow = 60000;
    const timestamp = Date.now();
    const queryString = `recvWindow=${recvWindow}&timestamp=${timestamp}`;

    const hash = HmacSHA256(queryString, BINANCE_SECRETE_KEY);
    const hmac = Hex.stringify(hash);

    const options = {
        method: 'get',
        url: `https://api.binance.us/api/v3/account?${queryString}&signature=${hmac}`,
        headers: {
            'X-MBX-APIKEY': `${BINANCE_API_KEY}`
        }
    }

    return await axios(options).then(res => res.data);
}

async function getAssets() {
    const timestamp = Date.now();
    const queryString = "timestamp=" + timestamp;

    const hash = HmacSHA256(queryString, BINANCE_SECRETE_KEY);
    const hmac = Hex.stringify(hash);

    const options = {
        method: 'get',
        url: `https://api.binance.us/sapi/v1/capital/config/getall?timestamp=${timestamp}&signature=${hmac}`,
        headers: {
            'X-MBX-APIKEY': `${BINANCE_API_KEY}`
        }
    }

    return axios(options)
        .then(res => {
            let assets = [];
            res.data.forEach(asset => 
                assets.push(new Asset(asset.coin, asset.name)));
            return assets;
        });
}

async function getAssetPairs() {
    const options = {
        method: 'get',
        url: 'https://api.binance.us/api/v3/exchangeInfo',
        headers: {
            'X-MBX-APIKEY': `${BINANCE_API_KEY}`
        }
    }

    return axios(options).then(res => {
        let assetPairs = [];
        res.data.symbols.forEach(symbol => {
            assetPairs.push(new AssetPair(symbol.symbol, symbol.baseAsset, symbol.quoteAsset));
        })
        return assetPairs;
    });
}

async function getWallets() {
    let accountInfo = await getAccountInfo();
    let assets = accountInfo.balances.flatMap(balance => balance.asset);
    let wallets = [];

    for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const timestamp = Date.now();
        const queryString = `asset=${asset}&timestamp=${timestamp}`;

        const hash = HmacSHA256(queryString, BINANCE_SECRETE_KEY);
        const hmac = Hex.stringify(hash);

        const options = {
            method: 'get',
            url: `https://api.binance.us/wapi/v3/depositAddress.html?${queryString}&signature=${hmac}`,
            headers: {
                'X-MBX-APIKEY': `${BINANCE_API_KEY}`
            }
        }

        await axios(options).then(res => {
            try {
                wallets.push(new Wallet(res.data.asset, res.data.address));
            } catch(ex) { }
        });
    }

    return wallets;
}

async function getInvestments() {
    let startDate = new Date(2017, 0, 1, 0, 0, 0);
    let endDate = addDay(startDate, 90);
    let today = thisDay();

    let investments = [];

    while (isSameOrBefore(endDate, today)) {
        const timestamp = Date.now();
        const queryString = `startTime=${startDate.getTime()}&endTime=${endDate.getTime()}&timestamp=${timestamp}`;

        const hash = HmacSHA256(queryString, BINANCE_SECRETE_KEY);
        const hmac = Hex.stringify(hash);

        const options = {
            method: 'get',
            url: `https://api.binance.us/sapi/v1/fiatpayment/query/deposit/history?startTime=${startDate.getTime()}&endTime=${endDate.getTime()}&timestamp=${timestamp}&signature=${hmac}`,
            headers: {
                'X-MBX-APIKEY': `${BINANCE_API_KEY}`
            }
        }

        await axios(options).then(res => {
            res.data.assetLogRecordList.forEach(investment => {
                if (investment.orderStatus == "Successful") {
                    let transfer = new Transfer();

                    transfer.datetime = new Date(investment.createTime);
                    transfer.priceTotal = parseFloat(investment.amount);
                    transfer.transferID = investment.orderId;

                    investments.push(transfer);
                }

            });
        });

        startDate = new Date(endDate);
        endDate = addDay(startDate, 90);
    }

    investments = sortAsc(investments, 'datetime');
    completeInvestmentData(investments, assets, wallets, exchangeID);

    return investments;
}

async function completeInvestmentData(investments, assets, wallets, exchangeID) {

    await csv()
        .fromFile(`${__dirname}/files/binance-transactions.csv`)
        .then(json => {
            for (let i = 0; i < investments.length; i++) {
                let investment = investments[i];
                let index = json.findIndex(_json => _json.Order_Id == investment.transferID);
                let transaction = json[index + 1];
                if (investment.priceTotal == parseFloat(transaction.Realized_Amount_For_Base_Asset)) {
                    investment.fee = parseFloat(transaction.Realized_Amount_For_Fee_Asset);
                    investment.priceSubtotal = investment.priceTotal - investment.fee;
                    // investment.priceSubtotal = parseFloat(transaction.Realized_Amount_For_Quote_Asset_In_USD_Value);
                    investment.quantity = parseFloat(transaction.Realized_Amount_For_Quote_Asset);
                    investment.txID = transaction.Transaction_Id;

                    investment.idExchange = exchangeID;
                    investment.idAsset = assets.find(asset => asset.symbol == transaction.Quote_Asset).id;
                    investment.idFeeAsset = assets.find(asset => asset.symbol == transaction.Fee_Asset).id;

                    investment.addressIn = wallets.find(wallet => wallet.idAsset == investment.idAsset).address;
                }
            }
        })
}

async function getDeposits() {
    let startTime = new Date(2021, 1, 1, 0, 0, 0).getTime();
    let endTime = new Date(2021, 3, 1, 0, 0, 0).getTime();
    
    const timestamp = Date.now();
    const queryString = `startTime=${startTime}&endTime=${endTime}&timestamp=${timestamp}`;

    const hash = HmacSHA256(queryString, BINANCE_SECRETE_KEY);
    const hmac = Hex.stringify(hash);

    const options = {
        method: 'get',
        // url: `https://api.binance.us/wapi/v3/depositHistory.html?timestamp=${timestamp}&signature=${hmac}`,
        url: `https://api.binance.us/sapi/v1/capital/deposit/hisrec?startTime=${startTime}&endTime=${endTime}&timestamp=${timestamp}&signature=${hmac}`,
        headers: {
            'X-MBX-APIKEY': `${BINANCE_API_KEY}`
        }
    }

    return axios(options)
        .then(res => {
            let investments = [];
            res.data.forEach(investment => {
                let transfer = new Transfer();

                transfer.datetime = new Date(investment.insertTime);
                transfer.quantity = investment.amount;
                transfer.fee = 0;
                transfer.addressIn = investment.addressIn;
                transfer.transferID = investment.txID;
                transfer.txID = investment.txID;

                investments.push(transfer);

            });
            return investments;
        });
}

module.exports = {
    getAssets,
    getAssetPairs,
    getWallets,
    getInvestments,
    getDeposits
}