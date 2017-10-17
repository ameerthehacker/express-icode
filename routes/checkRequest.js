module.exports = checkRequest = (err, object, res) => {
    // There was an internal server error
    if(err) {
        res.sendStatus(500);
        return true;
    }
    // If the challenge was not found
    if(!object) {
        res.sendStatus(404);
        return true;
    }
    return false;
}