import axios from "axios";
import { io } from "socket.io-client";

class BogeTransferService {
    intervalID;
    offset = 0;
    processing = false;
    bnbHistory = [];
    bogeTransferQueue = [];
    newTransfers = [];
    datetimes = [];
    bogeAddress = "0x248c45af3b2f73bc40fa159f2a90ce9cad7a77ba";
    pancakeAddress = "0xb9ace332c55779ec5324fabb83a73fb33f7066bf";
    pancake2Address = "0x15Ef0BE23194e4f21a4c4B871a78985c38e0CE39";

    constructor(serviceInterval, socketURL) {
        this.serviceInterval = serviceInterval;
        this.socket = io(socketURL);
    }

    start(socket) {
        //this.socket2 = socket;
        this.intervalID = setInterval(this.syncTransferTable, this.serviceInterval, this);
        return this.syncTransferTable(this);
    }

    restart() {
        clearInterval(this.intervalID);
        this.start();
    }

    stop() {
        clearInterval(this.intervalID);
        this.intervalID = null;
    }

    syncTransferTable(self) {
        return new Promise((resolveRun) => {
            if (self.processing == false) {
                self.processing = true;
    
                self.getLastSavedTransferTime()
                    .then((res) => new Promise((resolve) => {
                        self.lastSavedTime = new Date(res.data.data.getLastSavedTransferTime);
                        console.log(`Last Boge transfer saved on ${self.lastSavedTime.toJSON()}`);
    
                        self.fetchTranfers(self, self.lastSavedTime, resolve);
                    }))
                    .then(() => { 
                        return self.getBNBHistory(self); 
                    })
                    .then((res) => new Promise((resolve) => {
                        self.bnbHistory = res.data.data.getAssetValues;
                        self.fetchBNBTransfers(self, resolve);
                    }))
                    .then(() => new Promise((resolve) => {
                        self.setBNBValues(self);   
                        
                        self.saveTransfers(self, resolve);
    
                        console.log(`Saving transfers`); 
                    }))
                    .then(() => {
                        self.processing = false;
                        resolveRun();
                    });
            }
        });
    }

    async getLastSavedTransferTime() {
        var data = {
            query: `
            query {
                getLastSavedTransferTime 
            }`
        }
        return axios.post('http://localhost:4000/graphql', data);
    }

    async fetchTranfers(self, lastSavedTransferTime, resolve) {
        var data = {
            query: `
                query {
                    ethereum(network: bsc) {
                        transfers(
                            options: {asc: "block.timestamp.time", limit: 1000, offset: ${self.offset}}
                            date: {since: "${lastSavedTransferTime.toISOString()}", till: null}
                            amount: {gt: 0}
                            currency: {is: "${self.bogeAddress}"}
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
                self.createTransfers(self, lastSavedTransferTime, res.data.data.ethereum.transfers);
                    
                if (self.newTransfers.length == 0) {
                    self.processing = false;
                    return;
                }
            
                var lastTransferDate = new Date(self.newTransfers[self.newTransfers.length - 1].datetime);
                console.log(lastTransferDate.toString() + " " + res.data.data.ethereum.transfers.length);
    
                if (res.data.data.ethereum.transfers.length == 1000) {
                    self.offset += 1000;
                    self.fetchTranfers(self, lastSavedTransferTime, resolve);
                } else {
                    self.bogeTransferQueue = self.newTransfers.slice();
                    resolve();
                }
            });
    }
    
    createTransfers(self, lastSavedTransferTime, transfers) {
        transfers.forEach(transfer => {
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
                let datetime = new Date(transfer.block.timestamp.time);
                datetime.setSeconds(0);
                datetime = new Date(datetime.getTime() - datetime.getTimezoneOffset() * 60000);
                if (!self.datetimes.includes(datetime.toJSON()))
                    self.datetimes.push(datetime.toJSON());
            }
           });
    }
    
    fetchBNBTransfers(self, resolve) {
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
                transferQueue.forEach(transfer => {
                    transfers.forEach(bnbTransfer => {
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
                    self.fetchBNBTransfers(self, resolve);
                } else {
                    resolve();
                }
    
            });
    }
    
    setBNBValues(self) {
        self.newTransfers.map((transfer) => {
            let kline = self.bnbHistory.find(kline => {
                let klineDatetime = new Date(Number(kline.openTime));
                let transferDatetime = new Date(transfer.datetime.toJSON());
                transferDatetime.setSeconds(0); // Set to zero for comparison
    
                if (klineDatetime.getTime() == transferDatetime.getTime())
                    return true;
            });

            if (kline) {
                transfer.bnbUnitValue = kline.open;
                transfer.bnbValue = transfer.bnbAmount * transfer.bnbUnitValue;

                if (transfer.bnbAmount && transfer.bnbAmount != -1) {
                    transfer.priceTotal = transfer.bnbAmount * transfer.bnbUnitValue;
                    transfer.priceUnit = transfer.priceTotal / transfer.amount;
                } else {
                }
            } else {
                // Null price means BNB value wasn't available at the time of processing
                // Price & BNB value should be set later when BNB value is available
                transfer.bnbUnitValue = null;
                transfer.bnbValue = null;

                transfer.priceTotal = null;
                transfer.priceUnit = null;

            }
        });
    }
    
    getBNBHistory(self) {
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
    
    saveTransfers(self, resolve) {
        let transfer = self.newTransfers.shift(); 
        self.saveTransfer(transfer)
            .then((res) => {
                self.socket.emit('emit-transfer-added', res.data.data.addTransfer);
                //self.socket2.emit('transfer-added', res.data.data.addTransfer);

                self.lastSavedTime = transfer.datetime;
                if (self.newTransfers.length > 0) {
                    self.saveTransfers(self, resolve);
                } else {
                    resolve();
                }
            });
    }
    
    async saveTransfer(transfer) {
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
}

export default BogeTransferService;