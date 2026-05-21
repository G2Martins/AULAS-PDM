-- Permite que diferentes usuários tenham categorias com o mesmo nome (slug).
DROP INDEX `Category_name_key` ON `Category`;
CREATE UNIQUE INDEX `Category_name_userId_key` ON `Category`(`name`, `userId`);
