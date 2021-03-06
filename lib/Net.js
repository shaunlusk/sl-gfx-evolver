var C64GfxEv = C64GfxEv || {};

C64GfxEv.Net = function(props) {
  props = props || {};
  this._layerConfig = props.layerConfig || {input: 3, output: {size:16,activationType:"sigmoid"},};
  this._layers = [];
  this._activationFunctions = [];
  this._weights = [];
  this._layerWeightCount = [];
  this._totalWeightCount = 0;
  this._idx = -1;
  this.initialize(props.fillRandomWeights);
};

C64GfxEv.Net.prototype.getLayers = function() {return this._layers;};
C64GfxEv.Net.prototype.getWeights = function() {return this._weights;};

C64GfxEv.Net.prototype.initialize = function(fillRandomWeights) {
  var i, n;
  var layer = [], activationFunctions = [];

  // input layer
  for (n = 0; n < this._layerConfig.input; n++) {
    layer.push(0);
  }
  this._layers.push(layer);
  this._activationFunctions.push({/* activation not used for input; jsut placeholder */});

  // hidden layers
  layer = [];
  activationFunctions = [];
  for (i = 0; i < this._layerConfig.hidden.length; i++) {
    for (n = 0; n < this._layerConfig.hidden[i].size; n++) {
      layer.push(0);
    }
    this._layers.push(layer);
    this._activationFunctions.push(this.getActivationFunction(this._layerConfig.hidden[i].activationType));
  }

  // output layer
  layer = [];
  activationFunctions = [];
  for (n = 0; n < this._layerConfig.output.size; n++) {
    layer.push(0);
  }
  this._layers.push(layer);
  this._activationFunctions.push(this.getActivationFunction(this._layerConfig.output.activationType));

  this._fillWeights(function(layer, target, source) {
    return fillRandomWeights ? this.getRandomWeight() : 0;
  }.bind(this));
};

C64GfxEv.Net.prototype.setIndex = function(idx) {this._idx = idx;};
C64GfxEv.Net.prototype.getIndex = function() {return this._idx;};

C64GfxEv.Net.prototype._fillWeights = function(providerFn) {
  this._layerWeightCount = [];
  this._totalWeightCount = 0;

  this._weights = [];
  // weights - tgt x src
  // for each layer of weights...
  for (var i = 1; i < this._layers.length; i++) {
    var layerWeightCount = 0;
    var weights = [];
    // for each target node...
    for (var tgt = 0; tgt < this._layers[i].length; tgt++) {
      var tgtNodeInboundWgts = [];
      // ... add a weight for each source node
      for (src = 0; src < this._layers[i-1].length; src++) {
        var val = providerFn(i-1, tgt, src);
        tgtNodeInboundWgts.push(val);
      }
      weights.push(tgtNodeInboundWgts);
      layerWeightCount += tgtNodeInboundWgts.length;
    }
    this._weights.push(weights);
    this._layerWeightCount.push(layerWeightCount);
    this._totalWeightCount += layerWeightCount;
  }
};

C64GfxEv.Net.prototype.getRandomWeight = function() {
  var wgt = 1;
  wgt -= Math.random() * 2;
  return wgt;
};

C64GfxEv.Net.prototype.activate = function(input) {
  var i, tgt, src, layer, nodeVal;
  for (i = 0; i < input.length; i++) {
    this._layers[0][i] = input[i];
  }

  for (i = 1; i < this._layers.length; i++) {
    tgtlayer = this._layers[i];
    srclayer = this._layers[i-1];
    for (tgt = 0; tgt < tgtlayer.length; tgt++) {
      nodeVal = 0;
      for (src = 0; src < srclayer.length; src++) {
        nodeVal += srclayer[src] * this._weights[i-1][tgt][src];
      }
      tgtlayer[tgt] = this._activationFunctions[i](nodeVal);
    }
  }
  return this.getOutputs();
};

C64GfxEv.Net.prototype.getOutputs = function() {
  return this._layers[this._layers.length - 1];
};

C64GfxEv.Net.prototype.getWeightAt = function(layerIdx, tgtIdx, srcIdx) {
  return this._weights[layerIdx][tgtIdx][srcIdx];
};

C64GfxEv.Net.prototype.setWeightAt = function(layerIdx, tgtIdx, srcIdx, newVal) {
  this._weights[layerIdx][tgtIdx][srcIdx] = newVal;
};

C64GfxEv.Net.prototype.getRandomWeightCoords = function() {
  var wgtIdx = Math.floor(Math.random() * this._totalWeightCount);
  var layerIdx = 0;
  while (wgtIdx >= this._layerWeightCount[layerIdx]) {
    wgtIdx -= this._layerWeightCount[layerIdx];
    layerIdx++;
  }
  var tgtIdx = 0;
  while (wgtIdx >= this._weights[layerIdx][tgtIdx].length) {
    wgtIdx -= this._weights[layerIdx][tgtIdx].length;
    tgtIdx++;
  }

  return [layerIdx, tgtIdx, wgtIdx];
};

C64GfxEv.Net.prototype.getActivationFunction = function(type) {
  var fn = null;
  switch(type) {
    case "sigmoid":
      fn = C64GfxEv.Net.sigmoidFn;
      break;
    case "gaussian":
      fn = C64GfxEv.Net.gaussFn;
      break;
    default:
      fn = function() {};
      break;
  }
  return fn;
};

C64GfxEv.Net.prototype.clone = function() {
  var props = {layerConfig:this._layerConfig};
  var net = new C64GfxEv.Net(props);
  var me = this;
  net._fillWeights(function(layer, target, source){
    return me._weights[layer][target][source];
  }.bind(net));
  return net;
};

C64GfxEv.Net.sigmoidFn = function(val) {
  var outVal = 1 / (1 + Math.pow(Math.E, 0-val));
  return outVal;
};

C64GfxEv.Net.gaussFn = function(val) {
  var outVal = Math.pow(Math.E, (0-Math.pow(val,2)));
  return outVal;
};
