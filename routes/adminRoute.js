const express = require('express');
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const Doctor = require('../models/doctorModel');
const User = require("../models/userModel");

router.get("/get-all-doctors",authMiddleware,async(req,res)=>{
    try{
        const doctors=await Doctor.find({});
        res.status(200).send({
            message:"Doctors fetched successfully",
            success:true,
            data:doctors,
        });
    }catch(error){
        console.log(error);
        res.status(500).send({
            message:"Error applying doctor account",
            success:false,
            error,
        });
    }
});

router.get('/get-all-users',authMiddleware,async(req,res)=>{
    try{
        const users = await User.find({});
        res.status(200).send({
            message:"Users fetched successfully",
            success:true,
            data:users,
        });
    }catch(error){
        console.log(error);
        res.status(500).send({
            message:"Error applying doctor account",
            success:false,
            error,
        })
    }
});

router.post('/change-doctor-account-status',authMiddleware,async(req,res)=>{
    try{
        const {doctorId,status,userId}=req.body;
        const doctor=await Doctor.findByIdAndUpdate(doctorId,{
            status,
        });

        const user=await User.findOne({_id:doctor.userId});
        const unseenNotifications =user.unseenNotifications;
        unseenNotifications.push({
            type:"doctor-request-changed",
            message: `Your Doctor account has been ${status}`,
            onClickPath :"/notifications",
        });
        user.isDoctor=status==='approved'?true:false;
        user.isApplyDoctor=status==='approved'?false:true;
        await user.save();

        res.status(200).send({
            message:"Doctor status updated successfully",
            success:true,
            data:doctor,
        });
    }catch(error){
        console.log(error);
        res.status(500).send({
            message:"Error updating doctor account",
            success:false,
            error,
        })
    }
});

router.get('/user-statistics', authMiddleware, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        res.status(200).send({
            success: true,
            data: {
                totalUsers,
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

router.get('/doctor-statistics', authMiddleware, async (req, res) => {
    try {
        const totalDoctors = await Doctor.countDocuments();
        const acceptedDoctors = await Doctor.countDocuments({ status: 'approved' });
        const pendingDoctors = await Doctor.countDocuments({ status: 'pending' });
        const rejectedDoctors = await Doctor.countDocuments({ status: 'rejected' });

        const acceptanceRate = totalDoctors !== 0 ? (acceptedDoctors / totalDoctors) * 100 : 0;

        res.status(200).send({
            success: true,
            data: {
                totalDoctors,
                acceptedDoctors,
                pendingDoctors,
                acceptanceRate,
                rejectedDoctors,
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