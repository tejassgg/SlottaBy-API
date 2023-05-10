const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const config = require("config");
const mongoose = require("mongoose");

const User = require("../models/user");
const Event = require("../models/events");

const loginController = async (req, res) => {
  const { email, password } = req.body;
  try {
    var ExistingUser = await User.findOne({ email: email });

    if (!ExistingUser) {
      ExistingUser = await User.findOne({ userName: email });
      if (!ExistingUser)
        return res
          .status(200)
          .json({ message: "User doesn't exist..!!", success: false });
    }

    if (!ExistingUser.isApproved) {
      return res
        .status(200)
        .json({
          message:
            "Account not approved from admin. Please contact system administartor. ",
          success: false,
        });
    }

    const isPasswordOk = await bcrypt.compare(password, ExistingUser.password);

    if (!isPasswordOk)
      return res
        .status(200)
        .json({ message: "Invalid credintials..!!", success: false });

    const token = jwt.sign(
      {
        userName: ExistingUser.userName,
        email: ExistingUser.email,
        id: ExistingUser._id,
      },
      "Slottaby1234",
      { expiresIn: "2h" }
    );

    var data = {
      email: ExistingUser.email,
      firstName: ExistingUser.firstName,
      lastName: ExistingUser.lastName,
      profileColor: ExistingUser.profileColor,
      profilePicture: ExistingUser.profilePicture,
      userName: ExistingUser.userName,
      role: ExistingUser.role,
      isApproved: ExistingUser.isApproved,
    };

    res.status(200).json({
      result: data,
      token,
      message: "Login Successfull..!!",
      success: true,
    });
  } catch (err) {
    res.status(200).json({ message: "Something went wrong!", success: false });
  }
};

const registerController = async (req, res) => {
  // normal form signup
  const {
    email,
    password,
    confirmPassword,
    firstName,
    lastName,
    profilePicture,
    profileColor,
    userName,
  } = req.body;

  try {
    var validationMessage = "";
    if (password === "") {
      validationMessage += " " + "Please Enter Password.";
    }
    if (confirmPassword === "") {
      validationMessage += " " + "Please Enter Confirm Password.";
    }
    if (password !== confirmPassword) {
      validationMessage += " " + "Passwords dosen't match.";
    }
    if (email === "") {
      validationMessage += " " + "Please Enter Email.";
    }
    if (userName === "") {
      validationMessage += " " + "Please Enter Username.";
    }
    if (profilePicture.length < 100) {
      validationMessage += " " + "Please Upload Profile Picture.";
    }
    if (profileColor.length < 3) {
      validationMessage += " " + "Please Select Profile Color.";
    }

    if (validationMessage !== "") {
      return res
        .status(200)
        .json({ message: validationMessage, success: false });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(200).json({
        message: "Email already in use. Please enter unique email..!!",
        success: false,
      });
    } else {
      const UexistingUser = await User.findOne({ userName });
      if (UexistingUser)
        return res.status(200).json({
          message: "UserName already in use. Please enter unique username..!!",
          success: false,
        });
      else {
        const LexistingUser = await User.findOne({
          profileColor: profileColor,
        });
        if (UexistingUser)
          return res.status(200).json({
            message:
              "Profile Color (" +
              profileColor +
              ") already in use. Please choose another profileColor.",
            success: false,
          });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      profilePicture,
      profileColor,
      userName,
      role: "user",
      isApproved: false,
    });

    if (result !== null) {
      const userData = {
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        userName: result.userName,
        profilePicture: result.profilePicture,
        profileColor: result.profileColor,
        role: result.role,
        isApproved: result.isApproved,
      };
      const token = jwt.sign(
        {
          userName: result.userName,
          email: result.email,
          id: result._id,
        },
        config.get("JWT_SECRET"),
        { expiresIn: "1h" }
      );

      res.status(200).json({ userData, token, success: true });
    }
  } catch (err) {
    res
      .status(200)
      .json({ message: "Something went wrong! + " + err, success: false });
  }
};

const getAdminDataController = async (req, res) => {
  try {
    const usersResult = [];
    const eventsResult = [];

    const userDataList = await User.find({}).sort({ role: 1 });
    const eventDataList = await Event.find({});
    
    userDataList.forEach((result) => {
      const userData = {
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        userName: result.userName,
        profilePicture: result.profilePicture,
        profileColor: result.profileColor,
        role: result.role,
        isApproved: result.isApproved,
        _id:result._id
      };
      usersResult.push(userData);
    });

    eventDataList.forEach((ele) => {
      const eventData = {
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
        machineryID: ele.machineryID,
        slotDay: ele.slotDay,
        _id: ele._id,
      };
      eventsResult.push(eventData);
    });

    return res
      .status(200)
      .json({
        message: "Data Fetched Sucessfully..!!",
        usersResult: usersResult,
        eventsResult: eventsResult,
        success: true,
      });
  } catch (error) {
    return res
      .status(200)
      .json({ message: "Something Went Wrong..!! + " + error, success: false });
  }
};

const submitApprovalController = async (req, res) => {
  const { _id } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id))
      return res
        .status(200)
        .json({ message: "No event with this ID.", success: false });

  const resultIN = await User.updateOne(
    { _id: _id },
    { $set: { isApproved: true } }
  );

  if (resultIN.modifiedCount >= 1)
    return res
      .status(200)
      .json({ message: "User Approved Successfully..!", success: true });
};

module.exports = {
  loginController,
  registerController,
  getAdminDataController,
  submitApprovalController,
};
