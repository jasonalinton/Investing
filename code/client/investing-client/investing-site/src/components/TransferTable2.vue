<template>
    <div class="boge-table col" :style="{ height: tableHeight }">
        <div class="row">
            <div class="col">
                <MyChart v-if="showChart" :bnbKlines="myTransfers"></MyChart>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <table class="transfer table table-dark table-hover">
                    <thead class="thead-light">
                        <tr>
                            <th class="d-none d-md-table-cell"></th>
                            <th>Time</th>
                            <th>Total</th>
                            <th>Amount</th>
                            <th>Price</th>
                            <th class="d-none d-md-table-cell">TxHash</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(transfer, index) in transfers" :key="index" :class="transfer.type" :data-sender="transfer.senderAddress" :data-reciever="transfer.receiverAddress">
                            <td class="d-none d-md-table-cell center">{{ index + 1 }}</td>
                            <td>
                                <div class="d-flex flex-column">
                                    <span :style="{ 'margin-bottom': '2px' }">{{ date(transfer.datetime) }}</span>
                                    <span>{{ time(transfer.datetime) }}</span>
                                </div>
                            </td>
                            <!-- Amount (Value BNB) -->
                            <td>
                                <div class="d-flex flex-column">
                                    <span :style="{ 'margin-bottom': '2px' }">{{ Number(transfer.bnbAmount.toFixed(4)).toLocaleString() }} BNB ({{ transfer.bnbUnitValue}})</span>
                                    <span>${{ Number(transfer.priceTotal.toFixed(2)).toLocaleString() }}</span>
                                </div>
                            </td>
                            <!-- DOGE Amount -->
                            <td class="center">
                                {{ Number(transfer.bogeAmount.toFixed(2)).toLocaleString() }} BOGE
                            </td>
                            <!-- Price/Token -->
                            <td class="center">
                                ${{ transfer.priceUnit.toFixed(2) }}
                            </td>
                            <!-- txHash -->
                            <td class="d-none d-md-table-cell">
                                <a :href="getTransactionLink(transfer.txHash)" target="_blank">{{ transfer.txHash }}</a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
import axios from "axios";
import MyChart from "./MyChart.vue";
import syncTransferTable from "../service/transferService.js"
import saveNewBNBValues from "../service/bnbService.js"
import Web3 from "web3"
// mainnet
const web3 = new Web3('https://bsc-dataseed1.binance.org:443');
// import date from 'date-and-time';
// import test from "../service/utility.js"

var myTransfers;

export default {
    name: "TransferTable",
    components: {
    MyChart
  },
    props: {
        tableHeight: String,
        txFromAddress: String,
    },
    data: function () {
        return {
            transfers: [],
            myTransfers: [],
            newTransfers: [],
            myTransfers_Reverse: [],
            dexTrades: [],
            dexTradesLeft: [],
            transferQueue: [],
            transferKlines: [],
            bogeTransfers: [],
            bogeTransferQueue: [],
            transactions: {
                BOGE: [],
                BNB: [],
            },
            txHashs: [],
            bogeStartDate: new Date(2021, 3, 18, 16, 30, 0),
            bnbAddress: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
            bogeAddress: "0xfd345014ed667bb07eb26345e66addc9e8164b3b",
            pancakeAddress: "0xb9ace332c55779ec5324fabb83a73fb33f7066bf",
            pancake2Address: "0x15Ef0BE23194e4f21a4c4B871a78985c38e0CE39",
            myAddress: "0xfd345014ed667bb07eb26345e66addc9e8164b3b",
            myAddress2: "0x003c2f2dbcd1a57c081155c09aa72ba349da3752",
            datetimes: [],
            bnbHistory: [],
            bnbBinanceKlines: [],
            bnbBinanceKlines_Saved: [],
            showChart: false,
            shouldLog: false,
            offset: 0,
            bnbTransferOffser: 0
        };
    },
    created: function () {
        let self = this;
        myTransfers = self.myTransfers;
        console.log(myTransfers.length);

        web3.eth.getBalance(this.bogeAddress).then(res => {
            console.log(`BNB balance: ${res}`)
        });

        self.getTransfers()
            .then(res => {
                setTransfers(self, res.data.data.bogeTransfers);
                setMyTransfers(self);
                
                setPortfolioAmount(self);
                setMyGasFees(self);
                getMyWalletBalance();

                //createBogeKlines(self);
                
                self.showChart = true;
            });

         
    },
    computed: {},
    methods: {
        getTransfers: getTransfers,
        getDateInTimezone: getDateInTimezone,
        date: function (datetime) {
            return datetime.toLocaleDateString();
        },
        time: function (datetime) {
            return datetime.toLocaleTimeString();
        },
        valueInBNB: function (transfer) {
            return transfer.bnbAmount * transfer.bnbUnitValue;
        },
        bogePrice: function (transfer) {
            return this.valueInBNB(transfer) / transfer.amount;
        },
        getTransactionLink: function (txHash) {
            return "https://bscscan.com/tx/" + txHash;
        },
    },
};

async function getTransfers() {
    var data = {
        query: `
        query {
            bogeTransfers {
                id
                datetime
                type
                bnbAmount
                bnbUnitValue
                bogeAmount
                priceUnit
                priceTotal
                senderAddress
                receiverAddress
                txHash
            }
        }
        `
    }
    return axios.post('http://localhost:4000/graphql', data);
}

async function getDexTransfers() {
    var data = {
        query: `
        {
            ethereum(network: bsc) {
                dexTrades(
                options: {limit: 100, desc: "timeInterval.minute"}
                date: {since: "2020-11-01"}
                exchangeName: {is: "Pancake"}
                baseCurrency: {is: "0x248c45af3b2f73bc40fa159f2a90ce9cad7a77ba"}
                quoteCurrency: {is: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"}
                ) {
                timeInterval {
                    minute(count: 60)
                }
                baseCurrency {
                    symbol
                    address
                }
                baseAmount
                quoteCurrency {
                    symbol
                    address
                }
                quoteAmount
                trades: count
                quotePrice
                maximum_price: quotePrice(calculate: maximum)
                minimum_price: quotePrice(calculate: minimum)
                median_price: quotePrice(calculate: median)
                open_price: minimum(of: block, get: quote_price)
                close_price: maximum(of: block, get: quote_price)
                }
            }
        }
        `
    }
    return axios.post('http://localhost:4000/graphql', data);
}

function setTransfers(self, transfers) {
    let transfers_temp = []
    // Remove bad transfers
    transfers.forEach(transfer => {
        if (transfer.priceUnit >= 0 && transfer.priceUnit <= 10) {
            transfer.datetime = new Date(Number(transfer.datetime));
            transfers_temp.push(transfer);
        }
    })
    self.transfers = transfers_temp.sort((a, b) => b.datetime - a.datetime);
}

function setMyTransfers(self) {
    self.myTransfers = self.transfers.filter(transfer => {
        return transfer.senderAddress.toLowerCase() == self.myAddress.toLowerCase() || transfer.receiverAddress.toLowerCase() == self.myAddress.toLowerCase();
    });
    self.myTransfers_Reverse = self.myTransfers.slice();
}

function getMyInboundTransfers() {
    let data = {
        query: `
        {
            ethereum(network: bsc) {
                transfers(
                options: {desc: "block.timestamp.time", asc: "currency.symbol", limit: 1000, offset: 0}
                date: {since: null, till: null}
                amount: {gt: 0}
                receiver: {is: "0xfd345014ed667bb07eb26345e66addc9e8164b3b"}
                ) {
                block {
                    timestamp {
                    time(format: "%Y-%m-%d %H:%M:%S")
                    }
                    height
                }
                address: sender {
                    address
                    annotation
                }
                currency {
                    address
                    symbol
                }
                amount
                transaction {
                    hash
                }
                external
                }
            }
        }
        `
    }
    axios.defaults.headers.post["X-API-KEY"] = "BQYAuAhYKrbYFPY5xPeYEH5ZbghqLaGF";
    return axios.post("https://graphql.bitquery.io", data)
}

function getMyOutboundTransfers() {
    let data = {
        query: `
        {
            ethereum(network: bsc) {
                transfers(
                options: {desc: "block.timestamp.time", asc: "currency.symbol", limit: 1000, offset: 0}
                date: {since: null, till: null}
                amount: {gt: 0}
                sender: {is: "0xfd345014ed667bb07eb26345e66addc9e8164b3b"}
                ) {
                block {
                    timestamp {
                    time(format: "%Y-%m-%d %H:%M:%S")
                    }
                    height
                }
                address: sender {
                    address
                    annotation
                }
                currency {
                    address
                    symbol
                }
                amount
                transaction {
                    hash
                }
                external
                }
            }
        }
        `
    }
    axios.defaults.headers.post["X-API-KEY"] = "BQYAuAhYKrbYFPY5xPeYEH5ZbghqLaGF";
    return axios.post("https://graphql.bitquery.io", data)
}

function getMyWalletBalance() {
    let out = 0;
    let inn = 0;
    getMyInboundTransfers()
        .then(res => {
            res.data.data.ethereum.transfers.forEach(transfer => {
                if (transfer.currency.symbol == "BOGE") {
                    inn += transfer.amount;
                }
            });
            getMyOutboundTransfers()
                .then(res => {
                    res.data.data.ethereum.transfers.forEach(transfer => {
                        if (transfer.currency.symbol == "BOGE") {
                            out += transfer.amount;
                        }
                    })
                    console.log("hi");
                    console.log(inn - out);
                    console.log(out- inn);
                });
        });
}

function setPortfolioAmount(self) {
    // let bogeAmount = -2362.33051;
    let bogeAmount = 0;
    self.myTransfers.reverse();
    self.myTransfers.map((transfer) => {
        bogeAmount = (transfer.type == "buy") ? bogeAmount + transfer.bogeAmount : bogeAmount - transfer.bogeAmount;
        transfer.portfolioAmount = bogeAmount;
        transfer.portfolioValue = bogeAmount * transfer.priceUnit;
    });
    console.log(`Portfolio amount: ${self.myTransfers[0].portfolioAmount} BOGE`)
    console.log(`Portfolio value: $${self.myTransfers[0].portfolioValue}`)
}

function setMyGasFees(self) {
    getMyDEXTrades()
        .then(res => {
            self.dexTrades = res.data.data.ethereum.dexTrades;
            self.dexTradesLeft = res.data.data.ethereum.dexTrades.slice();
            let gasTotal = 0;
            let otherNumberTotal = 0;

            self.myTransfers.forEach(transfer => {
                let index = self.dexTrades.findIndex(dexTrade => {
                    return dexTrade.transaction.hash == transfer.txHash;
                });

                if (index != -1) {
                    let trade = self.dexTrades.splice(index, 1)[0];

                    transfer.gasPrice = trade.gasPrice;
                    transfer.dexTradeAmount = trade.tradeAmount;
                    transfer.otherNumber = (transfer.type == "sell") ? trade.buyAmount - transfer.bogeAmount : trade.sellAmount - transfer.bogeAmount; 
                    gasTotal += trade.gasPrice;
                    otherNumberTotal += transfer.otherNumber;
                } else {
                    console.log(`No Bitquery dex trade for txHash: ${transfer.txHash}`);
                }
            });

            console.log(self.dexTrades.length);
            console.log(gasTotal);
            let amountAfterGas = self.myTransfers[self.myTransfers.length - 1].portfolioAmount - gasTotal
            console.log(amountAfterGas);
            let amountAfterOtherNumber = amountAfterGas - otherNumberTotal;
            console.log(`Other amount total = ${otherNumberTotal}`);
            console.log(amountAfterOtherNumber);
        })
}

function getMyDEXTrades() {
    let data = {
        query: `
        {
            ethereum(network: bsc) {
                dexTrades(
                options: {desc: "block.timestamp.time", limit: 1000, offset: 0}
                date: {since: null, till: null}
                txSender: {is: "0xfd345014ed667bb07eb26345e66addc9e8164b3b"}
                ) {
                block {
                    timestamp {
                    time(format: "%Y-%m-%d %H:%M:%S")
                    }
                    height
                }
                tradeIndex
                protocol
                exchange {
                    fullName
                }
                smartContract {
                    address {
                    address
                    annotation
                    }
                }
                buyAmount
                buyCurrency {
                    address
                    symbol
                }
                sellAmount
                sellCurrency {
                    address
                    symbol
                }
                gas
                gasPrice
                gasValue
                price
                tradeAmount(in: USD)
                transaction {
                    gas
                    gasPrice
                    gasValue
                    hash
                    to {
                        address
                    }
                    txFrom {
                        address
                    }
                }
                }
            }
        }
        `
    }
    axios.defaults.headers.post["X-API-KEY"] = "BQYAuAhYKrbYFPY5xPeYEH5ZbghqLaGF";
    return axios.post("https://graphql.bitquery.io", data)
}

function getDateInTimezone(datetime) {
    return new Date(datetime.getTime() - datetime.getTimezoneOffset() * 60000);
}

</script>

<style>

td.center {
    font-size: 14px;
    vertical-align: middle;
}

table.transfer tr {
    font-size: 12px;
}

table.transfer td {
    padding: 4px !important;
}

table.transfer th:nth-child(1) {
    width: 20px;
}

table.transfer th:nth-child(2) {
    width: 100px;
}

table.transfer th:nth-child(3) {
    width: 200px;
}

table.transfer th:nth-child(4) {
    width: 50px;
}

table.transfer th:nth-child(5) {
    width: 75px;
}

table.transfer th:last-child {
    width: 100px;
}

table.transfer tr {
    font-size: 14px;
    line-height: 16px;
}

table.transfer tr.buy {
    color: #35b522 !important;
}

table.transfer tr.sell {
    color: #ff0f23 !important;
}

table.transfer td {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

table.transfer tr[data-sender="0xfd345014ed667bb07eb26345e66addc9e8164b3b"] td,
table.transfer tr[data-reciever="0xfd345014ed667bb07eb26345e66addc9e8164b3b"] td {
    background-color: #444c53;
}
</style>
