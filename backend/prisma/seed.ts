import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ROLES: Array<{ name: RoleName; description: string }> = [
  { name: RoleName.ADMIN, description: 'Configuración, usuarios, tarifas, reportes y auditoría' },
  { name: RoleName.OPERADOR, description: 'Suscriptores, predios, medidores, lecturas y facturación' },
  { name: RoleName.CAJERO, description: 'Pagos, cartera y recibos' },
  { name: RoleName.LECTOR, description: 'Registro de lecturas en campo' },
  { name: RoleName.CONSULTA, description: 'Solo lectura de reportes y datos' },
];

async function main(): Promise<void> {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@aquaerp.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.ADMIN },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      firstName: 'Administrador',
      lastName: 'Sistema',
      isActive: true,
    },
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'Administrador',
      lastName: 'Sistema',
      roles: {
        create: { roleId: adminRole.id },
      },
    },
  });

  const existingAdminRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
  });

  if (!existingAdminRole) {
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });
  }

  console.log(`Seed completado. Admin: ${adminEmail}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
