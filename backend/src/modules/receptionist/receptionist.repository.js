const prisma = require('../../config/database');

const SAFE_SELECT = {
  id: true, firstName: true, lastName: true,
  email: true, isActive: true,
  permissions: true, createdAt: true, updatedAt: true,
  user: { select: { id: true, phone: true, role: true } },
};

exports.findAll = () =>
  prisma.receptionist.findMany({
    select: SAFE_SELECT,
    orderBy: { createdAt: 'desc' },
  });

exports.findById = (id) =>
  prisma.receptionist.findUnique({
    where: { id: String(id) },
    select: SAFE_SELECT,
  });

// Check if phone is already taken (in users table)
exports.findByPhone = (phone) =>
  prisma.user.findUnique({ where: { phone } });

exports.findByUserId = (userId) =>
  prisma.receptionist.findUnique({
    where: { userId: String(userId) },
    select: SAFE_SELECT,
  });

exports.create = async ({ firstName, lastName, phone, email, passwordHash, permissions, createdBy }) => {
  const user = await prisma.user.create({
    data: {
      phone,
      password: passwordHash,
      role: 'RECEPTIONIST',
      receptionist: {
        create: {
          firstName,
          lastName,
          email,
          permissions,
          createdById: createdBy ? String(createdBy) : null,
        },
      },
    },
    include: { receptionist: true },
  });
  const { password: _pw, ...safeUser } = user;
  return safeUser;
};

exports.update = async (id, { firstName, lastName, email, phone, isActive, passwordHash }) => {
  const data = {};
  if (firstName !== undefined) data.firstName = firstName;
  if (lastName !== undefined) data.lastName = lastName;
  if (email !== undefined) data.email = email;
  if (isActive !== undefined) data.isActive = isActive;

  const rec = await prisma.receptionist.update({
    where: { id: String(id) },
    data,
    select: SAFE_SELECT,
  });

  if (phone || passwordHash) {
    await prisma.user.update({
      where: { id: rec.user.id },
      data: {
        ...(phone ? { phone } : {}),
        ...(passwordHash ? { password: passwordHash } : {}),
      },
    });
  }
  return rec;
};

exports.updatePermissions = (id, permissions) =>
  prisma.receptionist.update({
    where: { id: String(id) },
    data: { permissions },
    select: SAFE_SELECT,
  });

exports.softDelete = (id) =>
  prisma.receptionist.update({
    where: { id: String(id) },
    data: { isActive: false },
    select: SAFE_SELECT,
  });

exports.deleteReceptionist = (id) =>
  prisma.receptionist.delete({
    where: { id: String(id) },
  });

// Backward-compatible alias for older callers.
exports.remove = exports.softDelete;
