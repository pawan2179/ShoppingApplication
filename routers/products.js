const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const {Product} = require('../models/product');
const mongoose = require('mongoose');
const multer = require('multer');

//List of extensions allowed
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

//Configure multer so that files uploaded are uniquely named according to our format
var storage = multer.diskStorage({

    //destination of file
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Invalid image type');

        if(isValid) {
            uploadError= null
        }
        cb(null, 'public/uploads')
    },

    //Remove all spaces from name with '-' and add current date at end
    filename: function (req, file, cb) {

        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}).${extension}`)
    }
})

const uploadOptions = multer({storage: storage})

//Get Request on api/v1/products
router.get(`/`, async (req, res) => {

    //If category query is given
    //eg: http://localhost:3000/api/v1/products?categories=23456,56789
    //Multiple queries can be given so we need to split them and store in array
    let filter = {};
    if(req.query.categories) {
        filter = { category: req.query.categories.split(',') }
    }
    const productList = await Product.find(filter);
    if(!productList) {
        res.send(500).json({
            success : false
        })
    }
    res.send(productList); 
})

//GET a product of specific id
router.get('/:id', async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');
    if(!product) {
        res.status(500).json({
            success: false
        })
    }
    res.send(product);
})

//Post request on api/v1/products
router.post(`/`, uploadOptions.single('image'), async (req, res) => {

    //Verifying if current category is present in database
    const category = await Category.findById(req.body.category);
    if(!category) {
        return res.status(400).send('Invalid Category');
    }

    const file = req.file;
    if(!file)    return res.status(400).send('No image in request')

    const fileName = req.file.filename;
    const basePath = `{req.protocol}://${req.get('host')}/public/uploads/`;
    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    })

    product = await product.save();
    if(!product) {
        return res.status(500).send('The product cannot be created');
    }
    res.send(product);
})

//Update a product entry
router.put('/:id', uploadOptions.single('image'), async (req, res) => {

    if(!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product id');
    }
    const category = await Category.findById(req.body.category);
    if(!category) {
        return res.status(400).send('Invalid Category');
    }

    //If new image passed, update the previous path otherwise let it be same
    const product = await Product.findById(req.params.id);
    if(!product)    return res.status(400).send('Invalid Product');

    const file = req.file;
    let imagePath;
    
    if(file) {
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagePath = `${basePath}${fileName}`
    }
    else {
        imagePath = product.image;
    }

    const updatedproduct = await Product.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: req.body.image,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    }, {new: true} )

    if(!updatedproduct)    res.status(500).send('Product cannot be updated!');
    res.send(updatedproduct)
})

//Delete a product
router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id)
    .then(product => {
        if(product)    return res.status(200).json({
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

//Get count of products in database
router.get('/get/count', async (req, res) => {
    const productCount = await Product.countDocuments((count) => count);
    if(!productCount) {
        res.status(500).json({
            success: false,
        })
    }
    res.send({
        productCount: productCount
    });
})

//Get featured products (specified no. of products)
router.get('/get/featured/:count', async(req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const product = await Product.find({isFeatured: true}).limit(+count)
    if(!product) {
        res.status(500).json({
            success: false
        })
    }
    res.send(product);
})

router.put('/gallery-images/:id', 
            uploadOptions.array('images', 10),
            async(req, res) => {
                if(!mongoose.isValidObjectId(req.params.id)) {
                    return res.status(400).send('Invalid Product id');
                }
                const files = req.files
                const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
                let imagesPaths = [];

                console.log(files.images);

                if(files) {
                    files.map(file => {
                        console.log(`${file.fileName}`);
                        imagesPaths.push(`${basePath}${file.filename}`);
                    })
                }

                const product = await Product.findByIdAndUpdate(
                    req.params.id, {
                        images: imagesPaths
                    },
                    {new: true}
                )

                if(!product)    return res.status(500).send('Product cannot be updated');
                res.send(product);

            }
)

module.exports = router;