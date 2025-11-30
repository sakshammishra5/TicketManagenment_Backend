const mongoose = require("mongoose")
const { Schema } = mongoose;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phone:{
        type:String,
    },
    role: {
        type: String,
        default: "User",
        enum: ["User", "Admin"]
    },
    teamMembers: [
        { type: Schema.Types.ObjectId,
            ref:"User"
        }
    ]
})

module.exports = mongoose.model("User", userSchema);
