/**
* Simple state machine because angular is hard to manage and I miss react.
*/
class StateMachine {
  constructor () {
    let self = this;
    self.state = '';
    self.statesCallbacks = {};
    self.previousState = '';
    self.errorCallback = (state) => {
      throw new Error("State "+state+" does not exist");
    }
    self.afterHook = (state) => {};
  }

  setState (newState, ...args) {
    let self = this;
    if (self.state != '') {
      self.previousState = self.state;
    }
    self.state = newState;
    self.goToState(...args);
    return self;
  }

  getState () {
    return this.state;
  }

  getPreviousState () {
    return this.previousState;
  }

  setCleanCallback (callback) {
    let self = this;
    self.cleanCallback = callback;
    return self;
  }

  clean () {
    this.cleanCallback();
    return this;
  }

  exists (F) {
    return (F!== null) && (F !== undefined);
  }

  setErrorCallback (callback) {
    let self = this;
    self.errorCallback = callback;
    return self;
  }

  setAfterHook (callback) {
    let self = this;
    self.afterHook = callback;
    return self;
  }

  goToState (...args) {
    let self = this;
    if(self.exists(self.cleanCallback)) {
      self.cleanCallback();
    }
    let F = self.statesCallbacks[self.state];
    if (self.exists(F)) {
      F(...args);
    } else {
      self.errorCallback(self.state);
    }
    self.afterHook(self.state);
    return self;
  }

  setStateCallback (state, callback) {
    let self = this;
    self.statesCallbacks[state] = callback;
    return self;
  }
}

module.exports = StateMachine;