var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    
});

router.get('/create', function(req, res){
    var db = req.db;
    var restaurantCollection = db.get('restaurants');
    
    restaurantCollection.find({},{},function(e,docs){
        if(docs){
            res.render('orders/create', {
                restaurantList: docs,
                active: 'createorder'
            });
        }else{
            res.render('orders/create', {
                error: 'Could not find any restaurants'
            });
        } 
    });
});

router.post('/updateMenus', function(req, res){
    var db = req.db;
    var menuCollection = db.get('menus');
    var restaurantCollection = db.get('restaurants');

    restaurantCollection.findOne({_id:req.body.restaurantid},function(e,rdocs){
        menuCollection.find({_id:{$in:rdocs.menus}},function(e,mdocs){
            res.send(mdocs);
        });
    });
});

router.post('/updatePlates', function(req, res){
    var db = req.db;
    var plateCollection = db.get('plates');
    var menuCollection = db.get('menus');

    menuCollection.findOne({_id:parseInt(req.body.menuid)},function(e,mdocs){
        plateCollection.find({_id:{$in:mdocs.plates}},function(e,pdocs){
            res.send(pdocs);
        });
    });
});

router.post('/getPlate', function(req,res){
    var db = req.db;
    var plateCollection = db.get('plates');

    plateCollection.findOne({_id:parseInt(req.body.plateid)},function(e,docs){
        res.send(docs);
    });
});

router.post('/getUserAddresses', function(req,res){
    var db = req.db;
    var userCollection = db.get('usercollection');
    
    userCollection.findOne({_id:req.session.uid},function(e,docs){
        if(docs!=null){
            res.send(docs.address);
        }else{
            res.send('none');
        }
    });
});

router.post('/addAddressToCurrentUser', function(req,res){
    var db = req.db;
    var userCollection = db.get('userCollection');

    userCollection.update({_id:req.session.uid}, 
        {
            "$set":
            {
                "address" : userAddress,
            }
        }, function (err, doc) {
            if (err) {
                // If it failed, return error
                res.send("There was a problem updating the information in the database.");
            }
            else {
                // If it worked, set the header so the address bar doesn't still say /adduser
                res.location("/users/update");
                // And forward to success page
                res.redirect("/users/update");
            }
        });
});

router.post('/confirmOrder', function(req,res){
    var orders = JSON.parse(req.body.arrayOrder);

    var subtotal = 0;
    var orderElements = [];

    orders.forEach(function(entry) {
        console.log(entry);
        subtotal+=entry.quantity*entry.plate.price;
    });

    res.render('orders/confirmation', {
        orderList: orders,
        subtotal: subtotal,
        total: subtotal*2,
        active: 'createorder'
    });
});

module.exports = router;
