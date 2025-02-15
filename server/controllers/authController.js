import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';  // Import the user model
import transporter from '../config/nodemailer.js';

export const register = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.json({ success: false, message: 'Missing details' });
    }

    try {
        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({ name, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // Fixed maxAge calculation
        });

           // sending welcome email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'welcome to website',
            text:`Welcome to the website, Your account has been created with email id:${email}`
        }
        try {
            await transporter.sendMail(mailOptions);
            console.log("Email sent successfully to:", email);
        } catch (error) {
            console.error("Email sending error:", error);
        }
        

        return res.json({ success: true });

    } catch (error) {
        res.json({ success: false, message: error.message }); // Fixed error message
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: 'Email and password are required' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'Invalid email' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid password' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
       

        return res.json({ success: true });

    } catch (error) {
        res.json({ success: false, message: error.message }); // Fixed error message
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {  // Fixed method from cleanCookie to clearCookie
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });

        return res.json({ success: true, message: 'Logged out' });

    } catch (error) {
        res.json({ success: false, message: error.message }); // Fixed error message
    }
};

export const sendVerifyOtp = async (req, res)=>{
    try {
           const {userId} = req.body;
           const user = await userModel.findById(userId);
           if(user.isAccountVerified){
            return res.json({success: false,message:"accout already verified"})
           } 

           const otp = String(Math.floor(100000 + Math.random() * 900000));

           user.verifyOtp = otp;
           user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000

           await user.save();

            const mailOption = {
                from: process.env.SENDER_EMAIL,
                to: user.email,
                subject: 'Account Verification OTP',
                text:`Your OTP is ${otp}. Verify your account using this OTP.`
            }
            await transporter.sendMail(mailOption);
             
            res.json({ success: true, message: 'Verification OTP sent on Email'});


        } catch (error) 
        {
           res.json({ success: false, message: error.message });
        }
 }

 export const verifyEmail = async (req, res)=>{
    const {userId, otp} = req.body;

    if(!userId || !otp) {
          return res.json({ success: false, message: 'Missing Details' });
    }
    try {
          const user = await userModel.findById(userId);
            if(!user){
                return res.json({ success: false, message: 'User not found' });
            }

            if(user.verifyOtp === '' || user.verifyOtp !== otp) {
                    return res.json({ success: false, message: 'Invalid OTP' });
            }

            if(user.verifyOtpExpireAt < Date.now()) {
                    return res.json({ success: false, message: 'OTP Expired' });
            }

            user.isAccountVerified=true;
            user.verifyOtp ='';
            user.verifyOtpExpireAt=0;
            await user.save();
            return res.json({success: true, message: 'Email Verified successfully'})


    } catch (error) {
          return res.json({ success: false, message: error.message });
    }
}

//check if user is auth
export const isAuthenticated = async (req, res)=>{
    try {
    return res.json({ success: true });
    }
     catch (error) {
        return res.json({ success: false, message: error.message });
    }
}
//send password reset Otp
export const sendResetOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.json({ success: false, message: 'Email is required' });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        const hashedOtp = await bcrypt.hash(otp, 10);
        user.resetOtp = hashedOtp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP for resetting your password is ${otp}. Use this OTP to proceed with resetting your password.`,
        };

        await transporter.sendMail(mailOption);

        return res.json({ success: true, message: "OTP sent to your email" });

    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: error.message });
    }
};

// reset user password
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.resetOtp || !user.resetOtpExpireAt) {
            return res.status(400).json({ success: false, message: "OTP is not set. Request a new OTP." });
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP expired. Request a new OTP." });
        }

        const isOtpValid = await bcrypt.compare(otp, user.resetOtp);
        if (!isOtpValid) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = null;
        user.resetOtpExpireAt = null;

        await user.save();

        return res.status(200).json({ success: true, message: "Password has been reset successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};