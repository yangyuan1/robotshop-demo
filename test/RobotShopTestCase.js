// 引入智能合约文件
var RobotShop = artifacts.require("./RobotShop.sol");
// contract关键字定义一个测试集，其中可以包含多个测试用例
// 指定需要测试的智能合约，创建用例
// accounts参数代表当前测试网中可用的账户列表
// 例如如果将智能合约部署到ganache，那么accounts就是ganache中可用的账户列表
contract('RobotShop', function(accounts){
  var robotShopInstance;
  var seller = accounts[1];
  var buyer = accounts[2];
  // 出售多个机器人，准备两个机器人的内容
  var robotName1 = "机器人-1号";
  var robotDescription1 = "唱歌、跳舞、做家务";
  var robotPrice1 = 10;

  var robotName2 = "机器人-2号";
  var robotDescription2 = "聊天、遛狗、打麻将";
  var robotPrice2 = 6;

  var sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
  var buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

  it("初始化值应该为空", function() {
    return RobotShop.deployed().then(function(instance) {
      robotShopInstance = instance;
      return robotShopInstance.getNumberOfRobots();
    }).then(function(data) {
      assert.equal(data.toNumber(), 0, "机器人数量应该为零");
      return robotShopInstance.getRobotsForSale();
    }).then(function(data){
      assert.equal(data.length, 0, "在售机器人列表应该为空");
    });
  });

  // 出售机器人的测试用例中，测试按顺序出售两个机器人
  it("应该出售第一个机器人", function() {
    return RobotShop.deployed().then(function(instance){
      robotShopInstance = instance;
      return robotShopInstance.sellRobot(
        robotName1,
        robotDescription1,
        web3.toWei(robotPrice1, "ether"),
        {from: seller}
      );
    }).then(function(receipt){
      // 获取RobotShop触发的事件返回值，事件中包含了机器人信息
      assert.equal(receipt.logs.length, 1, "应该触发一个事件");
      assert.equal(receipt.logs[0].event, "LogSellRobot", "事件名称应该是 LogSellRobot");
      assert.equal(receipt.logs[0].args._id.toNumber(), 1, "机器人id应该是 1");
      assert.equal(receipt.logs[0].args._seller, seller, "事件中的seller参数值应该是  " + seller);
      assert.equal(receipt.logs[0].args._name, robotName1, "事件中的name参数值应该是 " + robotName1);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(robotPrice1, "ether"), "事件中的price参数值应该是 " + web3.toWei(robotPrice1, "ether"));

      return robotShopInstance.getNumberOfRobots();
    }).then(function(data) {
      assert.equal(data, 1, "机器人总数应该是1个");
      return robotShopInstance.getRobotsForSale();
    }).then(function(data) {
      assert.equal(data.length, 1, "应该只有1个在出售的机器人");
      assert.equal(data[0].toNumber(), 1, "机器人ID应该是 1");
      // 智能合约会为robot创建一个默认的get方法
      return robotShopInstance.robots(data[0]);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "机器人id应该是 1");
      assert.equal(data[1], seller, "卖家地址应该是 " + seller);
      assert.equal(data[2], 0x0, "买家地址应该是空值");
      assert.equal(data[3], robotName1, "机器人名称应该是 " + robotName1);
      assert.equal(data[4], robotDescription1, "机器人描述应该是 " + robotDescription1);
      assert.equal(data[5].toNumber(), web3.toWei(robotPrice1, "ether"), "机器人价格应该是 " + web3.toWei(robotPrice1, "ether"));
    });
  });

  //出售第二个机器人
  it("应该出售第二个机器人", function() {
    return RobotShop.deployed().then(function(instance){
      robotShopInstance = instance;
      return robotShopInstance.sellRobot(
        robotName2,
        robotDescription2,
        web3.toWei(robotPrice2, "ether"),
        {from: seller}
      );
    }).then(function(receipt){
      // 获取RobotShop触发的事件返回值，事件中包含了机器人信息
      assert.equal(receipt.logs.length, 1, "应该触发一个事件");
      assert.equal(receipt.logs[0].event, "LogSellRobot", "事件名称应该是 LogSellRobot");
      assert.equal(receipt.logs[0].args._id.toNumber(), 2, "机器人id应该是 2");
      assert.equal(receipt.logs[0].args._seller, seller, "事件中的seller参数值应该是  " + seller);
      assert.equal(receipt.logs[0].args._name, robotName2, "事件中的name参数值应该是 " + robotName2);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(robotPrice2, "ether"), "事件中的price参数值应该是 " + web3.toWei(robotPrice2, "ether"));

      return robotShopInstance.getNumberOfRobots();
    }).then(function(data) {
      assert.equal(data, 2, "机器人总数应该是2个");

      return robotShopInstance.getRobotsForSale();
    }).then(function(data) {
      assert.equal(data.length, 2, "应该只有2个在出售的机器人");
      assert.equal(data[1].toNumber(), 2, "机器人ID应该是 2");
      return robotShopInstance.robots(data[1]);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 2, "机器人id应该是 2");
      assert.equal(data[1], seller, "卖家地址应该是 " + seller);
      assert.equal(data[2], 0x0, "买家地址应该是空值");
      assert.equal(data[3], robotName2, "机器人名称应该是 " + robotName2);
      assert.equal(data[4], robotDescription2, "机器人描述应该是 " + robotDescription2);
      assert.equal(data[5].toNumber(), web3.toWei(robotPrice2, "ether"), "机器人价格应该是 " + web3.toWei(robotPrice2, "ether"));
    });
  });

  it("购买第一个机器人", function(){
    return RobotShop.deployed().then(function(instance) {
      robotShopInstance = instance;
      // 购买机器人之前记录买家和卖家的账户余额
      sellerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(seller), "ether").toNumber();
      buyerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(buyer), "ether").toNumber();

      return robotShopInstance.buyRobot(1,{
        from: buyer,
        value: web3.toWei(robotPrice1, "ether")
      });
    }).then(function(receipt){
      assert.equal(receipt.logs.length, 1, "应该触发一个事件");
      assert.equal(receipt.logs[0].event, "LogBuyRobot", "事件名称应该是 LogBuyRobot");
      // 检查机器人id
      assert.equal(receipt.logs[0].args._id.toNumber(), 1, "事件中机器人id应该是 1");
      assert.equal(receipt.logs[0].args._seller, seller, "事件中的seller参数值应该是 " + seller);
      assert.equal(receipt.logs[0].args._buyer, buyer, "事件中的buyer参数值应该是 " + buyer);
      assert.equal(receipt.logs[0].args._name, robotName1, "事件中的name参数值应该是 " + robotName1);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(robotPrice1, "ether"), "事件中的price参数值应该是 " + web3.toWei(robotPrice1, "ether"));

      // 购买机器人以后买家和卖家的余额
      sellerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(seller), "ether").toNumber();
      buyerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(buyer), "ether").toNumber();

      // 检查购买机器人后的余额是否正确
      assert(sellerBalanceAfterBuy == sellerBalanceBeforeBuy + robotPrice1, "卖家应该收到 " + robotPrice1 + " ETH");
      assert(buyerBalanceAfterBuy <= buyerBalanceBeforeBuy - robotPrice1, "买家应该花费 " + robotPrice1 + " ETH");

      return robotShopInstance.getRobotsForSale();
    }).then(function(data){
      assert.equal(data.length, 1, "应该剩余1个待售的机器人");
      assert.equal(data[0].toNumber(), 2, "待售机器人的id应该是2");

      return robotShopInstance.getNumberOfRobots();
    }).then(function(data){
      assert.equal(data.toNumber(), 2, "机器人总数应该仍然是2");
    });
  });
});
