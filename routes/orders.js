var express = require('express');
var mail = require('../lib/mail');
var constants = require('../lib/constants');
var router = express.Router();

var Order = require('../schema/order').Order;
var Restaurant = require('../schema/restaurant').Restaurant;
var Menu = require('../schema/menu').Menu;
var Plate = require('../schema/plate').Plate;
var User = require('../schema/user').User;
var DeliveryDiary = require('../schema/deliveryDiary').DeliveryDiary;

router.get('/', function(req, res) {
    
});

router.get('/create', function(req, res){
    Restaurant.find({},{},function(e,docs){
        if (docs) {
            res.render('orders/create', {
                restaurantList: docs,
                active: 'createorder'
            });
        } else {
            res.render('orders/create', {
                error: 'Could not find any restaurants'
            });
        } 
    });
});

router.get('/orderSendConfirmation', function(req,res){
    res.render('orders/sendConfirmation', {
        active: 'createorder'
    });
});

router.post('/updateMenus', function(req, res){
    Restaurant.findOne({_id:req.body.objId}, function(e, rdocs) {
        Menu.find({_id:{$in: rdocs.menus}}, function(e, mdocs) {
            res.send(mdocs);
        });
    });
});

router.post('/updatePlates', function(req, res){
    Menu.findOne({_id:req.body.objId},function(e,mdocs){
        Plate.find({_id:{$in:mdocs.plates}},function(e,pdocs){
            res.send(pdocs);
        });
    });
});

router.post('/getPlate', function(req,res) {
    Plate.findOne({_id:req.body.objId},function(e,docs) {
        res.send(docs);
    });
});

router.post('/getUserAddresses', function(req,res) {
    User.findOne({_id:req.session.uid},function(e,docs) {
        if (docs != null)
            res.send(docs);
        else
            res.send('none');
    });
});

router.post('/addAddressToCurrentUser', function(req,res) {

    console.log("Address: "+req.body.address);
    console.log("PostalCode: "+req.body.postalcode);

    User.findOneAndUpdate(
        { _id:req.session.uid },
        { "$addToSet": { address: {address: req.body.address, postalCode: req.body.postalcode} } },
        function(e,docs) {
            if(!e){
                 User.findOne({_id:req.session.uid},function(e,docs) {
                    if (docs != null) {
                        User.update({_id:req.session.uid},{"$set":{defaultAddress:docs.address.length-1}},function(e,docs){res.send("200");});
                    }
                });
            }
        }
    );
});

router.post('/confirmOrder', function(req,res) {
    var orders = JSON.parse(req.body.arrayOrder);
    var restaurantId = req.body.restaurantId;

    var subtotal = 0;
    var total = 0;
    var orderElements = [];

    orders.forEach(function(entry) {
        subtotal+=entry.quantity*entry.plate.price;
    });

    total = subtotal;
    total = total + (total * constants.TPS);
    total = total + (total * constants.TVQ);

    res.render('orders/confirmation', {
        orderList: orders,
        restaurantId: restaurantId,
        subtotal: subtotal,
        total: total,
        active: 'createorder'
    });
});

router.post('/sendOrder', function(req,res) {
    var order = req.body.order;
    order.customer = req.session.uid;

    var newOrder = new Order({
        address: JSON.parse(order.address),
        date: order.date,
        order: order.order,
        status: constants.STATUS_OPEN,
        restaurantId: order.restaurantId,
    });
    
    newOrder.save(function (err, newUser) {
        if (err)
            console.log(err);
    });

    User.findOne({_id:req.session.uid},function(e,docs) {
        if(docs != null)
            mail.sendMail("Your order has been confirmed", docs.email, "Order confirmation", "");
    });

    res.send("202");
});

router.post('/changeDefaultAddress', function(req,res) {

    User.findOne({_id:req.session.uid},function(e,docs) {
        if (docs != null) {
            User.update({_id:req.session.uid},{"$set":{defaultAddress:req.body.address}},function(e,docs){res.send("200");});
        }
    });
});

router.get('/listOpen', function(req, res){
    Order.find({status: constants.STATUS_OPEN},{},function(e,docs){
        if (docs) {
            res.render('orders/list', {
                orderlist: docs,
                list: "Open",
                active: 'prepareorder'
            });
        } else {
            res.render('orders/list', {
                error: 'Could not find any orders'
            });
        } 
    });
});

router.get('/listPreparation', function(req, res){
    Order.find({status: constants.STATUS_PREPARATION},{},function(e,docs){
        if (docs) {
            res.render('orders/list', {
                orderlist: docs,
                list: "Preparation",
                active: 'prepareorder'
            });
        } else {
            res.render('orders/list', {
                error: 'Could not find any orders'
            });
        } 
    });
});

router.get('/listReady', function(req, res){
    Order.find({status: constants.STATUS_READY},{},function(e,docs){
        if (docs) {
            res.render('orders/list', {
                orderlist: docs,
                list: "Ready",
                active: 'deliverorder'
            });
        } else {
            res.render('orders/list', {
                error: 'Could not find any orders'
            });
        } 
    });
});

router.post('/prepareOrder',function(req,res){
    var orderid = req.body.id;

    Order.findOneAndUpdate(
        {_id:orderid},
        {status: constants.STATUS_PREPARATION},
        function (err, doc) {
            if(err){
                res.send("500");
            }else{
                res.send("200");
            }
        }
    );
});

router.post('/finishOrder',function(req,res){
    var orderid = req.body.id;

    Order.findOneAndUpdate(
        {_id:orderid},
        {status: constants.STATUS_READY},
        function (err, doc) {
            if(err){
                res.send("500");
            }else{
                res.send("200");
            }
        }
    );
});

router.get('/acceptOrder', function(req,res){
    Order.find({status: constants.STATUS_READY},{},function(e,docs){
        res.render('orders/acceptOrder',{
            orderlist: docs,
        });
    });
});

router.post('/getAddressesDelivery', function(req,res){
    var orderid = req.body.orderId;
    var restAdd = null;
    var cliAdd = null;

    Order.findOne({status: constants.STATUS_READY, _id: orderid},{},function(e,docs){
       cliAdd = docs.address.address + ", " + docs.address.postalCode;
        Restaurant.findOne({_id: docs.restaurantId},{},function(e2,docs2){
            restAdd = docs2.address + ", " + docs2.postal_code;
            res.send({
                restaurantAddress:restAdd,
                clientAddress:cliAdd
            });
        });
    });
});

router.post('/acceptDelivery', function(req,res){
    var orderid = req.body.orderId;

    Order.findOne({_id: orderid},{},function(e,docs){
       if(docs.status != constants.STATUS_READY){
            res.send("404");
            return 0;
       }else{
            var newDeliveryDiary = new DeliveryDiary({
                orderId: orderid
                , deliverManId: req.session.uid
                , deliveryDate: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') 
            });
            
            newDeliveryDiary.save(function (err, newUser) {
                if (err){
                    console.log(err);
                    res.send("500");
                }else{
                    Order.findOneAndUpdate(
                        {_id:orderid},
                        {status: constants.STATUS_CLOSED},
                        function (err, doc) {
                            if(err){
                                res.send("500");
                            }else{
                                res.send("200");
                            }
                        }
                    );
                }
            });
       }
    });
});

module.exports = router;
