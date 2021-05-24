import axios from "axios";

class BogeHistoryService {
    intervalID;
    bogeHistory = {
        intervalString: '15m',
        intervalMinutes: 15
    }

    constructor(serviceInterval) {
        this.serviceInterval = serviceInterval;
    }

    start() {
        this.getLastSavedTimes();
        this.intervalID = setInterval(this.getLastSavedTimes, this.serviceInterval, this);
    }

    restart() {
        clearInterval(this.intervalID);
        this.start();
    }

    stop() {
        clearInterval(this.intervalID);
        this.intervalID = null;
    }

    getLastSavedTimes(self) {
        if (self.processing == false) {
            self.processing = true;

            let transferPromise = getLastSavedTransferTime();
            let klinePromise = getLastSavedKlineTime("BOGE");
            Promise.all([transferPromise, klinePromise])
                .then((res) => new Promise((resolve) => {
                    self.lastSavedTransferTime = new Date(transferPromise.value);
                    self.lastSavedKlineTime = new Date(klinePromise.value);

                    var diff = Math.abs(self.lastSavedTransferTime - self.lastSavedKlineTime);
                    var minutes = Math.floor((diff/1000)/60);
                    if (minutes >= 15)
                        self.createBogeKlines(self, resolve)
                    else
                        resolve();
                }))
                .then(() => {
                    self.processing = false;
                });
        }
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

    async getLastSavedKlineTime(symbol) {
        var data = {
            query: `
            mutation {
                getLastSavedTime(symbol: "${symbol}")
            }`
        }
        return axios.post('http://localhost:4000/graphql', data);
    }

    createBogeKlines(self, resolve) {
        let openTime = self.lastSavedKlineTime;
        let closeTime = date.addMinutes(openTime, self.bogeHistory.intervalMinutes)
        let transfers_temp = self.transfers.slice().sort((a, b) => b.datetime - a.datetime);
        while (openTime < new Date()) {
            var now = new Date();
            if (closeTime > now) closeTime = now;
            let transfers = transfers_temp.filter(transfer => {
                return transfer.datetime > openTime & transfer.datetime < closeTime;
            });
            if (transfers.length > 0) {
                let symbol = "BOGE";
                let interval = self.bogeHistory.intervalString;
                let total = 0;
                let high = 0;
                let low = 1000000000;
                let open = transfers[0].bogeAmount;
                let close = transfers[transfers.length - 1].bogeAmount;
                let volume = 0;
                let numberOfTrades = 0;
                
                transfers.forEach(transfer => {
                    total += transfer.priceUnit;
                    high = (transfer.priceUnit > high) ? transfer.priceUnit : high
                    low = (transfer.priceUnit < low) ? transfer.priceUnit : low
                    volume += transfer.bnbAmount;
                    numberOfTrades++;
                });
                let average = total / numberOfTrades;
                //transfer.average = average;
                self.transferKlines.push({ average, symbol, interval, openTime, open, high, low, 
                    close, volume, closeTime, numberOfTrades });
            }
            openTime = closeTime;
            closeTime = date.addMinutes(closeTime, self.bogeHistory.intervalMinutes);
            console.log(closeTime.toString());
        }
        resolve();
    }
}

export default BogeHistoryService;