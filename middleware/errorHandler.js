function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    let status = err.status || 500;
    let message = err.message || "Internal server error.";

    if (err.type === "entity.parse.failed") {
        status = 400;
        message = "Invalid JSON request body.";
    }

    if (status >= 500) {
        console.error(err);
        message = "Something went wrong on the server.";
    }

    res.status(status).json({
        error: message
    });
}

module.exports = errorHandler;

