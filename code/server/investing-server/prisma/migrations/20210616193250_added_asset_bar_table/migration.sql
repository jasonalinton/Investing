-- CreateTable
CREATE TABLE "AssetBar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idBaseAsset" INTEGER NOT NULL,
    "idQuoteAsset" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
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
    "takerBuyQuoteAssetVolume" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("idBaseAsset") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("idQuoteAsset") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AssetBar.symbol_interval_openTime_unique" ON "AssetBar"("symbol", "interval", "openTime");
