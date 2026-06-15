const express = require('express');
const router = express.Router();
const ctrl = require('./receptionist.controller');
const auth = require('../../middlewares/auth.middleware');
const role = require('../../middlewares/role.middleware');

router.use(auth);

// Self profile first (before /:id)
router.get('/profile/me', role(['RECEPTIONIST']), ctrl.getProfile);
router.put('/profile/me', role(['RECEPTIONIST']), ctrl.updateProfile);

// Only ADMIN can create receptionist accounts (per RBAC spec)
router.post('/', role(['ADMIN']), ctrl.create);

// ADMIN can fully manage; DOCTOR can only view/list
router.get('/', role(['DOCTOR', 'ADMIN']), ctrl.list);
router.get('/:id', role(['DOCTOR', 'ADMIN']), ctrl.getById);
router.put('/:id', role(['ADMIN']), ctrl.update);
router.delete('/:id', role(['ADMIN']), ctrl.deletePermanent);
router.patch('/:id/permissions', role(['ADMIN']), ctrl.updatePermissions);

module.exports = router;
