class Wallet {
    id
    idUser;
    idExchange;
    idAsset;
    symbol;
    address;

    constructor(symbol, address) {
        this.symbol = symbol.trim();
        this.address = address.trim();
    }
}

module.exports = Wallet;