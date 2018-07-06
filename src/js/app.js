App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,
  // 增加一个字段来记录数据是否已被加载过，防止数据被多次重复加载
  loading:false,
  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if(typeof web3 !== 'undefined') {
      //这里之所以没有复用web3对象，是因为外部注入的web3对象可能依赖于不同的web3库版本
      App.web3Provider = web3.currentProvider;
    } else {
      //创建一个新的Provider
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    //在初始化web3后，我们可以将访问web页面账户的地址和余额显示在页面中
    App.displayAccountInfo();
    // 然后我们可以初始化获取智能合约对象
    return App.initContract();
  },
  displayAccountInfo: function() {
    // 获取当前账户，这是一个异步方法，通过call back function获取信息
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $('#account').text(account);
        web3.eth.getBalance(account, function(err, balance) {
          if(err === null) {
            $('#accountBalance').text(web3.fromWei(balance, "ether") + " ETH");
          }
        })
      }
    });
  },
  initContract: function() {
    // 这里我们读取智能合约编译部署后产生的json文件
    // 保存了RobotShop的ABI（接口说明）信息及部署后的网络(地址)信息，它在编译合约的时候生成ABI，在部署的时候追加网络信息
    $.getJSON('RobotShop.json', function(robotShopArtifact) {
        App.contracts.RobotShop = TruffleContract(robotShopArtifact);
        App.contracts.RobotShop.setProvider(App.web3Provider);
        App.listenToEvents();
        return App.reloadRobots();
      });
  },
  reloadRobots: function() {
   //防止数据被重复加载
   if(App.loading) {
     return;
   }
   App.loading = true;

   var robotShopInstance;
    // 刷新一下当前账户余额，余额有可能发生变化
   App.displayAccountInfo();

   App.contracts.RobotShop.deployed().then(function(instance) {
     robotShopInstance = instance;
     //获取正在出售的机器人id列表
     return robotShopInstance.getRobotsForSale();

   }).then(function(robotIds) {
     // 清空rows
     $('#robotsRow').empty();
     // 循环id列表，然后根据id读取机器人信息进行显示
     for(var i = 0; i < robotIds.length; i++) {
        var robotId = robotIds[i];
        robotShopInstance.robots(robotId.toNumber()).then(function(robot){
	       // 显示机器人信息
          App.displayRobot(robot[0], robot[1], robot[3], robot[4], robot[5]);
        });
      }
      //解锁
      App.loading = false;

   }).catch(function(err) {
     console.error(err.message);
     //这里不要忘了也要解锁
     App.loading = false;
   });
  },
  // 显示机器人，把机器人信息append到列表中
  displayRobot: function(id, seller, name, description, price) {
    var robotsRow = $('#robotsRow');
    var etherPrice = web3.fromWei(price, "ether");

    var robotTemplate = $("#robotTemplate");
    robotTemplate.find('.panel-title').text(name);
    robotTemplate.find('.robot-description').text(description);
    robotTemplate.find('.robot-price').text(etherPrice + " ETH");
    // 按钮的data中保存该机器人id以及价格，点击时可直接获取
    robotTemplate.find('.btn-buy').attr('data-id', id);
    robotTemplate.find('.btn-buy').attr('data-value', etherPrice);
    // 卖家字段及购买按钮的显示
    if (seller == App.account) {
      robotTemplate.find('.robot-seller').text("你自己");
      robotTemplate.find('.btn-buy').hide();
    } else {
      robotTemplate.find('.robot-seller').text(seller);
      robotTemplate.find('.btn-buy').show();
    }
    // 增加机器人到列表中
    robotsRow.append(robotTemplate.html());
  },
  sellRobot: function() {
    var _robot_name = $('#robot_name').val();
    var _description = $('#robot_description').val();
    var _price = web3.toWei(parseFloat($('#robot_price').val() || 0), "ether");

    if((_robot_name.trim() == '') || (_price == 0)) {
      return false;
    }

    App.contracts.RobotShop.deployed().then(function(instance) {
      return instance.sellRobot(_robot_name, _description, _price, {
        from: App.account,
        gas: 500000
      });
    }).catch(function(err) {
      console.error(err);
    });
  },
  listenToEvents: function() {
    App.contracts.RobotShop.deployed().then(function(instance) {
      instance.LogSellRobot({}, {}).watch(function(error, event) {
        if (error) {
          console.error(error);
        }
        App.reloadRobots();
      });
	    instance.LogBuyRobot({}, {}).watch(function(error, event) {
        if (error) {
          console.error(error);
        }
        App.reloadRobots();
      });
    });
  },
  // 购买指定机器人
  buyRobot: function() {
    event.preventDefault();
    // 首先获取机器人id
    var _robotId = $(event.target).data('id');
    var _price = parseFloat($(event.target).data('value'));
    App.contracts.RobotShop.deployed().then(function(instance){
      //指定购买机器人的id
      return instance.buyRobot(_robotId,{
        from: App.account,
        value: web3.toWei(_price, "ether"),
        gas: 500000
      });
    }).catch(function(error) {
      console.error(error);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
