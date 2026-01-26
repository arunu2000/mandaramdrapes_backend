const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// --- HELPER FUNCTIONS ---

// 1. Calculate growth percentage
const calculatePercentage = (current, previous) => {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
};

// 2. specific stats for a given model (Count & Growth)
const getModelStats = async (Model, matchQuery = {}) => {
    const today = new Date();
    const last30Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
    const prev30Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 60);

    // Run 3 queries in parallel: Total, Current Month, Previous Month
    const [total, currentPeriod, prevPeriod] = await Promise.all([
        Model.countDocuments(matchQuery), // All-time total
        Model.countDocuments({ ...matchQuery, createdAt: { $gte: last30Days } }),
        Model.countDocuments({ ...matchQuery, createdAt: { $gte: prev30Days, $lt: last30Days } })
    ]);

    return {
        total,
        growth: calculatePercentage(currentPeriod, prevPeriod)
    };
};

// 3. Special Revenue Stats (Sum instead of Count)
const getRevenueStats = async () => {
    const today = new Date();
    const last30Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
    const prev30Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 60);

    // Helper to sum revenue for a specific date range
    const aggregateRevenue = async (startDate, endDate) => {
        const result = await Order.aggregate([
            { 
                $match: { 
                    paymentStatus: "Paid",
                    createdAt: { $gte: startDate, $lt: endDate || new Date() }
                } 
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        return result.length ? result[0].total : 0;
    };

    const [totalRevenue, currentRevenue, prevRevenue] = await Promise.all([
        aggregateRevenue(new Date(0)), // All time (from 1970)
        aggregateRevenue(last30Days),
        aggregateRevenue(prev30Days, last30Days)
    ]);

    return {
        total: totalRevenue,
        growth: calculatePercentage(currentRevenue, prevRevenue)
    };
};


// --- MAIN CONTROLLER ---

const getAdminSummary = async (req, res) => {
    try {
        console.log("Fetching Admin Summary...");

        // 1. Fetch Stats Cards with Growth Data
        const [ordersStats, usersStats, productStats, revenueStats] = await Promise.all([
            getModelStats(Order),
            getModelStats(User, { role: "customer" }), // Filter only customers, not admins
            getModelStats(Product),
            getRevenueStats()
        ]);

        // 2. Fetch Sales Chart Data (Last 7 Days by default for cleaner chart)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const salesChart = await Order.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }, paymentStatus: "Paid" } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Fetch Latest Orders Table
        const latestOrders = await Order.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .limit(10); // Standard table size

        res.status(200).json({
            summary: {
                revenue: revenueStats, // Returns { total: 50000, growth: 12.5 }
                orders: ordersStats,
                users: usersStats,
                products: productStats
            },
            salesChart,
            latestOrders
        });

    } catch (err) {
        console.error("Dashboard Error:", err);
        res.status(500).json({ message: "Error loading dashboard data" });
    }
};

module.exports = { getAdminSummary };