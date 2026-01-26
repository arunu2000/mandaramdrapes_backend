// const jwt = require("jsonwebtoken");
// const cookie = require("cookie");

// const socketAdminGuard = (socket, next) => {
//     try {
//         const cookies = socket.request.headers.cookie;
//         if (!cookies) return next(new Error("Unauthenticated"));

//         const token = cookie.parse(cookies).jwt;
//         if (!token) return next(new Error("Token Missing"));

//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
//         // Match your existing adminMiddleware logic
//         if (decoded && decoded.role === "admin") {
//             socket.user = decoded; // Attach user to socket
//             return next();
//         }
        
//         next(new Error("Access Denied. Admin role required."));
//     } catch (err) {
//         next(new Error("Authentication Failed"));
//     }
// };

// module.exports = socketAdminGuard;

const jwt = require("jsonwebtoken");
const cookie = require("cookie");

const socketAuthGuard = (socket, next) => {
    try {
        const cookies = socket.request.headers.cookie;
        if (!cookies) return next(new Error("Unauthenticated"));

        const token = cookie.parse(cookies).jwt;
        if (!token) return next(new Error("Token Missing"));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded) {
            socket.user = decoded; // Attach user (id, email, role) to socket
            return next();
        }
        
        next(new Error("Authentication Failed"));
    } catch (err) {
        next(new Error("Authentication Failed"));
    }
};

module.exports = socketAuthGuard;