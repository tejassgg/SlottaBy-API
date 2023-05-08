const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const config = require("config");
const User = require("../models/user");
const Event = require("../models/events");
const timingData = require("../../client/src/api/masterTimingData.json");
const machineMasterData = require("../../client/src/api/masterMachineryData.json");
const { application } = require("express");
const dayjs = require("dayjs");
const mongoose = require("mongoose");

const saveEventController = async (req, res) => {
  const {
    id,
    userName,
    slotStartTime,
    slotEndTime,
    description,
    day,
    label,
    createdDate,
    machineryID,
    slotDay,
  } = req.body;

  const calendarEvent = {
    id: id,
    userName: userName,
    slotStartTime: slotStartTime,
    slotEndTime: slotEndTime,
    description: description,
    day: day,
    slotDay: slotDay,
    label: label,
    createdDate: createdDate,
    machineryID: machineryID,
  };

  try {
    var IsExistingEvent = await Event.findOne({ id: calendarEvent.id });

    if (!IsExistingEvent) {
      var valMessage = "";

      for (let i = 0; i < calendarEvent.machineryID.length; i++) {
        var dayWiseData = await Event.find({ slotDay: calendarEvent.slotDay });
        var SlotBy = "";
        if (dayWiseData != null && dayWiseData.length > 0) {
          dayWiseData.forEach((day) => {
            if (day.machineryID === calendarEvent.machineryID[i].value) {
              if (calendarEvent.slotStartTime <= day.slotEndTime) {
                if (day.userName === calendarEvent.userName) SlotBy = "Me";
                else SlotBy = day.userName;

                valMessage +=
                  " Slot has been already booked by " +
                  SlotBy +
                  " for " +
                  calendarEvent.machineryID[i].label +
                  " from " +
                  timingData.find((a) => a.value == day.slotStartTime).label +
                  " to " +
                  timingData.find((a) => a.value == day.slotEndTime).label +
                  ". Please select another time period. (Consider 30 mins as buffer time for next slot booking).";
              }
            }
          });
        }

        if (
          valMessage == "" ||
          valMessage.indexOf("Slot Created Successfully") > -1
        ) {
          const eventData = {
            id: calendarEvent.id,
            userName: calendarEvent.userName,
            machineryID: calendarEvent.machineryID[i].value,
            slotStartTime: calendarEvent.slotStartTime,
            slotEndTime: calendarEvent.slotEndTime,
            description: calendarEvent.description,
            day: calendarEvent.day,
            label: calendarEvent.label,
            punchInTime: "",
            punchOutTime: "",
            slotDay: dayjs(calendarEvent.slotDay).format("MM-DD-YYYY"),
            createdDate: dayjs(calendarEvent.createdDate).format("MM-DD-YYYY"),
          };

          const result = await Event.create(eventData);

          var startTime = timingData.find(
            (a) => a.value == calendarEvent.slotStartTime
          ).label;
          var endTime = timingData.find(
            (a) => a.value == calendarEvent.slotEndTime
          ).label;

          var arrayOp = []
          if (result._id != 0) {
            arrayOp.push(result);
            if (calendarEvent.machineryID.length == 1)
              valMessage =
                "Slot Created Successfully for " +
                calendarEvent.machineryID[i].label +
                " from " +
                startTime +
                " to " +
                endTime +
                " for the date " +
                dayjs(calendarEvent.slotDay).format("DD-MM-YYYY");
            else {
              valMessage +=
                " Slot Created Successfully for " +
                calendarEvent.machineryID[i].label +
                " from " +
                startTime +
                " to " +
                endTime +
                " for the date " +
                dayjs(calendarEvent.slotDay).format("DD-MM-YYYY");
            }
          } else {
            valMessage = "";
          }
        }
      }

      if (valMessage != "") {
        res.status(200).json({
          result: arrayOp,
          message: valMessage,
          success: true,
        });
      } else {
        res.status(200).json({ message: valMessage, success: false });
      }
    }
  } catch (err) {
    res
      .status(200)
      .json({ message: "Something went wrong! + " + err, success: false });
  }
};

const getAllEventsController = async (req, res) => {
  try {
    var result = await Event.find({});

    var Resu = [];
    if (result != null && result.length > 0) {
      result.forEach((ele) => {
        var resuObj = {
          id: ele.id,
          userName: ele.userName,
          slotStartTime: ele.slotStartTime,
          slotEndTime: ele.slotEndTime,
          description: ele.description,
          day: ele.day,
          label: ele.label,
          punchInTime: ele.punchInTime,
          punchOutTime: ele.punchOutTime,
          createdDate: ele.createdDate,
          machineryIDData: ele.machineryID,
          machineryID: [],
          slotDay: ele.slotDay,
          _id: ele._id,
        };
        Resu.push(resuObj);
      });

      Resu.forEach((ele) => {
        var machineName = machineMasterData.find(
          (a) => a.value == ele.machineryIDData
        ).label;
        var DataObj = { label: machineName, value: ele.machineryIDData };
        ele.machineryID.push(DataObj);
      });
    }

    res.status(200).json({
      result: Resu,
      message: "Data Fetched Successfully..!!",
      success: true,
    });
  } catch (error) {
    res
      .status(200)
      .json({ message: "Something went wrong! + " + error, success: false });
  }
};

const deleteEventController = async (req, res) => {
  try {
    const { evt } = req.body;

    if (!mongoose.Types.ObjectId.isValid(evt._id))
      return res.status(404).send("No post with this id");

    var result = await Event.findByIdAndRemove(evt._id);
    return res.status(200).json({ message: "Slot Deleted Succesfully", success: true });
  } catch (error) {
    return res.status(200).json({
      message: "Something Went Wrong While Updating..!!" + error,
      success: false,
    });
  }
};

const punchInorOutEventController = async (req, res) => {
  try {
    const { selectedEvent, PunchType } = req.body;

    if (!mongoose.Types.ObjectId.isValid(selectedEvent._id))
      return res
        .status(200)
        .json({ message: "No event with this ID.", success: false });

    var currentdate = new Date();

    var datetime =
      currentdate.getDate() +
      "/" +
      (currentdate.getMonth() + 1) +
      "/" +
      currentdate.getFullYear() +
      " @ " +
      currentdate.getHours() +
      ":" +
      currentdate.getMinutes() +
      ":" +
      currentdate.getSeconds();

    var resultMsg = "";
    switch (PunchType) {
      case "IN":
        const resultIN = await Event.updateOne(
          { _id: selectedEvent._id },
          { $set: { punchInTime: datetime } }
        );
        if (resultIN.modifiedCount >= 1) resultMsg = "Punched In @" + datetime;
        break;
      case "OUT":
        const resultOut = await Event.updateOne(
          { _id: selectedEvent._id },
          { $set: { punchOutTime: datetime } }
        );
        if (resultOut.modifiedCount >= 1)
          resultMsg = "Punched Out @" + datetime;
        break;
    }
    if (resultMsg === "")
      return res.status(200).json({
        message: "Something Went Wrong While Updating..!!",
        success: false,
      });
    else res.status(200).json({ message: resultMsg, success: true });
  } catch (error) {
    return res.status(200).json({
      message: "Something Went Wrong While Updating..!!",
      success: false,
    });
  }
};

module.exports = {
  saveEventController,
  getAllEventsController,
  deleteEventController,
  punchInorOutEventController,
  deleteEventController,
};
