import bcrypt from "bcrypt";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";

export const loginUser = async(req,res)=>{
      try {
            const { email , phone ,password } = req.body;

            if((!email&&!phone) || !password){
                  return res.status(400).json({
                         success:false,
                        message:"email/phone/and password required"
                  });
            }

            let user ;

            if(email){
                  user = await User.findOne({email});
            }else{
                  user = await User.findOne({phone});
            }

            if(!user){
                 return res.status(400).json({
                         success:false,
                        message:"user not found"
                  }); 
            }
            
            if(user.isDeleted || !user.isActive){
                  return res.status(400).json({
                         success:false,
                        message:"your account is deactivated"
                  });
            }
            
            if (!user.password) {
                  return res.status(400).json({
                  success: false,
                  message: "Please complete registration first",
                  });
            }
            const isMatch =await bcrypt.compare(password,user.password);

            if(!isMatch){
                  return res.status(400).json({
                         success:false,
                        message:"incorrect password "
                  });
            }
            
            const token = jwt.sign(
                  { 
                         userId:user._id,
                         role:user.role
                  },
                  process.env.JWT_SECRET_KEY,
                  {expiresIn:"7d"}
            );

             res.status(200).json({
                         success:true,
                        message:"login sucessful",
                        token,
                        user:{
                              id:user._id,
                              email:user.email,
                              phone:user.phone,
                              role:user.role
                        },
                  });      
      } catch (error) {
            console.error("login failed",error);
            res.status(500).json({
                   success:false,
                   message:"login failed"
            });
      }
}