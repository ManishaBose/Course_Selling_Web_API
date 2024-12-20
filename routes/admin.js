const { Router } = require("express");
const adminMiddleware = require("../middleware/admin");
const router = Router();
const {z} = require("zod");
const jwt = require("jsonwebtoken")
const {Admin, Course} = require("../db/index");
const {jwt_secret} = require("../config");

const adminSignupSchema = z.object({
    username: z.string().email(),
    password: z.string().min(6)
});

const courseSchema = z.object({
    title: z.string(),
    description: z.string(),
    price: z.number(),
    imageLink: z.string()
})

function validateSignupInput(obj){
    const response = adminSignupSchema.safeParse(obj);
    return response;
}

function validateCourseInput(obj){
    const response = courseSchema.safeParse(obj);
    return response;
}

// Admin Routes
router.post('/signup', async (req, res) => {
    //if user exists sending a 400 and msg "admin already exists"
    //add in mongoDB and then send the appropriate message

    const validation = validateSignupInput(req.body);

    if(!validation.success){
        return res.status(400).json({
            message:"Invalid inputs"
        })
    }
    const {username, password} = validation.data;

    try{
        const existingAdmin = await Admin.findOne({username});
        if(existingAdmin){
            return res.status(400).json({
                message: "Admin already exists! Try with a different username"
            })
        } 
        await Admin.create({
            username, 
            password
        });
        return res.status(201).json({
            message: "Admin created successfully"
        })
    }
    catch(e){
        console.error(e);
        return res.status(500).json({
            message:"Oops! Admin could not be created"
        })
    }
});

router.post('/signin', async (req, res) => {
    const username =  req.body.username;
    const password = req.body.password;
    try{
        const admin = await Admin.findOne({
            username, password
        });
        if(!admin){
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

router.post('/courses', adminMiddleware, async (req, res) => {
    const validation = validateCourseInput(req.body);
    if(!validation.success){
        return res.status(400).json({
            message: "Invalid course inputs"
        })
    }

    const {title, description, price, imageLink} = validation.data;
    
    try{
    //now, I shouldn't be allowed to post the same course twice. 
    //If the title of two courses are same, then it should be blocked from being added in the database.
        const checkCourse = await Course.findOne({
            title
        })
        if(checkCourse){
            return res.status(409).json({
                message: "Course already exists. Try adding a different course"
            })
        }
    const newCourse = await Course.create({
        title,
        description,
        price,
        imageLink
    });
    return res.status(201).json({
        message: "Course created successfully",
        courseId: newCourse._id
    })}
    catch(e){
        console.error(e);
        return res.status(500).json({
            message: "Oops! Course couldn't be created."
        })
    }
});

router.get('/courses', adminMiddleware, async (req, res) => {
    const result = await Course.find({});
    res.status(200).json({
        courses: result
    })
});

module.exports = router;