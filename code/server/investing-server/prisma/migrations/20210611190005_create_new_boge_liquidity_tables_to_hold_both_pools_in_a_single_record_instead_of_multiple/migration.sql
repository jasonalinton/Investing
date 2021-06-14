-- CreateTable
CREATE TABLE "BogeLiquidities" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "datetime" DATETIME,
    "price" REAL,
    "bnbBalance_BOGE_9" REAL,
    "bogeBalance_BOGE_9" REAL,
    "price_BOGE_9" REAL,
    "bnbBalance_V2" REAL,
    "bogeBalance_V2" REAL,
    "price_V2" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
