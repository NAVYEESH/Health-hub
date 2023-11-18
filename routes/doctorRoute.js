const express = require('express');
const router = express.Router();
const Doctor = require('../models/doctorModel');
const authMiddleware = require("../middlewares/authMiddleware");
const Appointment=require("../models/appointmentModel");
const User=require("../models/userModel");
router.post("/get-doctor-info-by-user-id", authMiddleware, async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.body.userId });
        return res.status(200).send({
            success: true,
            message: "Doctor info feteched successfully",
            data: doctor,
        });
    } catch (error) {
        res
            .status(500)
            .send({ message: "Error getting doctor info", success: false, error });
    }
});

router.post("/get-doctor-info-by-id", authMiddleware, async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ _id: req.body.doctorId });
        return res.status(200).send({
            success: true,
            message: "Doctor info feteched successfully",
            data: doctor,
        });
    } catch (error) {
        res
            .status(500)
            .send({ message: "Error getting doctor info", success: false, error });
    }
});

router.post("/update-doctor-profile", authMiddleware, async (req, res) => {
    try {
        const doctor = await Doctor.findOneAndUpdate(
            {userId:req.body.userId},req.body
        )
        return res.status(200).send({
            success: true,
            message: "Doctor profile updated successfully",
            data: doctor,
        });
    } catch (error) {
        res
            .status(500)
            .send({ message: "Error updating", success: false, error });
    }
});

router.get("/get-appointments-by-doctor-id", authMiddleware, async (req, res) => {
    try {
        const doctor = await Doctor.findOne({userId:req.body.userId})
        const appointments = await Appointment.find({doctorId:doctor._id});
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

router.post('/change-appointment-status',authMiddleware,async(req,res)=>{
    try{
        const {appointmentId,status}=req.body;
        const appointment=await Appointment.findByIdAndUpdate(appointmentId,{
            status,
        });

        const user=await User.findOne({_id:appointment.userId});
        const unseenNotifications =user.unseenNotifications;
        unseenNotifications.push({
            type:"appointment-status-changed",
            message: `Your Appointment account has been ${status}`,
            onClickPath :"/appointments",
        });
        await user.save();

        res.status(200).send({
            message:"Appointment status updated successfully",
            success:true,
        });
    }catch(error){
        console.log(error);
        res.status(500).send({
            message:"Error changing appointment status",
            success:false,
            error,
        })
    }
});

router.get('/appointment-statistics', authMiddleware, async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.body.userId }); // Assuming doctor ID is stored in req.user.id

        const totalAppointments = await Appointment.countDocuments({ doctorId: doctor._id });
        const pendingAppointments = await Appointment.countDocuments({ doctorId: doctor._id, status: 'pending' });
        const acceptedAppointments = await Appointment.countDocuments({ doctorId: doctor._id, status: 'approved' });
        const rejectedAppointments = await Appointment.countDocuments({ doctorId: doctor._id, status: 'rejected' });

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