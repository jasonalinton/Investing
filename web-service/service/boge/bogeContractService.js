import axios from "axios";

class BogeContractService {
    pancakeAddress = {
        BOGE_9: "0xb9ace332c55779ec5324fabb83a73fb33f7066bf",
        RouterV2: "0x15Ef0BE23194e4f21a4c4B871a78985c38e0CE39"
    };

    constructor(serviceInterval, socketURL) {
        this.serviceInterval = serviceInterval;
        //this.socket = io(socketURL);
    }

    start(socket) {
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

    async run(self) {
        return new Promise((resolve) => {
            const BOGE9Promise = self.getLiquidity(self, self.pancakeAddress.BOGE_9);
            const RouterV2Promise = self.getLiquidity(self, self.pancakeAddress.RouterV2);

            Promise.all([BOGE9Promise, RouterV2Promise]).then(values => {
                resolve();
            }, error => { console.log(error) });
        }, error => { console.log(error) });
    }

    async getLiquidity(self, pancakeAddress) {
        return new Promise((resolve) => {
            const bnbPromise = self.getBNBBalance(pancakeAddress);
            const bogePromise = self.getBOGEBalance(pancakeAddress);

            Promise.all([bnbPromise, bogePromise]).then(values => {
                const bnbBalance = values[0].data.result;
                const bogeBalance = values[1].data.result;

                self.saveBogeLiquidity(new Date(), bnbBalance, bogeBalance, pancakeAddress)
                    .then(() => { }, error => { console.log(error.response.data.errors) })

                resolve();
            }, error => { console.log(error) });
        });
    }

    async getBNBBalance(pancakeAddress) {
        return axios.get(`https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c&address=${pancakeAddress}&tag=latest&apikey=BG6DCTFBA1MWMYBZV7QGS831QVFMUADUB9`);
    }

    async getBOGEBalance(pancakeAddress) {
        return axios.get(`https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=0x248c45af3b2f73bc40fa159f2a90ce9cad7a77ba&address=${pancakeAddress}&tag=latest&apikey=BG6DCTFBA1MWMYBZV7QGS831QVFMUADUB9`);
    }

    async saveBogeLiquidity(datetime, bnbBalance, bogeBalance, address) {
        var data = {
            query: `
            mutation {
                addBogeLiquidity(
                  datetime: "${datetime.toJSON()}"
                  bnbBalance: ${Number(bnbBalance) / 1000000000000000000}
                  bogeBalance: ${Number(bogeBalance) / 1000000000}
                  address: "${address}"
                ) {
                  id
                  datetime
                  bnbBalance
                  bogeBalance
                  address
                }
              }
            `
        }
        return axios.post('http://localhost:4000/graphql', data);
    }

}

export default BogeContractService;