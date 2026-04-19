/**
 * Receptionist Controller
 *
 * Because we don't know the exact ORM / DB layer used in the full backend
 * (only the analytics module was shipped), this controller is written in a
 * framework-agnostic, promise-based style compatible with Prisma, Sequelize,
 * or a raw-query repository pattern.  Replace the repository calls with your
 * actual DB implementation.
 */
const repo = require('./receptionist.repository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const err = (res, msg, status = 400) => res.status(status).json({ success: false, message: msg });

// ── List all receptionists (doctor/admin read access) ───────────────────────
exports.list = async (req, res) => {
  try {
    const list = await repo.findAll();
    ok(res, list);
  } catch (e) { err(res, e.message, 500); }
};

// ── Create a receptionist account (admin-only route) ───────────────────────
exports.create = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password, permissions } = req.body;

    if (!firstName || !lastName || !phone || !password)
      return err(res, 'firstName, lastName, phone and password are required.');

    const exists = await repo.findByPhone(phone);
    if (exists) return err(res, 'Phone number already registered.');

    const hashed = await bcrypt.hash(password, 10);

    const defaultPermissions = {
      registerPatient: true,
      bookAppointment: true,
      cancelAppointment: false,
      viewMedicalHistory: false,
      manageSchedule: false,
      viewBilling: false,
      ...permissions,   // override with caller's choices
    };

    const receptionist = await repo.create({
      firstName, lastName, phone, email,
      passwordHash: hashed,
      permissions: defaultPermissions,
      createdBy: req.user.id,
    });

    ok(res, receptionist, 201);
  } catch (e) { err(res, e.message, 500); }
};

// ── Get by ID ──────────────────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const r = await repo.findById(req.params.id);
    if (!r) return err(res, 'Receptionist not found.', 404);
    ok(res, r);
  } catch (e) { err(res, e.message, 500); }
};

// ── Update (name, email, phone, status) ───────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, isActive, password } = req.body;
    const updates = { firstName, lastName, email, phone, isActive };

    if (password) {
      updates.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await repo.update(req.params.id, updates);
    if (!updated) return err(res, 'Receptionist not found.', 404);
    ok(res, updated);
  } catch (e) { err(res, e.message, 500); }
};

// ── Update permissions only ────────────────────────────────────────────────
exports.updatePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    const updated = await repo.updatePermissions(req.params.id, permissions);
    if (!updated) return err(res, 'Receptionist not found.', 404);
    ok(res, updated);
  } catch (e) { err(res, e.message, 500); }
};

// ── Soft-delete (deactivate) ───────────────────────────────────────────────
exports.softDelete = async (req, res) => {
  try {
    await repo.softDelete(req.params.id);
    ok(res, { deleted: true });
  } catch (e) { err(res, e.message, 500); }
};

// Backward-compatible alias for routes still using remove.
exports.remove = exports.softDelete;

// ── Self profile (receptionist only) ──────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const r = await repo.findByUserId(req.user.id);
    if (!r) return err(res, 'Profile not found.', 404);
    ok(res, r);
  } catch (e) { err(res, e.message, 500); }
};

// ── Self profile update (receptionist only) ────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const rec = await repo.findByUserId(req.user.id);
    if (!rec) return err(res, 'Profile not found.', 404);
    const { firstName, lastName, email, phone, password } = req.body;
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (password) updates.passwordHash = await bcrypt.hash(password, 10);
    const updated = await repo.update(rec.id, updates);
    ok(res, updated);
  } catch (e) { err(res, e.message, 500); }
};
