const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const router = express.Router();
const User = require("../model/userSchema")
const bcrypt = require("bcrypt")



router.get("/getmember", verifyToken, async (req, res) => {
    try {
        const adminId = req.user;

        const members = await User.findById(adminId)
            .populate('teamMembers', 'firstName lastName phone email');

        res.status(200).json(members.teamMembers);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.get("/getmember/:memberId", verifyToken, async (req, res) => {
    try {
        const adminId = req.user;
        const { memberId } = req.params;

        // Ensure that member belongs to admin
        const admin = await User.findOne({
            _id: adminId,
            teamMembers: memberId
        });

        if (!admin) {
            return res.status(404).json({ message: "Member not found in your team" });
        }

        const member = await User.findById(memberId)
            .select("firstName lastName phone email");

        res.status(200).json(member);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});


router.put("/updatemember/:memberId", verifyToken, async (req, res) => {
    try {
        const adminId = req.user;
        const { memberId } = req.params;
        const data = req.body;

        // Check if member belongs to admin
        const admin = await User.findOne({
            _id: adminId,
            teamMembers: memberId
        });

        if (!admin) {
            return res.status(404).json({ message: "Member not found in your team" });
        }

        const updated = await User.findByIdAndUpdate(
            memberId,
            { $set: data },
            { new: true }
        ).select("firstName lastName phone email");

        res.status(200).json(updated);
    }
    catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});


router.delete("/deletemember/:memberId", verifyToken, async (req, res) => {
    try {
        const adminId = req.user;
        const { memberId } = req.params;

        // Remove from admin's teamMembers array
        const admin = await User.findByIdAndUpdate(
            adminId,
            { $pull: { teamMembers: memberId } },
            { new: true }
        );

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.status(200).json({ message: "Member removed from team" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});


// POST /team/addMember
router.post("/addMember", verifyToken, async (req, res) => {
  try {
    const adminId = req.user; // token gives admin id
    const { username, email, phone, role } = req.body;

    // simple required validation
    if (!username) return res.status(400).json({ message: "username is required" });
    if (!email) return res.status(400).json({ message: "email is required" });

    // password = hashed email (your logic)
    const hashedPassword = await bcrypt.hash(email, 10);

    // create user with firstName only
    const member = await User.create({
      firstName: username,   // <-- username saved as firstName
      lastName: "",          // <-- keep lastName empty
      email,
      password: hashedPassword,
      phone,
      role: role || "User",  // only User/Admin allowed
    });

    // push user to admin's teamMembers
    await User.findByIdAndUpdate(adminId, {
      $push: { teamMembers: member._id }
    });

    // send response to frontend
    res.status(201).json({
      id: member._id,
      fullName: member.firstName,   // return what you need
      phone: member.phone,
      email: member.email,
      role: member.role,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add member", error });
  }
});




module.exports = router