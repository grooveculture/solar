require('dotenv').config();
var request = require('request');
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_DB, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT
});

var kwhday;
var kwhmonth;
var kwhyear;
var kwhlifetime;

let myobj;


const Solars = sequelize.define('solars', {
  datum: {
    type: Sequelize.STRING,
    required: true,
    unique: false
  },
  name: {
    type: Sequelize.STRING,
    required: true,
    unique: false
  },
  kwh: {
    type: Sequelize.DOUBLE,
    required: true,
    unique: false
  }
})

function getDaten() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      var options = {
        'method': 'GET',
        'url': process.env.SOLAR_URL,
        'headers': {
          'Cookie': process.env.SOLAR_COOKIE
        }
      };
      request(options, function (error, response) {
        if (error) throw new Error(error);
        let obj = JSON.parse(response.body);
        kwhday = (obj.overview["lastDayData"]["energy"]) / 1000;
        kwhmonth = (obj.overview["lastMonthData"]["energy"]) / 1000;
        kwhyear = (obj.overview["lastYearData"]["energy"]) / 1000;
        kwhlifetime = (obj.overview["lifeTimeData"]["energy"]) / 1000;
        console.log("day: " + kwhday + " month: " + kwhmonth + " year: " + kwhyear + " lifetime: " + kwhlifetime);

      });
    });
  }, 2000);

  resolve();
};



function insertData() {

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(process.env.DB_DB, process.env.DB_USER, process.env.DB_PASS, {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT
      });

      sequelize.authenticate()
        .then(() => console.log('Database connected...'))
        .catch(err => console.log('Error: ' + err))

      

      // Creating a Date object 
      function pad2(n) { return n < 10 ? '0' + n : n }
      var date = new Date();
      var timestamp = (date.getFullYear().toString() + pad2(date.getMonth() + 1) + pad2(date.getDate()) + pad2(date.getHours()) + pad2(date.getMinutes()) + pad2(date.getSeconds()));
      var options = { useUnifiedTopology: true };

      var myobjs = [{ datum: timestamp, name: "lastDayData", kwh: kwhday },
      { datum: timestamp, name: "lastMonthData", kwh: kwhmonth },
      { datum: timestamp, name: "lastYearData", kwh: kwhyear },
      { datum: timestamp, name: "lifeTimeData", kwh: kwhlifetime }];

      sequelize.sync({ force: false })
        .then(() => {
          console.log(`Database & tables created!`);

          Solars.bulkCreate([
            myobjs[0],
            myobjs[1],
            myobjs[2],
            myobjs[3]
          ]).then(function () {
            return Solars.findAll();
          }).then(function (solars) {
            console.log(solars);
          });
        });
    }, 2000);
    resolve();
  });
}



getDaten()
  .then(insertData())
  .catch(err => console.log(err));