const express = require("express")
const mongoose = require('mongoose')
const cors = require('cors')

const userRoutes = require("./routes/userRoutes")

const app = express()

app.use(cors())

app.use(express.json({limit: '30mb',extended: true}));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

app.use("/users", userRoutes)

const PORT = process.env.PORT || 5000;
const MONGOOSE_URL = "mongodb+srv://tejassgg:june2014@cluster0.lsryd.mongodb.net/DILDB?retryWrites=true&w=majority"

mongoose.connect(MONGOOSE_URL, {useNewUrlParser: true})
.then(()=> app.listen(PORT, ()=>{
    console.log(`Server is running at port ${PORT}`);
}))
.catch(err=>{
    console.log(err)
})
