import express from 'express';
import { client } from '../mongodb.mjs';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import { stringToHash, verifyHash, validateHash } from "bcrypt-inzi";
const studentCollection = client.db("attendance-app").collection("students");
let router = express.Router();

router.post('/login', async (req, res, next) => {
    if (!req.body?.email || !req.body?.password) {
        res.status(403).send(`Required parameter missing!
        Example request body:{
            email:"abc@gmail.com",
            password:"********",
        }`);
        return;
    };
    req.body.email = req.body.email.toLowerCase();
    try {
        let result = await studentCollection.findOne({ email: req.body.email });
        if (!result) {
            res.status(401).send({ message: ("Email or Password Incorrect!") })
            return;
        } else {
            const isMatch = await verifyHash(req.body.password, result.password);
            if (isMatch == true) {
                const token = jwt.sign({
                    isAdmin: result.isAdmin,
                    _id: result._id,
                    firstName: result.firstName,
                    lastName: result.lastName,
                    rollNum: result.rollNum,
                    email: req.body.email,
                },
                    process.env.SECRET,{
                        expiresIn: '24h',
                    });

                res.cookie('token', token,
                    {
                        httpOnly: true,
                        secure: true,
                        expires: new Date(Date.now() + 86400000)
                    });
                res.status(200).send({ message: "Login Successful!" ,
                data:{
                    isAdmin: result.isAdmin,
                    _id: result._id,
                    firstName: result.firstName,
                    lastName: result.lastName,
                    email: req.body.email,
            }
        })
               return;
            } else {
                res.status(401).send({ message: ("Email or Password Incorrect!") })
                return;
            }

        }
    }
    catch (e) {
        console.log("Error in Mongodb ", e);
        res.status(500).send("Server Error. Try again later!")
    }
})
router.post('/logout', async (req, res, next) =>{
    res.clearCookie('token');
    res.status(200).send({message: "Logout Successfully!"});
    return;
})
router.post('/signup', async (req, res, next) => {
    if (!req.body?.firstName || !req.body?.lastName || !req.body?.email || !req.body?.password || !req.body?.rollNumber) {
        res.status(403).send(`Required parameter missing
        Example request body:{
            firstName: "First Name",
            lastName: "Last Name",
            rollNumber: 98745,
            email: "abc@gmail.com",
            password: "********",
        }`);
        return;
    };

    req.body.email = req.body.email.toLowerCase();
    req.body.firstName = req.body.firstName.toUpperCase();
    req.body.lastName = req.body.lastName.toUpperCase();

    try {
        let results = await userCollection.findOne({ email: req.body.email });
        console.log("results ", results);
        if (!results) {

            const passwordHash = await stringToHash(req.body.password);
            const insertResponse = await studentCollection.insertOne({
                isAdmin: false,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                rollNum: req.body.rollNum,
                email: req.body.email,
                password: passwordHash,
                createdAt: moment().format('llll'),
            });
            console.log("Insert Response  ", insertResponse);
            res.status(200).send({ message: ('Student added successfully!') });
        } else {
            res.status(403).send({message:("Student already exists with email!")});
        }
    } catch (e) {
        console.log("Error in Mongodb ", e);
        res.status(500).send("Server Error. Try again later!")
    }
})
export default router;