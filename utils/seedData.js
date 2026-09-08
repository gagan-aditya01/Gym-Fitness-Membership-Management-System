const bcrypt = require('bcrypt');
const User = require('../models/User');
const MembershipPlan = require('../models/MembershipPlan');
const TrainerProfile = require('../models/TrainerProfile');
const ClassSession = require('../models/ClassSession');
const Membership = require('../models/Membership');
const Attendance = require('../models/Attendance');
const WorkoutNote = require('../models/WorkoutNote');

async function seedInitialData() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already populated, skipping seed.');
      return;
    }

    console.log('Seeding initial gym demonstration data...');

    const saltRounds = 10;
    const defaultPasswordHash = await bcrypt.hash('password123', saltRounds);

    // 1. Users
    const admin = await User.create({
      name: 'Alex Vance (Admin)',
      email: 'admin@gym.com',
      passwordHash: defaultPasswordHash,
      role: 'admin',
    });

    const trainer1 = await User.create({
      name: 'Marcus Stone (Head Coach)',
      email: 'trainer@gym.com',
      passwordHash: defaultPasswordHash,
      role: 'trainer',
    });

    const trainer2 = await User.create({
      name: 'Elena Rostova (Yoga & Pilates)',
      email: 'elena@gym.com',
      passwordHash: defaultPasswordHash,
      role: 'trainer',
    });

    const member1 = await User.create({
      name: 'Jordan Miller',
      email: 'member@gym.com',
      passwordHash: defaultPasswordHash,
      role: 'member',
    });

    const member2 = await User.create({
      name: 'Sophia Chen',
      email: 'sophia@gym.com',
      passwordHash: defaultPasswordHash,
      role: 'member',
    });

    // 2. Trainer Profiles
    await TrainerProfile.create({
      userId: trainer1._id,
      specialization: 'High-Intensity Strength & Conditioning, Olympic Weightlifting',
      bio: 'Former national athlete with 8+ years coaching champions. Passionate about biomechanics and functional hypertrophy.',
      yearsExperience: 8,
    });

    await TrainerProfile.create({
      userId: trainer2._id,
      specialization: 'Vinyasa Yoga, Functional Mobility, Breathwork',
      bio: 'Certified 500-hour RYT instructor focused on core stability, mindful alignment, and injury recovery.',
      yearsExperience: 5,
    });

    // 3. Membership Plans
    const planBasic = await MembershipPlan.create({
      name: 'Bronze Starter',
      durationMonths: 1,
      price: 39.99,
    });

    const planSilver = await MembershipPlan.create({
      name: 'Silver Active',
      durationMonths: 3,
      price: 99.99,
    });

    const planGold = await MembershipPlan.create({
      name: 'Gold Pro Elite',
      durationMonths: 6,
      price: 189.99,
    });

    const planDiamond = await MembershipPlan.create({
      name: 'Platinum Annual Pass',
      durationMonths: 12,
      price: 349.99,
    });

    // 4. Active Membership for Member 1
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);

    await Membership.create({
      memberId: member1._id,
      planId: planGold._id,
      startDate,
      endDate,
      status: 'active',
    });

    // 5. Classes
    const now = Date.now();
    const class1 = await ClassSession.create({
      trainerId: trainer1._id,
      title: 'Power CrossFit & Kettlebell Blast',
      schedule: new Date(now + 2 * 3600 * 1000), // in 2 hours
      durationMinutes: 60,
      capacity: 15,
      bookedCount: 1,
      status: 'scheduled',
    });

    const class2 = await ClassSession.create({
      trainerId: trainer2._id,
      title: 'Sunrise Flow & Deep Core Mobility',
      schedule: new Date(now + 24 * 3600 * 1000), // tomorrow
      durationMinutes: 45,
      capacity: 12,
      bookedCount: 0,
      status: 'scheduled',
    });

    const class3 = await ClassSession.create({
      trainerId: trainer1._id,
      title: 'HIIT Spartan Circuit',
      schedule: new Date(now + 48 * 3600 * 1000), // in 2 days
      durationMinutes: 50,
      capacity: 20,
      bookedCount: 0,
      status: 'scheduled',
    });

    // 6. Attendance records
    await Attendance.create({
      memberId: member1._id,
      type: 'gym_visit',
      date: new Date(now - 3 * 86400 * 1000),
    });

    await Attendance.create({
      memberId: member1._id,
      type: 'gym_visit',
      date: new Date(now - 1 * 86400 * 1000),
    });

    // 7. Workout Notes
    await WorkoutNote.create({
      memberId: member1._id,
      trainerId: trainer1._id,
      note: 'Superb squat depth today. Increased barbell back squat from 80kg to 90kg with spotless form. Keep up hydration!',
    });

    console.log('✅ Demo gym dataset seeded successfully.');
  } catch (err) {
    console.error('Error seeding data:', err.message);
  }
}

module.exports = { seedInitialData };
