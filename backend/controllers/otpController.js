import crypto from 'crypto';
import bcrypt from "bcrypt";
import OTP from "../models/OtpModel.js";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";

export const sendOtp = async(req,res)=>{
      try {
            const {email,phone} = req.body;

            if(!email&&!phone){
                  return res.status(400).json({
                        message:"email or phone required",
                        success:false
                  });
            }
            

            if(email){
                  const existingUser = await User.findOne({email});
                  if(existingUser){
                        return res.status(400).json({
                              message:"Email already registered",
                              success:false
                        });
                  }

            }

            if(phone){
                  const existingUser = await User.findOne({phone});
                  if(existingUser){
                        return res.status(400).json({
                              message:"phone already registred",
                              success:false
                        });
                  }
            }
           
             const otp = crypto.randomInt(100000,999999).toString();

            if(email){
                  await OTP.deleteMany({email});
            }

            if(phone){
                  await OTP.deleteMany({phone});
            }

           const otpData = new OTP({
             email:email || undefined,
             phone :phone|| undefined,
             otp:otp
           });

            console.log(`OTP for ${email || phone} : ${otp}`);
            
            await otpData.save();
      
            res.status(200).json({
                  success:true,
                  message:"OTP sent succesfully"
            });

      } catch (error) {
            console.error("send otp error",error);
            res.status(500).json({
                  success:false,
                  message:"otp not send"
            });
      }
};
/* ================= VERIFY OTP ================= */
export const verifyOtp = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    let otpRecord;

    // 🔥 FIX: Compare as STRING (same as stored)
    if (email) {
      otpRecord = await OTP.findOne({ email, otp });
    } else if (phone) {
      otpRecord = await OTP.findOne({ phone, otp });
    } else {
      return res.status(400).json({
        success: false,
        message: "Email or phone required",
      });
    }

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check expiry (3 minutes)
    const diffMinutes = (Date.now() - otpRecord.createdAt) / 1000 / 60;

    if (diffMinutes > 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // 🔥 Prevent duplicate user creation
    let user;
    if (email) {
      otpRecord = await OTP.findOne({ email, otp }).sort({ createdAt: -1 });
    } else if (phone) {
      otpRecord = await OTP.findOne({ phone, otp }).sort({ createdAt: -1 });
    }

    if (!user) {
      user = await User.create({
        email: email || undefined,
        phone: phone || undefined,
        isVerified: true,
      });
    }
    
    const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
      );

    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json({
      success: true,
      message: "OTP verified",
      userId: user._id,
      token
    });

  } catch (error) {
    console.error("Verify OTP Error:", error); // 🔥 IMPORTANT
    res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
};

export const completeRegistration = async (req,res)=>{
      try {
            const { 
                  password ,
                  confirmPassword , 
                  firstName ,
                  lastName,
                  gender ,
                  address
            } = req.body;
            
            const userId = req.userId;
            
            let user = await User.findById(userId);

            if(!user){
                  return res.status(400).json({
                        success:false,
                        message:"verify otp first"
                  });
            }

            if(!password||!confirmPassword||!firstName||!lastName||!gender||!address){
                  return res.status(400).json({
                        success:false,
                        message:"All fields are required"
                  });
            }
            if(password!==confirmPassword){
                  return res.status(400).json({
                        success:false,
                        message:"Passwords do not match"
                  });
            }
            
            if(password.length < 6){
                  return res.status(400).json({
                        success:false,
                        message:"Password must be at least 6 characters long"
                  });
            }
            
            const hashedPassword = await bcrypt.hash(password,Number(process.env.HASH_KEY));
           
            user = await User.findByIdAndUpdate(userId,
                  {
                        password:hashedPassword,
                        firstName,
                        lastName,
                        gender,
                        address        
                  },
                  {
                        new:true
                  }
            );
            
            res.status(200).json({
                  success:true,
                  message:"Registration completed succesfully",
                  user
            });
            
      } catch (error) {
            res.status(500).json({
                  success:false,
                  message:"Registration failed",
                  
            });
      }
}