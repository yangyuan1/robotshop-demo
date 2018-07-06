pragma solidity ^0.4.21;
contract Ownable{
  address owner; //增加一个owner，存储智能合约的所有者
  //定义一个函数修改器，用于保证当前函数调用者必须是合约的所有者
  modifier onlyOwner(){
    require(msg.sender == owner);
    _; // 占位符，使用这个函数修改器的函数代码
  }
  function constructor() public{
    owner = msg.sender; //合约的创建者作为合约的所有者
  }
}
