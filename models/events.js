const mongoose = require("mongoose")

const eventSchema = mongoose.Schema({
    id: {type: String, required: false},
    userName:{type: String, required: true},
    machineryID: {type: Number, required: true},
    slotStartTime: {type: String, required: true},
    slotEndTime: {type: String, required: true},
    description: {type: String, required: true},
    label: {type: String, required: true},
    punchInTime: {type: String, required: false},
    punchOutTime: {type: String, required: false},
    slotDay: {type: String, required: true},
    createdDate: {type: String, required: false},
})

module.exports = mongoose.model("Event", eventSchema)