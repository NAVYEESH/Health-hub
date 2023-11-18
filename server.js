const express = require("express");
const app = express();
require('dotenv').config()
const dbConfig = require("./config/dbConfig");
app.use(express.json());
const userRoute=require("./routes/userRoute");
const adminRoute=require("./routes/adminRoute");
const doctorRoute=require("./routes/doctorRoute");
app.use('/api/user',userRoute);
app.use('/api/admin',adminRoute);
app.use('/api/doctor',doctorRoute);
const port =process.env.PORT || 5000
const path=require("path")
app.use(express.static(path.join(__dirname, './client/build')));
app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, './client/build', 'index.html'));
  });
app.listen(port, () => console.log(`Node server started at port ${port}`));
