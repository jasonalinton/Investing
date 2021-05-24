-- CreateTable
CREATE TABLE "Asset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AssetValue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idBaseAsset" INTEGER NOT NULL,
    "idQuoteAsset" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "openTime" DATETIME NOT NULL,
    "open" REAL NOT NULL,
    "high" REAL NOT NULL,
    "low" REAL NOT NULL,
    "close" REAL NOT NULL,
    "volume" REAL NOT NULL,
    "closeTime" DATETIME NOT NULL,
    "quoteAssetVolume" REAL,
    "numberOfTrades" REAL,
    "takerBuyBaseAssetVolume" REAL,
    "takerBuyQuoreAssetVolume" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("idBaseAsset") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("idQuoteAsset") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BogeTransfers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "datetime" DATETIME NOT NULL,
    "block" INTEGER NOT NULL,
    "bnbAmount" REAL NOT NULL,
    "bnbUnitValue" REAL NOT NULL,
    "bogeAmount" REAL NOT NULL,
    "senderAddress" TEXT NOT NULL,
    "receiverAddress" TEXT NOT NULL,
    "txHash" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AssetPair" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    FOREIGN KEY ("A") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("B") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_assetValueBase" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    FOREIGN KEY ("A") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("B") REFERENCES "AssetValue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_assetValueQuote" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    FOREIGN KEY ("A") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("B") REFERENCES "AssetValue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AssetValue.symbol_unique" ON "AssetValue"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "_AssetPair_AB_unique" ON "_AssetPair"("A", "B");

-- CreateIndex
CREATE INDEX "_AssetPair_B_index" ON "_AssetPair"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_assetValueBase_AB_unique" ON "_assetValueBase"("A", "B");

-- CreateIndex
CREATE INDEX "_assetValueBase_B_index" ON "_assetValueBase"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_assetValueQuote_AB_unique" ON "_assetValueQuote"("A", "B");

-- CreateIndex
CREATE INDEX "_assetValueQuote_B_index" ON "_assetValueQuote"("B");
