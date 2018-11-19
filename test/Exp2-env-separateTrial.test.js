// const {
//   getNow
// } = require("./helper/timer");
// const {
//   sleep,
//   writeToFile
// } = require("./helper/util");

// const argv = require('minimist')(process.argv.slice(2), {
//   string: ['prefix']
// });

// const Redistribution = artifacts.require("Redistribution");

// let redistribution;
// var lastReceiptBlock = 0
// let paymentHashs

// let t1 = [];
// let t2 = [];

// // --------------------------------------end of env vars-----------------------------
// let max_trial = 10;
// let C = 100; // num of customers: FIXED
// let M = 1; // num of merchants
// let token = 1; // num of tokens to pay
// // let fact_C = 3628800; // calculate C! in advance 
// let total_token = token * max_trial * C; // total tokens needed in this exp
// let STEP = 10;
// let START_NUM = 10;
// let EXP_NUM = "Exp2";
// let prefix = "100C";
// // -----------------------------------end of configurable vars-----------------------------


// contract('Redistribution', function (accounts) {
//   // assert.equal(accounts.length, 110)
//   const [owner, merchant1] = accounts;
//   const customers = accounts.slice(2, 2 + C); // from index 2, len = number of merchants  

//   it("configure env", async function () {
//     // deploy contract
//     redistribution = await Redistribution.new();

//     // owner sends tokens to customer1
//     await Promise.all(customers.slice(0, C).map(function (customer) {
//       return redistribution.transfer(customer, total_token);
//     }))

//     // register
//     await redistribution.registerAsMerchant({
//       from: merchant1
//     })

//     await Promise.all(customers.slice(0, C).map(function (customer) {
//       return redistribution.registerAsCustomer({
//         from: customer
//       })
//     }))
//   })

//   it("Exp2: test latency of pay ", async function () {
//     // Catch file prefix
//     // const prefix = argv['prefix'];

//     // Do multiple trials
//     for (var j = 1; j <= max_trial; j++) {
//       let ans_array_per_trial = [];

//       // Test different number of merchants
//       for (var c = START_NUM; c <= C; c += STEP) {
//         // start!
//         t1[c] = Date.now()

//         await Promise.all(customers.slice(0, c).map(function (customer) {
//           return redistribution.pay(merchant1, token, {
//             from: customer
//           })
//         }));

//         t2[c] = Date.now()
//         let latency = t2[c] - t1[c]
//         // console.log(c, ":", latency);
//         ans_array_per_trial.push(latency);

//       }
//       // Output to file (m:time)
//       // writeToFile(EXP_NUM + "-" + prefix + "-trial#" + j.toString(), ans_array_per_trial);
//       writeToFile(EXP_NUM + "-" + prefix + "-trial#" + j.toString(), ans_array_per_trial);
//     }
//   }).timeout(3000000000);

// });
