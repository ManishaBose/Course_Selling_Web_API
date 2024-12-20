const { Router } = require("express");
const router = Router();
const userMiddleware = require("../middleware/user");
const { User, Course } = require("../db");
const {z} = require("zod");
const jwt = require("jsonwebtoken");
const {jwt_secret} = require("../config");

const userSignupSchema = z.object({
    username: z.string().email(),
    password: z.string().min(6)
});

function validateSignupInput(obj){
    const response = userSignupSchema.safeParse(obj);
    return response;
}

// User Routes
router.post('/signup', async (req, res) => {
    const validation = validateSignupInput(req.body);

    if(!validation.success){
        return res.status(400).json({
            message:"Invalid inputs"
        })
    }
    const {username, password} = validation.data;

    try{
        const existingUser = await User.findOne({username});
        if(existingUser){
            return res.status(400).json({
                message: "User already exists! Try with a different username"
            })
        } 
        await User.create({
            username, 
            password
        });
        return res.status(201).json({
            message: "User created successfully"
        })
    }
    catch(e){
        console.error(e);
        return res.status(500).json({
            message:"Oops! User could not be created"
        })
    }
});

router.post('/signin', async (req, res) => {
    const username =  req.body.username;
    const password = req.body.password;
    try{
        const user = await User.findOne({
            username, password
        });
        if(!user){
            return res.status(401).json({
                message: "Invalid username or password"
            })
        }
        var token = jwt.sign({username}, jwt_secret);
        return res.status(200).json({
            token
        })
    } catch(e){
        console.error(e);
        res.status(500).json({
            message: "Sorry! Could not sign in."
        })
    }
});

router.get('/courses', async (req, res) => {
    const result = await Course.find({});
    res.status(200).json({
        courses: result
    })
});

router.post('/courses/:courseId', userMiddleware, async (req, res) => {
    const courseId = req.params.courseId;
    const username = req.username;
    console.log(username);
    try{
        //do not purchase the same course twice
        const checkCourse = await User.findOne({
            username,
            purchasedCourses: courseId
        });
        if(checkCourse){
            return res.status(409).json({
                message: "Course already purchased. Happy Learning!"
            })
        }

        await User.updateOne({
            username
        },{
            "$push":{
                purchasedCourses: courseId
            }
        });
        res.status(200).json({
            message: "Course purchased successfully"
        })
    }
    catch(e){
        console.error(e);
        res.status(403).json({
            message:"Error in purchasing course"
        })
    }
});

router.get('/purchasedCourses', userMiddleware, async (req, res) => {
    const username = req.username;
    try{
        const user = await User.findOne({
            username
        })

        console.log(user.purchasedCourses);
        const courses = await Course.find({
            _id:{
                "$in": user.purchasedCourses
            }
        });
        res.status(200).json({
            courses
        })
    }
    catch(e){
        console.error(e);
        res.status(403).json({
            message:"Error! Try again"
        })
    }
});

module.exports = router