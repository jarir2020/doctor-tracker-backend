/** Doctor Tracker: Aggregates record totals, six-month trends, and patients per doctor. */
import { Router } from "express";
import { Doctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();
router.use(requireAdmin);

function sixMonthBuckets(now) {
  // Build UTC month keys first so months with no records still appear as zeroes.
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
    const month = date.toISOString().slice(0, 7);
    return {
      month,
      label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(date),
      doctors: 0,
      patients: 0,
    };
  });
}

// Produce a single summary payload for dashboard cards and charts.
router.get("/summary", async (req, res) => {
  const now = new Date();
  const months = sixMonthBuckets(now);
  const start = new Date(`${months[0].month}-01T00:00:00.000Z`);

  // Run independent counts and aggregations together to reduce dashboard latency.
  const [doctorTotal, patientTotal, doctorTrend, patientTrend, patientsPerDoctor] = await Promise.all([
    Doctor.countDocuments(),
    Patient.countDocuments(),
    Doctor.aggregate([
      { $match: { createdAt: { $gte: start, $lte: now } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Patient.aggregate([
      { $match: { createdAt: { $gte: start, $lte: now } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Doctor.aggregate([
      {
        $lookup: {
          from: Patient.collection.name,
          let: { doctorId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$doctor", "$$doctorId"] } } },
            { $count: "value" },
          ],
          as: "patientStats",
        },
      },
      { $addFields: { patientCount: { $ifNull: [{ $arrayElemAt: ["$patientStats.value", 0] }, 0] } } },
      { $project: { name: 1, specialization: 1, patientCount: 1 } },
      { $sort: { patientCount: -1, name: 1 } },
      { $limit: 8 },
    ]),
  ]);

  const byMonth = new Map(months.map((item) => [item.month, item]));
  for (const item of doctorTrend) {
    const bucket = byMonth.get(item._id);
    if (bucket) bucket.doctors = item.count;
  }
  for (const item of patientTrend) {
    const bucket = byMonth.get(item._id);
    if (bucket) bucket.patients = item.count;
  }

  res.json({
    success: true,
    data: {
      totals: { doctors: doctorTotal, patients: patientTotal },
      monthlyActivity: months,
      patientsPerDoctor: patientsPerDoctor.map((item) => ({
        doctorId: item._id.toString(),
        name: item.name,
        specialization: item.specialization,
        patients: item.patientCount,
      })),
    },
  });
});

export default router;
