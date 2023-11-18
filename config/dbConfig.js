const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL);

const connection=mongoose.connection;

connection.on("connected" ,()=>{
    console.log('MongoDB is connection is succesfull');
});

connection.on("error",() => {
    console.log("Error in MongoDB connection");
});

module.exports =mongoose; 