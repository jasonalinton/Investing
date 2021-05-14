/*
  Warnings:

  - You are about to drop the column `text` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `AssetValue` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "AssetValue.symbol_unique";

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Asset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Asset" ("id", "symbol", "name", "createdAt", "updatedAt") SELECT "id", "symbol", "name", "createdAt", "updatedAt" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
CREATE UNIQUE INDEX "Asset.symbol_unique" ON "Asset"("symbol");
CREATE TABLE "new_AssetValue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idBaseAsset" INTEGER NOT NULL,
    "idQuoteAsset" INTEGER NOT NULL,
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
INSERT INTO "new_AssetValue" ("id", "idBaseAsset", "idQuoteAsset", "symbol", "openTime", "open", "high", "low", "close", "volume", "closeTime", "quoteAssetVolume", "numberOfTrades", "takerBuyBaseAssetVolume", "takerBuyQuoreAssetVolume", "createdAt", "updatedAt") SELECT "id", "idBaseAsset", "idQuoteAsset", "symbol", "openTime", "open", "high", "low", "close", "volume", "closeTime", "quoteAssetVolume", "numberOfTrades", "takerBuyBaseAssetVolume", "takerBuyQuoreAssetVolume", "createdAt", "updatedAt" FROM "AssetValue";
DROP TABLE "AssetValue";
ALTER TABLE "new_AssetValue" RENAME TO "AssetValue";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
