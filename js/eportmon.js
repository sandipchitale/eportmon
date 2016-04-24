(function(){
  const spawn = require('child_process').spawn;

  angular
  .module('EportmonApp', [])
  .controller('EportmonCtrl', ['$scope', '$log', function($scope){
    var vm = this;
    vm.wait = false;
    vm.ports = [];
    vm.filterPorts = function(portLine) {
      return portLine[2] === 'LISTENING';
    }

    vm.orderByPorts = function(portLine) {
      return parseInt(portLine[1]);
    }

    function netstat() {
      var portLines = '';

      vm.wait = true;
      vm.ports = [];

      const ns = spawn('netstat', ['-anop', 'tcp']);
      ns.stdout.on('data', function(pls) {
        portLines += String.fromCharCode.apply(null, pls).substring(1);
      });

      ns.stderr.on('data', (err) => {
        $log.error(err);
      });

      ns.on('close', (code) => {
        vm.wait = false;
        portLines = portLines.split(/\r\n/);
        $scope.$apply(function() {
          if (angular.isArray(portLines) && portLines.length > 5) {
            portLines.splice(0, 5);
            if (portLines[portLines.length-1] === '') [
              portLines.splice(portLines.length-1, 1)
            ]
            angular.forEach(portLines, function(portLine, index, portLines) {
              portLines[index] = portLine.split(/\s+/);
              portLines[index].splice(3,1);
              portLines[index].splice(0,1);
              portLines[index][1] = portLines[index][1].split(/:/);
              portLines[index][1].splice(0,1);
              portLines[index][1] = portLines[index][1][0];
            });
            vm.ports = portLines;
          }
        });
      });
    }
    vm.netstat = netstat;
    netstat();
  }]);
})();
