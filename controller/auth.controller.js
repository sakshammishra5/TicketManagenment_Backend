const User = require("../model/userSchema")
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")


module.exports.registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        let ifexist = await User.findOne({ firstName })
        if (ifexist !== null) {
            return res.status(409).json({ message: "Username already present!" })
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ firstName, lastName, password: hashedPassword, email });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        // console.log(error)
        res.status(500).json({ error: 'Registration failed' });
    }
}


// User login
module.exports.loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ firstName:username });
        if (!user) {
            return res.status(401).json({ error: 'Authentication failed' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Authentication failed' });
        }
        console.log(process.env.JWT_secret)
        const token = jwt.sign({ userId: user._id }, process.env.JWT_Secret, {
            expiresIn: '1h',
        });
        console.log(token)
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
}
