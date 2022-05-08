/*
  Warnings:

  - You are about to drop the column `block` on the `BogeTransfers` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BogeTransfers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "datetime" DATETIME,
    "type" TEXT,
    "bnbAmount" REAL,
    "bnbUnitValue" REAL,
    "bogeAmount" REAL,
    "senderAddress" TEXT,
    "receiverAddress" TEXT,
    "txHash" TEXT
);
INSERT INTO "new_BogeTransfers" ("id", "datetime", "bnbAmount", "bnbUnitValue", "bogeAmount", "senderAddress", "receiverAddress", "txHash") SELECT "id", "datetime", "bnbAmount", "bnbUnitValue", "bogeAmount", "senderAddress", "receiverAddress", "txHash" FROM "BogeTransfers";
DROP TABLE "BogeTransfers";
ALTER TABLE "new_BogeTransfers" RENAME TO "BogeTransfers";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
