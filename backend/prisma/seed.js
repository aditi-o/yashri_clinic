const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database…');

  // ── Admin ────────────────────────────────────────────────────────────────
  const existingAdmin = await prisma.user.findUnique({ where: { phone: '9000000000' } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        phone: '9000000000',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin created  →  phone: 9000000000 / admin123');
  } else {
    console.log('ℹ️  Admin already exists');
  }

  // ── Doctor ───────────────────────────────────────────────────────────────
  // FIX: check whether the linked Doctor row exists, not just the User.
  // If the User was created but the doctor nested-create failed silently,
  // the login works (JWT uses User.id) but every profile fetch returns null → 404.
  const existingDoctorUser = await prisma.user.findUnique({
    where: { phone: '9876543210' },
    include: { doctor: true },
  });

  if (!existingDoctorUser) {
    await prisma.user.create({
      data: {
        phone: '9876543210',
        password: await bcrypt.hash('doctor123', 10),
        role: 'DOCTOR',
        doctor: {
          create: {
            firstName: 'Rajesh',       lastName: 'Kumar',
            email: 'dr.rajesh@clinic.com',
            specialization: 'General Physician',
            qualification: 'MBBS, MD',
            experience: 15,            consultationFee: 500,
          },
        },
      },
    });
    console.log('✅ Doctor created  →  phone: 9876543210 / doctor123');
  } else if (!existingDoctorUser.doctor) {
    // REPAIR: User exists but Doctor row is missing — create just the profile
    console.log('⚠️  Doctor User found but Doctor profile is missing — repairing…');
    await prisma.doctor.create({
      data: {
        userId:         existingDoctorUser.id,
        firstName:      'Rajesh',
        lastName:       'Kumar',
        email:          'dr.rajesh@clinic.com',
        specialization: 'General Physician',
        qualification:  'MBBS, MD',
        experience:     15,
        consultationFee: 500,
      },
    });
    console.log('✅ Doctor profile repaired for existing User');
  } else {
    console.log('ℹ️  Doctor already exists (User + Doctor profile both present)');
  }

  // ── Patient ──────────────────────────────────────────────────────────────
  const existingPatientUser = await prisma.user.findUnique({
    where: { phone: '9123456789' },
    include: { patient: true },
  });

  if (!existingPatientUser) {
    await prisma.user.create({
      data: {
        phone: '9123456789',
        password: await bcrypt.hash('patient123', 10),
        role: 'PATIENT',
        patient: {
          create: {
            firstName: 'Priya',      lastName: 'Sharma',
            email: 'priya.sharma@email.com',
            dateOfBirth: new Date('1990-05-15'),
            gender: 'FEMALE',
            address: '123 Main Street, Mumbai',
            emergencyContact: '9111222333',
            bloodGroup: 'O+',        allergies: 'None',
          },
        },
      },
    });
    console.log('✅ Patient created →  phone: 9123456789 / patient123');
  } else if (!existingPatientUser.patient) {
    console.log('⚠️  Patient User found but Patient profile is missing — repairing…');
    await prisma.patient.create({
      data: {
        userId:           existingPatientUser.id,
        firstName:        'Priya',
        lastName:         'Sharma',
        email:            'priya.sharma@email.com',
        dateOfBirth:      new Date('1990-05-15'),
        gender:           'FEMALE',
        address:          '123 Main Street, Mumbai',
        emergencyContact: '9111222333',
        bloodGroup:       'O+',
        allergies:        'None',
      },
    });
    console.log('✅ Patient profile repaired for existing User');
  } else {
    console.log('ℹ️  Patient already exists');
  }

  // ── Receptionist ─────────────────────────────────────────────────────────
  const existingRecUser = await prisma.user.findUnique({
    where: { phone: '9555000001' },
    include: { receptionist: true },
  });

  if (!existingRecUser) {
    await prisma.user.create({
      data: {
        phone: '9555000001',
        password: await bcrypt.hash('rec123', 10),
        role: 'RECEPTIONIST',
        receptionist: {
          create: {
            firstName: 'Anita',
            lastName:  'Desai',
            email:     'anita.desai@clinic.com',
            isActive:  true,
            permissions: {
              registerPatient:    true,
              bookAppointment:    true,
              cancelAppointment:  true,
              viewMedicalHistory: false,
              manageSchedule:     true,
              viewBilling:        false,
            },
          },
        },
      },
    });
    console.log('✅ Receptionist created  →  phone: 9555000001 / rec123');
  } else if (!existingRecUser.receptionist) {
    console.log('⚠️  Receptionist User found but Receptionist profile is missing — repairing…');
    await prisma.receptionist.create({
      data: {
        userId:    existingRecUser.id,
        firstName: 'Anita',
        lastName:  'Desai',
        email:     'anita.desai@clinic.com',
        isActive:  true,
        permissions: {
          registerPatient:    true,
          bookAppointment:    true,
          cancelAppointment:  true,
          viewMedicalHistory: false,
          manageSchedule:     true,
          viewBilling:        false,
        },
      },
    });
    console.log('✅ Receptionist profile repaired for existing User');
  } else {
    console.log('ℹ️  Receptionist already exists');
  }

  // ── Medicines ────────────────────────────────────────────────────────────
  const medCount = await prisma.medicine.count();
  if (medCount === 0) {
    await prisma.medicine.createMany({
      data: [
        { name:'Paracetamol',  genericName:'Acetaminophen',  manufacturer:'PharmaCorp', category:'Analgesic',         dosageForm:'Tablet',  strength:'500mg', price:5,  stockQuantity:1000 },
        { name:'Amoxicillin',  genericName:'Amoxicillin',    manufacturer:'MediLabs',   category:'Antibiotic',        dosageForm:'Capsule', strength:'250mg', price:15, stockQuantity:500  },
        { name:'Ibuprofen',    genericName:'Ibuprofen',      manufacturer:'HealthPlus', category:'Anti-inflammatory', dosageForm:'Tablet',  strength:'400mg', price:8,  stockQuantity:800  },
        { name:'Cetirizine',   genericName:'Cetirizine HCl', manufacturer:'AllerCare',  category:'Antihistamine',     dosageForm:'Tablet',  strength:'10mg',  price:6,  stockQuantity:600  },
        { name:'Omeprazole',   genericName:'Omeprazole',     manufacturer:'GastroMed',  category:'Antacid',           dosageForm:'Capsule', strength:'20mg',  price:12, stockQuantity:400  },
      ],
    });
    console.log('✅ Medicines seeded');
  }

  console.log('\n🎉 Seeding complete!');
  console.log('──────────────────────────────────────');
  console.log('Admin        →  9000000000 / admin123');
  console.log('Doctor       →  9876543210 / doctor123');
  console.log('Receptionist →  9555000001 / rec123');
  console.log('Patient      →  9123456789 / patient123');
  console.log('──────────────────────────────────────');
}

main()
  .catch(e => { console.error('❌ Seeding failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
