import $ from "jquery";
import axios from "axios";

function syncTransferTable(self, resolveTransfers) {
    getLastSavedTransferTime()
        .then((res) => new Promise((resolve) => {
            fetchTranfers(self, new Date(res.data.data.getLastSavedTransferTime), resolve);
        }))
        .then(() => { 
            return getBNBHistory(self); 
        })
        .then((res) => new Promise((resolve) => {
            self.bnbHistory = res.data.data.getAssetValues;
            fetchBNBTransfers(self, resolve);
        }))
        .then((res) => new Promise((resolve) => {
            setBNBValues(self, res.transferQueue);    
            saveTransfers(self, resolve);
        }))
        .then(resolveTransfers);
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

async function fetchTranfers(self, lastSavedTransferTime, resolve) {
    var data = {
        query: `
            query {
                ethereum(network: bsc) {
                    transfers(
                        options: {asc: "block.timestamp.time", limit: 1000, offset: ${self.offset}}
                        date: {since: "${lastSavedTransferTime.toISOString()}", till: null}
                        amount: {gt: 0}
                        currency: {is: "0x248c45af3b2f73bc40fa159f2a90ce9cad7a77ba"}
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
    axios.post("https://graphql.bitquery.io", data)
        .then((res) => {
            createTransfer(self, lastSavedTransferTime, res);
                
            if (self.newTransfers.length == 0)
                return;
        
            var lastTransferDate = new Date(self.newTransfers[self.newTransfers.length - 1].datetime);
            console.log(lastTransferDate.toString() + " " + res.data.data.ethereum.transfers.length);

            if (res.data.data.ethereum.transfers.length == 1000) {
                self.offset += 1000;
                fetchTranfers(self, lastSavedTransferTime, resolve);
            } else {
                self.bogeTransferQueue = self.newTransfers.slice();
                resolve();
            }
        })
}

function createTransfer(self, lastSavedTransferTime, res) {
    $(res.data.data.ethereum.transfers).each(function (index, transfer) {
        
        /* Datetime comes in as UTC. That UTC datetime is converter to locale giving you the wrong datetime.
            Subtract by timezone offset to get the correct datetime */
        let datetimeUTC = new Date(transfer.block.timestamp.time);
        datetimeUTC = new Date(datetimeUTC.getTime() - datetimeUTC.getTimezoneOffset() * 60000);

        if (datetimeUTC > lastSavedTransferTime) {

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
                priceUnit: -1,
                priceTotal: -1,
                amount: Number(transfer.amount),
                txHash: transfer.transaction.hash,
                sender: transfer.sender.address,
                receiver: transfer.receiver.address,
            };

            self.newTransfers.push(tempTransfer);
            self.transferQueue.push(tempTransfer);
            self.txHashs.push(transfer.transaction.hash);
            let datetime = new Date(transfer.block.timestamp.time);
            datetime.setSeconds(0);
            datetime = new Date(datetime.getTime() - datetime.getTimezoneOffset() * 60000);
            if (!self.datetimes.includes(datetime.toJSON()))
                self.datetimes.push(datetime.toJSON());
            let datetimeString = datetime.setSeconds(0);
            datetime = new Date(datetimeString);
            // self.getAssetValue(tempTransfer.datetime)
            // .then((res) => {
            //     if (res.data.data.getAssetValue) {
            //         tempTransfer.bnbUnitValue = res.data.data.getAssetValue.open;
            //     }
            // });
        }
       });
}

function fetchBNBTransfers(self, resolve) {
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
    return axios.post("https://graphql.bitquery.io", data)
        .then((res) => {
            var transfers = res.data.data.ethereum.transfers.reverse();
            $(transferQueue).each(function (index, transfer) {
                $(transfers).each(function (index, bnbTransfer) {
                    if (transfer.txHash == bnbTransfer.transaction.hash) {
                        if (transfer.sender.toLowerCase() == self.pancakeAddress.toLowerCase() || 
                            transfer.sender.toLowerCase() == self.pancake2Address.toLowerCase()) {
                            if ((bnbTransfer.receiver.address.toLowerCase() == self.pancakeAddress.toLowerCase() || 
                                 bnbTransfer.receiver.address.toLowerCase() == self.pancake2Address.toLowerCase())
                                && bnbTransfer.currency.symbol == "WBNB") {
                                transfer.type = "buy";
                                transfer.bnbAmount = Number(bnbTransfer.amount);
                                return;
                            } 
                        }

                        if (transfer.receiver.toLowerCase() == self.pancakeAddress.toLowerCase() || 
                            transfer.receiver.toLowerCase() == self.pancake2Address.toLowerCase()) {
                            if ((bnbTransfer.sender.address.toLowerCase() == self.pancakeAddress.toLowerCase() || 
                                 bnbTransfer.sender.address.toLowerCase() == self.pancake2Address.toLowerCase())
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
                fetchBNBTransfers(self, resolve);
            } else {
                resolve({ transferQueue: self.newTransfers });
            }

        });
}

function setBNBValues(self, transfers) {
    transfers.map((transfer) => {
        if (transfer.txHash == "0x83579fd01f1604d87fd1acc08b3a574a6157e8fbaf3f38b63bb6cc57dfb32a59") {
            console.log("stop");
        }
        self.bnbHistory.some((kline) => {
            if (kline.openTime == "1620581886000") {
                console.log("Stop again!");
            }
            let klineDatetime = new Date(Number(kline.openTime));
            let transferDatetime = new Date(transfer.datetime.toJSON());
            transferDatetime.setSeconds(0); // Set to zero for comparison

            if (klineDatetime.getTime() == transferDatetime.getTime()) {
                transfer.bnbUnitValue = kline.open;
                transfer.bnbValue = transfer.bnbAmount * transfer.bnbUnitValue;

                if (transfer.bnbAmount && transfer.bnbAmount != -1) {
                    transfer.priceTotal = transfer.bnbAmount * transfer.bnbUnitValue;
                    transfer.priceUnit = transfer.priceTotal / transfer.amount;
                }
                
                return true;
            }
        });
    });
}

function getBNBHistory(self) {
    var datetimes = JSON.stringify(self.datetimes);
    var data = {
        query:
            `
            mutation {
                getAssetValues(symbol: "BNB", datetimes: ${datetimes}) {
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

function saveTransfers(self, resolve) {
    console.log("Saving transfers");

    let transfer = self.newTransfers.shift();
    saveTransfer(transfer)
        .then(() => {
            if (self.newTransfers.length > 0) {
                saveTransfers(self, resolve);
            } else {
                resolve();
            }
        });

    // self.newTransfers.map((transfer) => {
    //     saveTransfer(transfer).then(
    //         (res) => {
    //             if (self.shouldLog)
    //                 console.log(res.data.data.addTransfer);
    //         },
    //         (err) => {
    //             console.log(err);
    //         })
    // });
}

async function saveTransfer(transfer) {
   var data = {
        query: `
        mutation {
            addTransfer(transfer: {
                datetime: "${transfer.datetime.toJSON()}"
                type: "${transfer.type}"
                bnbAmount: ${transfer.bnbAmount}
                bogeAmount: ${transfer.amount}
                bnbUnitValue: ${transfer.bnbUnitValue}
                priceUnit: ${transfer.priceUnit}
                priceTotal: ${transfer.priceTotal}
                senderAddress: "${transfer.sender}"
                receiverAddress: "${transfer.receiver}"
                txHash: "${transfer.txHash}"
            }) {
                datetime
                type
                bnbAmount
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

export default syncTransferTable;