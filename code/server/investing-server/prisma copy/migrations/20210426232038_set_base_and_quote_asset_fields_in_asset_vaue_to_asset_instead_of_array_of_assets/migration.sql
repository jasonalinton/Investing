/*
  Warnings:

  - You are about to drop the `_assetValueBase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_assetValueQuote` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_assetValueBase";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_assetValueQuote";
PRAGMA foreign_keys=on;
