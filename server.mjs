import express from 'express';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import 'dotenv/config'
import authRouter from './routes/auth.mjs'
import attendanceRouter from './routes/attendence.mjs'
import { client } from './mongodb.mjs';

const __dirname = path.resolve();
const app = express();
app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use("/api/v1", authRouter)

app.use("/api/v1" ,(req, res, next) => {
    const token = req.cookies.token;
    try{
        const decoded = jwt.verify(token, process.env.SECRET);
        console.log("decoded: ", decoded);
            req.body.decoded = {
                _id: decoded._id,
                isAdmin: decoded.isAdmin,
                firstName: decoded.firstName,
                lastName: decoded.lastName,
                email: decoded.email,
                rollNum: decoded.rollNum,
            }
    next();
}
        catch(e){
            res.status(401).send({ message: "Invalid token" })
        }
    })
    
    
    app.use("/api/v1", attendanceRouter);

app.use('/', express.static(path.join(__dirname, './web/build')))
app.get('*', (req, res, next)=>{
    res.sendFile(path.join(__dirname, './web/build/index.html'))
})

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Example server listening on port ${PORT}`)
})