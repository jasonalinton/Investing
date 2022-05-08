-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BogeTransfers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "datetime" DATETIME,
    "type" TEXT,
    "bnbAmount" REAL,
    "bnbUnitValue" REAL,
    "bogeAmount" REAL,
    "priceTotal" REAL,
    "priceUnit" REAL,
    "senderAddress" TEXT,
    "receiverAddress" TEXT,
    "txHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_BogeTransfers" ("id", "datetime", "type", "bnbAmount", "bnbUnitValue", "bogeAmount", "senderAddress", "receiverAddress", "txHash", "priceTotal", "priceUnit") SELECT "id", "datetime", "type", "bnbAmount", "bnbUnitValue", "bogeAmount", "senderAddress", "receiverAddress", "txHash", "priceTotal", "priceUnit" FROM "BogeTransfers";
DROP TABLE "BogeTransfers";
ALTER TABLE "new_BogeTransfers" RENAME TO "BogeTransfers";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
