const express = require('express');
const router = express.Router();
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");
const Doctor = require('../models/doctorModel');
const Appointment = require('../models/appointmentModel')
const moment = require("moment");

router.post('/register', async (req, res) => {
    try {
        const userExists = await User.findOne({ email: req.body.email });
        if (userExists) {
            return res.status(200).send({ message: "User already exists", success: false });
        }
        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        req.body.password = hashedPassword;
        const newuser = new User(req.body);
        await newuser.save();
        res.status(200).send({ message: "User created successfully", success: true });
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Error creating user", success: false, error });
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(200).send({ message: "User does not exist", success: false });
        }
        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) {
            return res.status(200).send({ message: "Password is incorrect", success: false });
        } else {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: "1d"
            })
            res.status(200).send({ message: "Login successful", success: true, data: token });
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Error logging in", success: false, error })
    }
})

router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.userId });
        user.password = undefined;
        if (!user) {
            return res.status(200).send({ message: "User does not exist", success: false });
        } else {
            res.status(200).send({
                success: true,
                data: user,
            })
        }
    } catch (error) {
        res.status(500).send({ message: "Error getting user info", success: false, error });
    }
});

router.post('/apply-doctor-account', authMiddleware, async (req, res) => {
    try {
        const newdoctor = new Doctor({ ...req.body, status: "pending" });
        await newdoctor.save();
        const adminUser = await User.findOne({ isAdmin: true });

        const unseenNotifications = adminUser.unseenNotifications;
        unseenNotifications.push({
            type: "new-doctor-request",
            message: `${newdoctor.firstName} ${newdoctor.lastName} has applied for a doctor account`,
            data: {
                doctorId: newdoctor._id,
                name: newdoctor.firstName + " " + newdoctor.lastName,
            },
            onClickPath: "/admin/doctorslist"
        })
        await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });
        res.status(200).send({
            success: true,
            message: "Doctor account applied successfully",
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Error applying doctor account", success: false, error });
    }
});

router.post('/mark-all-notifications-as-seen', authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.userId });
        const unseenNotifications = user.unseenNotifications;
        const seenNotifications = user.seenNotifications;
        seenNotifications.push(...unseenNotifications);
        user.unseenNotifications = [];
        user.seenNotifications = seenNotifications;
        const updatedUser = await user.save();
        updatedUser.password = undefined;
        res.status(200).send({
            success: true,
            message: "All notifications marked as seen",
            data: updatedUser,
        });
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Error marking notifications as seen", success: false, error });
    }
});

router.post('/delete-all-notifications', authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.userId });
        user.seenNotifications = [];
        user.unseenNotifications = [];
        const updatedUser = await user.save();
        updatedUser.password = undefined;
        res.status(200).send({
            success: true,
            message: "All notifications deleted",
            data: updatedUser,
        });
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Error deleting notifications", success: false, error });
    }
});

router.get("/get-all-approved-doctors", authMiddleware, async (req, res) => {
    try {
        ""
        const doctors = await Doctor.find({ status: "approved" });
        res.status(200).send({
            message: "Doctors fetched successfully",
            success: true,
            data: doctors,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error applying doctor account",
            success: false,
            error,
        });
    }
});

router.post('/book-appointment', authMiddleware, async (req, res) => {
    try {
        req.body.status = "pending";
        const newAppointment = new Appointment(req.body);
        await newAppointment.save();
        const user = await User.findOne({ _id: req.body.doctorInfo.userId });
        user.unseenNotifications.push({
            type: 'new-appointment-request',
            message: `A new appointment request has been made by ${req.body.userInfo.name}`,
            onClickPath: '/doctor/appointments',
        });
        await user.save();
        res.status(200).send({
            message: "Appointment booked successfully",
            success: true,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error booking appointment",
            success: false,
            error,
        })
    }
});

router.post('/check-booking-availability', authMiddleware, async (req, res) => {

    try {
        const date = req.body.date;
        const fTime = req.body.time;
        const tTime=req.body.time;
        const parsedfTime = moment(fTime, 'HH:mm');
        const parsedtTime = moment(tTime, 'HH:mm');
        const fromTime=parsedfTime.subtract(29,'minutes').format('HH:mm');
        const toTime = parsedtTime.add(29, 'minutes').format('HH:mm');
        const doctorId = req.body.doctorId;
        const appointments = await Appointment.find({
            doctorId,
            date,
            time: { $gte: fromTime, $lte: toTime },
        });

        if (appointments.length > 0) {
            res.status(200).send({
                message: "Appointment not available",
                success: false,
            });
        } else {
            res.status(200).send({
                message: "Appointment available",
                success: true,
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error booking appointment",
            success: false,
            error,
        });
    }
});

router.get("/get-appointments-by-user-id", authMiddleware, async (req, res) => {
    try {
        const appointments = await Appointment.find({userId:req.body.userId});
        res.status(200).send({
            message: "Appointments fetched successfully",
            success: true,
            data: appointments,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error fetching appointments",
            success: false,
            error,
        });
    }
});

router.get('/appointment-statistics', authMiddleware, async (req, res) => {
    try {
        const totalAppointments = await Appointment.countDocuments();
        const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
        const acceptedAppointments = await Appointment.countDocuments({ status: 'approved' });
        const rejectedAppointments = await Appointment.countDocuments({ status: 'rejected' });

        const acceptanceRate = totalAppointments !== 0 ? (acceptedAppointments / totalAppointments) * 100 : 0;

        res.status(200).send({
            success: true,
            data: {
                totalAppointments,
                pendingAppointments,
                acceptedAppointments,
                rejectedAppointments,
                acceptanceRate,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            error,
        });
    }
});



module.exports = router;