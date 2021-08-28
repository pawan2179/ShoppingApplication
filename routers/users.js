const {User} = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv/config');

//GET all users
router.get('/', async(req, res) => {
    const userList = await User.find().select('-passwordHash');

    if(!userList) {
        res.status(500).json({
            success: false,
            message: 'User with given ID was not found'
        })
    }
    res.send(userList);
})

//GET user by ID
router.get('/:id', (req, res) => {
    const user = User.findById(req.params.id).select('-passwordHash')
    .then(user => {
        if(!user) {
            res.status(500).json({
                success: false,
                message: 'Some internal error occured',
            })
        }
        else {
            res.send(user);
        }
    })
    .catch(err => {
        res.status(400).json({
            success: false,
            error: err,
        })
    })
})

router.post('/', async(req, res) => {
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        city: req.body.city,
        country: req.body.country,
    })

    user = await user.save();
    if(!user) {
        res.status(404).send('User not created!')
    }

    res.send(user);
})

router.post('/login', async(req, res) => {
    const user = await User.findOne({email: req.body.email})
    if(!user) {
        return res.status(400).send('User not Found!!');
    }
    if(user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const secret = process.env.SECRET

        const token = jwt.sign({
            userId: user.id,
            isAdmin: user.isAdmin
        }, secret, {
            expiresIn: '1d'
        })
        res.status(200).send({user: user.email, token: token});
    }
    else res.status(400).send('Wrong Password');
})

router.get('/get/count', (req, res) => {
    const userCount = User.countDocuments((count) => count)
    .then(userCount => {
        if(!userCount)
            res.status(500).json({success: false})
        res.send({
            userCount: userCount
        });
    })
    .catch(err => {
        res.status(500).json({
            error: err
        })
    });
})

//Delete a User
router.delete('/:id', (req, res) => {
    const user = User.findByIdAndRemove(req.params.id)
    .then(user => {
        if(user)    return res.status(200).json({
            success: true,
            message: 'Deletion successfull',
        })
        else {
            return res.status(404).json({
                success: false, 
                message: 'Failed to delete'
            })
        }
    })
    .catch(err => {
        return res.status(500).json({
            success: false,
            error: err
        })
    })
})

module.exports = router;