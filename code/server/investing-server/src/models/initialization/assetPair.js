class AssetPair {
    id
    symbol;
    baseAsset;
    quoteAsset;

    constructor(symbol, baseAsset, quoteAsset, id) {
        this.symbol = symbol.trim();
        this.baseAsset = baseAsset.trim();
        this.quoteAsset = quoteAsset.trim();
        this.id = id;
    }
}

module.exports = AssetPair;