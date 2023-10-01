const express = require("express");
const path  = require('path');
const app = express();
const port = 3000;
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

mongoose.connect("mongodb://localhost:27017",{
    dbName:"backend",
})
    .then(() => console.log("datbase connected"))
    .catch((e) => console.log(e));

const userSchema = new mongoose.Schema({ // defining structure of db
    name: String,
    email: String,
    password: String,
});
const User = mongoose.model("User", userSchema); // important for mongo db to send data to db

//built in middleware used to import file from another folder

const staticPath = path.join(__dirname, "../public");
app.use(express.urlencoded({extended: true})); // for submitting the form neccessary
app.use(cookieParser());
// const templatePath = path.join(__dirname, "../templates")
//to set the view engine
app.set("view engine", "ejs"); //exact same if to use hbs
// app.set('views', templatePath);

//template engine route

const isAuthenticated = async (req,res,next) =>{
    const {token} = req.cookies;
    if(token){
        const decoded=jwt.verify(token,"trial");//same token name to pass when we create token name in login page
        console.log(decoded);
        req.user = await User.findById(decoded._id);
        next();
        // res.render("logout");
    }
    else{
        res.redirect("/login");
    }
};

app.get("/",isAuthenticated, (req,res)=>{
    res.render("logout");
    // res.render("login"); // name of source file and views folder should be keep inside the same folder where the source file is there 
});
app.get("/success", (req,res)=>{
    res.render("success"); 
});
app.get("/register", (req,res)=>{
    res.render("register"); 
});
app.get("/login", (req,res)=>{
    res.render("login"); 
});
// app.get("/add", async (req,res)=>{ we are oushing this dumy data from ourself but now we will push through contact form
//     await Messge.create({name:"Raj",email:"raj2003mk@gmail.com"});
//         res.send("nice");
// });

app.use(express.static(staticPath));

// app.post("/contact", async (req,res) =>{ // command to send data to mongo db
//     const {name, email} = req.body;
//     await Messge.create({name:name ,email:email})
//     res.redirect("/success");
// });

app.post("/register", async (req,res) =>{
    const {name, email, password} = req.body;
    let user = await User.findOne({email}); // condition if email does not found in database then he have to regsiter first
    if(user){
        return res.redirect("/login"); // code if user does not exist then he have to register first
    }
    const hashedpassword = await bcrypt.hash(password,10); // installed bcrypt package to use hashed so that we can protect the password
    user = await User.create({
        name:name ,
        email:email, 
        password:hashedpassword,
        });
    const token = jwt.sign({id:user._id},"trial"); // finding original id of use rwho login thorugh cookie using jwt
    res.cookie("token", token, {
        httpOnly:true,expires:new Date(Date.now()+ 60 * 1000),
    });
    res.redirect("/");
});

app.post("/login", async (req,res) =>{
    const {email,password}= req.body;
    let user  = await User.findOne({email});
    if(!user) return res.render("/register");
    // const isMatch = user.password === password; //checkig for password if same or not
    const isMatch = await bcrypt.compare(password, user.password); // we used this because hashed password is dfferent so we want to compare the password 
    if(!isMatch) return (res.render("login",{email,message:"Incorrect Password"}));
    const token = jwt.sign({id:user._id},"trial"); // finding original id of use rwho login thorugh cookie using jwt
    res.cookie("token", token, {
        httpOnly:true,expires:new Date(Date.now()+ 60 * 1000),
    });
    res.redirect("/");
});

app.get("/logout", (req,res) =>{
    res.cookie("token", null, {
        httpOnly:true,
        expires:new Date(Date.now()),
    });
    res.redirect("/");
});

// app.get("/temp", (req,res) =>{
//     res.send({
//         id:1,
//         name:"Tanay",
//     });
// });
// app.get("/users", (req,res)=>{
//     res.json({
//         users,
//     });
// });

app.listen(port, ()=>{
    console.log("Listening to port number 3000");
});