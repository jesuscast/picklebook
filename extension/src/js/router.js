const StateMachine = require('./statemachine');

class Router extends StateMachine {
  constructor () {
    super();
    this.routable = true;
    this.submodules = {};
  }

  get (entirePath, ...args) {
    let pathsList = entirePath.split("/");
    if(pathsList.length > 1) {
      const currenPath = pathsList.shift();
      if ( Object.keys(this.submodules).indexOf(currenPath) !== -1 ) {
        return this.submodules[currenPath].get(pathsList.join("/"), ...args);
      } else {
        throw new Error(currenPath+': Path not defiend');
      }
    } else {
      return this.setState(entirePath, ...args);
    }
  }

  route (entirePath, node) {
    let pathsList = entirePath.split("/");
    if(pathsList.length > 1 ){
      throw new Error('Please use a sub router module to add nested paths');
    }
    if (node.routable) {
      this.submodules[entirePath] = node;
    } else {
      this.setStateCallback(entirePath, node);
    }
    return this;
  }
}

module.exports = Router;