const Redistribution = artifacts.require("Redistribution");
const expectEvent = require("./helper/expectEvent");

let redistribution;

function retrieveReceipts(lastReceiptBlock, merchant) {
  return new Promise(function (resolve, reject) {

    let paymentHashs = [];
    let PaymentInitiatedEvent = redistribution.PaymentInitiated({}, {
      fromBlock: lastReceiptBlock,
      toBlock: 'latest',
      address: merchant
    })
    PaymentInitiatedEvent.get((error, logs) => {
      if (error) reject(error);

      // logs.forEach(log => console.log(log.args))
      var itemsProcessed = 0;
      if (logs.length >= 1) {
        logs.forEach(log => {
          paymentHashs.push(log.args.paymentHash);

          // resolve promise on last processed item
          itemsProcessed++;
          if (itemsProcessed === logs.length) {
            resolve(paymentHashs);
          }
        })
      } else resolve(paymentHashs);
    })
  });
}


contract('Redistribution', function (accounts) {
  const [owner, merchant1, merchant2, customer1, customer2, customer3] = accounts;

  before(async function () {
    redistribution = await Redistribution.new();
    assert.equal(await redistribution.balanceOf(owner), 1000);
  })

  it("should register merchant", async function () {
    await redistribution.registerAsMerchant({
      from: merchant1
    })
    await redistribution.registerAsMerchant({
      from: merchant2
    })
  })

  it("should register customer", async function () {
    await redistribution.registerAsCustomer({
      from: customer1
    })
    await redistribution.registerAsCustomer({
      from: customer2
    })
    await redistribution.registerAsCustomer({
      from: customer3
    })
  })

  it("owner should send 10 tokens to customer", async function () {
    await redistribution.transfer(customer1, 10);
    assert.equal(await redistribution.balanceOf(customer1), 10);
  })

  // exp1: test latency of pay 
  it("customer should pay 10 token to merchant ", async function () {
    await expectEvent.inTransaction(
      redistribution.pay(merchant1, 10, {
        from: customer1
      }),
      "PaymentInitiated"
    );
  });

  // exp2: test latency of settle 
  it("merchant should settle 10 token from previous transaction event ", async function () {
    let paymentHashs = await retrieveReceipts(0, merchant1);
    // console.log(paymentHashs)
    paymentHashs.forEach(async paymentHash => {
      await redistribution.settle(paymentHash, {
        from: merchant1
      });
    });
  });
});