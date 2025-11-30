const mongoose =require("mongoose")
const { Schema } = mongoose;


const clientSchema = Schema(
    {

        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true },
        // Which admin/workspace this client belongs to
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    },
    { timestamps: true }

)

module.exports = mongoose.model("Client", clientSchema)