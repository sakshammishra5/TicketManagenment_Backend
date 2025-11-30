const User = require("../model/userSchema");
const jwt = require("jsonwebtoken");
// const bcrypt=require("bcrypt")

module.exports.getProfileDetail = async (req, res) => {
    try {
        return res.status(200).json(req.user)
    }
    catch {

    }
}