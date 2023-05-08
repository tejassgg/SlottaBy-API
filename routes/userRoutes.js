const express = require("express")

const { loginController, registerController } = require("../controllers/userController")
const {saveEventController, getAllEventsController, punchInorOutEventController, deleteEventController} = require("../controllers/eventController")

const router = express.Router()

router.post("/login", loginController)
router.post("/register", registerController)
router.post("/saveEvent",saveEventController)
router.post("/getAllEvents", getAllEventsController)
router.post("/punchInorOutEvent", punchInorOutEventController)
router.post("/deleteEvent", deleteEventController)

module.exports = router;