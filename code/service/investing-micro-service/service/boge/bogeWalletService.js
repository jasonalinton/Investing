import axios from "axios";

class BogeWalletService {
    wallets = [
        { name: "My Main Wallet", address: "0xfd345014ed667bb07eb26345e66addc9e8164b3b", symbol: "BOGE" },
        { name: "My Trust Wallet", address: "0x003c2f2dbcd1a57c081155c09aa72ba349da3752", symbol: "BOGE" },
        { name: "Christy", address: "0xa1CFA1eC61BcA7707ad4A813376d104Cb75Fe679", symbol: "BOGE" },
        { name: "Dad", address: "0xdac5ee9e4e1d0a1a923241400dd84cf1df77d732", symbol: "BOGE" },
        { name: "Mom", address: "0xf2FE653B6F00AaA96Dfb373eD30d569656EbeE21", symbol: "BOGE" },
        { name: "Sayeed", address: "0xe3672Ddd7Cf52Ba8D5F4413E7BB5bbb5e7dc0EFD", symbol: "BOGE" },
        { name: "Evan F", address: "0x4ffFD4BE967968BE09F8Fdb9CD6F99A837F6E6E8", symbol: "BOGE" },
        { name: "Mark", address: "0x7C5f319dDB3D13De0586c765a42C8304259A7B1c", symbol: "BOGE" },
        { name: "Evan B", address: "0x7A8659d4b8Dd1604b479Bc6850017293Dd3296F2", symbol: "BOGE" },
        { name: "Miran", address: "0x28775b57b7Dc5Ca4559b79e8c80e1FbD949B7de5", symbol: "BOGE" },
        { name: "Jordan", address: "0x09cD966b10db4080E96284ce03EFf86285023CaD", symbol: "BOGE" },
        { name: "Jordan 2", address: "0x8d1863CFD76532C82723715CdBf50bac56f715ca", symbol: "BOGE" },
        { name: "Matty", address: "0xb8b6b0e721a8f9b68942b9543d1fbba88b44e94b", symbol: "BOGE" },
        { name: "Matty 2", address: "0x0134ADb604c8732430564475a366a14eA3537dCA", symbol: "BOGE" },
        { name: "My Main Wallet (BNB)", address: "0xfd345014ed667bb07eb26345e66addc9e8164b3b", symbol: "BNB" },
        { name: "My Trust Wallet (BNB)", address: "0x003c2f2dbcd1a57c081155c09aa72ba349da3752", symbol: "BNB" },
        { name: "Christy", address: "0xa1CFA1eC61BcA7707ad4A813376d104Cb75Fe679", symbol: "BNB" },
        { name: "Dad", address: "0xdac5ee9e4e1d0a1a923241400dd84cf1df77d732", symbol: "BNB" },
        { name: "Mom", address: "0xf2FE653B6F00AaA96Dfb373eD30d569656EbeE21", symbol: "BNB" },
    ]

    contractAddresses = {
        BOGE: "0x248c45af3b2f73bc40fa159f2a90ce9cad7a77ba",
        BNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
    }

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

    run(self) {
        self.walletsQueue = self.wallets.slice();
        self.requestIntervalID = setInterval(self.getWalletBalances, 500, self);
    }

    async getWalletBalances(self) {
        let wallet = self.walletsQueue.shift();
        if (wallet) {
            if (self.walletsQueue.length == 0)
                clearInterval(self.requestIntervalID);
            
            if (wallet.symbol == "BNB") {
                self.processBNBWalletBalance(self, wallet);
            } else {
                self.getWalletBalance(wallet.address)
                .then(res => {
                    if (isNaN(res.data.result) || res.data.result == "Max rate limit reached") {
                        console.log("Not a number");
                        return
                    }
                    
                    return self.saveWalletBalance(new Date(), res.data.result, wallet);
                }, logErrors)
                .then(res => {
                    if (res) {
                        console.log(JSON.stringify(res.data.data.addWalletBalance));
                    } else
                        console.log("Error saving wallet balance");
                        console.log(JSON.stringify(wallet));
                }, logErrors);
            }
            
        }
    }

    async getWalletBalance(address, contractAddress) {
        contractAddress = (contractAddress) ? contractAddress : "0x248c45af3b2f73bc40fa159f2a90ce9cad7a77ba";
        return axios.get(`https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest&apikey=BG6DCTFBA1MWMYBZV7QGS831QVFMUADUB9`);
    }

    async saveWalletBalance(datetime, balance, wallet) {
        let denominator = (wallet.symbol == "BNB") ? 1000000000000000000 : 1000000000
        var data = {
            query: `
            mutation {
                addWalletBalance(
                  datetime: "${datetime.toJSON()}"
                  balance: ${Number(balance) / denominator}
                  name: "${wallet.name}"
                  address: "${wallet.address}"
                ) {
                  id
                  datetime
                  balance
                  name
                  address
                }
              }
            `
        }
        
        return axios.post('http://localhost:4000/graphql', data);
    }

    async processBNBWalletBalance(self, wallet) {
        return self.getBNBWalletBalance(wallet.address)
                .then(res => {
                    if (isNaN(res.data.result) || res.data.result == "Max rate limit reached") {
                        console.log("Not a number");
                        return
                    }
                    
                    return self.saveWalletBalance(new Date(), res.data.result, wallet);
                }, logErrors)
                .then(res => {
                    if (res) {
                        console.log(JSON.stringify(res.data.data.addWalletBalance));
                    } else
                        console.log("Error saving wallet balance");
                        console.log(JSON.stringify(wallet));
                }, logErrors);
    }

    async getBNBWalletBalance(address) {
        return axios.get(`https://api.bscscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=BG6DCTFBA1MWMYBZV7QGS831QVFMUADUB9`);
    }
}

function logErrors(err) {
    if (err.response.data.errors) {
        err.response.data.errors.forEach(error => {
            console.log(error);
        })
    } else if (err.data.data.errors) {
        err.data.data.errors.forEach(error => {
            console.log(error);
        })
    }
    else if (err.stack) {
        console.log(err.stack);
    }
    else if (err.message) {
        console.log(err.stack);
    } else {
        console.log(err);
    }
}

export default BogeWalletService;