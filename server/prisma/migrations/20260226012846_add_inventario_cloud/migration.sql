-- CreateTable
CREATE TABLE "Rol" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Permiso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modulo" TEXT NOT NULL,
    "accion" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UsuarioRol" (
    "usuarioId" INTEGER NOT NULL,
    "rolId" INTEGER NOT NULL,

    PRIMARY KEY ("usuarioId", "rolId"),
    CONSTRAINT "UsuarioRol_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsuarioRol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'user',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Servidor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pais" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "nombreVM" TEXT,
    "ip" TEXT,
    "cpu" INTEGER,
    "memoria" TEXT,
    "disco" TEXT,
    "ambiente" TEXT NOT NULL,
    "arquitectura" TEXT,
    "sistemaOperativo" TEXT,
    "version" TEXT,
    "antivirus" TEXT,
    "estado" TEXT NOT NULL,
    "responsable" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventarioFisico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pais" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT,
    "serie" TEXT,
    "inventario" TEXT,
    "estado" TEXT NOT NULL,
    "responsable" TEXT,
    "observaciones" TEXT,
    "equipo" TEXT,
    "direccionIp" TEXT,
    "ilo" TEXT,
    "descripcion" TEXT,
    "serial" TEXT,
    "sistemaOperativo" TEXT,
    "garantia" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventarioCloud" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenant" TEXT NOT NULL,
    "nube" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "ipPublica" TEXT,
    "ipPrivada" TEXT,
    "instanceType" TEXT,
    "cpu" INTEGER,
    "ram" TEXT,
    "storageGib" TEXT,
    "sistemaOperativo" TEXT,
    "costoUsd" TEXT,
    "hostName" TEXT,
    "responsable" TEXT,
    "modoUso" TEXT,
    "service" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "host" TEXT NOT NULL,
    "puerto" INTEGER NOT NULL DEFAULT 587,
    "usuario" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "usandoTls" BOOLEAN NOT NULL DEFAULT true,
    "emailFrom" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_PermisoToRol" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_PermisoToRol_A_fkey" FOREIGN KEY ("A") REFERENCES "Permiso" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PermisoToRol_B_fkey" FOREIGN KEY ("B") REFERENCES "Rol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_modulo_accion_key" ON "Permiso"("modulo", "accion");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Configuracion_clave_key" ON "Configuracion"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "_PermisoToRol_AB_unique" ON "_PermisoToRol"("A", "B");

-- CreateIndex
CREATE INDEX "_PermisoToRol_B_index" ON "_PermisoToRol"("B");
