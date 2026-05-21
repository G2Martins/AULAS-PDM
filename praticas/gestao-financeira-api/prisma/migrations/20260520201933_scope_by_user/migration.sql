-- Adiciona userId nullable para permitir backfill
ALTER TABLE `Category` ADD COLUMN `userId` INTEGER NULL;
ALTER TABLE `Transaction` ADD COLUMN `userId` INTEGER NULL;

-- Backfill: dados existentes pertencem ao usuário demo (id = 1).
-- Categorias padrão (isDefault = true) permanecem com userId NULL (visíveis a todos).
UPDATE `Category` SET `userId` = 1 WHERE `isDefault` = FALSE;
UPDATE `Transaction` SET `userId` = 1 WHERE `userId` IS NULL;

-- Após o backfill, Transaction.userId é obrigatório
ALTER TABLE `Transaction` MODIFY COLUMN `userId` INTEGER NOT NULL;

-- Foreign keys e índices
CREATE INDEX `Category_userId_idx` ON `Category`(`userId`);
CREATE INDEX `Transaction_userId_idx` ON `Transaction`(`userId`);

ALTER TABLE `Category`
  ADD CONSTRAINT `Category_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Transaction`
  ADD CONSTRAINT `Transaction_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
