const Dose = require('../models/Dose');
const Medication = require('../models/Medication');
const mongoose = require('mongoose');

// @desc    Get today's doses for user
// @route   GET /api/doses/today
// @access  Private
exports.getTodayDoses = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const doses = await Dose.find({
      userId: req.user.id,
      scheduledTime: { $gte: today, $lt: tomorrow }
    }).populate('medicationId');

    res.json(doses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get doses for a specific date
// @route   GET /api/doses/date/:date
// @access  Private
exports.getDosesByDate = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const doses = await Dose.find({
      userId: req.user.id,
      scheduledTime: { $gte: date, $lt: nextDay }
    }).populate('medicationId');

    res.json(doses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Scan and mark dose as taken
// @route   POST /api/doses/scan/:id
// @access  Private
exports.scanDose = async (req, res) => {
  try {
    const dose = await Dose.findById(req.params.id).populate('medicationId');

    if (!dose) {
      return res.status(404).json({ error: 'Dose not found' });
    }

    if (dose.userId.toString() !== req.user.id &&
        !req.user.patients.includes(dose.userId.toString())) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    if (dose.takenTime) {
      return res.status(400).json({ error: 'Dose already taken' });
    }

    const now = new Date();
    const scheduledTime = new Date(dose.scheduledTime);
    const hoursLate = (now - scheduledTime) / (1000 * 60 * 60);

    if (hoursLate > 4) {
      dose.status = 'missed';
      await dose.save();
      return res.status(400).json({ error: 'Dose window expired' });
    }

    dose.takenTime = now;
    dose.status = 'taken';
    await dose.save();

    res.json({
      success: true,
      message: 'Dose recorded successfully',
      dose
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get adherence statistics
// @route   GET /api/doses/stats
// @access  Private
exports.getAdherenceStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const doses = await Dose.find({
      userId: req.user.id,
      scheduledTime: { $gte: thirtyDaysAgo }
    });

    const total = doses.length;
    const taken = doses.filter(d => d.status === 'taken').length;
    const missed = doses.filter(d => d.status === 'missed').length;
    const pending = doses.filter(d => d.status === 'pending').length;

    const dailyStats = {};
    doses.forEach(dose => {
      const date = dose.scheduledTime.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { total: 0, taken: 0 };
      }
      dailyStats[date].total++;
      if (dose.status === 'taken') {
        dailyStats[date].taken++;
      }
    });

    const chartData = Object.keys(dailyStats).map(date => ({
      date,
      adherence: (dailyStats[date].taken / dailyStats[date].total) * 100
    }));

    res.json({
      total,
      taken,
      missed,
      pending,
      adherenceRate: total > 0 ? (taken / total) * 100 : 0,
      chartData: chartData.slice(-30)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get detailed adherence statistics with trends
// @route   GET /api/doses/stats/detailed
// @access  Private
exports.getDetailedAdherenceStats = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const doses = await Dose.find({
      userId: req.user.id,
      scheduledTime: { $gte: startDate }
    }).populate('medicationId');

    const total = doses.length;
    const taken = doses.filter(d => d.status === 'taken').length;
    const missed = doses.filter(d => d.status === 'missed').length;
    const skipped = doses.filter(d => d.status === 'skipped').length;
    const pending = doses.filter(d => d.status === 'pending').length;

    const adherenceRate = total > 0 ? (taken / total) * 100 : 0;

    const byMedication = {};
    doses.forEach(dose => {
      const medId = dose.medicationId._id.toString();
      const medName = dose.medicationId.name;
      if (!byMedication[medId]) {
        byMedication[medId] = {
          name: medName,
          total: 0,
          taken: 0,
          missed: 0
        };
      }
      byMedication[medId].total++;
      if (dose.status === 'taken') byMedication[medId].taken++;
      if (dose.status === 'missed') byMedication[medId].missed++;
    });

    const dailyData = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = { date: dateStr, taken: 0, total: 0, adherence: 0 };
    }

    doses.forEach(dose => {
      const dateStr = dose.scheduledTime.toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].total++;
        if (dose.status === 'taken') dailyData[dateStr].taken++;
      }
    });

    const chartData = Object.values(dailyData).map(day => ({
      ...day,
      adherence: day.total > 0 ? (day.taken / day.total) * 100 : 0
    }));

    const weeklyData = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      let weekTotal = 0;
      let weekTaken = 0;

      doses.forEach(dose => {
        const doseDate = new Date(dose.scheduledTime);
        if (doseDate >= weekStart && doseDate <= weekEnd) {
          weekTotal++;
          if (dose.status === 'taken') weekTaken++;
        }
      });

      weeklyData.push({
        week: i + 1,
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0],
        total: weekTotal,
        taken: weekTaken,
        adherence: weekTotal > 0 ? (weekTaken / weekTotal) * 100 : 0
      });
    }

    const medicationStats = Object.values(byMedication).map(med => ({
      ...med,
      rate: med.total > 0 ? (med.taken / med.total) * 100 : 0
    }));

    const bestMedication = [...medicationStats].sort((a, b) => b.rate - a.rate)[0];
    const worstMedication = [...medicationStats].sort((a, b) => a.rate - b.rate)[0];

    function calculateCurrentStreak(doses) {
      let streak = 0;
      const sortedDoses = [...doses].sort((a, b) => b.scheduledTime - a.scheduledTime);
      for (const dose of sortedDoses) {
        if (dose.status === 'taken') {
          streak++;
        } else if (dose.status === 'missed') {
          break;
        }
      }
      return streak;
    }

    function calculateTrend(chartData) {
      if (chartData.length < 2) return 'stable';
      const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
      const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
      const firstAvg = firstHalf.reduce((sum, d) => sum + d.adherence, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, d) => sum + d.adherence, 0) / secondHalf.length;
      const diff = secondAvg - firstAvg;
      if (diff > 5) return 'improving';
      if (diff < -5) return 'declining';
      return 'stable';
    }

    res.json({
      period: `${days} days`,
      overall: {
        total,
        taken,
        missed,
        skipped,
        pending,
        adherenceRate: Math.round(adherenceRate * 10) / 10
      },
      byMedication: medicationStats,
      chartData,
      weeklyData,
      insights: {
        bestMedication,
        worstMedication,
        streak: calculateCurrentStreak(doses),
        trend: calculateTrend(chartData)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};