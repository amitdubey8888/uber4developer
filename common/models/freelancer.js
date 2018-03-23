'use strict';
var loopback = require('loopback') ;
var GeoPoint = loopback.GeoPoint ;
var AWS = require('aws-sdk') ;
var multiparty = require('multiparty') ;
const accessKeyId =  process.env.AWS_ACCESS_KEY || "AKIAIHHP4EX7J5VJV3ZQ";
const secretAccessKey = process.env.AWS_SECRET_KEY || "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";
const fs = require('fs') ;
const pathLib = require('path') ;
const nodemailer = require('nodemailer');

// Resume Parser Start
const PDFParser = require("pdf2json");
const pdfParser = new PDFParser(this,1);
const parserFunction = require('../../uploads/app');
// Resume Parser End

AWS.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
});
module.exports = function(Freelancer) {
    Freelancer.details = function(lat, lng, domain, technology, cb) {
       var filter = {} ;
       var where = {} ;
       filter = { where : where} ;
       if(lat != null && lng != null){
           
        var reqLoc = new GeoPoint({
            lat: lat,
            lng: lng
        });
        var locationQuery= {} ;
        locationQuery.maxDistance =15 ;
        locationQuery.near = reqLoc;
        where.location  = locationQuery ;
       }

       if(domain != null){
           where.domain = domain ;
       }
       if(technology != null){
        where.technologies = technology ;
      }
      filter = {where : where} ;
      var fields = {
          "location": true,
          "technologies":true,
          "domain":true
      };
      filter.fields = fields;

      Freelancer.find(filter,function(err, freelancers){
        if(err)
            console.log(err) ;
        cb(null, freelancers) ;
      })
    }

    Freelancer.uploadResume = async(userId, req,cb)=>{
        var s3 = new AWS.S3();
        const file = await getFileFromRequest(req);
        const { Location, ETag, Bucket, Key } = await uploadFileToS3(file);
        // Create Text File Start
        var location=Location;
        return new Promise((resolve, reject)=>{
            pdfParser.loadPDF(file.path);
            pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
            pdfParser.on("pdfParser_dataReady", pdfData => {
                fs.writeFile("./uploads/public/resume.txt", pdfParser.getRawTextContent());
                parserFunction.parse().then((response)=>{
                    var result = {
                        url: location,
                        name:response.name,
                        email: response.email,
                        phone: response.phone,
                        skills: response.skills,
                        technology: response.technology,
                        summary: response.summary
                    }
                    fs.unlink('./uploads/public/resume.txt', function (err) {
                        if (err) throw err;
                    });
                    resolve(result);
                });
            });
        });
        // Create Text File End
    }

    const getFileFromRequest = (req) => new Promise((resolve, reject) => {
        const form = new multiparty.Form();
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          const file = files['file'][0]; // get the file from the returned files object
          if (!file) Promise.reject('File was not found in form data.');
          else resolve(file);
        });
    });

    const uploadFileToS3 = (file, options = {}) => {

        // turn the file into a buffer for uploading
        const buffer = fs.readFileSync(file.path);
            
        // generate a new random file name
        const fileName = options.name || String(Date.now());
        
        // the extension of your file
        const extension = extname(file.path);
        
        var s3 = new AWS.S3();
        var bucket = 'uber4developer';
        var folder = 'resume' ;
        var uploadParams = {};
        uploadParams.Bucket = bucket ;
        uploadParams.Key = pathLib.join(folder, `${fileName}${extension}`) ;
        uploadParams.Body = buffer ;
        uploadParams.ACL = 'public-read' ;
        // return a promise
        return new Promise((resolve, reject) => {
            return s3.upload(uploadParams, (err, result) => {
            if (err) reject(err);
            else resolve(result); // return the values of the successful AWS S3 request
            });
        });
    };
    const extname = function(fileName){
        var index = fileName.lastIndexOf('.') ;
        if(index >=0){
            return fileName.substr(index) ;
        }else{
            return "" ;
        }
    }

    Freelancer.contactadmin = (req, cb)=>{
        var userId = req.body.userId ;
        var jobId = req.body.jobId ;
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'prashanthfreelancer2@gmail.com',
                pass: 'fl#@2018'
            }
        });
        Freelancer.findOne({userId:userId,include:'user'},function(err, flObj){
            if(err){ 
                cb(err, null);
            }else{
                flObj = flObj.toJSON() ;
                console.log('USER = ',flObj.user) ;
                const flName = flObj.user.first_name + flObj.user.last_name ;
                const flEmail = flObj.user.email ;
                const flPhone = flObj.user.phone ;
                console.log('USER = ',flObj.user) ;
                var Job = Freelancer.app.models.Job ;
                Job.findOne({id: jobId},function(err, job){
                    if(err){
                        cb(err, null);
                    }else{
                        console.log('JOB = ',job) ;
                        const clientId = job.created_by ;
                        const Client = Freelancer.app.models.Client ;

                        Client.findOne({id:clientId,include:'user'},function(err, client){
                            if(err){
                                cb(err, null);
                            }else{
                                console.log("CLIENT = ",client) ;
                                client = client.toJSON() ;
                                console.log("USER = ",client.user) ;
                            const clientName = client.user.first_name + client.user.last_name ;
                            console.log("client name = ",clientName) ;
                            const clientEmail = client.user.email ;
                            console.log("client name = ",clientEmail) ;
                            const clientPhone = client.user.phone ;
                            console.log("client name = ",clientPhone) ;
                            var content = '<p>Freelancer - '+flName+' requested for a Job posted by '+clientName+' Below are details</p>' ;
                            content += '<p> Client: </p>' ;
                            content += '<p> Name: ' + clientName+' </p>' ;
                            content += '<p> Email : '+ clientEmail +' </p>' ;
                            content += '<p> Phone : '+ clientPhone +' </p>' ;
                            
                            content += '<p></p><br>'
                            content += '<p> Freelancer: </p>' ;
                            content += '<p> Name: ' + flName+' </p>' ;
                            content += '<p> Email : '+ flEmail +' </p>' ;
                            content += '<p> Phone : '+ flPhone +' </p>' ;
    
                            var mailOptions = {
                                from: 'prashanthfreelancer2@gmail.com',
                                to: 'prashanthfreelancer2@gmail.com',
                                subject: 'Freelancer requested for a Job',
                                html: content
                            };
    
    
                            transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                    console.log(error);
                                    cb( error, null) ;
                                } else {
                                    console.log('Email sent: ' + info.response);
                                    var result = {} ;
                                    result.success=  'ok' ;
                                    cb(null, result) ;
                                }
                            });
                        }
                        });
                        
                    }
                });
                

            }
        });
        
        

    }

    Freelancer.remoteMethod('details', {
        http: { 'verb': 'get'},
        accepts: [
            {arg: 'lat', type: 'number'},
            {arg: 'lng', type: 'number'},
            {arg: 'domain', type: 'string'},
            {arg: 'technology', type: 'string'}
        ],
        returns: {arg: 'results', type: 'Object'}
    });

    Freelancer.remoteMethod('uploadResume',{
        http:{'verb':'post'},
        accepts:[
            {arg: 'userId', type: 'String'},
            {arg: 'req', type: 'object', 'http': {source: 'req'}}
        ],
        returns: {arg: 'result', type: 'object'}
    });
    Freelancer.remoteMethod('contactadmin',{
        http:{'verb':'post'},
        accepts:[
            {arg: 'req', type: 'object', 'http': {source: 'req'}}
        ],
        returns: {arg: 'result', type: 'object'}
    });
};