import axios from "axios";

class BogeLiquidityService {
    pancakeAddress = {
        BOGE_9: "0xb9ace332c55779ec5324fabb83a73fb33f7066bf",
        RouterV2: "0x15Ef0BE23194e4f21a4c4B871a78985c38e0CE39"
    };

    constructor(serviceInterval, socketURL) {
        this.serviceInterval = serviceInterval;
        //this.socket = io(socketURL);
    }

    async start(socket) {
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
        
    }

    async run(self) {
        let datetime = new Date();
        const BOGE9Promise = self.getLiquidity(self, self.pancakeAddress.BOGE_9);
        const RouterV2Promise = self.getLiquidity(self, self.pancakeAddress.RouterV2);

        return Promise.all([BOGE9Promise, RouterV2Promise])
            .then(values => {
                let boge9 = values[0];
                let v2 = values[1];
                self.saveBogeLiquidity(datetime, boge9.bnbBalance, boge9.bogeBalance, v2.bnbBalance, v2.bogeBalance)
            }, error => { console.log(error) });
    }

    async getLiquidity(self, pancakeAddress) {
        const bnbPromise = self.getBNBBalance(pancakeAddress);
        const bogePromise = self.getBOGEBalance(pancakeAddress);

        return Promise.all([bnbPromise, bogePromise]).then(values => {
            let liquidity = {
                bnbBalance: values[0].data.result,
                bogeBalance: values[1].data.result
            }
            return liquidity;
        }, error => { console.log(error) });
    }

    async getBNBBalance(pancakeAddress) {
        return axios.get(`https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c&address=${pancakeAddress}&tag=latest&apikey=BG6DCTFBA1MWMYBZV7QGS831QVFMUADUB9`);
    }

    async getBOGEBalance(pancakeAddress) {
        return axios.get(`https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=0x248c45af3b2f73bc40fa159f2a90ce9cad7a77ba&address=${pancakeAddress}&tag=latest&apikey=BG6DCTFBA1MWMYBZV7QGS831QVFMUADUB9`);
    }

    async saveBogeLiquidity(datetime, bnbBalance_BOGE9, bogeBalance_BOGE9, bnbBalance_V2, bogeBalance_V2) {
        var data = {
            query: `
            mutation {
                addBogeLiquidity(
                  datetime: "${datetime.toJSON()}"
                  bnbBalance_BOGE_9: ${Number(bnbBalance_BOGE9) / 1000000000000000000}
                  bogeBalance_BOGE_9: ${Number(bogeBalance_BOGE9) / 1000000000}
                  bnbBalance_V2: ${Number(bnbBalance_V2) / 1000000000000000000}
                  bogeBalance_V2: ${Number(bogeBalance_V2) / 1000000000}
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
        // console.log(data.query);
        return axios.post('http://localhost:4000/graphql', data);
    }

}

export default BogeLiquidityService;