pragma solidity ^0.4.21;
import "./Ownable.sol"; //引用智能合约文件
contract RobotShop is Ownable{
  // 声明一个存储机器人的结构体，里面包含一个机器人所有的属性字段
  struct Robot {
    uint id; //唯一id，对应一个唯一的机器人
    address seller; //当前卖家的以太坊账户地址
    address buyer; //购买了该机器人的买家的以太坊账户地址
    string name; //机器人的名称
    string description; //机器人的功能描述
    uint256 price; //机器人的出售价格
  }
  //声明一个mapping作为存储机器人的list
  mapping (uint => Robot) public robots;
  //记录机器人智能合约中机器人列表的总数下标
  uint robotCounter;
  //增加一个销毁函数，使用函数修改器，只能让合约所有者调用
  function kill() public onlyOwner{
    selfdestruct(owner);
  }
  //增加一个卖出机器人事件
  event LogSellRobot(
    // 增加一个参数
    uint indexed _id,
    address indexed _seller,
    string _name,
    uint256 _price
  );
  //增加一个购买机器人事件
  event LogBuyRobot(
    // 增加一个参数
    uint indexed _id,
    address indexed _seller,
    address indexed _buyer,
    string _name,
    uint256 _price
  );
  //声明一个函数，在区块链上建立一笔出售机器人的记录
  function sellRobot(string _name, string _description, uint256 _price) public {
    robotCounter++; //首先对总数加一
    //然后新建一个新的机器人记录在列表中
    robots[robotCounter] = Robot(
      robotCounter,
      msg.sender,
      0x0,
      _name,
      _description,
      _price
    );
    // 触发事件
    emit LogSellRobot(robotCounter,msg.sender, _name, _price);
  }
  //创建一个函数，获取所有机器人的总数
  function getNumberOfRobots() public view returns (uint) {
    return robotCounter;
  }
  // 返回所有的正在出售的机器人id列表
  function getRobotsForSale() public view returns (uint[]) {
    // 声明一个数组
    uint[] memory robotIds = new uint[](robotCounter);
    // 记录在售机器人的数量
    uint numberOfRobotsForSale = 0;
    // 循环所有机器人列表
    for(uint i = 1; i <= robotCounter;  i++) {
      // 保存尚未出售的机器人id
      if(robots[i].buyer == 0x0) {
        robotIds[numberOfRobotsForSale] = robots[i].id;
        numberOfRobotsForSale++;
      }
    }
    // 上面数组的大小不是我们想要的，重新声明一个更准确的数组，用于返回结果
    uint[] memory forSale = new uint[](numberOfRobotsForSale);
    for(uint j = 0; j < numberOfRobotsForSale; j++) {
      forSale[j] = robotIds[j];
    }
    //返回最终的列表
    return forSale;
  }
  function buyRobot(uint _id) payable public {
    // 检查是否有待出售的机器人时，看robotCounter是否大于0
    require(robotCounter > 0);
    // 检查传入的id是否合法，是否存在这个机器人
    require(_id > 0 && _id <= robotCounter);
    // 根据id获取机器人信息
    Robot storage robot = robots[_id];
    // 检查机器人是否已被卖出
    require(robot.buyer == 0X0);
    // 不允许购买自己出售的机器人
    require(msg.sender != robot.seller);
    // 购买价格必须等于机器人价格
    require(msg.value == robot.price);
    // 校验通过，保存买家的账户地址，代表购买了该机器人
    robot.buyer = msg.sender;
    // 把钱转账给卖家账户
    robot.seller.transfer(msg.value);
    // 触发事件
    emit LogBuyRobot(_id, robot.seller, robot.buyer, robot.name, robot.price);
  }
}
