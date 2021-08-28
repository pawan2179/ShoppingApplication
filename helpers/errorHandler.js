function errorHandler(err, req, res, next) {

    //jwt authentication error
    if(err.name === 'UnauthorizedError') {
        return res.status(401).json({message: 'User not authorized'})
    }
    //validation error
    if(err.name == 'ValidationError') {
        return res.status(401).json({message: err.name})
    }
    //default to server error
    return res.status(500).json({message: err})
}

module.exports = errorHandler;