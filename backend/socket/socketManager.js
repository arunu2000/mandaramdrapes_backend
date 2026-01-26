// const socketAdminGuard = require("../middleware/socketMiddleware");

// const initSocket = (io) => {
//     // Apply security middleware
//     io.use(socketAdminGuard);

//     io.on("connection", (socket) => {
//         console.log(`Admin Connected: ${socket.user.email}`);
        
//         // Join the secure admin room
//         socket.join("admin-room");

//         socket.on("disconnect", () => {
//             console.log("Admin disconnected");
//         });
//     });
// };

// module.exports = initSocket;

const socketAuthGuard = require("../middleware/socketMiddleware");

const initSocket = (io) => {
    // Apply the authentication middleware to all connections
    io.use(socketAuthGuard);

    io.on("connection", (socket) => {
        const { id, email, role } = socket.user;
        console.log(`Connected: ${email} | Role: ${role}`);

        // 1. Logic for ADMINS
        if (role === "admin") {
            socket.join("admin-room");
            console.log(`Admin ${email} joined secure admin-room`);
        } 
        
        // 2. Logic for EVERYONE (including Customers)
        // Every user joins a room named after their unique User ID
        // This is where their specific "Bell Icon" notifications are sent
        socket.join(id.toString());
        console.log(`User ${id} joined their private notification room`);

        socket.on("disconnect", () => {
            console.log(`User ${email} disconnected`);
        });
    });
};

module.exports = initSocket;