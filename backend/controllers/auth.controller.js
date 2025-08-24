import { redis } from '../lib/redis.js';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';


const generateToken = (userId) => {
  const accessToken = jwt.sign({userId}, 
    process.env.ACCESS_TOKEN_SECRET, 
    {expiresIn: '15m'});

    const refreshToken = jwt.sign({userId}, process.env.REFRESH_TOKEN_SECRET,
    {expiresIn: '7d'});
    return {accessToken, refreshToken};

};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(userId.toString(), refreshToken, 'EX', 7 * 24 * 60 * 60); // 7 days expiration
}


const setCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true, // Accessible only by web server
    secure: process.env.NODE_ENV === 'production', // Set to true in production
    sameSite: 'Strict', // Adjust based on your requirements
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
    res.cookie('refreshToken', refreshToken, {
    httpOnly: true, // Accessible only by web server
    secure: process.env.NODE_ENV === 'production', // Set to true in production
    sameSite: 'Strict', // Adjust based on your requirements
    maxAge: 15 * 60 * 7000, // 7 days
  });
}

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  const userExist = await User.findOne({ email });;
try {
  
  if (userExist) {
    return res.status(400).json({ message: 'User already exists' });
  }
  const user = await User.create({ email, password, name });
  // authenticate user
  const {accessToken, refreshToken} = generateToken(user._id)
  await storeRefreshToken(user._id, refreshToken);

  setCookies(res, accessToken, refreshToken);

  res.status(201).json({ user:{
      _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    }, message: 'User created successfully'
  }
  );
} catch (error) { 
  res.status(500).json({ message: 'Server error', error: error.message });
 
}
}

export const login = (req, res) => {
  res.send('login Route');
}
export const logout = (req, res) => {
  res.send('logout Route');
}
