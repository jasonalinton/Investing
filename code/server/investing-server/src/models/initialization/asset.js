class Asset {
    id
    symbol;
    name;

    constructor(symbol, name, id) {
        this.symbol = symbol.trim();
        this.name = name.trim();
        this.id = id;
    }
}

module.exports = Asset;