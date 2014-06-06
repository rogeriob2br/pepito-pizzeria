﻿var mongoose = require('mongoose');

module.exports = {


    getUserModel: function (db) {

        var connectString = db.driver._connect_args[0];

        if (mongoose.connection.readyState == 0) 
        {
            mongoose.connect(connectString.substring(10, connectString.length));
        }

        var Schema = mongoose.Schema;

           var userschem = new Schema({
                  userid: { type: Number }
                  , username: { type: String }
                    //, userbirthdate: { type: String }
                  , useraddress: { type: String }
                  , userphone: { type: String }
                  , useremail: { type: String }
                  , userpassword: { type: String }
                }, { collection: 'usercollection' });

              try {
                return mongoose.model('usercollection', userschem);
            } catch (e) {
                return mongoose.model('usercollection')
            }

        

    },

    closeConnection: function () {

        mongoose.disconnect();
    }
}