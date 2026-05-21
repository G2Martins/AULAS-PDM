/*
  Warnings:

  - You are about to drop the column `color` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `transaction` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `transaction` table. All the data in the column will be lost.
  - Added the required column `displayName` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `category` DROP COLUMN `color`,
    DROP COLUMN `type`,
    ADD COLUMN `background` VARCHAR(191) NULL,
    ADD COLUMN `displayName` VARCHAR(191) NOT NULL,
    ADD COLUMN `isDefault` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isIncome` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `transaction` DROP COLUMN `amount`,
    DROP COLUMN `type`,
    ADD COLUMN `value` DECIMAL(12, 2) NOT NULL;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
