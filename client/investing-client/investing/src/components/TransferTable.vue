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
                            <!-- <th>Portfolio Amount</th>
                            <th>Portfolio Value</th> -->
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
                            <td class="center"> {{ Number(transfer.bogeAmount.toFixed(2)).toLocaleString() }} BOGE </td>
<!-- 
                            <td class="center"> {{ Number(transfer.portfolioAmount.toFixed(2)).toLocaleString() }}</td>
                            <td class="center"> {{ Number(transfer.valueInBNB.toFixed(2)).toLocaleString() }}</td> -->

                            <!-- Price/Token -->
                            <td class="center">${{ transfer.priceUnit.toFixed(2) }}</td>

                            <!-- txHash -->
                            <td class="d-none d-md-table-cell">
                                <a
                                    :href="getTransactionLink(transfer.txHash)"
                                    target="_blank"
                                    >{{ transfer.txHash }}</a
                                >
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
import $ from "jquery";
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
            // bogeStartDate: new Date(2021, 3, 18),
            bogeStartDate: new Date(2021, 3, 18, 16, 30, 0),
            bnbAddress: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
            bogeAddress: "0xfd345014ed667bb07eb26345e66addc9e8164b3b",
            pancakeAddress: "0xb9ace332c55779ec5324fabb83a73fb33f7066bf",
            pancake2Address: "0x15Ef0BE23194e4f21a4c4B871a78985c38e0CE39",
            myAddress: "0x003c2f2dbcd1a57c081155c09aa72ba349da3752",
            // myAddress: "0xfd345014ed667bb07eb26345e66addc9e8164b3b",
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


        new Promise((resolve) => { // (*)
            saveNewBNBValues(self, resolve);
        })
            .then(() => new Promise(resolve => {
                syncTransferTable(self, resolve);  
            }));

        self.getTransfers()
            .then(res => {
                let transfers_temp = []
                res.data.data.bogeTransfers.forEach(transfer => {
                    if (transfer.priceUnit >= 0 && transfer.priceUnit <= 10) {
                        transfer.datetime = new Date(Number(transfer.datetime));
                        transfers_temp.push(transfer);
                    }
                })

                self.transfers = transfers_temp.sort((a, b) => b.datetime - a.datetime);

                getMyTransfers(self);
                setPortfolioAmount(self);
                setMyGasFees(self);
                getMyWalletBalance();

                // self.myTransfers.forEach(transfer => {
                //     // console.log(`${transfer.datetime.toJSON()} ${transfer.bogeAmount} at ${transfer.priceUnit}`);
                //     console.log(`${transfer.datetime.toLocaleDateString()}          ${transfer.portfolioAmount}`);
                // });

                //createBogeKlines(self);
                
                self.showChart = true;
            });

         
    },
    computed: {},
    methods: {
        // initialize: initialize,
        setBNBValue: setBNBValue,
        setBNBValues: setBNBValues,
        getTransfers: getTransfers,
        getLastSavedTime: getLastSavedTime,
        getLastSavedTransferTime: getLastSavedTransferTime,
        fetchTranfers: fetchTranfers,
        // fetchBogeTransactions: fetchBogeTransactions,
        fetchBNBTransfers: fetchBNBTransfers,
        fetchBNBTransactions: fetchBNBTransactions,
        getBNBHistory: getBNBHistory,
        getBinanceBNBHistory: getBinanceBNBHistory,
        getDateInTimezone: getDateInTimezone,
        saveTransfers: saveTransfers,
        saveTransfer: saveTransfer,
        // valueInBNB: function (transfer) {
        //     let bnbAmount = transfer.bnbAmount * transfer.bnbUnitValue;
        //     return Number(bnbAmount.toFixed(2)).toLocaleString();
        // },
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
    // let inboundTransfers = [];
    // let outboundTransfers = [];
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

function getMyTransfers(self) {
    self.myTransfers = self.transfers.filter(transfer => {
        return transfer.senderAddress.toLowerCase() == self.myAddress.toLowerCase() || transfer.receiverAddress.toLowerCase() == self.myAddress.toLowerCase();
    });
    self.myTransfers_Reverse = self.myTransfers.slice();
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
                // let trade = dexTrades.find(dexTrade => {
                //     return dexTrade.transaction.hash == transfer.txHash;
                // });

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

// function getMyDEXTrades(self) {
//     let myTXHashs = self.myTransfers.map(transfer => {
//         return transfer.txHash;
//     })

//     let data = {
//         query: `
//         {
//             ethereum(network: bsc) {
//                 dexTrades(
//                 options: {desc: "block.timestamp.time", limit: 1000, offset: 0}
//                 date: {since: null, till: null}
//                 txHash: {in: ${ JSON.stringify(myTXHashs) }}
//                 ) {
//                 block {
//                     timestamp {
//                     time(format: "%Y-%m-%d %H:%M:%S")
//                     }
//                     height
//                 }
//                 tradeIndex
//                 protocol
//                 exchange {
//                     fullName
//                 }
//                 smartContract {
//                     address {
//                     address
//                     annotation
//                     }
//                 }
//                 buyAmount
//                 buyCurrency {
//                     address
//                     symbol
//                 }
//                 sellAmount
//                 sellCurrency {
//                     address
//                     symbol
//                 }
//                 gas
//                 gasPrice
//                 gasValue
//                 price
//                 tradeAmount(in: USD)
//                 transaction {
//                     gas
//                     gasPrice
//                     gasValue
//                     hash
//                 }
//                 }
//             }
//         }
//         `
//     }
//     return axios.post('http://localhost:4000/graphql', data);
// }



// function createBogeKlines(self) {
//     let openTime = new Date(self.bogeStartDate.toJSON());
//     let closeTime = date.addMinutes(openTime, 15)

//     let transfers_temp = self.transfers.slice().sort((a, b) => b.datetime - a.datetime);

//     while (openTime < new Date()) {
//         var now = new Date();
//         if (closeTime > now) closeTime = now;

//         let transfers = transfers_temp.filter(transfer => {
//             return transfer.datetime > openTime & transfer.datetime < closeTime;
//         });
//         if (transfers.length > 0) {
//             let symbol = "BOGE";
//             let interval = "15m";
//             let total = 0;
//             let high = 0;
//             let low = 1000000000;
//             let open = transfers[0].bogeAmount;
//             let close = transfers[transfers.length - 1].bogeAmount;
//             let volume = 0;
//             let numberOfTrades = 0;
            
//             transfers.forEach(transfer => {
//                 total += transfer.priceUnit;
//                 high = (transfer.priceUnit > high) ? transfer.priceUnit : high
//                 low = (transfer.priceUnit < low) ? transfer.priceUnit : low
//                 volume += transfer.bnbAmount;
//                 numberOfTrades++;
//             });
//             let average = total / numberOfTrades;

//             //transfer.average = average;
//             self.transferKlines.push({ average, symbol, interval, openTime, open, high, low, close, volume, closeTime, numberOfTrades });
//         }

//         openTime = closeTime;
//         closeTime = date.addMinutes(closeTime, 15);
//         console.log(closeTime.toString());
//     }
// }

async function fetchTranfers(self, datetime) {
    //var param = self.txFromAddress ? 'txFrom: {is: "' + self.txFromAddress + '"}' : "";
    var param = "";
    //lastTransferDate = new Date();
    console.log(toISODate(datetime));
    var data = {
        query:
            `
            query {
                ethereum(network: bsc) {
                    transfers(
                        options: {asc: "block.timestamp.time", limit: 1000, offset: `+ self.offset +`}
                        date: {after: "`+ datetime.toISOString() +`", till: null}
                        amount: {gt: 0}
                        currency: {is: "0x248c45af3b2f73bc40fa159f2a90ce9cad7a77ba"}
                        ` + param + `
                    ) {
                    block {
                        timestamp {
                        time(format: "%Y-%m-%d %H:%M:%S")
                        }
                        height
                    }
                    sender {
                        address
                        # annotation
                    }
                    receiver {
                        address
                        # annotation
                    }
                    transaction {
                        hash
                    }
                    amount
                    currency {
                        symbol
                    }
                    #   external
                    }
                }
            }
        `,
    };

    axios.defaults.headers.post["X-API-KEY"] = "BQYAuAhYKrbYFPY5xPeYEH5ZbghqLaGF";
    axios.post("https://graphql.bitquery.io", data).then((res) => {
        createTransfer(self, res);

        if (self.transfers.length == 0)
            return;

        var lastTransferDate = new Date(self.transfers[self.transfers.length - 1].datetime);
        console.log(lastTransferDate.toString() + " " + res.data.data.ethereum.transfers.length);

        if (res.data.data.ethereum.transfers.length == 1000) {
            self.offset += 1000;
            fetchTranfers(self, datetime);
        } else {
            self.bogeTransferQueue = self.transfers.slice();
            self.fetchBNBTransfers(self);
            //saveTransfers(self);

        }
    }, (err) => {
        console.log(err);
    });
}

function createTransfer(self, res) {
     $(res.data.data.ethereum.transfers).each(function (index, transfer) {
            /* Datetime comes in as UTC. That UTC datetime is converter to locale giving you the wrong datetime.
               Subtract by timezone offset to get the correct datetime */
            let datetimeUTC = new Date(transfer.block.timestamp.time);
            datetimeUTC = new Date(datetimeUTC.getTime() - datetimeUTC.getTimezoneOffset() * 60000);

            var tempTransfer = {
                datetime: datetimeUTC,
                datetimeLocale: new Date(transfer.block.timestamp.time).toLocaleString(),
                datetimeUTC: new Date(transfer.block.timestamp.time),
                datetimeLocal: new Date(transfer.block.timestamp.time),
                datetimeString: new Date(transfer.block.timestamp.time).toLocaleString(),
                date: new Date(transfer.block.timestamp.time).toLocaleDateString(),
                time: new Date(transfer.block.timestamp.time).toLocaleTimeString(),
                block: transfer.block.height,
                bnbAmount: -1,
                bnbUnitValue: -1,
                bnbValue: -1,
                amount: Number(transfer.amount),
                txHash: transfer.transaction.hash,
                sender: transfer.sender.address,
                receiver: transfer.receiver.address,
            };
            self.transfers.push(tempTransfer);
            self.transferQueue.push(tempTransfer);
            self.txHashs.push(transfer.transaction.hash);
            let datetime = new Date(transfer.block.timestamp.time);
            datetime.setSeconds(0);
            datetime = new Date(datetime.getTime() - datetime.getTimezoneOffset() * 60000);
            self.datetimes.push(datetime);
            let datetimeString = datetime.setSeconds(0);
            datetime = new Date(datetimeString);
            // self.getAssetValue(tempTransfer.datetime)
            // .then((res) => {
            //     if (res.data.data.getAssetValue) {
            //         tempTransfer.bnbUnitValue = res.data.data.getAssetValue.open;
            //     }
            // });
        });
}

function fetchBNBTransfers(self) {
    console.log(self.bogeTransferQueue.length + " transfers left");
    let transferQueue = self.bogeTransferQueue.splice(0, 100);

    let txHashs = transferQueue.map((tran) => {
        return tran.txHash;
    });
    var data = {
        query:
            `
        {
            ethereum(network: bsc) {
                transfers(
                options: {desc: "block.timestamp.time", limit: 10000, offset: 0}
                date: {since: null, till: null}
                amount: {gt: 0}
                txHash: {in: ` + JSON.stringify(txHashs) + `} ) {
                transaction {
                    hash
                }
                block {
                    timestamp {
                    time(format: "%Y-%m-%d %H:%M:%S")
                    }
                    height
                }
                sender {
                    address
                }
                receiver {
                    address
                }
                transaction {
                    hash
                }
                amount
                currency {
                    symbol
                }
                }
            }
            }
    `,
    };

    axios.defaults.headers.post["X-API-KEY"] = "BQYAuAhYKrbYFPY5xPeYEH5ZbghqLaGF";
    return axios.post("https://graphql.bitquery.io", data).then(
        (res) => {
            var transfers = res.data.data.ethereum.transfers.reverse();
            $(transferQueue).each(function (index, transfer) {
                $(transfers).each(function (index, bnbTransfer) {
                    if (transfer.txHash == bnbTransfer.transaction.hash) {
                        // if (transfer.senderAddress.toLowerCase() == self.pancakeAddress.toLowerCase() || transfer.senderAddress.toLowerCase() == self.pancake2Address.toLowerCase()) {
                        if (transfer.sender.toLowerCase() == self.pancakeAddress.toLowerCase() || transfer.sender.toLowerCase() == self.pancake2Address.toLowerCase()) {
                            if ((bnbTransfer.receiver.address.toLowerCase() == self.pancakeAddress.toLowerCase() || bnbTransfer.receiver.address.toLowerCase() == self.pancake2Address.toLowerCase())
                                && bnbTransfer.currency.symbol == "WBNB") {
                                transfer.type = "buy";
                                transfer.bnbAmount = Number(bnbTransfer.amount);
                                return;
                            } 
                        }

                        // if (transfer.receiverAddress.toLowerCase() == self.pancakeAddress.toLowerCase() || transfer.receiverAddress.toLowerCase() == self.pancake2Address.toLowerCase()) {
                        if (transfer.receiver.toLowerCase() == self.pancakeAddress.toLowerCase() || transfer.receiver.toLowerCase() == self.pancake2Address.toLowerCase()) {
                            if ((bnbTransfer.sender.address.toLowerCase() == self.pancakeAddress.toLowerCase() || bnbTransfer.sender.address.toLowerCase() == self.pancake2Address.toLowerCase())
                                && bnbTransfer.currency.symbol == "WBNB") {
                                transfer.type = "sell";
                                transfer.bnbAmount = Number(bnbTransfer.amount);
                                return;
                            } 
                        }
                    }
                });
            });

            if (self.bogeTransferQueue.length > 0) {
                self.fetchBNBTransfers(self);
            }
            self.setBNBValue(self, transferQueue);
            //self.saveTransfers(self, transferQueue);
        }
    )
}

function saveTransfers(self, transfers) {
    console.log("Saving transfers");

    transfers.map((transfer) => {
        self.saveTransfer(transfer).then(
            (res) => {
                if (self.shouldLog)
                    console.log(res.data.data.addTransfer);
            },
            (err) => {
                console.log(err);
            })
    });
}

function saveTransfer(transfer) {
    var data = {
        query: `
        mutation {
            addTransfer(transfer: {
                datetime: "`+ transfer.datetime.toJSON() +`"
                type: "`+ transfer.type +`"
                bnbAmount: `+ transfer.bnbAmount +`
                bogeAmount: `+ transfer.amount +`
                bnbUnitValue: `+ transfer.bnbUnitValue +`
                senderAddress: "`+ transfer.sender +`"
                receiverAddress: "`+ transfer.receiver +`"
                txHash: "`+ transfer.txHash +`"
            }) {
                datetime
                type
                bnbAmount
                bogeAmount
                senderAddress
                receiverAddress
                txHash
            }
        }
        `
    }
    return axios.post('http://localhost:4000/graphql', data);
}

// async function setBNBValues(self) {
//     self.getTransfers().then(
//         (res) => {
//             let transferQueue = []
//             let persistedTransfers = res.data.data.bogeTransfers;
//            // for (var i = 1; i <= persistedTransfers.length; i++) {
//             for (var i = 1; i <= 10; i++) {
//                 transferQueue.push(persistedTransfers[i]);
//                 if (i % 10 == 0) {
//                     var res = await self.fetchBNBTransfers(transferQueue);
//                     fetchBNBTransfers_Then(self, transferQueue, res);
//                     transferQueue = [];
//                 }
//             }
//         }
//     )
// }

function setBNBValues(self) {
    self.getTransfers().then(
        (res) => {
            self.bogeTransfers = res.data.data.bogeTransfers.slice();
            self.bogeTransferQueue = res.data.data.bogeTransfers.slice();
            self.fetchBNBTransfers(self);
        }
    )
}

// function saveBNBValues(self) {
//     self.bogeTransfers.map((transfer) => {
//         saveBNBValue(transfer);
//     });
// }

// function saveBNBValue(transfer) {
//     var data = {
//         query: `
//         mutation {
//         saveBNBValue(id: `+ transfer.id + ` bnbAmount: `+ transfer.bnbAmount + ` type: `+ transfer.type + `) {
//             bnbAmount
//             bogeAmount
//         }
//         }`
//     }
//     return axios.post('http://localhost:4000/graphql', data);
// }



async function getLastSavedTime() {
    var data = {
        query: `
        mutation {
            getLastSavedTime(symbol: "BNB")
        }`
    }
    return axios.post('http://localhost:4000/graphql', data);
}

async function getLastSavedTransferTime() {
    var data = {
        query: `
        query {
            getLastSavedTransferTime 
        }`
    }
    return axios.post('http://localhost:4000/graphql', data);
}

function getBNBHistory(self) {
    var datetimes = JSON.stringify(self.datetimes);
    var data = {
        query:
            `
            mutation {
                getAssetValues(symbol: "BNB", datetimes: `+ datetimes +`) {
                    id
                    idBaseAsset
                    idQuoteAsset
                    symbol
                    openTime
                    open
                    high
                    low
                    close
                    volume
                    closeTime
                    quoteAssetVolume
                    numberOfTrades
                    takerBuyBaseAssetVolume
                    takerBuyQuoreAssetVolume
                }
            }
        `,
    };

    axios.defaults.headers.post["X-API-KEY"] = "BG6DCTFBA1MWMYBZV7QGS831QVFMUADUB9";
    return axios.post("http://localhost:4000/", data);
}

function getBinanceBNBHistory(self, lastSavedTime) {

    axios.get('https://api.binance.us/api/v3/klines?symbol=BNBUSD&limit=1000&interval=1m&startTime=' + lastSavedTime.getTime())
        .then(function (res) {
           // console.log(res.data.length);
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

            if (self.bnbBinanceKlines.length == 0)
                return;

            var lastCloseDate = new Date(self.bnbBinanceKlines[self.bnbBinanceKlines.length - 1].closeTime);
            console.log(lastCloseDate.toString() + " " + res.data.length);
            if (lastCloseDate < new Date()) {
                //saveBNBHistory(self);
                self.getBinanceBNBHistory(self, lastCloseDate);
            } else {
                self.bnbBinanceKlines.map((kline) => {
                    saveBNBHistory(kline);
                });
                
                console.log("Done");
            }
        }
    );
}

function saveBNBHistory(kline) {
    var data = {
        query: 
        `mutation {
            addAssetValue(
                assetValue:
                    {
                        symbol:"BNB"
                        openTime: "` + kline.openTime + `"
                        open:` + kline.open + `
                        high:` + kline.high + `
                        low:` + kline.low + `
                        close:` + kline.close + `
                        volume:` + kline.volume + `
                        closeTime:"` + kline.closeTime + `"
                        quoteAssetVolume:` + kline.quoteAssetVolume + `
                        numberOfTrades:` + kline.numberOfTrades + `
                        takerBuyBaseAssetVolume:` + kline.takerBuyBaseAssetVolume + `
                        takerBuyQuoreAssetVolume:` + kline.takerBuyQuoreAssetVolume + `
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
    
    axios.post('http://localhost:4000/graphql', data)
        .then(() => { },
            (err) => {
                console.log("Error");
                console.log(err);
            });
}

function fetchBNBTransactions(self) {
    var data = {
        query:
            `
        {
            ethereum(network: bsc) {
                transfers(
                options: {desc: "block.timestamp.time", limit: 10000, offset: 0}
                date: {since: null, till: null}
                amount: {gt: 0}
                txHash: {in: ` + JSON.stringify(self.txHashs) + `} ) {
                transaction {
                    hash
                }
                block {
                    timestamp {
                    time(format: "%Y-%m-%d %H:%M:%S")
                    }
                    height
                }
                sender {
                    address
                }
                receiver {
                    address
                }
                transaction {
                    hash
                }
                amount
                currency {
                    symbol
                }
                }
            }
            }
    `,
    };

    axios.defaults.headers.post["X-API-KEY"] = "BQYAuAhYKrbYFPY5xPeYEH5ZbghqLaGF";
    axios.post("https://graphql.bitquery.io", data).then(function (res) {
        var transfers = res.data.data.ethereum.transfers.reverse();
        $(self.transferQueue).each(function (index, transfer) {
            $(transfers).each(function (index, bnbTransfer) {
                if (transfer.txHash == bnbTransfer.transaction.hash) {
                    if (transfer.sender.toLowerCase() == self.pancakeAddress.toLowerCase() || transfer.sender.toLowerCase() == self.pancake2Address.toLowerCase()) {
                        if ((bnbTransfer.receiver.address.toLowerCase() == self.pancakeAddress.toLowerCase() || bnbTransfer.receiver.address.toLowerCase() == self.pancake2Address.toLowerCase())
                            && bnbTransfer.currency.symbol == "WBNB") {
                            transfer.type = "buy";
                            transfer.bnbAmount = Number(bnbTransfer.amount);
                            return;
                        } 
                    }

                    if (transfer.receiver.toLowerCase() == self.pancakeAddress.toLowerCase() || transfer.receiver.toLowerCase() == self.pancake2Address.toLowerCase()) {
                        if ((bnbTransfer.sender.address.toLowerCase() == self.pancakeAddress.toLowerCase() || bnbTransfer.sender.address.toLowerCase() == self.pancake2Address.toLowerCase())
                            && bnbTransfer.currency.symbol == "WBNB") {
                            transfer.type = "sell";
                            transfer.bnbAmount = Number(bnbTransfer.amount);
                            return;
                        } 
                    }
                }
            });
        });

        if (transfers.length == 0)
            return;

        console.log(transfers.length + " bnb transfers");
        if (transfers.length == 1000) {
            self.offset += 1000;
            self.fetchBNBTransactions(self);
        } else {
            return;
        }
    }, (err) => {
        console.log(err);
    });
}

function setBNBValue(self, transfers) {
    
        let transferQueue = [];

        self.getBNBHistory(self).then(
            (res) => {
                self.bnbHistory = res.data.data.getAssetValues;

                transfers.map((transfer) => {
                    transferQueue.push(transfer);
                    self.bnbHistory.map((kline) => {
                        var klineDatetime = new Date(Number(kline.openTime));
                        let transferDatetime = new Date(transfer.datetime.toJSON());
                        transferDatetime.setSeconds(0);
                        //var transferDateTime = transfer.datetime;
                        //transferDateTime.setSeconds();
                        //transferDatetime = new Date(transferDatetime.getTime() + transferDatetime.getTimezoneOffset() * 60000)
                        if (/*transfer.bnbUnitValue == -1 &&*/ klineDatetime.getTime() == transferDatetime.getTime()) {
                            transfer.bnbUnitValue = kline.open;
                            transfer.bnbValue = transfer.bnbAmount * transfer.bnbUnitValue;
                            transfer.valueInBNB = transfer.portfolioAmount * self.bogePrice(transfer);
                            
                            // self.saveTransfer(transfer);
                            return;
                        }
                    });
                });

                self.saveTransfers(self, transferQueue);

                self.showChart = true;
            }
        )
}

function toISODate(datetime) {
    return (datetime.toJSON()).split("T")[0];
}

function getDateInTimezone(datetime) {
    return new Date(datetime.getTime() - datetime.getTimezoneOffset() * 60000);
}

// function removeTransfer(item, itemList) {
//   var findObject = (object) => object.txHash == item.txHash;
//   var index = itemList.findIndex(findObject);
//   if (index === -1) return false;
//   else {
//     itemList.splice(index, 1);
//     return true;
//   }
// }
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
